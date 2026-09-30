import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserProfileImage } from "@/lib/utils";
import { IslamicMosaicPattern, AlAzharSchoolBanner } from "@/components/shared/alazhar-patterns";

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
    const [dbUser, dbKelas, dbHadirMonth, dbEventsMonth, dbClassmates, dbAnnounce] =
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

  const formattedAnnouncements = (announcements || []).map((p) => ({
    id: p.id ? p.id.toString() : Math.random().toString(),
    from: p.from || "IT",
    title: p.title || "Pengumuman",
    file: p.file || null,
    pengumuman: p.pengumuman || "",
    like: p.like || "0",
    created_at: p.created_at || null,
  }));

  // Fetch Jadwal Hari Ini & Tugas Siswa
  let todaySchedules: any[] = [];
  let pendingTasksCount = 0;

  try {
    if (kelasInfo?.id) {
      const [jadwalKelas, activeTasks] = await Promise.all([
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
      ]);

      const tasksList = (activeTasks as any[]) || [];
      pendingTasksCount = tasksList.filter(
        (t) => !t.submissions || t.submissions.length === 0 || t.submissions[0]?.status === "perlu_revisi"
      ).length;

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
      {/* Premium Hero Banner Siswa — Bertema Hijau Zamrud Al-Azhar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 p-5 sm:p-7 md:p-8 text-white shadow-xl border border-emerald-500/30">
        {/* Decorative Ambient Lighting & Glows */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/22 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-teal-400/18 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 h-40 w-40 rounded-full bg-amber-500/12 blur-2xl pointer-events-none" />

        {/* Geometric Mosaic Overlay from Logo */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen">
          <IslamicMosaicPattern />
        </div>

        <div className="relative z-10">
          {/* Greeting */}
          <div className="space-y-2 max-w-3xl">
            <h1 dir="ltr" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              <span dir="rtl" className="inline-block">السَّلاَمُ عَلَيْكُمْ</span>,{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-amber-200 bg-clip-text text-transparent">
                {studentName}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/85 font-normal leading-relaxed">
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
          description="Total kehadiran bulan ini"
          variant="amber"
          href="/siswa/attendance"
        />
        <StatCard
          title="Kegiatan Bulan Ini"
          value={`${totalEventsMonth} Kegiatan`}
          description="Agenda kalender sekolah"
          variant="accent"
          href="/siswa/calendar"
        />
        <StatCard
          title="Tugas Aktif"
          value={`${pendingTasksCount} Tugas`}
          description="Tugas perlu dikerjakan"
          variant="rose"
          href="/siswa/tugas"
        />
        <StatCard
          title="Jadwal Hari Ini"
          value={`${todaySchedules.length} Sesi`}
          description={`Hari ${todayDayName}`}
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
            <p className="text-xs text-muted-foreground mt-0.5">
              Jadwal pelajaran aktif untuk kelas {studentClass || "Anda"} hari ini
            </p>
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
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-tight">
                      {subj.waktu}
                    </span>

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

      {/* 2 Columns: Announcements + Banner Sekolah */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Timeline Pengumuman */}
        <div className="space-y-3.5 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Pengumuman Sekolah & Kelas</h2>
          </div>
          <AnnouncementTimeline
            announcements={formattedAnnouncements}
            userRole="siswa"
            canManage={false}
          />
        </div>

        {/* Official Al-Azhar School Motto Banner */}
        <div className="space-y-6 lg:col-span-4">
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
