import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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

  const guruClass = session.kelas || "";

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
    const [dbStudents, dbPrestasi] = await Promise.all([
      guruClass
        ? prisma.user.findMany({
            where: { kelas: guruClass, status: "1" },
            select: { id: true, name: true, nis: true },
            orderBy: { name: "asc" },
          })
        : [],
      prisma.prestasi.findMany({
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
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Daftar rekam jejak prestasi dan kejuaraan siswa {guruClass ? `kelas ${guruClass}` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="amber" size="sm" className="hidden sm:inline-flex">
            {achievements.length} Prestasi Terdata
          </Badge>
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
