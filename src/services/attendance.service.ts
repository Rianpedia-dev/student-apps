import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface AttendanceRecordItem {
  userId: string;
  keterangan: string;
  catatan?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  name: string;
  nis: string;
  gender: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  daily: Record<number, string>;
  percentage?: number;
}

export interface SubjectAttendanceSummary {
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  totalPertemuan: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  percentage: number;
}

export interface StudentAttendanceEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  keterangan: string;
  mapelId?: string;
  mapelNama: string;
  mapelKode: string;
  catatan?: string;
  jamKe?: string;
  guruNama?: string;
}

export interface StudentAttendanceLogItem {
  id: string;
  date: string;
  mapelId?: string;
  mapelNama: string;
  mapelKode?: string;
  keterangan: string;
  catatan?: string;
  jamKe?: string;
  guruNama?: string;
}

export interface TodayTeacherScheduleAttendance {
  jadwalId: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  mapelWarna: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  jamMulai: string;
  jamSelesai: string;
  hari: string;
  isFilled: boolean;
  totalSiswa: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alphaCount: number;
}

export interface ClassSubjectMatrixItem {
  studentId: string;
  studentName: string;
  nis: string;
  gender: string;
  subjectStatuses: Record<string, { keterangan: string; catatan?: string }>;
  overallStatus: "Lengkap" | "Bolos Terdeteksi" | "Sakit Seharian" | "Izin Seharian" | "Belum Lengkap";
}

export class AttendanceService {
  /**
   * Menyimpan / memperbarui presensi berbasis MATA PELAJARAN secara batch transaksional.
   * Kunci unik presensi per mapel: [user_id, mapel_id, date].
   */
  static async recordSubjectAttendance(params: {
    date: string;
    kelas: string;
    kelasId?: bigint | string;
    mapelId: bigint | string;
    guruId?: bigint | string;
    jadwalId?: bigint | string;
    pertemuanId?: bigint | string;
    jamKe?: string;
    records: AttendanceRecordItem[];
  }) {
    const { date, kelas, kelasId, mapelId, guruId, jadwalId, pertemuanId, jamKe, records } = params;
    if (records.length === 0) return true;

    const month = date.split("-")[1] || String(new Date().getMonth() + 1);
    const mId = BigInt(mapelId);
    const gId = guruId ? BigInt(guruId) : undefined;
    const jId = jadwalId ? BigInt(jadwalId) : undefined;
    const pId = pertemuanId ? BigInt(pertemuanId) : undefined;
    const kId = kelasId ? BigInt(kelasId) : undefined;

    // Normalisasi & deduplikasi
    const deduped = new Map<string, { keterangan: string; catatan?: string }>();
    for (const record of records) {
      if (!record?.userId) continue;
      deduped.set(String(record.userId), {
        keterangan: record.keterangan,
        catatan: record.catatan || "",
      });
    }
    if (deduped.size === 0) return true;

    const userIds = Array.from(deduped.keys()).map((id) => BigInt(id));

    // Periksa data absensi yang sudah ada untuk mapel ini pada tanggal ini
    const existing = await prisma.absen.findMany({
      where: {
        date,
        mapel_id: mId,
        user_id: { in: userIds },
      },
      select: { id: true, user_id: true },
    });
    const existingMap = new Map<string, bigint>();
    existing.forEach((e) => existingMap.set(e.user_id.toString(), e.id));

    const toCreate: Prisma.AbsenCreateManyInput[] = [];
    const updates: Prisma.PrismaPromise<unknown>[] = [];

    for (const [userIdStr, item] of deduped) {
      const existingId = existingMap.get(userIdStr);
      if (existingId) {
        updates.push(
          prisma.absen.update({
            where: { id: existingId },
            data: {
              keterangan: item.keterangan,
              catatan: item.catatan || null,
              kelas,
              kelas_id: kId,
              guru_id: gId,
              jadwal_id: jId,
              pertemuan_id: pId,
              jam_ke: jamKe || null,
              month,
            },
          })
        );
      } else {
        toCreate.push({
          user_id: BigInt(userIdStr),
          kelas,
          kelas_id: kId,
          mapel_id: mId,
          guru_id: gId,
          jadwal_id: jId,
          pertemuan_id: pId,
          jam_ke: jamKe || null,
          keterangan: item.keterangan,
          catatan: item.catatan || null,
          date,
          month,
        });
      }
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [];
    if (toCreate.length > 0) {
      operations.push(prisma.absen.createMany({ data: toCreate, skipDuplicates: true }));
    }
    operations.push(...updates);

    if (operations.length > 0) {
      await prisma.$transaction(operations, { timeout: 30000 });
    }
    return true;
  }

  /**
   * Menyimpan / memperbarui presensi harian per kelas secara batch (Legacy / Rombel umum).
   * Tetap didukung untuk kompatibilitas ke belakang.
   */
  static async recordAttendance(
    date: string,
    kelas: string,
    records: AttendanceRecordItem[]
  ) {
    if (records.length === 0) return true;

    const month = date.split("-")[1] || String(new Date().getMonth() + 1);

    const deduped = new Map<string, string>();
    for (const record of records) {
      if (!record?.userId) continue;
      deduped.set(String(record.userId), record.keterangan);
    }
    if (deduped.size === 0) return true;

    const userIds = Array.from(deduped.keys()).map((id) => BigInt(id));

    const existing = await prisma.absen.findMany({
      where: { date, user_id: { in: userIds } },
      select: { user_id: true, id: true },
    });
    const existingMap = new Map<string, bigint>();
    existing.forEach((e) => existingMap.set(e.user_id.toString(), e.id));

    const toCreate: Prisma.AbsenCreateManyInput[] = [];
    const updates: Prisma.PrismaPromise<unknown>[] = [];

    for (const [id, keterangan] of deduped) {
      const existingId = existingMap.get(id);
      if (existingId) {
        updates.push(
          prisma.absen.update({
            where: { id: existingId },
            data: { keterangan, kelas, month },
          })
        );
      } else {
        toCreate.push({
          user_id: BigInt(id),
          kelas,
          keterangan,
          date,
          month,
        });
      }
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [];
    if (toCreate.length > 0) {
      operations.push(prisma.absen.createMany({ data: toCreate, skipDuplicates: true }));
    }
    operations.push(...updates);

    if (operations.length > 0) {
      await prisma.$transaction(operations, { timeout: 30000 });
    }
    return true;
  }

  /**
   * Mengambil jadwal mengajar guru pada hari ini beserta status pengisian presensinya.
   */
  static async getTeacherTodaySchedulesWithAttendance(
    guruId: bigint,
    dateStr?: string
  ): Promise<TodayTeacherScheduleAttendance[]> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const hari = dayNames[targetDate.getDay()];
    const isoDate = dateStr || `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

    // Ambil jadwal mengajar guru pada hari ini
    const schedules = await prisma.jadwalPelajaran.findMany({
      where: {
        guru_id: guruId,
        hari,
      },
      include: {
        kelas: true,
        mapel: true,
      },
      orderBy: { jam_mulai: "asc" },
    });

    if (schedules.length === 0) return [];

    // Ambil semua absensi yang sudah terisi untuk mapel & kelas terkait pada tanggal ini
    const mapelIds = schedules.map((s) => s.mapel_id);
    const kelasNames = schedules.map((s) => s.kelas.nama_kelas);

    const [attendanceRecords, studentsCount] = await Promise.all([
      prisma.absen.findMany({
        where: {
          date: isoDate,
          mapel_id: { in: mapelIds },
          kelas: { in: kelasNames },
        },
        select: {
          mapel_id: true,
          kelas: true,
          keterangan: true,
        },
      }),
      prisma.user.groupBy({
        by: ["kelas"],
        where: {
          kelas: { in: kelasNames },
          status: "1",
        },
        _count: { id: true },
      }),
    ]);

    const studentCountMap = new Map<string, number>();
    studentsCount.forEach((sc) => {
      if (sc.kelas) studentCountMap.set(sc.kelas, sc._count.id);
    });

    return schedules.map((sch) => {
      const recordsForSchedule = attendanceRecords.filter(
        (a) => a.mapel_id === sch.mapel_id && a.kelas === sch.kelas.nama_kelas
      );

      let hadir = 0, sakit = 0, izin = 0, alpha = 0;
      recordsForSchedule.forEach((r) => {
        if (r.keterangan === "Hadir") hadir++;
        else if (r.keterangan === "Sakit") sakit++;
        else if (r.keterangan === "Izin") izin++;
        else if (r.keterangan === "Alpha") alpha++;
      });

      const totalSiswa = studentCountMap.get(sch.kelas.nama_kelas) || 0;
      const isFilled = recordsForSchedule.length > 0;

      return {
        jadwalId: sch.id.toString(),
        mapelId: sch.mapel_id.toString(),
        mapelNama: sch.mapel.nama_mapel,
        mapelKode: sch.mapel.kode_mapel,
        mapelWarna: sch.mapel.warna || "emerald",
        kelasId: sch.kelas_id.toString(),
        kelasNama: sch.kelas.nama_kelas,
        jenjang: sch.kelas.jenjang || "SD",
        jamMulai: sch.jam_mulai,
        jamSelesai: sch.jam_selesai,
        hari: sch.hari,
        isFilled,
        totalSiswa,
        hadirCount: hadir,
        sakitCount: sakit,
        izinCount: izin,
        alphaCount: alpha,
      };
    });
  }

  /**
   * Mengambil matriks kehadiran siswa lintas mata pelajaran pada hari ini untuk kelas binaan Wali Kelas.
   */
  static async getDailyClassSubjectMatrix(
    kelasNama: string,
    dateStr: string
  ): Promise<{
    kelas: string;
    date: string;
    hari: string;
    schedules: {
      jadwalId: string;
      mapelId: string;
      mapelNama: string;
      jamMulai: string;
      jamSelesai: string;
      guruNama: string;
      isFilled: boolean;
    }[];
    matrix: ClassSubjectMatrixItem[];
  }> {
    const targetDate = new Date(dateStr);
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const hari = dayNames[targetDate.getDay()];

    const [students, schedules, attendanceRecords] = await Promise.all([
      prisma.user.findMany({
        where: { kelas: kelasNama, status: "1" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, nis: true, gender: true },
      }),
      prisma.jadwalPelajaran.findMany({
        where: {
          kelas: { nama_kelas: kelasNama },
          hari,
        },
        include: { mapel: true, guru: { select: { name: true } } },
        orderBy: { jam_mulai: "asc" },
      }),
      prisma.absen.findMany({
        where: {
          kelas: kelasNama,
          date: dateStr,
        },
        select: {
          user_id: true,
          mapel_id: true,
          keterangan: true,
          catatan: true,
        },
      }),
    ]);

    const formattedSchedules = schedules.map((sch) => {
      const recordsForMapel = attendanceRecords.filter((a) => a.mapel_id === sch.mapel_id);
      return {
        jadwalId: sch.id.toString(),
        mapelId: sch.mapel_id.toString(),
        mapelNama: sch.mapel.nama_mapel,
        jamMulai: sch.jam_mulai,
        jamSelesai: sch.jam_selesai,
        guruNama: sch.guru?.name || "-",
        isFilled: recordsForMapel.length > 0,
      };
    });

    const matrix: ClassSubjectMatrixItem[] = students.map((student) => {
      const studentRecords = attendanceRecords.filter((a) => a.user_id === student.id);
      const subjectStatuses: Record<string, { keterangan: string; catatan?: string }> = {};

      schedules.forEach((sch) => {
        const found = studentRecords.find((a) => a.mapel_id === sch.mapel_id);
        if (found) {
          subjectStatuses[sch.mapel_id.toString()] = {
            keterangan: found.keterangan || "Hadir",
            catatan: found.catatan || undefined,
          };
        }
      });

      // Evaluasi status keseluruhan siswa pada hari ini
      const statuses = Object.values(subjectStatuses).map((s) => s.keterangan);
      let overallStatus: ClassSubjectMatrixItem["overallStatus"] = "Lengkap";

      if (statuses.length === 0) {
        overallStatus = "Belum Lengkap";
      } else if (statuses.every((s) => s === "Sakit")) {
        overallStatus = "Sakit Seharian";
      } else if (statuses.every((s) => s === "Izin")) {
        overallStatus = "Izin Seharian";
      } else if (statuses.includes("Alpha") && (statuses.includes("Hadir") || statuses.includes("Izin"))) {
        overallStatus = "Bolos Terdeteksi";
      } else if (statuses.length < schedules.length) {
        overallStatus = "Belum Lengkap";
      }

      return {
        studentId: student.id.toString(),
        studentName: student.name,
        nis: student.nis || "-",
        gender: student.gender || "L",
        subjectStatuses,
        overallStatus,
      };
    });

    return {
      kelas: kelasNama,
      date: dateStr,
      hari,
      schedules: formattedSchedules,
      matrix,
    };
  }

  /**
   * Terapkan status izin/sakit seharian oleh Wali Kelas untuk seluruh mapel pada tanggal tersebut.
   */
  static async applyFullDayStatusByWaliKelas(params: {
    dateStr: string;
    kelasNama: string;
    studentId: string;
    keterangan: "Sakit" | "Izin" | "Alpha" | "Hadir";
    catatan?: string;
  }) {
    const { dateStr, kelasNama, studentId, keterangan, catatan } = params;
    const targetDate = new Date(dateStr);
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const hari = dayNames[targetDate.getDay()];
    const month = dateStr.split("-")[1] || String(targetDate.getMonth() + 1);

    // Ambil semua jadwal mapel untuk kelas ini pada hari tersebut
    const schedules = await prisma.jadwalPelajaran.findMany({
      where: {
        kelas: { nama_kelas: kelasNama },
        hari,
      },
      select: {
        id: true,
        mapel_id: true,
        guru_id: true,
        jam_mulai: true,
        jam_selesai: true,
      },
    });

    const studentBigInt = BigInt(studentId);

    if (schedules.length === 0) {
      // Jika tidak ada jadwal mapel hari ini, simpan sebagai catatan absen harian umum
      await prisma.absen.upsert({
        where: {
          user_id_mapel_id_date: {
            user_id: studentBigInt,
            mapel_id: BigInt(0),
            date: dateStr,
          },
        },
        create: {
          user_id: studentBigInt,
          kelas: kelasNama,
          date: dateStr,
          month,
          keterangan,
          catatan: catatan || "Izin resmi melalui Wali Kelas",
        },
        update: {
          keterangan,
          catatan: catatan || "Izin resmi melalui Wali Kelas",
        },
      });
      return true;
    }

    // Upsert untuk setiap mapel yang terjadwal
    const operations = schedules.map((sch) =>
      prisma.absen.upsert({
        where: {
          user_id_mapel_id_date: {
            user_id: studentBigInt,
            mapel_id: sch.mapel_id,
            date: dateStr,
          },
        },
        create: {
          user_id: studentBigInt,
          kelas: kelasNama,
          mapel_id: sch.mapel_id,
          jadwal_id: sch.id,
          guru_id: sch.guru_id,
          jam_ke: `${sch.jam_mulai} - ${sch.jam_selesai}`,
          date: dateStr,
          month,
          keterangan,
          catatan: catatan || `Diset oleh Wali Kelas (${keterangan} Seharian)`,
        },
        update: {
          keterangan,
          catatan: catatan || `Diset oleh Wali Kelas (${keterangan} Seharian)`,
        },
      })
    );

    await prisma.$transaction(operations, { timeout: 30000 });
    return true;
  }

  /**
   * Mengambil rekapitulasi presensi khusus per MATA PELAJARAN untuk satu kelas.
   */
  static async getSubjectAttendanceRecap(
    mapelId: bigint | string,
    kelasNama: string,
    month?: number,
    year?: number
  ): Promise<{
    mapel: { id: string; nama: string; kode: string; warna: string };
    kelas: string;
    month?: number;
    year?: number;
    students: StudentAttendanceSummary[];
    totalSessions: number;
  }> {
    const mId = BigInt(mapelId);

    const [mapel, students, attendanceList] = await Promise.all([
      prisma.mataPelajaran.findUnique({
        where: { id: mId },
        select: { id: true, nama_mapel: true, kode_mapel: true, warna: true },
      }),
      prisma.user.findMany({
        where: { kelas: kelasNama, status: "1" },
        orderBy: { name: "asc" },
      }),
      prisma.absen.findMany({
        where: {
          mapel_id: mId,
          kelas: kelasNama,
          ...(month ? { month: String(month) } : {}),
        },
      }),
    ]);

    if (!mapel) {
      throw new Error("Mata pelajaran tidak ditemukan");
    }

    // Hitung tanggal-tanggal unik KBM mapel ini
    const sessionDates = new Set<string>();
    attendanceList.forEach((a) => {
      if (a.date) sessionDates.add(a.date);
    });
    const totalSessions = sessionDates.size;

    const report: StudentAttendanceSummary[] = students.map((student) => {
      const studentAbsens = attendanceList.filter((a) => a.user_id === student.id);
      let hadir = 0, sakit = 0, izin = 0, alpha = 0;
      const dailyMap: Record<number, string> = {};

      studentAbsens.forEach((a) => {
        const parts = (a.date || "").split("-");
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          dailyMap[day] = a.keterangan || "";
        }
        if (a.keterangan === "Hadir") hadir++;
        else if (a.keterangan === "Sakit") sakit++;
        else if (a.keterangan === "Izin") izin++;
        else if (a.keterangan === "Alpha") alpha++;
      });

      const totalRecorded = hadir + sakit + izin + alpha;
      const percentage = totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 100;

      return {
        studentId: student.id.toString(),
        name: student.name,
        nis: student.nis || "-",
        gender: student.gender || "L",
        hadir,
        sakit,
        izin,
        alpha,
        daily: dailyMap,
        percentage,
      };
    });

    return {
      mapel: {
        id: mapel.id.toString(),
        nama: mapel.nama_mapel,
        kode: mapel.kode_mapel,
        warna: mapel.warna || "emerald",
      },
      kelas: kelasNama,
      month,
      year,
      students: report,
      totalSessions,
    };
  }

  /**
   * Mengambil ringkasan kepatuhan dan audit presensi sekolah untuk Administrator.
   */
  static async getAdminAttendanceDashboard(
    dateStr: string,
    filters?: { jenjang?: string; tingkat?: number; kelas?: string }
  ) {
    const targetDate = new Date(dateStr);
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const hari = dayNames[targetDate.getDay()];

    const whereKelas: Prisma.KelasWhereInput = {};
    if (filters?.jenjang && filters.jenjang !== "SEMUA") {
      whereKelas.jenjang = filters.jenjang;
    }
    if (filters?.tingkat) {
      whereKelas.tingkat = filters.tingkat;
    }
    if (filters?.kelas) {
      whereKelas.nama_kelas = filters.kelas;
    }

    const [allSchedules, allAbsenToday, classes] = await Promise.all([
      prisma.jadwalPelajaran.findMany({
        where: {
          hari,
          kelas: whereKelas,
        },
        include: {
          kelas: true,
          mapel: true,
          guru: { select: { id: true, name: true, image: true, nip: true } },
        },
        orderBy: [{ kelas: { nama_kelas: "asc" } }, { jam_mulai: "asc" }],
      }),
      prisma.absen.findMany({
        where: {
          date: dateStr,
          ...(filters?.kelas ? { kelas: filters.kelas } : {}),
        },
        select: {
          id: true,
          mapel_id: true,
          kelas: true,
          keterangan: true,
          user_id: true,
        },
      }),
      prisma.kelas.findMany({
        where: whereKelas,
        orderBy: { nama_kelas: "asc" },
      }),
    ]);

    let totalHadir = 0, totalSakit = 0, totalIzin = 0, totalAlpha = 0;
    allAbsenToday.forEach((a) => {
      if (a.keterangan === "Hadir") totalHadir++;
      else if (a.keterangan === "Sakit") totalSakit++;
      else if (a.keterangan === "Izin") totalIzin++;
      else if (a.keterangan === "Alpha") totalAlpha++;
    });

    const totalScheduledSessions = allSchedules.length;
    let filledSessionsCount = 0;

    const scheduleCompliance = allSchedules.map((sch) => {
      const records = allAbsenToday.filter(
        (a) => a.mapel_id === sch.mapel_id && a.kelas === sch.kelas.nama_kelas
      );
      const isFilled = records.length > 0;
      if (isFilled) filledSessionsCount++;

      let hadir = 0, sakit = 0, izin = 0, alpha = 0;
      records.forEach((r) => {
        if (r.keterangan === "Hadir") hadir++;
        else if (r.keterangan === "Sakit") sakit++;
        else if (r.keterangan === "Izin") izin++;
        else if (r.keterangan === "Alpha") alpha++;
      });

      return {
        jadwalId: sch.id.toString(),
        kelasNama: sch.kelas.nama_kelas,
        jenjang: sch.kelas.jenjang,
        mapelNama: sch.mapel.nama_mapel,
        mapelKode: sch.mapel.kode_mapel,
        jamMulai: sch.jam_mulai,
        jamSelesai: sch.jam_selesai,
        guruId: sch.guru.id.toString(),
        guruNama: sch.guru.name,
        guruNip: sch.guru.nip || "-",
        isFilled,
        recordsCount: records.length,
        hadir,
        sakit,
        izin,
        alpha,
      };
    });

    const complianceRate = totalScheduledSessions > 0
      ? Math.round((filledSessionsCount / totalScheduledSessions) * 100)
      : 100;

    return {
      date: dateStr,
      hari,
      summary: {
        totalScheduledSessions,
        filledSessionsCount,
        unfilledSessionsCount: totalScheduledSessions - filledSessionsCount,
        complianceRate,
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpha,
      },
      scheduleCompliance,
      classList: classes.map((c) => ({ id: c.id.toString(), nama: c.nama_kelas })),
    };
  }

  /**
   * Mengambil riwayat presensi siswa yang dirinci per mata pelajaran untuk portal siswa.
   */
  static async getStudentSubjectAttendanceHistory(
    studentId: bigint | string
  ): Promise<{
    overallStats: { hadir: number; sakit: number; izin: number; alpha: number; percentage: number };
    subjectSummaries: SubjectAttendanceSummary[];
    recentLogs: StudentAttendanceLogItem[];
    allLogs: StudentAttendanceLogItem[];
    calendarEvents: StudentAttendanceEvent[];
  }> {
    const sId = BigInt(studentId);

    const records = await prisma.absen.findMany({
      where: { user_id: sId },
      include: {
        mapel: {
          select: { id: true, nama_mapel: true, kode_mapel: true },
        },
        guru: {
          select: { name: true },
        },
      },
      orderBy: { date: "desc" },
    });

    let totalHadir = 0, totalSakit = 0, totalIzin = 0, totalAlpha = 0;
    const subjectMap = new Map<string, { hadir: number; sakit: number; izin: number; alpha: number; nama: string; kode: string }>();

    records.forEach((r) => {
      if (r.keterangan === "Hadir") totalHadir++;
      else if (r.keterangan === "Sakit") totalSakit++;
      else if (r.keterangan === "Izin") totalIzin++;
      else if (r.keterangan === "Alpha") totalAlpha++;

      if (r.mapel_id && r.mapel) {
        const key = r.mapel_id.toString();
        const existing = subjectMap.get(key) || {
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpha: 0,
          nama: r.mapel.nama_mapel,
          kode: r.mapel.kode_mapel,
        };
        if (r.keterangan === "Hadir") existing.hadir++;
        else if (r.keterangan === "Sakit") existing.sakit++;
        else if (r.keterangan === "Izin") existing.izin++;
        else if (r.keterangan === "Alpha") existing.alpha++;
        subjectMap.set(key, existing);
      }
    });

    const totalRecords = totalHadir + totalSakit + totalIzin + totalAlpha;
    const overallPercentage = totalRecords > 0 ? Math.round((totalHadir / totalRecords) * 100) : 100;

    const subjectSummaries: SubjectAttendanceSummary[] = Array.from(subjectMap.entries()).map(([mapelId, data]) => {
      const total = data.hadir + data.sakit + data.izin + data.alpha;
      const percentage = total > 0 ? Math.round((data.hadir / total) * 100) : 100;
      return {
        mapelId,
        mapelNama: data.nama,
        mapelKode: data.kode,
        totalPertemuan: total,
        hadir: data.hadir,
        sakit: data.sakit,
        izin: data.izin,
        alpha: data.alpha,
        percentage,
      };
    });

    const colorMap: Record<string, string> = {
      Hadir: "#10b981", // emerald-500
      Sakit: "#0284c7", // sky-600
      Izin: "#d97706",  // amber-600
      Alpha: "#e11d48", // rose-600
    };

    const allLogs: StudentAttendanceLogItem[] = records.map((r) => ({
      id: r.id.toString(),
      date: r.date || "",
      mapelId: r.mapel_id ? r.mapel_id.toString() : undefined,
      mapelNama: r.mapel?.nama_mapel || "Presensi Umum",
      mapelKode: r.mapel?.kode_mapel || "-",
      keterangan: r.keterangan || "Hadir",
      catatan: r.catatan || undefined,
      jamKe: r.jam_ke || undefined,
      guruNama: r.guru?.name || undefined,
    }));

    const calendarEvents: StudentAttendanceEvent[] = records.map((a) => {
      const parts = (a.date || "").split("-");
      const formattedDate =
        parts.length === 3
          ? `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
          : a.date || "";

      const ket = a.keterangan || "Hadir";
      const bg = colorMap[ket] || "#10b981";
      const mapelTitle = a.mapel?.nama_mapel ? `${a.mapel.nama_mapel}: ${ket}` : ket;

      return {
        id: a.id.toString(),
        title: mapelTitle,
        start: formattedDate,
        backgroundColor: bg,
        keterangan: ket,
        mapelId: a.mapel_id ? a.mapel_id.toString() : undefined,
        mapelNama: a.mapel?.nama_mapel || "Presensi Umum",
        mapelKode: a.mapel?.kode_mapel || "-",
        catatan: a.catatan || "",
        jamKe: a.jam_ke || "",
        guruNama: a.guru?.name || "",
      };
    });

    return {
      overallStats: {
        hadir: totalHadir,
        sakit: totalSakit,
        izin: totalIzin,
        alpha: totalAlpha,
        percentage: overallPercentage,
      },
      subjectSummaries,
      recentLogs: allLogs.slice(0, 30),
      allLogs,
      calendarEvents,
    };
  }

  /**
   * Menghapus seluruh data presensi untuk tanggal, kelas, dan mapel tertentu
   */
  static async deleteSubjectAttendance(date: string, kelas: string, mapelId?: bigint | string) {
    const where: Prisma.AbsenWhereInput = {
      date,
      kelas,
      ...(mapelId ? { mapel_id: BigInt(mapelId) } : {}),
    };

    const result = await prisma.absen.deleteMany({ where });
    return result.count;
  }

  /**
   * Menghapus seluruh data presensi harian rombel (Legacy)
   */
  static async deleteAttendanceByDate(date: string, kelas: string) {
    const result = await prisma.absen.deleteMany({
      where: { date, kelas },
    });
    return result.count;
  }

  /**
   * Mengambil rekap presensi bulanan beserta matriks harian per siswa (Legacy Rombel)
   */
  static async getAttendanceRecap(
    kelas: string,
    month: number,
    year: number
  ): Promise<{
    kelas: string;
    month: number;
    year: number;
    daysInMonth: number;
    data: StudentAttendanceSummary[];
  }> {
    const students = await prisma.user.findMany({
      where: { kelas, status: "1" },
      orderBy: { name: "asc" },
    });

    const attendanceList = await prisma.absen.findMany({
      where: {
        kelas,
        month: String(month),
      },
    });

    const daysInMonth = new Date(year, month, 0).getDate();

    const report: StudentAttendanceSummary[] = students.map((student) => {
      const studentAbsens = attendanceList.filter((a) => a.user_id === student.id);
      let hadir = 0, sakit = 0, izin = 0, alpha = 0;
      const dailyMap: Record<number, string> = {};

      studentAbsens.forEach((a) => {
        const parts = (a.date || "").split("-");
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          dailyMap[day] = a.keterangan || "";
        }
        if (a.keterangan === "Hadir") hadir++;
        else if (a.keterangan === "Sakit") sakit++;
        else if (a.keterangan === "Izin") izin++;
        else if (a.keterangan === "Alpha") alpha++;
      });

      const total = hadir + sakit + izin + alpha;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;

      return {
        studentId: student.id.toString(),
        name: student.name,
        nis: student.nis || "-",
        gender: student.gender || "L",
        hadir,
        sakit,
        izin,
        alpha,
        daily: dailyMap,
        percentage,
      };
    });

    return {
      kelas,
      month,
      year,
      daysInMonth,
      data: report,
    };
  }

  /**
   * Mengambil status kehadiran per tanggal dalam satu bulan untuk kalender interaktif
   */
  static async getMonthlyStatus(kelas: string, monthStr: string) {
    const records = await prisma.absen.findMany({
      where: {
        kelas,
        month: monthStr,
      },
      select: {
        date: true,
        keterangan: true,
      },
    });

    const dateSet = new Set<string>();
    records.forEach((r) => {
      if (r.date) dateSet.add(r.date);
    });

    return Array.from(dateSet);
  }
}
