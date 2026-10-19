import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
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

  const dashboardData = await DashboardService.getStudentDashboardData(
    session.id,
    session.kelas || "",
    session
  );

  const {
    studentInfo,
    announcements: formattedAnnouncements,
  } = dashboardData;

  const studentName = studentInfo.name;

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
          title="Presensi"
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
          href="/siswa/mapel"
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
        />
        <StatCard
          title="Kelas Online"
          variant="teal"
          href="/siswa/kelas-online"
        />
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
