import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StatCard } from "@/components/shared/stat-card";
import { AnnouncementTimeline } from "@/components/shared/announcement-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  let achievements: any[] = [];
  let announcements: any[] = [];

  try {
    const [dbStudents, dbAttHadir, dbAttTotal, dbTugas, dbReview, dbMateri, dbJadwal, dbAchieve, dbAnnounce] =
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
        prisma.prestasi.findMany({
          orderBy: { created_at: "desc" },
          take: 5,
        }),
        prisma.pengumuman.findMany({
          where: {
            OR: [
              { from: "IT" },
              ...(guruClass ? [{ from: guruClass }] : []),
            ],
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
    totalMateri = dbMateri;
    totalJadwal = dbJadwal;
    // Fetch student profile data for dashboard achievements
    const achieveUserIds = dbAchieve
      .map((a) => {
        try {
          const n = BigInt(a.id_user);
          return n > BigInt(0) ? n : null;
        } catch {
          return null;
        }
      })
      .filter((id): id is bigint => id !== null);

    const achieveNames = dbAchieve.map((a) => a.nama).filter(Boolean);

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
    });

    const achieveUserById = new Map<string, (typeof matchedAchieveUsers)[0]>();
    const achieveUserByName = new Map<string, (typeof matchedAchieveUsers)[0]>();
    for (const u of matchedAchieveUsers) {
      achieveUserById.set(u.id.toString(), u);
      achieveUserByName.set(u.name.trim().toLowerCase(), u);
    }

    achievements = dbAchieve.map((ach) => {
      const studentUser = achieveUserById.get(ach.id_user) || achieveUserByName.get(ach.nama.trim().toLowerCase());
      const studentImage = studentUser?.image || null;

      return {
        ...ach,
        studentImage,
        studentGender: studentUser?.gender || null,
      };
    });
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

      {/* 4 Stat Cards Bertema Al-Azhar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isWaliKelas ? (
          <>
            <StatCard
              title="Kelas Saya"
              value={`${students.length} Siswa`}
              variant="amber"
              href="/guru/my-class"
            />
            <StatCard
              title="Absensi Hari Ini"
              value={totalAbsenToday > 0 ? `${attendanceToday} Hadir` : "0 Hadir"}
              count={totalAbsenToday > 0 ? attendanceToday : "—"}
              countLabel={totalAbsenToday > 0 ? "Hadir" : "Belum diisi"}
              variant="accent"
              href={`/guru/attendance/${todayFormatted}`}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Materi & Modul"
              value={`${totalMateri} Pertemuan`}
              variant="amber"
              href="/guru/mapel"
            />
            <StatCard
              title="Jadwal Mengajar"
              value={`${totalJadwal} Jadwal`}
              variant="accent"
              href="/guru/calendar"
            />
          </>
        )}
        <StatCard
          title="Tugas Aktif"
          value={`${totalTugas} Tugas`}
          variant="primary"
          href="/guru/tugas"
        />
        <StatCard
          title="Perlu Dinilai"
          value={`${pendingReview} Submisi`}
          variant="rose"
          href="/guru/tugas?status=need_grading"
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
                  <span>Prestasi Terkini</span>
                </CardTitle>
                <Link
                  href="/guru/achievements"
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
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
