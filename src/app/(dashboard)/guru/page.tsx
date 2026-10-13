import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { Badge } from "@/components/ui/badge";
import {
  IslamicMosaicPattern,
  IslamicStarGeometricPattern,
  AlAzharColorfulMosqueHero,
  AlAzharMosaicStrip,
  AlAzharCornerMosaic,
} from "@/components/shared/alazhar-patterns";

export const dynamic = "force-dynamic";

export default async function GuruDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: BigInt(session.id) },
        select: { status: true, kelas: true, guru_bidang: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const isWaliKelas = currentStatus === "4";
  const guruClass = isWaliKelas ? (dbUser?.kelas || session.kelas || "") : "";
  const guruBidang = dbUser?.guru_bidang || "";

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isNum = /^\d+$/.test(session.id);
  const guruIdBigInt = isNum ? BigInt(session.id) : null;

  let students: any[] = [];
  let attendanceToday = 0;
  let totalAbsenToday = 0;
  let totalTugas = 0;
  let pendingReview = 0;
  let totalMateri = 0;
  let totalJadwal = 0;
  let totalKelasOnline = 0;
  let announcements: any[] = [];

  try {
    const [
      dbStudents,
      dbAttHadir,
      dbAttTotal,
      dbTugas,
      dbReview,
      dbMateri,
      dbJadwal,
      dbOnline,
      dbAnnounce,
    ] = await Promise.all([
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
      guruIdBigInt
        ? prisma.pertemuan.count({
            where: { guru_id: guruIdBigInt },
          })
        : 0,
      guruIdBigInt
        ? prisma.jadwalPelajaran.count({
            where: { guru_id: guruIdBigInt },
          })
        : 0,
      guruIdBigInt
        ? prisma.kelasOnline
            .count({
              where: { guru_id: guruIdBigInt },
            })
            .catch(() => 0)
        : 0,
      prisma.pengumuman.findMany({
        where: {
          OR: [
            { from: "IT" },
            ...(guruClass ? [{ from: guruClass }] : []),
          ],
        },
        orderBy: { id: "desc" },
        take: 20,
      }),
    ]);

    students = dbStudents;
    attendanceToday = dbAttHadir;
    totalAbsenToday = dbAttTotal;
    totalTugas = dbTugas;
    pendingReview = dbReview;
    totalMateri = dbMateri;
    totalJadwal = dbJadwal;
    totalKelasOnline = dbOnline;
    announcements = dbAnnounce;
  } catch (e) {
    console.error("Database query error in guru dashboard:", e);
  }

  const announcementIds = (announcements || []).map((p) => p.id.toString()).filter(Boolean);
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
      console.error("Error fetching guru announcement likes:", e);
    }
  }

  const formattedAnnouncements = (announcements || []).map((p) => {
    const pId = p.id.toString();
    return {
      id: pId,
      from: p.from,
      title: p.title,
      file: p.file,
      pengumuman: p.pengumuman,
      like: p.like,
      isLiked: likedPostIds.has(pId),
      created_at: p.created_at,
    };
  });

  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Premium Hero Banner Guru — Gradasi Mewah, Motif Islami & Siluet Masjid Warna-Warni */}
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
          <div className="space-y-3">
            <h1 dir="ltr" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              <span dir="rtl" className="inline-block text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                السَّلاَمُ عَلَيْكُمْ
              </span>
              ,{" "}
              <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {session.name}
              </span>
            </h1>

            {/* Role Badge */}
            <div className="flex items-center gap-2">
              {isWaliKelas ? (
                <Badge variant="amber" size="sm">
                  Guru & Wali Kelas
                </Badge>
              ) : (
                <Badge variant="emerald" size="sm">
                  Guru Mata Pelajaran
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Folder Cards:
          - Desktop (lg): 4 card dalam satu baris mendatar (Baris 1: 4 card, Baris 2: 2 card)
          - Tablet (md): 3 card dalam satu baris mendatar (2 baris x 3 card)
          - Mobile: 2 card per baris mendatar (3 baris mendatar, responsif) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
        {isWaliKelas ? (
          <>
            {/* Baris 1: Amber, Blue, Emerald */}
            <StatCard
              title="Kelas Saya"
              variant="amber"
              href="/guru/my-class"
            />
            <StatCard
              title="Absensi Hari Ini"
              variant="blue"
              href={`/guru/attendance/${todayFormatted}`}
            />
            <StatCard
              title="Tugas Aktif"
              variant="emerald"
              href="/guru/tugas"
            />

            {/* Baris 2: Rose, Purple, Teal */}
            <StatCard
              title="Perlu Dinilai"
              variant="rose"
              href="/guru/tugas?status=need_grading"
            />
            <StatCard
              title="Materi & Modul"
              variant="purple"
              href="/guru/mapel"
            />
            <StatCard
              title="Jadwal Mengajar"
              variant="teal"
              href="/guru/calendar"
            />
          </>
        ) : (
          <>
            {/* Baris 1: Amber, Blue, Emerald */}
            <StatCard
              title="Mata Pelajaran"
              variant="amber"
              href="/guru/mapel"
            />
            <StatCard
              title="Jadwal Mengajar"
              variant="blue"
              href="/guru/calendar"
            />
            <StatCard
              title="Tugas Aktif"
              variant="emerald"
              href="/guru/tugas"
            />

            {/* Baris 2: Rose, Purple, Teal */}
            <StatCard
              title="Perlu Dinilai"
              variant="rose"
              href="/guru/tugas?status=need_grading"
            />
            <StatCard
              title="Materi & Modul"
              variant="purple"
              href="/guru/mapel"
            />
            <StatCard
              title="Kelas Online"
              variant="teal"
              href="/guru/kelas-online"
            />
          </>
        )}
      </div>

      {/* Timeline Pengumuman */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Timeline Pengumuman</h2>
        </div>
        <AnnouncementTimeline
          announcements={formattedAnnouncements}
          userRole="guru"
          canManage={false}
        />
      </div>
    </div>
  );
}
