import prisma from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serializer";
import { compareScheduleTime, getUserProfileImage } from "@/lib/utils";

export interface StudentDashboardResult {
  studentInfo: {
    id: string;
    name: string;
    nis: string;
    image: string;
    gender: string | null;
    kelas: string;
    points: number;
    waliKelas: string;
  };
  metrics: {
    totalHadirBulanIni: number;
    totalKegiatanBulanIni: number;
    pendingTasksCount: number;
    totalMapelCount: number;
  };
  classmates: {
    id: string;
    name: string;
    image: string;
    gender: string | null;
  }[];
  announcements: {
    id: string;
    from: string;
    title: string;
    file: string | null;
    pengumuman: string;
    like: string;
    isLiked: boolean;
    created_at: Date | string | null;
  }[];
  achievements: any[];
  todaySchedules: any[];
}

export class DashboardService {
  /**
   * Mengambil dan mengagregasi seluruh data untuk Dashboard Siswa
   */
  static async getStudentDashboardData(
    userId: string,
    studentClass: string,
    sessionUser?: { image?: string | null; gender?: string | null; nis?: string | null; name?: string | null }
  ): Promise<StudentDashboardResult> {
    const isNum = /^\d+$/.test(userId);
    const userIdBigInt = isNum ? BigInt(userId) : null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentMonthStr = String(currentMonthNum).padStart(2, "0");
    const currentYearMonth = `${currentYear}-${currentMonthStr}`;

    const startOfMonth = new Date(currentYear, now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDayName = DAY_NAMES[now.getDay()];

    const [dbUser, dbKelas, dbHadirMonth, dbEventsMonth, dbClassmates, dbAnnounce, dbAchieve] =
      await Promise.all([
        userIdBigInt
          ? prisma.user.findUnique({
              where: { id: userIdBigInt },
              select: { image: true, point: true, nis: true, name: true, gender: true },
            }).catch(() => null)
          : null,
        studentClass
          ? prisma.kelas.findFirst({
              where: { nama_kelas: studentClass },
            }).catch(() => null)
          : null,
        userIdBigInt
          ? prisma.absen.count({
              where: {
                user_id: userIdBigInt,
                date: { startsWith: currentYearMonth },
                keterangan: { in: ["Hadir", "hadir", "H"] },
              },
            }).catch(() => 0)
          : 0,
        prisma.event.count({
          where: {
            AND: [
              {
                OR: [
                  { kelas: "Semua Kelas" },
                  ...(studentClass ? [{ kelas: studentClass }] : []),
                  { from: "admin" },
                  { kelas: "Umum" },
                ],
              },
              {
                start: { lte: endOfMonth },
              },
              {
                OR: [
                  { end: { gte: startOfMonth } },
                  { end: null, start: { gte: startOfMonth } },
                ],
              },
            ],
          },
        }).catch(() => 0),
        studentClass
          ? prisma.user.findMany({
              where: { kelas: studentClass, status: "1" },
              select: { id: true, name: true, image: true, gender: true },
              orderBy: { name: "asc" },
            }).catch(() => [])
          : [],
        prisma.pengumuman.findMany({
          where: {
            OR: [{ from: "IT" }, ...(studentClass ? [{ from: studentClass }] : [])],
          },
          orderBy: { id: "desc" },
          take: 10,
        }).catch(() => []),
        prisma.prestasi.findMany({
          orderBy: { created_at: "desc" },
          take: 5,
        }).catch(() => []),
      ]);

    // Wali kelas fallback
    let waliKelas = dbKelas?.wali_kelas;
    if ((!waliKelas || waliKelas === "-" || waliKelas === "Belum ditentukan") && studentClass) {
      try {
        const teacher = await prisma.user.findFirst({
          where: {
            kelas: studentClass,
            status: { in: ["2", "4"] },
          },
          select: { name: true },
        });
        if (teacher?.name) {
          waliKelas = teacher.name;
        }
      } catch (e) {
        console.error("Error fetching teacher wali_kelas fallback:", e);
      }
    }

    // Likes status pengumuman
    const announcementIds = (dbAnnounce || []).map((p) => p.id.toString());
    let likedPostIds = new Set<string>();
    if (announcementIds.length > 0 && userId) {
      try {
        const userLikes = await prisma.like.findMany({
          where: {
            user_id: String(userId),
            post_id: { in: announcementIds },
          },
          select: { post_id: true },
        });
        likedPostIds = new Set(userLikes.map((l) => l.post_id));
      } catch (e) {
        console.error("Error fetching announcement likes:", e);
      }
    }

    const formattedAnnouncements = (dbAnnounce || []).map((p) => {
      const pId = p.id.toString();
      return {
        id: pId,
        from: p.from || "IT",
        title: p.title || "Pengumuman",
        file: p.file || null,
        pengumuman: p.pengumuman || "",
        like: p.like || "0",
        isLiked: likedPostIds.has(pId),
        created_at: p.created_at || null,
      };
    });

    // Jadwal & Tugas Aktif
    let todaySchedules: any[] = [];
    let pendingTasksCount = 0;
    let totalMapelCount = 0;

    if (dbKelas?.id) {
      try {
        const [jadwalKelas, activeTasks, countMapel] = await Promise.all([
          prisma.jadwalPelajaran.findMany({
            where: {
              kelas_id: dbKelas.id,
              hari: todayDayName,
            },
            include: {
              mapel: true,
              guru: {
                select: { id: true, name: true, image: true, guru_bidang: true },
              },
            },
          }),
          prisma.tugas.findMany({
            where: {
              kelas_id: dbKelas.id,
              status: { in: ["aktif", "PUBLISHED"] },
              deadline: { gte: now },
            },
            include: {
              submissions: userIdBigInt
                ? {
                    where: { siswa_id: userIdBigInt },
                    select: { id: true, status: true },
                  }
                : false,
            },
          }),
          prisma.mataPelajaran.count({
            where: dbKelas.jenjang ? { OR: [{ jenjang: dbKelas.jenjang }, { jenjang: "SEMUA" }] } : {},
          }),
        ]);

        totalMapelCount = countMapel;

        pendingTasksCount = (activeTasks || []).filter((t: any) => {
          const userSub = t.submissions?.[0];
          return !userSub || userSub.status === "BELUM_MENGERJAKAN";
        }).length;

        todaySchedules = (jadwalKelas || [])
          .sort((a, b) =>
            compareScheduleTime(
              a.hari,
              a.jam_mulai,
              a.jam_selesai,
              b.hari,
              b.jam_mulai,
              b.jam_selesai
            )
          )
          .map((s) => {
            const tasksForMapel = (activeTasks || []).filter((t: any) => t.mapel_id === s.mapel_id);
            const unsubmitted = tasksForMapel.filter(
              (t: any) => !t.submissions || t.submissions.length === 0
            ).length;

            return {
              id: s.id.toString(),
              kodeMapel: s.mapel?.kode_mapel || "-",
              namaMapel: s.mapel?.nama_mapel || "Mata Pelajaran",
              guruNama: s.guru?.name || "Guru Pengampu",
              waktu: `${s.jam_mulai || "07:30"} - ${s.jam_selesai || "09:00"}`,
              ruang: s.ruang || "-",
              activeTasksCount: unsubmitted,
              detailUrl: `/siswa/mapel/${s.mapel_id || s.id}`,
            };
          });
      } catch (e) {
        console.error("Error fetching student schedule & tasks:", e);
      }
    }

    // Prestasi siswa & enrich foto
    const achieveUserIds = (dbAchieve || [])
      .map((a: any) => {
        try {
          const n = BigInt(a.id_user);
          return n > BigInt(0) ? n : null;
        } catch {
          return null;
        }
      })
      .filter((id: any): id is bigint => id !== null);

    const achieveNames = (dbAchieve || []).map((a: any) => a.nama).filter(Boolean);

    const matchedAchieveUsers = await prisma.user.findMany({
      where: {
        OR: [
          ...(achieveUserIds.length > 0 ? [{ id: { in: achieveUserIds } }] : []),
          ...(achieveNames.length > 0 ? [{ name: { in: achieveNames } }] : []),
        ],
      },
      select: { id: true, name: true, gender: true, image: true },
    }).catch(() => []);

    const achieveUserById = new Map<string, (typeof matchedAchieveUsers)[0]>();
    const achieveUserByName = new Map<string, (typeof matchedAchieveUsers)[0]>();
    for (const u of matchedAchieveUsers) {
      achieveUserById.set(u.id.toString(), u);
      achieveUserByName.set(u.name.trim().toLowerCase(), u);
    }

    const formattedAchievements = (dbAchieve || []).map((ach: any) => {
      const studentUser = achieveUserById.get(ach.id_user) || achieveUserByName.get(ach.nama?.trim().toLowerCase());
      const studentImg = studentUser?.image || null;

      return {
        ...ach,
        id: ach.id.toString(),
        studentImage: studentImg,
        studentGender: studentUser?.gender || null,
      };
    });

    const userProfileImg = getUserProfileImage(
      dbUser?.image || sessionUser?.image,
      dbUser?.gender || sessionUser?.gender
    );

    const formattedClassmates = (dbClassmates || []).map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      image: getUserProfileImage(c.image, c.gender),
      gender: c.gender,
    }));

    return {
      studentInfo: {
        id: userId,
        name: dbUser?.name || sessionUser?.name || "Siswa",
        nis: dbUser?.nis || sessionUser?.nis || "-",
        image: userProfileImg,
        gender: dbUser?.gender || sessionUser?.gender || null,
        kelas: studentClass || "Belum Ditentukan",
        points: Number(dbUser?.point) || 0,
        waliKelas: waliKelas || "-",
      },
      metrics: {
        totalHadirBulanIni: dbHadirMonth || 0,
        totalKegiatanBulanIni: dbEventsMonth || 0,
        pendingTasksCount,
        totalMapelCount,
      },
      classmates: formattedClassmates,
      announcements: formattedAnnouncements,
      achievements: serializeBigInt(formattedAchievements),
      todaySchedules,
    };
  }
}
