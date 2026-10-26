import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { StudentTable } from "./_components/student-table";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const session = await getSession();
  const activeJenjang = await getActiveJenjang(session);

  let formattedStudents: any[] = [];
  let classList: string[] = [];
  const classJenjangMap: Record<string, string> = {};

  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  try {
    const studentWhere: any = {
      status: { in: ["0", "1"] },
    };
    if (isRestricted) {
      studentWhere.jenjang = activeJenjang;
    }

    const classWhere: any = {};
    if (isRestricted) {
      classWhere.jenjang = activeJenjang;
    }

    const [students, classes] = await Promise.all([
      prisma.user.findMany({
        where: studentWhere,
        orderBy: { name: "asc" },
      }),
      prisma.kelas.findMany({
        where: classWhere,
        orderBy: { nama_kelas: "asc" },
      }),
    ]);

    formattedStudents = students.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      nis: s.nis,
      nip: s.nip,
      email: s.email,
      appleid: s.appleid,
      gender: s.gender,
      kelas: s.kelas,
      jenjang: s.jenjang || (s.kelas && /SMP|Kelas (7|8|9)/i.test(s.kelas) ? "SMP" : "SD"),
      status: s.status,
      point: s.point,
      notes: s.notes,
    }));

    classList = classes.map((c) => c.nama_kelas);
    classes.forEach((c) => {
      classJenjangMap[c.nama_kelas] = c.jenjang || "SD";
    });
  } catch (e) {
    console.error("Database query error in Admin Students page:", e);
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
          <h1 className="text-2xl font-bold tracking-tight">Kelola Akun Siswa</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {scopeLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola data pendaftaran siswa {scopeLabel}, verifikasi akun baru, dan import massal melalui Excel.
        </p>
      </div>

      <StudentTable
        initialStudents={formattedStudents}
        classList={classList}
        classJenjangMap={classJenjangMap}
        adminJenjang={session?.jenjang || "ALL"}
        activeJenjang={activeJenjang}
      />
    </div>
  );
}
