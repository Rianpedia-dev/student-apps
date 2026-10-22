import prisma from "@/lib/prisma";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  Bell,
  UserCheck,
  UserX,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { CalendarWidget } from "@/components/shared/calendar-widget";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let totalSiswa = 0;
  let totalGuru = 0;
  let totalKelas = 0;
  let totalMapel = 0;
  let totalJadwal = 0;
  let totalPengumuman = 0;
  let totalAktif = 0;
  let totalNonAktif = 0;
  let formattedAnnouncements: any[] = [];

  try {
    const [
      siswaCount,
      guruCount,
      kelasCount,
      mapelCount,
      jadwalCount,
      pengumumanTotal,
      aktifCount,
      nonAktifCount,
      pengumumanList,
    ] = await Promise.all([
      prisma.user.count({ where: { status: "1" } }),
      prisma.user.count({ where: { status: { in: ["2", "4"] } } }),
      prisma.kelas.count(),
      prisma.mataPelajaran.count(),
      prisma.jadwalPelajaran.count(),
      prisma.pengumuman.count(),
      prisma.user.count({ where: { status: { not: "0" } } }),
      prisma.user.count({ where: { status: "0" } }),
      prisma.pengumuman.findMany({
        orderBy: { id: "desc" },
        take: 20,
      }),
    ]);

    totalSiswa = siswaCount;
    totalGuru = guruCount;
    totalKelas = kelasCount;
    totalMapel = mapelCount;
    totalJadwal = jadwalCount;
    totalPengumuman = pengumumanTotal;
    totalAktif = aktifCount;
    totalNonAktif = nonAktifCount;

    formattedAnnouncements = pengumumanList.map((p) => ({
      id: p.id.toString(),
      from: p.from,
      title: p.title,
      file: p.file,
      pengumuman: p.pengumuman,
      like: p.like,
      created_at: p.created_at,
    }));
  } catch (e) {
    console.error("Database query error in Admin Dashboard:", e);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Page */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Dashboard Administrator
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 font-normal">
          Selamat datang di panel kontrol Sistem Informasi SD - SMP Islam Al-Azhar Cairo Palembang.
        </p>
      </div>

      {/* 8 Folder Cards:
          - Desktop (lg): 4 card dalam satu baris mendatar (2 baris x 4 card)
          - Tablet (md): 3 card dalam satu baris mendatar
          - Mobile: 2 card per baris mendatar (4 baris mendatar, responsif) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
        {/* Baris 1: Amber, Blue, Emerald, Rose */}
        <StatCard
          title="Jumlah Siswa"
          value={totalSiswa}
          countLabel="Siswa"
          icon={GraduationCap}
          variant="amber"
          href="/admin/students"
        />
        <StatCard
          title="Jumlah Guru"
          value={totalGuru}
          countLabel="Guru"
          icon={Users}
          variant="blue"
          href="/admin/teachers"
        />
        <StatCard
          title="Total Kelas"
          value={totalKelas}
          countLabel="Rombel"
          icon={School}
          variant="emerald"
          href="/admin/classes"
        />
        <StatCard
          title="Mata Pelajaran"
          value={totalMapel}
          countLabel="Mapel"
          icon={BookOpen}
          variant="rose"
          href="/admin/subjects"
        />

        {/* Baris 2: Purple, Teal, Indigo, Orange */}
        <StatCard
          title="Jadwal Pelajaran"
          value={totalJadwal}
          countLabel="Jadwal"
          icon={Calendar}
          variant="purple"
          href="/admin/schedules"
        />
        <StatCard
          title="Pengumuman"
          value={totalPengumuman}
          countLabel="Info"
          icon={Bell}
          variant="teal"
          href="/admin/announcements"
        />
        <StatCard
          title="Akun Aktif"
          value={totalAktif}
          countLabel="Akun"
          icon={UserCheck}
          variant="indigo"
          href="/admin/students"
        />
        <StatCard
          title="Perlu Verifikasi"
          value={totalNonAktif}
          countLabel="Akun"
          icon={UserX}
          variant="orange"
          href="/admin/students"
        />
      </div>

      {/* Grid: Pengumuman (7 col) & Kalender (5 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Timeline Pengumuman */}
        <div className="space-y-3.5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Timeline Pengumuman</h2>
          </div>
          <AnnouncementTimeline
            announcements={formattedAnnouncements}
            userRole="admin"
            canManage={false}
          />
        </div>

        {/* Kalender Kegiatan */}
        <div className="space-y-3.5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Kalender Kegiatan</h2>
          </div>
          <CalendarWidget canManage={true} />
        </div>
      </div>

    </div>
  );
}
