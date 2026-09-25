import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Users, FileCheck, Sparkles, School } from "lucide-react";
import { ClipboardListIcon } from "@/components/ui/clipboard-list-icon";
import { StatCard } from "@/components/stat-card";
import { AnnouncementTimeline } from "@/components/announcement-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AlAzharSchoolBanner } from "@/components/ui/alazhar-patterns";

export const dynamic = "force-dynamic";

export default async function GuruDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const guruClass = session.kelas || "";
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isNum = /^\d+$/.test(session.id);
  const guruIdBigInt = isNum ? BigInt(session.id) : null;

  let students: any[] = [];
  let attendanceToday = 0;
  let totalAbsenToday = 0;
  let totalTugas = 0;
  let pendingReview = 0;
  let achievements: any[] = [];
  let announcements: any[] = [];

  try {
    const [dbStudents, dbAttHadir, dbAttTotal, dbTugas, dbReview, dbAchieve, dbAnnounce] =
      await Promise.all([
        guruClass
          ? prisma.user.findMany({
              where: { kelas: guruClass, status: "1" },
              orderBy: { name: "asc" },
            })
          : [],
        guruClass
          ? prisma.absen.count({
              where: {
                kelas: guruClass,
                date: todayStr,
                keterangan: "Hadir",
              },
            })
          : 0,
        guruClass
          ? prisma.absen.count({
              where: { kelas: guruClass, date: todayStr },
            })
          : 0,
        guruIdBigInt
          ? prisma.tugas.count({
              where: { guru_id: guruIdBigInt, status: "aktif" },
            })
          : 0,
        guruIdBigInt
          ? prisma.tugasSubmission.count({
              where: { tugas: { guru_id: guruIdBigInt }, status: "dikumpulkan" },
            })
          : 0,
        prisma.prestasi.findMany({
          orderBy: { created_at: "desc" },
          take: 5,
        }),
        prisma.pengumuman.findMany({
          where: {
            OR: [{ from: "IT" }, { from: guruClass }],
          },
          orderBy: { id: "desc" },
          take: 10,
        }),
      ]);

    students = dbStudents;
    attendanceToday = dbAttHadir;
    totalAbsenToday = dbAttTotal;
    totalTugas = dbTugas;
    pendingReview = dbReview;
    achievements = dbAchieve;
    announcements = dbAnnounce;
  } catch (e) {
    console.error("Database query error in guru dashboard:", e);
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

  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 dir="ltr" className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            <span dir="rtl" className="inline-block">السَّلاَمُ عَلَيْكُمْ</span>, {session.name}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 font-normal">
            <span>Wali Kelas: <strong className="text-foreground font-medium">{guruClass || "Belum ditentukan"}</strong></span>
          </p>
        </div>
      </div>

      {/* 4 Stat Cards Bertema Al-Azhar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Kelas Saya"
          value={`${students.length} Siswa`}
          icon={Users}
          description="Wali kelas & murid"
          variant="amber"
          meta="Aktif"
          href="/guru/my-class"
        />
        <StatCard
          title="Absensi Hari Ini"
          value={totalAbsenToday > 0 ? `${attendanceToday} Hadir` : "0 Hadir"}
          count={totalAbsenToday > 0 ? attendanceToday : "—"}
          countLabel={totalAbsenToday > 0 ? "Hadir" : "Belum diisi"}
          icon={ClipboardListIcon}
          description={totalAbsenToday > 0 ? `Dari ${students.length} siswa` : "Buka form absen"}
          variant="accent"
          meta="Presensi"
          href={`/guru/attendance/${todayFormatted}`}
        />
        <StatCard
          title="Tugas Kelas"
          value={`${totalTugas} Tugas`}
          icon={FileCheck}
          description="Tugas aktif berjalan"
          variant="primary"
          meta="Penugasan"
          href="/guru/tugas"
        />
        <StatCard
          title="Perlu Dinilai"
          value={`${pendingReview} Submisi`}
          icon={Sparkles}
          description="Koreksi lembar tugas"
          variant="rose"
          meta="Evaluasi"
          href="/guru/tugas"
        />
      </div>

      {/* 2 Columns: Announcements + Prestasi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Timeline Pengumuman */}
        <div className="space-y-3.5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Timeline Pengumuman</h2>
          </div>
          <AnnouncementTimeline
            announcements={formattedAnnouncements}
            userRole="guru"
            canManage={false}
          />
        </div>

        {/* Right side: Prestasi Siswa & Banner Motto */}
        <div className="space-y-6 lg:col-span-5">
          {/* Prestasi Siswa Section */}
          <Card className="border border-amber-500/20 rounded-xl shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>🏆 Prestasi Terkini</span>
                </CardTitle>
                <Link
                  href="/guru/achievements"
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  Lihat Semua
                </Link>
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                      🏆
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

          {/* Official Al-Azhar School Motto Banner (As shown in reference mockup) */}
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
