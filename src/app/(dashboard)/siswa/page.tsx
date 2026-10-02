import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowRight, Trophy } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserProfileImage } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  IslamicMosaicPattern,
  IslamicStarGeometricPattern,
  AlAzharColorfulMosqueHero,
  AlAzharMosaicStrip,
  AlAzharCornerMosaic,
  AlAzharSchoolBanner,
} from "@/components/shared/alazhar-patterns";

export const dynamic = "force-dynamic";

export default async function SiswaDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentClass = session.kelas || "";
  const isNum = /^\d+$/.test(session.id);
  const userIdBigInt = isNum ? BigInt(session.id) : null;

  let kelasInfo: any = null;
  let totalHadirMonth = 0;
  let totalEventsMonth = 0;
  let classmates: any[] = [];
  let announcements: any[] = [];
  let achievements: any[] = [];
  let studentImage: string | null = session.image || null;
  let studentNis = session.nis || "-";
  let studentName = session.name || "Siswa";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthStr = String(currentMonthNum).padStart(2, "0");
  const todayStr = `${currentYear}-${currentMonthStr}-${String(now.getDate()).padStart(2, "0")}`;
  const currentYearMonth = `${currentYear}-${currentMonthStr}`;

  const startOfMonth = new Date(currentYear, now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayDayName = DAY_NAMES[now.getDay()];

  try {
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

    const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
    const photoMap = new Map<string, string | null>();
    const genderMap = new Map<string, string | null>();
    (dbClassmates || []).forEach((u) => {
      if (u.image) {
        photoMap.set(normalizeName(u.name), u.image);
      }
      genderMap.set(normalizeName(u.name), u.gender);
    });

    kelasInfo = dbKelas;
    totalHadirMonth = dbHadirMonth || 0;
    totalEventsMonth = dbEventsMonth || 0;
    classmates = dbClassmates || [];
    announcements = dbAnnounce || [];

    // Fetch student profile data for dashboard achievements
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
      select: {
        id: true,
        name: true,
        gender: true,
        image: true,
      },
    }).catch(() => []);

    const achieveUserById = new Map<string, (typeof matchedAchieveUsers)[0]>();
    const achieveUserByName = new Map<string, (typeof matchedAchieveUsers)[0]>();
    for (const u of matchedAchieveUsers) {
      achieveUserById.set(u.id.toString(), u);
      achieveUserByName.set(u.name.trim().toLowerCase(), u);
    }

    achievements = (dbAchieve || []).map((ach: any) => {
      const studentUser = achieveUserById.get(ach.id_user) || achieveUserByName.get(ach.nama.trim().toLowerCase());
      const studentImg =
        studentUser?.image ||
        (ach.fotoanak &&
        !ach.fotoanak.includes("trophy") &&
        !ach.fotoanak.includes("best-student") &&
        !ach.fotoanak.includes("best-point")
          ? ach.fotoanak
          : null);

      return {
        ...ach,
        studentImage: studentImg,
        studentGender: studentUser?.gender || null,
      };
    });

    // Student identity info
    studentImage = getUserProfileImage(dbUser?.image || session.image, dbUser?.gender || (session as any).gender);
    studentNis = dbUser?.nis || session.nis || "-";
    studentName = dbUser?.name || session.name || "Siswa";
  } catch (e) {
    console.error("Database query error in siswa dashboard:", e);
  }

  if (!kelasInfo) {
    kelasInfo = { id: null, wali_kelas: "-", nama_kelas: studentClass || "Belum ditentukan" };
  }

  let waliKelas = kelasInfo?.wali_kelas;
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

  const announcementIds = (announcements || []).map((p) => (p.id ? p.id.toString() : "")).filter(Boolean);
  let likedPostIds = new Set<string>();
  if (announcementIds.length > 0 && session?.id) {
    try {
      const userLikes = await prisma.like.findMany({
        where: {
          user_id: String(session.id),
          post_id: { in: announcementIds },
        },
        select: { post_id: true },
      });
      likedPostIds = new Set(userLikes.map((l) => l.post_id));
    } catch (e) {
      console.error("Error fetching user announcement likes:", e);
    }
  }

  const formattedAnnouncements = (announcements || []).map((p) => {
    const pId = p.id ? p.id.toString() : Math.random().toString();
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

  // Fetch Jadwal Hari Ini & Tugas Siswa
  let todaySchedules: any[] = [];
  let pendingTasksCount = 0;
  let totalMapelCount = 0;

  try {
    if (kelasInfo?.id) {
      const [jadwalKelas, activeTasks, countMapel] = await Promise.all([
        prisma.jadwalPelajaran.findMany({
          where: { kelas_id: kelasInfo.id },
          include: {
            mapel: true,
            guru: { select: { name: true, image: true } },
          },
          orderBy: [{ jam_mulai: "asc" }],
        }).catch(() => []),
        prisma.tugas.findMany({
          where: { kelas_id: kelasInfo.id, status: "aktif" },
          include: userIdBigInt
            ? {
              submissions: { where: { siswa_id: userIdBigInt } },
            }
            : undefined,
        }).catch(() => []),
        prisma.mataPelajaran.count({
          where: {
            OR: [
              { jenjang: (kelasInfo as any)?.jenjang || "SD" },
              { jenjang: "SEMUA" },
            ],
          },
        }).catch(() => 0),
      ]);

      const tasksList = (activeTasks as any[]) || [];
      pendingTasksCount = tasksList.filter(
        (t) => !t.submissions || t.submissions.length === 0 || t.submissions[0]?.status === "perlu_revisi"
      ).length;

      const uniqueInJadwal = new Set((jadwalKelas as any[]).map((j) => j.mapel_id).filter(Boolean)).size;
      totalMapelCount = countMapel || uniqueInJadwal || 0;

      if (jadwalKelas && jadwalKelas.length > 0) {
        // Filter khusus jadwal untuk hari ini
        const schedulesForToday = (jadwalKelas as any[]).filter(
          (j) => j.hari?.trim().toLowerCase() === todayDayName.toLowerCase()
        );

        todaySchedules = schedulesForToday.map((j) => {
          const tasksForMapel = tasksList.filter((t) => t.mapel_id === j.mapel_id);
          const unsubmitted = tasksForMapel.filter(
            (t) => !t.submissions || t.submissions.length === 0
          ).length;

          return {
            id: j.id.toString(),
            kodeMapel: j.mapel?.kode_mapel || "-",
            namaMapel: j.mapel?.nama_mapel || "Mata Pelajaran",
            guruNama: j.guru?.name || "Guru Pengampu",
            waktu: `${j.jam_mulai || "07:30"} - ${j.jam_selesai || "09:00"}`,
            ruang: j.ruang || "-",
            activeTasksCount: unsubmitted,
            detailUrl: `/siswa/mapel/${j.mapel_id || j.id}`,
          };
        });
      }
    }
  } catch (err) {
    console.error("Error fetching schedules/tasks in siswa dashboard:", err);
  }

  return (
    <div className="space-y-8">
      {/* Premium Hero Banner Siswa — Gradasi Mewah, Motif Islami & Siluet Masjid Warna-Warni */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#09574c] to-[#083344] p-6 sm:p-8 md:p-9 text-white shadow-2xl border border-emerald-400/35">
        {/* Decorative Ambient Lighting & Color Glows */}
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 h-64 w-64 rounded-full bg-teal-400/25 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-10 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />

        {/* Motif Desain: Islamic Geometric Star Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.16] pointer-events-none mix-blend-screen">
          <IslamicStarGeometricPattern />
        </div>
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-overlay">
          <IslamicMosaicPattern />
        </div>

        {/* Corner Mosaic Motif di Sudut Kanan Atas */}
        <div className="absolute top-0 right-0 w-36 sm:w-44 h-28 opacity-40 pointer-events-none">
          <AlAzharCornerMosaic className="w-full h-full" />
        </div>

        {/* Siluet Arsitektur Masjid Al-Azhar Berwarna-Warni */}
        <div className="absolute right-0 bottom-0 top-0 w-full sm:w-[62%] lg:w-[50%] flex items-end justify-end pointer-events-none opacity-95 overflow-hidden">
          <AlAzharColorfulMosqueHero className="h-[92%] sm:h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Pita Mozaik Segitiga Warna-Warni di Garis Bawah Card */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 opacity-90 overflow-hidden">
          <AlAzharMosaicStrip className="h-full w-full object-cover" />
        </div>

        <div className="relative z-10 max-w-xl lg:max-w-2xl">
          {/* Greeting */}
          <div className="space-y-2.5">
            <h1 dir="ltr" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              <span dir="rtl" className="inline-block text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                السَّلاَمُ عَلَيْكُمْ
              </span>
              ,{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-yellow-200 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                {studentName}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-50/90 font-normal leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              Selamat datang kembali di portal pembelajaran Student Apps. Semangat belajar dan raih prestasi terbaik hari ini!
            </p>
          </div>
        </div>
      </div>


      {/* 4 Stat Cards Bertema Al-Azhar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Hadir Bulan Ini"
          value={`${totalHadirMonth} Hari`}
          variant="amber"
          href="/siswa/attendance"
        />
        <StatCard
          title="Kegiatan Bulan Ini"
          value={`${totalEventsMonth} Kegiatan`}
          variant="accent"
          href="/siswa/calendar"
        />
        <StatCard
          title="Tugas Aktif"
          value={`${pendingTasksCount} Tugas`}
          variant="rose"
          href="/siswa/mapel"
        />
        <StatCard
          title="Mata Pelajaran"
          value={`${totalMapelCount} Mapel`}
          variant="primary"
          href="/siswa/mapel"
        />
      </div>


      {/* Widget Section: Jadwal Hari Ini */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Jadwal Hari Ini
            </h2>
          </div>
          <Link
            href="/siswa/mapel"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Jadwal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todaySchedules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySchedules.map((subj) => (
              <Link
                key={subj.id}
                href={subj.detailUrl}
                className="group relative rounded-2xl border border-border/80 hover:border-emerald-500/40 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <Badge variant="outline" size="xs">
                      {subj.waktu}
                    </Badge>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {subj.activeTasksCount > 0 && (
                        <Badge variant="amber" size="xs">
                          {subj.activeTasksCount} Tugas
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:text-primary group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                    {subj.namaMapel}
                  </h3>

                  <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                    {subj.guruNama && (
                      <div className="truncate font-medium text-foreground/80">
                        {subj.guruNama}
                      </div>
                    )}
                    {subj.ruang && subj.ruang !== "-" && (
                      <div className="truncate text-[11px] text-muted-foreground/75">
                        Ruang: {subj.ruang}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-6 sm:p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">Tidak Ada Jadwal Pelajaran Hari Ini</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Hari ini ({todayDayName}) tidak ada jadwal pelajaran aktif untuk kelas {studentClass || "Anda"}.
            </p>
            <div className="pt-2">
              <Link
                href="/siswa/mapel"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Lihat Semua Jadwal Mingguan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 2 Columns: Announcements + Prestasi Terkini & Banner Sekolah */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Timeline Pengumuman */}
        <div className="space-y-3.5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Pengumuman Sekolah & Kelas</h2>
          </div>
          <AnnouncementTimeline
            announcements={formattedAnnouncements}
            userRole="siswa"
            canManage={false}
          />
        </div>

        {/* Right side: Prestasi Siswa & Banner Motto */}
        <div className="space-y-6 lg:col-span-5">
          {/* Prestasi Terkini Section */}
          <Card className="border border-amber-500/20 rounded-xl shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>Prestasi Terkini</span>
                </CardTitle>
                <Badge variant="outline" size="xs">
                  Siswa Berprestasi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 italic">
                  Belum ada prestasi siswa dicatat.
                </p>
              ) : (
                achievements.map((ach) => (
                  <div
                    key={ach.id.toString()}
                    className="flex items-center gap-3 rounded-lg border p-2.5 text-xs transition-colors hover:bg-muted/30"
                  >
                    <div className="shrink-0">
                      <UserAvatar
                        src={ach.studentImage}
                        gender={ach.studentGender}
                        name={ach.nama}
                        className="h-9 w-9 rounded-lg object-cover border border-border shadow-xs"
                        previewable={true}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{ach.prestasi}</p>
                      <p className="text-muted-foreground truncate">{ach.nama} • {ach.kelas}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Official Al-Azhar School Motto Banner */}
          <Card className="border border-border/80 bg-white/95 dark:bg-card/95 rounded-2xl shadow-xs overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-sky-500" />
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <AlAzharSchoolBanner />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
