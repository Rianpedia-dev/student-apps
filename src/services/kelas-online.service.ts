import prisma from "@/lib/prisma";
import { deleteDailyRoom } from "@/lib/daily";
import type { JenjangType } from "@/lib/jenjang";
import { parseTimeToMinutes } from "@/lib/utils";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import type {
  KelasOnlineSessionType,
  OnlineClassRoomItem,
  TeacherClassOption,
  TeacherOnlineClassContext,
  TeacherPertemuanOption,
  TeacherSubjectOption,
  TeacherTodayScheduleItem,
  WaliKelasMonitorItem,
} from "@/types/kelas-online";

const ROOM_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 jam sesuai masa berlaku token Daily.co

const ENGLISH_TO_INDO_DAY: Record<string, string> = {
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
  Saturday: "Sabtu",
  Sunday: "Minggu",
};

function isNumericId(val?: string | number | bigint | null): boolean {
  if (val === undefined || val === null) return false;
  return /^\d+$/.test(String(val));
}

function normalizeHari(hari?: string | null): string {
  return (hari || "").trim().toLowerCase().replace("'", "");
}

/**
 * Menghasilkan nama hari (Senin..Minggu) dan tanggal ISO (YYYY-MM-DD)
 * berdasarkan zona waktu Asia/Jakarta (WIB).
 */
export function getJakartaDateParts(date: Date = new Date()): {
  hari: string;
  isoDate: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((p) => [p.type, p.value]));

  const weekdayEn = map.get("weekday") || "Monday";
  const year = map.get("year") || String(date.getFullYear());
  const month = map.get("month") || "01";
  const day = map.get("day") || "01";

  return {
    hari: ENGLISH_TO_INDO_DAY[weekdayEn] || "Senin",
    isoDate: `${year}-${month}-${day}`,
  };
}

function normalizeSessionType(val?: string | null): KelasOnlineSessionType {
  return val === "WALI_KELAS" ? "WALI_KELAS" : "MAPEL";
}

function serializeRoom(
  room: {
    id: bigint;
    room_name: string;
    room_url: string;
    guru_id: bigint;
    guru_name: string;
    kelas: string;
    kelas_id: bigint | null;
    mata_pelajaran: string | null;
    mapel_id: bigint | null;
    jadwal_id: bigint | null;
    pertemuan_id: bigint | null;
    session_type: string;
    topik: string | null;
    is_attendance_synced: boolean;
    status: string;
    started_at: Date | null;
    ended_at: Date | null;
    pertemuan?: { pertemuan_ke: number; judul: string } | null;
    attendance?: Array<{
      id: bigint;
      user_id?: bigint;
      user_role?: string;
      left_at?: Date | null;
    }>;
  },
  options?: { mode?: "active" | "ended" }
): OnlineClassRoomItem {
  const startMs = room.started_at?.getTime() || 0;
  const endMs = room.ended_at?.getTime() || 0;
  const durationMinutes =
    startMs && endMs ? Math.max(0, Math.round((endMs - startMs) / 60000)) : null;

  const attendanceList = room.attendance || [];
  const activeParticipants =
    options?.mode === "active"
      ? attendanceList.filter((a) => !a.left_at).length
      : undefined;

  // Untuk riwayat selesai, hitung siswa unik yang pernah bergabung
  let totalAttendance: number | undefined;
  if (options?.mode === "ended" || room.status === "ended") {
    const uniqueStudentIds = new Set(
      attendanceList
        .filter((a) => a.user_role === "siswa" && a.user_id !== undefined)
        .map((a) => a.user_id!.toString())
    );
    totalAttendance =
      uniqueStudentIds.size > 0
        ? uniqueStudentIds.size
        : attendanceList.filter((a) => a.user_role === "siswa").length;
  }

  return {
    id: room.id.toString(),
    room_name: room.room_name,
    room_url: room.room_url,
    guru_id: room.guru_id.toString(),
    guru_name: room.guru_name,
    kelas: room.kelas,
    kelas_id: room.kelas_id ? room.kelas_id.toString() : null,
    mata_pelajaran: room.mata_pelajaran,
    mapel_id: room.mapel_id ? room.mapel_id.toString() : null,
    jadwal_id: room.jadwal_id ? room.jadwal_id.toString() : null,
    pertemuan_id: room.pertemuan_id ? room.pertemuan_id.toString() : null,
    pertemuan_ke: room.pertemuan?.pertemuan_ke ?? null,
    pertemuan_judul: room.pertemuan?.judul ?? null,
    session_type: normalizeSessionType(room.session_type),
    topik: room.topik,
    is_attendance_synced: room.is_attendance_synced,
    status: room.status,
    started_at: room.started_at?.toISOString() || null,
    ended_at: room.ended_at?.toISOString() || null,
    duration_minutes: durationMinutes,
    active_participants: activeParticipants,
    total_attendance: totalAttendance,
  };
}

export class KelasOnlineService {
  /**
   * Menutup otomatis room aktif yang sudah melewati batas kedaluwarsa Daily.co (4 jam)
   * beserta catatan kehadiran yang masih terbuka (`left_at = null`).
   */
  static async cleanupExpiredRooms(): Promise<number> {
    const cutoff = new Date(Date.now() - ROOM_EXPIRY_MS);

    const expiredRooms = await prisma.kelasOnline.findMany({
      where: {
        status: "active",
        OR: [
          { started_at: { lt: cutoff } },
          { started_at: null, created_at: { lt: cutoff } },
        ],
      },
      select: {
        id: true,
        room_name: true,
        started_at: true,
        created_at: true,
      },
    });

    if (expiredRooms.length === 0) return 0;

    for (const room of expiredRooms) {
      const baseStart = room.started_at || room.created_at || cutoff;
      const roomEndedAt = new Date(
        Math.min(Date.now(), baseStart.getTime() + ROOM_EXPIRY_MS)
      );

      await prisma.kelasOnline.update({
        where: { id: room.id },
        data: {
          status: "ended",
          ended_at: roomEndedAt,
        },
      });

      const openAttendances = await prisma.kelasOnlineAttendance.findMany({
        where: {
          kelas_online_id: room.id,
          left_at: null,
        },
      });

      for (const att of openAttendances) {
        const joinedAt = att.joined_at || baseStart;
        const durationMinutes = Math.max(
          0,
          Math.round((roomEndedAt.getTime() - joinedAt.getTime()) / 60000)
        );
        await prisma.kelasOnlineAttendance.update({
          where: { id: att.id },
          data: {
            left_at: roomEndedAt,
            duration_minutes: durationMinutes,
          },
        });
      }

      deleteDailyRoom(room.room_name).catch((err) => {
        console.warn(`[cleanupExpiredRooms] Gagal menghapus Daily room ${room.room_name}:`, err);
      });
    }

    return expiredRooms.length;
  }

  /**
   * Meresolusi konteks pengampu untuk halaman & modal Kelas Online guru:
   * - Status Wali Kelas (`status === "4"`) + kelas perwalian
   * - Daftar kelas & mapel yang diampu dari `JadwalPelajaran` aktif (difilter `activeJenjang`)
   * - Fallback ke semua kelas & mapel di jenjang aktif jika belum ada jadwal terpetakan
   * - Jadwal mengajar hari ini (WIB) beserta status apakah room sudah aktif
   */
  static async getTeacherOnlineClassContext(
    userId: string,
    activeJenjang: JenjangType
  ): Promise<TeacherOnlineClassContext> {
    if (!isNumericId(userId)) {
      throw new ValidationError("ID akun guru tidak valid.");
    }

    const guruBigInt = BigInt(userId);
    const dbUser = await prisma.user.findUnique({
      where: { id: guruBigInt },
      select: {
        id: true,
        name: true,
        status: true,
        kelas: true,
        guru_bidang: true,
        jenjang: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundError("Data guru tidak ditemukan.");
    }

    const isWaliKelas = dbUser.status === "4";
    let waliKelas: TeacherClassOption | null = null;

    if (isWaliKelas && dbUser.kelas) {
      const waliKelasRecord = await prisma.kelas.findFirst({
        where: { nama_kelas: dbUser.kelas },
        select: { id: true, nama_kelas: true, jenjang: true, tingkat: true },
      });

      if (waliKelasRecord) {
        if (activeJenjang === "ALL" || waliKelasRecord.jenjang === activeJenjang) {
          waliKelas = {
            id: waliKelasRecord.id.toString(),
            namaKelas: waliKelasRecord.nama_kelas,
            jenjang: waliKelasRecord.jenjang,
            tingkat: waliKelasRecord.tingkat,
          };
        }
      }
    }

    // Muat JadwalPelajaran aktif untuk guru ini (difilter activeJenjang)
    const schedules = await prisma.jadwalPelajaran.findMany({
      where: {
        guru_id: guruBigInt,
        is_active: true,
        ...(activeJenjang !== "ALL" ? { kelas: { jenjang: activeJenjang } } : {}),
      },
      include: {
        kelas: {
          select: { id: true, nama_kelas: true, jenjang: true, tingkat: true },
        },
        mapel: {
          select: { id: true, kode_mapel: true, nama_mapel: true, warna: true },
        },
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    });

    const hasScheduleMapping = schedules.length > 0;

    const classMap = new Map<string, TeacherClassOption>();
    const subjectsByClassMap = new Map<string, Map<string, TeacherSubjectOption>>();

    if (hasScheduleMapping) {
      for (const s of schedules) {
        const kId = s.kelas.id.toString();
        const mId = s.mapel.id.toString();

        if (!classMap.has(kId)) {
          classMap.set(kId, {
            id: kId,
            namaKelas: s.kelas.nama_kelas,
            jenjang: s.kelas.jenjang,
            tingkat: s.kelas.tingkat,
          });
        }

        if (!subjectsByClassMap.has(kId)) {
          subjectsByClassMap.set(kId, new Map());
        }
        const classSubjects = subjectsByClassMap.get(kId)!;
        if (!classSubjects.has(mId)) {
          classSubjects.set(mId, {
            id: mId,
            kodeMapel: s.mapel.kode_mapel,
            namaMapel: s.mapel.nama_mapel,
            warna: s.mapel.warna || "emerald",
          });
        }
      }
    } else {
      // Kebijakan Fallback #1: Jika belum ada jadwal di JadwalPelajaran,
      // izinkan guru memilih seluruh kelas & mapel di jenjang aktifnya.
      const [allClasses, allSubjects] = await Promise.all([
        prisma.kelas.findMany({
          where: activeJenjang !== "ALL" ? { jenjang: activeJenjang } : undefined,
          orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
          select: { id: true, nama_kelas: true, jenjang: true, tingkat: true },
        }),
        prisma.mataPelajaran.findMany({
          where:
            activeJenjang !== "ALL"
              ? { OR: [{ jenjang: activeJenjang }, { jenjang: "SEMUA" }] }
              : undefined,
          orderBy: { nama_mapel: "asc" },
          select: { id: true, kode_mapel: true, nama_mapel: true, warna: true },
        }),
      ]);

      const subjectList: TeacherSubjectOption[] = allSubjects.map((m) => ({
        id: m.id.toString(),
        kodeMapel: m.kode_mapel,
        namaMapel: m.nama_mapel,
        warna: m.warna || "emerald",
      }));

      for (const c of allClasses) {
        const kId = c.id.toString();
        classMap.set(kId, {
          id: kId,
          namaKelas: c.nama_kelas,
          jenjang: c.jenjang,
          tingkat: c.tingkat,
        });

        const subMap = new Map<string, TeacherSubjectOption>();
        subjectList.forEach((m) => subMap.set(m.id, m));
        subjectsByClassMap.set(kId, subMap);
      }
    }

    const classes = Array.from(classMap.values()).sort((a, b) => {
      if (a.jenjang !== b.jenjang) return a.jenjang.localeCompare(b.jenjang);
      if ((a.tingkat ?? 0) !== (b.tingkat ?? 0)) return (a.tingkat ?? 0) - (b.tingkat ?? 0);
      return a.namaKelas.localeCompare(b.namaKelas);
    });

    const subjectsByClass: Record<string, TeacherSubjectOption[]> = {};
    for (const [kId, subMap] of subjectsByClassMap.entries()) {
      subjectsByClass[kId] = Array.from(subMap.values()).sort((a, b) =>
        a.namaMapel.localeCompare(b.namaMapel)
      );
    }

    // Muat Pertemuan untuk pasangan kelas+mapel yang terpetakan (atau milik guru ini)
    const pertemuanWhere = hasScheduleMapping
      ? {
          OR: schedules.map((s) => ({
            kelas_id: s.kelas_id,
            mapel_id: s.mapel_id,
          })),
        }
      : { guru_id: guruBigInt };

    const pertemuanRows = await prisma.pertemuan.findMany({
      where: pertemuanWhere,
      select: {
        id: true,
        kelas_id: true,
        mapel_id: true,
        pertemuan_ke: true,
        judul: true,
      },
      orderBy: [{ pertemuan_ke: "asc" }],
    });

    const pertemuanByPair: Record<string, TeacherPertemuanOption[]> = {};
    for (const p of pertemuanRows) {
      const key = `${p.kelas_id.toString()}:${p.mapel_id.toString()}`;
      if (!pertemuanByPair[key]) {
        pertemuanByPair[key] = [];
      }
      pertemuanByPair[key].push({
        id: p.id.toString(),
        kelasId: p.kelas_id.toString(),
        mapelId: p.mapel_id.toString(),
        pertemuanKe: p.pertemuan_ke,
        judul: p.judul,
      });
    }

    // Jadwal mengajar hari ini (Asia/Jakarta) + cek room aktif
    const { hari: todayHari } = getJakartaDateParts();
    const todayNormalized = normalizeHari(todayHari);

    const activeTeacherRooms = await prisma.kelasOnline.findMany({
      where: {
        guru_id: guruBigInt,
        status: "active",
      },
      select: {
        id: true,
        kelas_id: true,
        mapel_id: true,
        session_type: true,
      },
    });

    const todaySchedules: TeacherTodayScheduleItem[] = schedules
      .filter((s) => normalizeHari(s.hari) === todayNormalized)
      .sort(
        (a, b) =>
          parseTimeToMinutes(a.jam_mulai) - parseTimeToMinutes(b.jam_mulai)
      )
      .map((s) => {
        const activeMatch = activeTeacherRooms.find(
          (r) =>
            r.session_type === "MAPEL" &&
            r.kelas_id === s.kelas_id &&
            r.mapel_id === s.mapel_id
        );

        return {
          jadwalId: s.id.toString(),
          kelasId: s.kelas_id.toString(),
          kelasNama: s.kelas.nama_kelas,
          jenjang: s.kelas.jenjang,
          mapelId: s.mapel_id.toString(),
          mapelNama: s.mapel.nama_mapel,
          mapelKode: s.mapel.kode_mapel,
          mapelWarna: s.mapel.warna || "emerald",
          hari: s.hari,
          jamMulai: s.jam_mulai,
          jamSelesai: s.jam_selesai,
          activeRoomId: activeMatch ? activeMatch.id.toString() : null,
        };
      });

    return {
      guruId: dbUser.id.toString(),
      guruName: dbUser.name,
      guruBidang: dbUser.guru_bidang,
      status: dbUser.status,
      isWaliKelas,
      waliKelas,
      hasScheduleMapping,
      classes,
      subjectsByClass,
      pertemuanByPair,
      todaySchedules,
    };
  }

  /**
   * Memvalidasi hak pengampu / wali kelas sebelum membuat room Kelas Online.
   */
  static async validateTeacherCreateAuthorization(params: {
    userId: string;
    activeJenjang: JenjangType;
    sessionType: KelasOnlineSessionType;
    kelasId?: string;
    mapelId?: string;
    jadwalId?: string;
    pertemuanId?: string;
  }) {
    const context = await this.getTeacherOnlineClassContext(
      params.userId,
      params.activeJenjang
    );

    if (params.sessionType === "WALI_KELAS") {
      if (!context.isWaliKelas || !context.waliKelas) {
        throw new UnauthorizedError(
          "Mode Sesi Wali Kelas hanya tersedia untuk Guru & Wali Kelas yang memiliki rombel binaan pada jenjang aktif."
        );
      }

      return {
        context,
        sessionType: "WALI_KELAS" as const,
        kelasId: BigInt(context.waliKelas.id),
        kelasNama: context.waliKelas.namaKelas,
        mapelId: null as bigint | null,
        mapelNama: "Pembinaan Wali Kelas",
        jadwalId: null as bigint | null,
        pertemuanId: null as bigint | null,
      };
    }

    // Mode MAPEL
    if (!isNumericId(params.kelasId) || !isNumericId(params.mapelId)) {
      throw new ValidationError(
        "Kelas dan Mata Pelajaran wajib dipilih untuk sesi Pembelajaran Mapel."
      );
    }

    const kelasIdStr = String(params.kelasId);
    const mapelIdStr = String(params.mapelId);

    const allowedClass = context.classes.find((c) => c.id === kelasIdStr);
    const allowedSubjects = context.subjectsByClass[kelasIdStr] || [];
    const allowedSubject = allowedSubjects.find((m) => m.id === mapelIdStr);

    if (!allowedClass || !allowedSubject) {
      throw new UnauthorizedError(
        context.hasScheduleMapping
          ? "Anda tidak terdaftar sebagai pengampu mata pelajaran ini pada kelas tersebut."
          : "Kelas atau mata pelajaran tidak berada dalam jenjang aktif Anda."
      );
    }

    let resolvedJadwalId: bigint | null = null;
    if (params.jadwalId) {
      if (!isNumericId(params.jadwalId)) {
        throw new ValidationError("Format jadwalId tidak valid.");
      }
      const jadwal = await prisma.jadwalPelajaran.findFirst({
        where: {
          id: BigInt(params.jadwalId),
          guru_id: BigInt(params.userId),
          kelas_id: BigInt(kelasIdStr),
          mapel_id: BigInt(mapelIdStr),
        },
        select: { id: true },
      });
      if (!jadwal) {
        throw new UnauthorizedError("Jadwal mengajar tidak sesuai dengan hak pengampu Anda.");
      }
      resolvedJadwalId = jadwal.id;
    }

    let resolvedPertemuanId: bigint | null = null;
    if (params.pertemuanId) {
      if (!isNumericId(params.pertemuanId)) {
        throw new ValidationError("Format pertemuanId tidak valid.");
      }
      const pertemuan = await prisma.pertemuan.findFirst({
        where: {
          id: BigInt(params.pertemuanId),
          kelas_id: BigInt(kelasIdStr),
          mapel_id: BigInt(mapelIdStr),
        },
        select: { id: true },
      });
      if (!pertemuan) {
        throw new ValidationError(
          "Pertemuan yang dipilih tidak cocok dengan kelas dan mata pelajaran terkait."
        );
      }
      resolvedPertemuanId = pertemuan.id;
    }

    return {
      context,
      sessionType: "MAPEL" as const,
      kelasId: BigInt(allowedClass.id),
      kelasNama: allowedClass.namaKelas,
      mapelId: BigInt(allowedSubject.id),
      mapelNama: allowedSubject.namaMapel,
      jadwalId: resolvedJadwalId,
      pertemuanId: resolvedPertemuanId,
    };
  }

  /**
   * Mengecek apakah sudah ada room aktif yang sama pada kelas + mapel (atau wali kelas) tersebut.
   */
  static async findDuplicateActiveRoom(params: {
    sessionType: KelasOnlineSessionType;
    kelasId: bigint;
    mapelId: bigint | null;
  }) {
    if (params.sessionType === "WALI_KELAS") {
      return prisma.kelasOnline.findFirst({
        where: {
          status: "active",
          kelas_id: params.kelasId,
          session_type: "WALI_KELAS",
        },
        select: {
          id: true,
          room_name: true,
          guru_id: true,
          guru_name: true,
          kelas: true,
          mata_pelajaran: true,
        },
      });
    }

    if (!params.mapelId) return null;

    return prisma.kelasOnline.findFirst({
      where: {
        status: "active",
        kelas_id: params.kelasId,
        mapel_id: params.mapelId,
        session_type: "MAPEL",
      },
      select: {
        id: true,
        room_name: true,
        guru_id: true,
        guru_name: true,
        kelas: true,
        mata_pelajaran: true,
      },
    });
  }

  /**
   * Mengambil daftar room aktif, riwayat sesi guru, serta panel monitoring
   * kelas perwalian (khusus Wali Kelas status === "4").
   */
  static async getGuruRoomsAndMonitoring(
    userId: string,
    activeJenjang: JenjangType,
    context: TeacherOnlineClassContext
  ): Promise<{
    activeRooms: OnlineClassRoomItem[];
    endedRooms: OnlineClassRoomItem[];
    waliMonitorRooms: WaliKelasMonitorItem[];
  }> {
    if (!isNumericId(userId)) {
      return { activeRooms: [], endedRooms: [], waliMonitorRooms: [] };
    }

    const guruBigInt = BigInt(userId);
    const isRestricted = activeJenjang !== "ALL";

    let allowedClassIds: bigint[] = [];
    let allowedClassNames: string[] = [];

    if (isRestricted) {
      const allowedClasses = await prisma.kelas.findMany({
        where: { jenjang: activeJenjang },
        select: { id: true, nama_kelas: true },
      });
      allowedClassIds = allowedClasses.map((c) => c.id);
      allowedClassNames = allowedClasses.map((c) => c.nama_kelas);
    }

    const jenjangFilter = isRestricted
      ? {
          OR: [
            ...(allowedClassIds.length > 0
              ? [{ kelas_id: { in: allowedClassIds } }]
              : []),
            ...(allowedClassNames.length > 0
              ? [{ kelas_id: null, kelas: { in: allowedClassNames } }]
              : []),
          ],
        }
      : {};

    const [dbActive, dbEnded, dbWaliMonitor] = await Promise.all([
      prisma.kelasOnline.findMany({
        where: {
          guru_id: guruBigInt,
          status: "active",
          ...jenjangFilter,
        },
        include: {
          pertemuan: { select: { pertemuan_ke: true, judul: true } },
          attendance: {
            where: { left_at: null },
            select: { id: true, left_at: true },
          },
        },
        orderBy: { started_at: "desc" },
      }),
      prisma.kelasOnline.findMany({
        where: {
          guru_id: guruBigInt,
          status: "ended",
          ...jenjangFilter,
        },
        include: {
          pertemuan: { select: { pertemuan_ke: true, judul: true } },
          attendance: {
            where: { user_role: "siswa" },
            select: { id: true, user_id: true, user_role: true },
          },
        },
        orderBy: { ended_at: "desc" },
        take: 30,
      }),
      context.isWaliKelas && context.waliKelas
        ? prisma.kelasOnline.findMany({
            where: {
              OR: [
                { kelas_id: BigInt(context.waliKelas.id) },
                { kelas_id: null, kelas: context.waliKelas.namaKelas },
              ],
            },
            include: {
              pertemuan: { select: { pertemuan_ke: true, judul: true } },
              attendance: {
                select: { id: true, user_id: true, user_role: true, left_at: true },
              },
            },
            orderBy: { started_at: "desc" },
            take: 30,
          })
        : Promise.resolve([]),
    ]);

    return {
      activeRooms: dbActive.map((r) => serializeRoom(r, { mode: "active" })),
      endedRooms: dbEnded.map((r) => serializeRoom(r, { mode: "ended" })),
      waliMonitorRooms: dbWaliMonitor.map((r) => ({
        ...serializeRoom(r, { mode: r.status === "active" ? "active" : "ended" }),
        isOwnRoom: r.guru_id.toString() === userId,
      })),
    };
  }

  /**
   * Mengambil daftar room aktif dan riwayat kelas siswa berbasis `kelas_id` (dengan fallback `kelas`).
   */
  static async getStudentKelasOnlineData(
    userId: string,
    fallbackKelasName: string | null | undefined
  ) {
    let studentClassName = fallbackKelasName || "";
    if (isNumericId(userId)) {
      const dbUser = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: { kelas: true },
      });
      if (dbUser?.kelas) {
        studentClassName = dbUser.kelas;
      }
    }

    const kelasRecord = studentClassName
      ? await prisma.kelas.findFirst({
          where: { nama_kelas: studentClassName },
          select: { id: true, nama_kelas: true },
        })
      : null;

    const studentClassFilter = kelasRecord
      ? {
          OR: [
            { kelas_id: kelasRecord.id },
            { kelas_id: null, kelas: kelasRecord.nama_kelas },
          ],
        }
      : { kelas: studentClassName };

    const dbActive = studentClassName
      ? await prisma.kelasOnline.findMany({
          where: {
            status: "active",
            ...studentClassFilter,
          },
          include: {
            pertemuan: { select: { pertemuan_ke: true, judul: true } },
            attendance: {
              where: { left_at: null },
              select: { id: true, left_at: true },
            },
          },
          orderBy: { started_at: "desc" },
        })
      : [];

    const activeRooms = dbActive.map((r) => serializeRoom(r, { mode: "active" }));

    let historyRecords: Array<{
      id: string;
      room_id: string;
      mata_pelajaran: string;
      session_type: KelasOnlineSessionType;
      topik: string | null;
      pertemuan_ke: number | null;
      guru_name: string;
      joined_at: string | null;
      left_at: string | null;
      duration_minutes: number | null;
      date: string;
    }> = [];

    if (isNumericId(userId)) {
      const dbHistory = await prisma.kelasOnlineAttendance.findMany({
        where: { user_id: BigInt(userId) },
        include: {
          kelasOnline: {
            select: {
              id: true,
              mata_pelajaran: true,
              session_type: true,
              topik: true,
              guru_name: true,
              kelas: true,
              started_at: true,
              pertemuan: { select: { pertemuan_ke: true } },
            },
          },
        },
        orderBy: { joined_at: "desc" },
        take: 25,
      });

      historyRecords = dbHistory.map((a) => ({
        id: a.id.toString(),
        room_id: a.kelasOnline.id.toString(),
        mata_pelajaran:
          a.kelasOnline.session_type === "WALI_KELAS"
            ? "Sesi Wali Kelas"
            : a.kelasOnline.mata_pelajaran || "Kelas Online",
        session_type: normalizeSessionType(a.kelasOnline.session_type),
        topik: a.kelasOnline.topik,
        pertemuan_ke: a.kelasOnline.pertemuan?.pertemuan_ke ?? null,
        guru_name: a.kelasOnline.guru_name,
        joined_at: a.joined_at?.toISOString() || null,
        left_at: a.left_at?.toISOString() || null,
        duration_minutes: a.duration_minutes,
        date:
          a.kelasOnline.started_at?.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          }) || "-",
      }));
    }

    return {
      studentClassName,
      studentKelasId: kelasRecord?.id.toString() || null,
      activeRooms,
      historyRecords,
    };
  }

  /**
   * Mengecek apakah sedang ada Kelas Online aktif untuk mapel & kelas siswa tertentu
   * (ditampilkan sebagai banner Live Now di halaman detail mapel siswa).
   */
  static async getActiveRoomForStudentSubject(
    studentClassName: string,
    mapelId: string
  ): Promise<OnlineClassRoomItem | null> {
    if (!studentClassName || !isNumericId(mapelId)) return null;

    await this.cleanupExpiredRooms();

    const kelasRecord = await prisma.kelas.findFirst({
      where: { nama_kelas: studentClassName },
      select: { id: true, nama_kelas: true },
    });

    const room = await prisma.kelasOnline.findFirst({
      where: {
        status: "active",
        mapel_id: BigInt(mapelId),
        session_type: "MAPEL",
        ...(kelasRecord
          ? {
              OR: [
                { kelas_id: kelasRecord.id },
                { kelas_id: null, kelas: kelasRecord.nama_kelas },
              ],
            }
          : { kelas: studentClassName }),
      },
      include: {
        pertemuan: { select: { pertemuan_ke: true, judul: true } },
        attendance: {
          where: { left_at: null },
          select: { id: true, left_at: true },
        },
      },
      orderBy: { started_at: "desc" },
    });

    return room ? serializeRoom(room, { mode: "active" }) : null;
  }

  /**
   * Mengambil room aktif yang dibuat guru untuk pasangan (kelasId, mapelId).
   */
  static async getActiveRoomForTeacherSubject(
    guruId: string,
    kelasId: string,
    mapelId: string
  ): Promise<OnlineClassRoomItem | null> {
    if (!isNumericId(guruId) || !isNumericId(kelasId) || !isNumericId(mapelId)) {
      return null;
    }

    const room = await prisma.kelasOnline.findFirst({
      where: {
        status: "active",
        guru_id: BigInt(guruId),
        kelas_id: BigInt(kelasId),
        mapel_id: BigInt(mapelId),
        session_type: "MAPEL",
      },
      include: {
        pertemuan: { select: { pertemuan_ke: true, judul: true } },
        attendance: {
          where: { left_at: null },
          select: { id: true, left_at: true },
        },
      },
      orderBy: { started_at: "desc" },
    });

    return room ? serializeRoom(room, { mode: "active" }) : null;
  }
}
