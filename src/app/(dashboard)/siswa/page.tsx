import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardService } from "@/services/dashboard.service";
import {
  IslamicMosaicPattern,
  IslamicStarGeometricPattern,
  AlAzharColorfulMosqueHero,
  AlAzharMosaicStrip,
  AlAzharCornerMosaic,
} from "@/components/shared/alazhar-patterns";

export const dynamic = "force-dynamic";

export default async function SiswaDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const [dashboardData, violationsCount] = await Promise.all([
    DashboardService.getStudentDashboardData(session.id, session.kelas || "", session),
    prisma.pelanggaran.count({ where: { user_id: session.id } }).catch(() => 0),
  ]);

  const {
    studentInfo,
    metrics,
    classmates,
    announcements: formattedAnnouncements,
    todaySchedules,
  } = dashboardData;

  const studentName = studentInfo.name;
  const studentNis = studentInfo.nis;
  const studentImage = studentInfo.image;
  const waliKelas = studentInfo.waliKelas;
  const studentClass = studentInfo.kelas;

  const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayDayName = DAY_NAMES[new Date().getDay()];

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Premium Hero Banner Siswa — Gradasi Mewah, Motif Islami & Siluet Masjid Warna-Warni */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#09574c] to-[#083344] p-4 sm:p-7 md:p-9 text-white shadow-2xl border border-emerald-400/35">
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


      {/* 6 Folder Cards:
          - Desktop (lg): 4 card dalam satu baris mendatar (Baris 1: 4 card, Baris 2: 2 card)
          - Tablet (md): 3 card dalam satu baris mendatar (2 baris x 3 card)
          - Mobile: 2 card per baris mendatar (3 baris mendatar, responsif) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
        {/* Baris 1: Amber, Blue, Emerald */}
        <StatCard
          title="Absensi"
          variant="amber"
          href="/siswa/attendance"
        />
        <StatCard
          title="Kalender Kegiatan"
          variant="blue"
          href="/siswa/calendar"
        />
        <StatCard
          title="Tugas Saya"
          variant="emerald"
          href="/siswa/tugas"
        />

        {/* Baris 2: Rose, Purple, Teal */}
        <StatCard
          title="Mata Pelajaran"
          variant="rose"
          href="/siswa/mapel"
        />
        <StatCard
          title="Pelanggaran"
          variant="purple"
          href="/siswa/violations"
          value={`${violationsCount} Catatan`}
          meta={violationsCount === 0 ? "Disiplin" : "Evaluasi"}
        />
        <StatCard
          title="Kelas Online"
          variant="teal"
          href="/siswa/kelas-online"
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

      {/* Timeline Pengumuman */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Pengumuman Sekolah & Kelas</h2>
        </div>
        <AnnouncementTimeline
          announcements={formattedAnnouncements}
          userRole="siswa"
          canManage={false}
        />
      </div>
    </div>
  );
}
