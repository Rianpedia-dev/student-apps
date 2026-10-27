import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { AppCache } from "@/lib/cache";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  Bell,
  UserCheck,
  UserX,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { CalendarWidget } from "@/components/shared/calendar-widget";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const activeJenjang = await getActiveJenjang(session);

  let totalSiswa = 0;
  let totalGuru = 0;
  let totalKelas = 0;
  let totalMapel = 0;
  let totalJadwal = 0;
  let totalPengumuman = 0;
  let totalAktif = 0;
  let totalNonAktif = 0;
  let formattedAnnouncements: any[] = [];

  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  try {
    const siswaWhere = isRestricted ? { status: "1", jenjang: activeJenjang } : { status: "1" };
    const guruWhere = isRestricted
      ? { status: { in: ["2", "4"] }, OR: [{ jenjang: activeJenjang }, { jenjang: "ALL" }] }
      : { status: { in: ["2", "4"] } };
    const kelasWhere = isRestricted ? { jenjang: activeJenjang } : {};
    const mapelWhere = isRestricted ? { jenjang: { in: [activeJenjang, "SEMUA"] } } : {};
    const jadwalWhere = isRestricted ? { kelas: { jenjang: activeJenjang } } : {};
    const aktifWhere = isRestricted
      ? { status: { not: "0" }, jenjang: activeJenjang }
      : { status: { not: "0" } };
    const nonAktifWhere = isRestricted
      ? { status: "0", jenjang: activeJenjang }
      : { status: "0" };

    const cacheKey = `admin-dashboard-stats:${isRestricted ? activeJenjang : "ALL"}`;
    const stats = await AppCache.getOrSet(
      cacheKey,
      300, // 5 menit
      async () => {
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
          prisma.user.count({ where: siswaWhere }),
          prisma.user.count({ where: guruWhere }),
          prisma.kelas.count({ where: kelasWhere }),
          prisma.mataPelajaran.count({ where: mapelWhere }),
          prisma.jadwalPelajaran.count({ where: jadwalWhere }),
          prisma.pengumuman.count(),
          prisma.user.count({ where: aktifWhere }),
          prisma.user.count({ where: nonAktifWhere }),
          prisma.pengumuman.findMany({
            orderBy: { id: "desc" },
            take: 20,
          }),
        ]);

        return {
          totalSiswa: siswaCount,
          totalGuru: guruCount,
          totalKelas: kelasCount,
          totalMapel: mapelCount,
          totalJadwal: jadwalCount,
          totalPengumuman: pengumumanTotal,
          totalAktif: aktifCount,
          totalNonAktif: nonAktifCount,
          formattedAnnouncements: pengumumanList.map((p) => ({
            id: p.id.toString(),
            from: p.from,
            title: p.title,
            file: p.file,
            pengumuman: p.pengumuman,
            like: p.like,
            created_at: p.created_at,
          })),
        };
      },
      ["admin-stats", "dashboard"]
    );

    totalSiswa = stats.totalSiswa;
    totalGuru = stats.totalGuru;
    totalKelas = stats.totalKelas;
    totalMapel = stats.totalMapel;
    totalJadwal = stats.totalJadwal;
    totalPengumuman = stats.totalPengumuman;
    totalAktif = stats.totalAktif;
    totalNonAktif = stats.totalNonAktif;
    formattedAnnouncements = stats.formattedAnnouncements;
  } catch (e) {
    console.error("Database query error in Admin Dashboard:", e);
  }

  const scopeLabel =
    isSuperAdmin && activeJenjang === "ALL"
      ? "Semua Jenjang (SD & SMP)"
      : activeJenjang === "SD"
        ? "Jenjang SD Islam Al-Azhar"
        : activeJenjang === "SMP"
          ? "Jenjang SMP Islam Al-Azhar"
          : "Semua Jenjang (SD & SMP)";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/50 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {activeJenjang === "ALL" ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <Shield className="h-3.5 w-3.5 text-amber-600" />
              )}
              {scopeLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard Administrator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 font-normal">
            Panel kontrol data akademik dan administrasi {scopeLabel}.
          </p>
        </div>
      </div>

      {/* 8 Folder Cards */}
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
          title="Dewan Guru"
          value={totalGuru}
          countLabel="Guru"
          icon={Users}
          variant="blue"
          href="/admin/teachers"
        />
        <StatCard
          title="Rombongan Belajar"
          value={totalKelas}
          countLabel="Kelas"
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

        {/* Baris 2: Teal, Purple, Emerald, Rose */}
        <StatCard
          title="Jadwal KBM"
          value={totalJadwal}
          countLabel="Sesi"
          icon={Calendar}
          variant="teal"
          href="/admin/schedules"
        />
        <StatCard
          title="Pengumuman"
          value={totalPengumuman}
          countLabel="Info"
          icon={Bell}
          variant="purple"
          href="/admin/announcements"
        />
        <StatCard
          title="Pengguna Aktif"
          value={totalAktif}
          countLabel="Akun"
          icon={UserCheck}
          variant="emerald"
          href="/admin/students"
        />
        <StatCard
          title="Belum Verifikasi"
          value={totalNonAktif}
          countLabel="Pending"
          icon={UserX}
          variant="rose"
          href="/admin/students"
        />
      </div>

      {/* Konten Bawah: Pengumuman Sekolah & Kalender Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnnouncementTimeline
            announcements={formattedAnnouncements}
            userRole="admin"
            canManage={true}
          />
        </div>
        <div className="lg:col-span-1">
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}
