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
import { UserAvatar } from "@/components/shared/user-avatar";
import { getDefaultProfileImage, getUserProfileImage } from "@/lib/utils";
import { SubjectCard } from "@/components/features/subjects/subject-card";
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

  try {
    const [dbUser, dbKelas, dbHadirMonth, dbEventsMonth, dbClassmates, dbAnnounce] =
      await Promise.all([
        userIdBigInt
          ? prisma.user.findUnique({
              where: { id: userIdBigInt },
              select: { image: true, point: true, nis: true, name: true, gender: true },
            })
          : null,
        studentClass
          ? prisma.kelas.findFirst({
              where: { nama_kelas: studentClass },
            })
          : null,
        userIdBigInt
          ? prisma.absen.count({
              where: {
                user_id: userIdBigInt,
                date: { startsWith: currentYearMonth },
                keterangan: { in: ["Hadir", "hadir", "H"] },
              },
            })
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
        }),
        studentClass
          ? prisma.user.findMany({
              where: { kelas: studentClass, status: "1" },
            })
          : [],
        prisma.pengumuman.findMany({
          where: {
            OR: [{ from: "IT" }, { from: studentClass }],
          },
          orderBy: { id: "desc" },
          take: 10,
        }),
      ]);

    const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
    const photoMap = new Map<string, string | null>();
    const genderMap = new Map<string, string | null>();
    dbClassmates.forEach((u) => {
      if (u.image) {
        photoMap.set(normalizeName(u.name), u.image);
      }
      genderMap.set(normalizeName(u.name), u.gender);
    });

    kelasInfo = dbKelas;
    totalHadirMonth = dbHadirMonth;
    totalEventsMonth = dbEventsMonth;
    classmates = dbClassmates;
    announcements = dbAnnounce;

    // Student identity info
    studentImage = getUserProfileImage(dbUser?.image || session.image, dbUser?.gender || (session as any).gender);
    studentNis = dbUser?.nis || session.nis || "-";
    studentName = dbUser?.name || session.name || "Siswa";
  } catch (e) {
    console.error("Database query error in siswa dashboard:", e);
  }

  if (!kelasInfo) {
    kelasInfo = { wali_kelas: "-", nama_kelas: studentClass || "Belum ditentukan" };
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

  const formattedAnnouncements = announcements.map((p) => ({
    id: p.id.toString(),
    from: p.from,
    title: p.title,
    file: p.file,
    pengumuman: p.pengumuman,
    like: p.like,
    created_at: p.created_at,
  }));

  // Fetch Mata Pelajaran & Jadwal Siswa
  let subjectsForDashboard: any[] = [];
  let pendingTasksCount = 0;

  if (kelasInfo) {
    const [jadwalKelas, activeTasks] = await Promise.all([
      prisma.jadwalPelajaran.findMany({
        where: { kelas_id: kelasInfo.id },
        include: {
          mapel: true,
          guru: { select: { name: true, image: true } },
        },
        orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
      }),
      prisma.tugas.findMany({
        where: { kelas_id: kelasInfo.id, status: "aktif" },
        include: {
          submissions: userIdBigInt ? { where: { siswa_id: userIdBigInt } } : false,
        },
      }),
    ]);

    pendingTasksCount = activeTasks.filter(
      (t) => !t.submissions || t.submissions.length === 0 || t.submissions[0].status === "perlu_revisi"
    ).length;

    if (jadwalKelas.length > 0) {
      subjectsForDashboard = jadwalKelas.map((j) => {
        const tasksForMapel = activeTasks.filter((t) => t.mapel_id === j.mapel_id);
        const unsubmitted = tasksForMapel.filter(
          (t) => !t.submissions || t.submissions.length === 0
        ).length;

        return {
          id: j.mapel.id.toString(),
          kodeMapel: j.mapel.kode_mapel,
          namaMapel: j.mapel.nama_mapel,
          jenjang: j.mapel.jenjang,
          icon: j.mapel.icon,
          warna: j.mapel.warna,
          guruNama: j.guru.name,
          guruImage: j.guru.image,
          jadwalHari: j.hari,
          jadwalWaktu: `${j.jam_mulai} - ${j.jam_selesai}`,
          ruang: j.ruang,
          activeTasksCount: unsubmitted,
          detailUrl: `/siswa/mapel/${j.mapel.id}`,
        };
      });
    } else {
      const generalMapel = await prisma.mataPelajaran.findMany({
        where: { OR: [{ jenjang: kelasInfo.jenjang || "SD" }, { jenjang: "SEMUA" }] },
        take: 6,
        orderBy: { nama_mapel: "asc" },
      });

      subjectsForDashboard = generalMapel.map((m) => ({
        id: m.id.toString(),
        kodeMapel: m.kode_mapel,
        namaMapel: m.nama_mapel,
        jenjang: m.jenjang,
        icon: m.icon,
        warna: m.warna,
        guruNama: "Guru Pengampu",
        jadwalHari: "Senin - Jumat",
        jadwalWaktu: "07:30 - 09:00",
        activeTasksCount: 0,
        detailUrl: `/siswa/mapel/${m.id}`,
      }));
    }
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
          title="Mata Pelajaran"
          value={`${subjectsForDashboard.length} Mapel`}
          description="Jadwal & materi aktif"
          variant="primary"
          href="/siswa/mapel"
        />
      </div>


      {/* Widget Section: Mata Pelajaran Saya */}
      {subjectsForDashboard.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>📚 Mata Pelajaran Saya</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({studentClass || "Semua Jenjang"})
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Akses materi pelajaran, tugas aktif, dan konsultasi dengan guru pengampu
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsForDashboard.map((subj) => (
              <SubjectCard
                key={subj.id}
                id={subj.id}
                kodeMapel={subj.kodeMapel}
                namaMapel={subj.namaMapel}
                jenjang={subj.jenjang}
                icon={subj.icon}
                warna={subj.warna}
                guruNama={subj.guruNama}
                jadwalHari={subj.jadwalHari}
                jadwalWaktu={subj.jadwalWaktu}
                ruang={subj.ruang}
                activeTasksCount={subj.activeTasksCount}
                detailUrl={subj.detailUrl}
              />
            ))}
          </div>
        </div>
      )}

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
