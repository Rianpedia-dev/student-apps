import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { TeacherTable } from "./_components/teacher-table";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  const session = await getSession();
  const activeJenjang = await getActiveJenjang(session);

  let formattedTeachers: any[] = [];
  let classNames: string[] = [];
  let subjectNames: string[] = [];

  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  try {
    const teacherWhere: any = {
      status: { in: ["0", "2", "4"] },
    };
    if (isRestricted) {
      teacherWhere.OR = [
        { jenjang: activeJenjang },
        { jenjang: "ALL" },
      ];
    }

    const classWhere: any = {};
    if (isRestricted) {
      classWhere.jenjang = activeJenjang;
    }

    const subjectWhere: any = {};
    if (isRestricted) {
      subjectWhere.jenjang = { in: [activeJenjang, "SEMUA"] };
    }

    const [teachers, classes, subjects] = await Promise.all([
      prisma.user.findMany({
        where: teacherWhere,
        orderBy: { name: "asc" },
      }),
      prisma.kelas.findMany({
        where: classWhere,
        select: { nama_kelas: true },
        orderBy: { nama_kelas: "asc" },
      }),
      prisma.mataPelajaran.findMany({
        where: subjectWhere,
        select: { nama_mapel: true },
        orderBy: { nama_mapel: "asc" },
      }),
    ]);

    classNames = classes.map((c) => c.nama_kelas).filter(Boolean);
    subjectNames = Array.from(new Set(subjects.map((s) => s.nama_mapel).filter(Boolean)));

    formattedTeachers = teachers.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      email: t.email,
      nip: t.nip,
      guru_bidang: t.guru_bidang,
      kelas: t.kelas,
      jenjang: t.jenjang || "SD",
      status: t.status,
      gender: t.gender,
      appleid: t.appleid,
      passwordappleid: t.passwordappleid,
    }));
  } catch (e) {
    console.error("Database query error in Admin Teachers page:", e);
  }

  const scopeLabel =
    isSuperAdmin && activeJenjang === "ALL"
      ? "Semua Jenjang"
      : activeJenjang === "SD"
        ? "Jenjang SD"
        : activeJenjang === "SMP"
          ? "Jenjang SMP"
          : "Semua Jenjang";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Kelola Akun Guru</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {scopeLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola data dewan guru {scopeLabel}, verifikasi pendaftaran akun baru, dan atur penugasan wali kelas.
        </p>
      </div>

      <TeacherTable
        initialTeachers={formattedTeachers}
        classList={classNames}
        subjectList={subjectNames}
        adminJenjang={session?.jenjang || "ALL"}
        activeJenjang={activeJenjang}
      />
    </div>
  );
}
