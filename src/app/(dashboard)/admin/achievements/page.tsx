import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { AchievementsClientView } from "../../guru/achievements/_components/achievements-client-view";
import { AchievementService } from "@/services/achievement.service";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const activeJenjang = await getActiveJenjang(session);
  const isRestricted = activeJenjang !== "ALL";

  // Ambil data siswa untuk dropdown input (sesuai jenjang admin)
  const dbStudents = await prisma.user.findMany({
    where: {
      status: "1",
      ...(isRestricted ? { jenjang: activeJenjang } : {}),
    },
    select: { id: true, name: true, nis: true, kelas: true, image: true, gender: true },
    orderBy: [{ kelas: "asc" }, { name: "asc" }],
  });

  const students = dbStudents.map((s) => ({
    id: s.id.toString(),
    name: s.name,
    nis: s.nis || "",
    kelas: s.kelas || "",
    image: s.image,
    gender: s.gender,
  }));

  // Ambil kelas-kelas aktif
  const classes = await prisma.kelas.findMany({
    where: isRestricted ? { jenjang: activeJenjang } : {},
    select: { id: true, nama_kelas: true },
    orderBy: { nama_kelas: "asc" },
  });

  const rombelOptions = classes.map((c) => ({
    id: c.id.toString(),
    name: c.nama_kelas,
  }));

  // Ambil data prestasi & leaderboard
  const [achievements, { entries: leaderboardEntries }] = await Promise.all([
    AchievementService.getAchievements({
      jenjang: isRestricted ? activeJenjang : undefined,
    }),
    AchievementService.getLeaderboard({
      jenjang: isRestricted ? activeJenjang : undefined,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Interactive Client View */}
      <AchievementsClientView
        initialAchievements={achievements}
        students={students}
        guruClass=""
        canManage={true}
        userRole={session.role}
        userStatus={session.status}
        leaderboardEntries={leaderboardEntries}
        rombelOptions={rombelOptions}
        currentUserId={session.id}
        jenjangLabel={activeJenjang === "ALL" ? "Semua Jenjang (SD & SMP)" : activeJenjang}
      />
    </div>
  );
}

