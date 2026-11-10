import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AchievementService } from "@/services/achievement.service";
import { SiswaAchievementsClient } from "./_components/siswa-achievements-client";
import type { AchievementItem } from "../../guru/achievements/_components/achievement-detail-modal";

export const dynamic = "force-dynamic";

export default async function SiswaAchievementsPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentClass = session.kelas || "";
  const studentJenjang: "SD" | "SMP" =
    session.jenjang && session.jenjang !== "ALL"
      ? (session.jenjang as "SD" | "SMP")
      : /smp|kelas\s*(7|8|9)/i.test(studentClass)
      ? "SMP"
      : "SD";

  // 1. Ambil prestasi milik siswa ini
  const [dbPrestasi, { entries: leaderboardEntries, allStudents }, classes] = await Promise.all([
    prisma.prestasi.findMany({
      where: {
        OR: [
          { id_user: session.id },
          ...(session.name ? [{ nama: session.name }] : []),
        ],
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
    }),
    AchievementService.getLeaderboard({
      jenjang: studentJenjang,
    }),
    prisma.kelas.findMany({
      where: { jenjang: studentJenjang },
      select: { id: true, nama_kelas: true },
      orderBy: { nama_kelas: "asc" },
    }),
  ]);

  const rombelOptions = classes.map((c) => ({
    id: c.id.toString(),
    name: c.nama_kelas,
  }));

  const serializableAchievements: AchievementItem[] = dbPrestasi.map((ach) => ({
    id: ach.id.toString(),
    id_user: ach.id_user,
    nama: ach.nama,
    kelas: ach.kelas,
    kelas_saat_prestasi: ach.kelas_saat_prestasi || ach.kelas,
    tahun_ajaran: ach.tahun_ajaran || "2025/2026",
    tingkat: ach.tingkat || "Dalam Sekolah",
    peringkat: ach.peringkat || "Juara 1",
    poin: ach.poin ?? 1,
    fotoanak: ach.fotoanak,
    prestasi: ach.prestasi,
    created_at: ach.created_at ? ach.created_at.toISOString() : null,
  }));

  return (
    <SiswaAchievementsClient
      myAchievements={serializableAchievements}
      leaderboardEntries={leaderboardEntries}
      allStudents={allStudents}
      rombelOptions={rombelOptions}
      currentUserId={session.id}
      studentName={session.name}
      studentClass={studentClass}
      studentJenjang={studentJenjang}
    />
  );
}

