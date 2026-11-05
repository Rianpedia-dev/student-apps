import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { AddAchievementModal } from "./_components/add-achievement-modal";
import { AchievementsClientView } from "./_components/achievements-client-view";
import { AchievementService } from "@/services/achievement.service";

export const dynamic = "force-dynamic";

export default async function GuruAchievementsPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const activeJenjang = await getActiveJenjang(session);
  const isRestricted = activeJenjang !== "ALL";

  // Hanya Wali Kelas (status === "4") yang berhak menginput/mengelola prestasi
  const isWaliKelas = session.status === "4";
  const guruClass = isWaliKelas ? (session.kelas || "") : "";

  // Ambil data siswa binaan jika wali kelas
  let students: {
    id: string;
    name: string;
    nis: string;
    kelas?: string;
    image?: string | null;
    gender?: string | null;
  }[] = [];
  if (isWaliKelas && guruClass) {
    const dbStudents = await prisma.user.findMany({
      where: { kelas: guruClass, status: "1" },
      select: { id: true, name: true, nis: true, kelas: true, image: true, gender: true },
      orderBy: { name: "asc" },
    });
    students = dbStudents.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      nis: s.nis || "",
      kelas: s.kelas || guruClass,
      image: s.image,
      gender: s.gender,
    }));
  }

  // Ambil daftar kelas untuk opsi filter Leaderboard
  const classes = await prisma.kelas.findMany({
    where: isRestricted ? { jenjang: activeJenjang } : {},
    select: { id: true, nama_kelas: true },
    orderBy: { nama_kelas: "asc" },
  });

  const rombelOptions = classes.map((c) => ({
    id: c.id.toString(),
    name: c.nama_kelas,
  }));

  // Ambil prestasi & leaderboard via AchievementService
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
      {/* Header Page & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prestasi & Kejuaraan Siswa</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isWaliKelas
              ? `Kelola catatan juara siswa binaan (${guruClass}) dengan sistem poin skala 1–16.`
              : "Pantau rekam jejak juara dan papan peringkat siswa berprestasi Al-Azhar."}
          </p>
        </div>

        {isWaliKelas && (
          <div className="flex items-center gap-3">
            <AddAchievementModal students={students} guruClass={guruClass} />
          </div>
        )}
      </div>

      {/* Interactive Client View: Tabs, Gallery, Leaderboard & Dialogs */}
      <AchievementsClientView
        initialAchievements={achievements}
        students={students}
        guruClass={guruClass}
        canManage={isWaliKelas}
        userRole={session.role}
        userStatus={session.status}
        leaderboardEntries={leaderboardEntries}
        rombelOptions={rombelOptions}
        currentUserId={session.id}
        jenjangLabel={activeJenjang === "ALL" ? "SD / SMP" : activeJenjang}
      />
    </div>
  );
}
