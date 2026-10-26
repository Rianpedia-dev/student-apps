import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { Badge } from "@/components/ui/badge";
import { AddAchievementModal } from "./_components/add-achievement-modal";
import { AchievementsClientView } from "./_components/achievements-client-view";
import type { AchievementItem } from "./_components/achievement-detail-modal";

export const dynamic = "force-dynamic";

export default async function GuruAchievementsPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const activeJenjang = await getActiveJenjang(session);
  const isRestricted = activeJenjang !== "ALL";

  const guruClass = session.kelas || "";
  const guruClassJenjang = guruClass && /SMP|Kelas (7|8|9)/i.test(guruClass) ? "SMP" : "SD";
  const showGuruClass = !isRestricted || activeJenjang === guruClassJenjang;

  interface StudentDbRecord {
    id: bigint;
    name: string;
    nis: string | null;
  }

  interface AchievementWithProfile {
    id: bigint;
    id_user: string;
    nama: string;
    kelas: string;
    fotoanak: string;
    prestasi: string;
    created_at: Date | null;
    studentImage?: string | null;
    studentGender?: string | null;
  }

  let students: StudentDbRecord[] = [];
  let achievements: AchievementWithProfile[] = [];

  try {
    let allowedClassNames: string[] = [];
    if (isRestricted) {
      const allowedClasses = await prisma.kelas.findMany({
        where: { jenjang: activeJenjang },
        select: { nama_kelas: true },
      });
      allowedClassNames = allowedClasses.map((c) => c.nama_kelas);
    }

    const [dbStudents, dbPrestasi] = await Promise.all([
      guruClass && showGuruClass
        ? prisma.user.findMany({
            where: { kelas: guruClass, status: "1" },
            select: { id: true, name: true, nis: true },
            orderBy: { name: "asc" },
          })
        : [],
      prisma.prestasi.findMany({
        where: isRestricted ? { kelas: { in: allowedClassNames } } : {},
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
    ]);
    students = dbStudents;

    // Fetch student profile data (image & gender) for achievements
    const userIds = dbPrestasi
      .map((a) => {
        try {
          const n = BigInt(a.id_user);
          return n > BigInt(0) ? n : null;
        } catch {
          return null;
        }
      })
      .filter((id): id is bigint => id !== null);

    const studentNames = dbPrestasi.map((a) => a.nama).filter(Boolean);

    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
          ...(studentNames.length > 0 ? [{ name: { in: studentNames } }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        gender: true,
        image: true,
      },
    });

    const userById = new Map<string, (typeof matchedUsers)[0]>();
    const userByName = new Map<string, (typeof matchedUsers)[0]>();
    for (const u of matchedUsers) {
      userById.set(u.id.toString(), u);
      userByName.set(u.name.trim().toLowerCase(), u);
    }

    achievements = dbPrestasi.map((ach) => {
      const studentUser = userById.get(ach.id_user) || userByName.get(ach.nama.trim().toLowerCase());
      const studentImage = studentUser?.image || null;

      return {
        ...ach,
        studentImage,
        studentGender: studentUser?.gender || null,
      };
    });
  } catch (e) {
    console.error("Database query error in achievements:", e);
  }

  const serializableStudents = students.map((s) => ({
    id: s.id.toString(),
    name: s.name,
    nis: s.nis || "",
  }));

  const serializableAchievements: AchievementItem[] = achievements.map((ach) => ({
    id: ach.id.toString(),
    id_user: ach.id_user,
    nama: ach.nama,
    kelas: ach.kelas,
    fotoanak: ach.fotoanak,
    prestasi: ach.prestasi,
    created_at: ach.created_at ? ach.created_at.toISOString() : null,
    studentImage: ach.studentImage || null,
    studentGender: ach.studentGender || null,
  }));

  return (
    <div className="space-y-6">
      {/* Header Page & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prestasi & Kejuaraan Siswa</h1>
        </div>

        <div className="flex items-center gap-3">
          <AddAchievementModal students={serializableStudents} guruClass={guruClass} />
        </div>
      </div>

      {/* Interactive Client View: Stats, Filters, Cards & Dialogs */}
      <AchievementsClientView
        initialAchievements={serializableAchievements}
        students={serializableStudents}
        guruClass={guruClass}
      />
    </div>
  );
}
