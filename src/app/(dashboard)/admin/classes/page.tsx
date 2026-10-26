import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { ClassTable } from "./_components/class-table";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const session = await getSession();
  const activeJenjang = await getActiveJenjang(session);

  let formattedClasses: any[] = [];
  let teachersList: string[] = [];

  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  try {
    const classWhere: any = {};
    if (isRestricted) {
      classWhere.jenjang = activeJenjang;
    }

    const teacherWhere: any = { status: { in: ["2", "4"] } };
    if (isRestricted) {
      teacherWhere.OR = [
        { jenjang: activeJenjang },
        { jenjang: "ALL" },
      ];
    }

    const studentWhere: any = { status: "1" };
    if (isRestricted) {
      studentWhere.jenjang = activeJenjang;
    }

    const [classes, teachers, students] = await Promise.all([
      prisma.kelas.findMany({
        where: classWhere,
        orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
      }),
      prisma.user.findMany({
        where: teacherWhere,
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: studentWhere,
        select: { kelas: true },
      }),
    ]);

    const studentCountMap = new Map<string, number>();
    students.forEach((s) => {
      if (s.kelas) {
        studentCountMap.set(s.kelas, (studentCountMap.get(s.kelas) || 0) + 1);
      }
    });

    formattedClasses = classes.map((c) => ({
      id: c.id.toString(),
      nama_kelas: c.nama_kelas,
      jenjang: c.jenjang || (c.nama_kelas.startsWith("7") || c.nama_kelas.startsWith("8") || c.nama_kelas.startsWith("9") ? "SMP" : "SD"),
      tingkat: c.tingkat,
      wali_kelas: c.wali_kelas || "-",
      jumlah_siswa: c.jumlah_siswa || String(studentCountMap.get(c.nama_kelas) || 0),
      code_restrict: c.code_restrict || "-",
    }));

    teachersList = Array.from(
      new Set(teachers.map((t) => t.name?.trim()).filter((name): name is string => Boolean(name)))
    );
  } catch (e) {
    console.error("Database query error in Admin Classes page:", e);
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
          <h1 className="text-2xl font-bold tracking-tight">Kelola Kelas</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {scopeLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola rombongan belajar {scopeLabel}, penugasan wali kelas, kode restrict iPad, serta import & export data kelas.
        </p>
      </div>

      <ClassTable
        initialClasses={formattedClasses}
        teachersList={teachersList}
        adminJenjang={session?.jenjang || "ALL"}
        activeJenjang={activeJenjang}
      />
    </div>
  );
}
