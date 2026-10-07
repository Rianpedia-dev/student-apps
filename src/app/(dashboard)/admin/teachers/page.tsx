import prisma from "@/lib/prisma";
import { TeacherTable } from "./_components/teacher-table";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  let formattedTeachers: any[] = [];
  let classNames: string[] = [];

  try {
    const [teachers, classes] = await Promise.all([
      prisma.user.findMany({
        where: {
          status: { in: ["0", "2", "4"] },
        },
        orderBy: { name: "asc" },
      }),
      prisma.kelas.findMany({
        select: { nama_kelas: true },
        orderBy: { nama_kelas: "asc" },
      }),
    ]);

    classNames = classes.map((c) => c.nama_kelas).filter(Boolean);

    formattedTeachers = teachers.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      email: t.email,
      nip: t.nip,
      guru_bidang: t.guru_bidang,
      kelas: t.kelas,
      status: t.status,
      gender: t.gender,
      appleid: t.appleid,
      passwordappleid: t.passwordappleid,
    }));
  } catch (e) {
    console.error("Database query error in Admin Teachers page:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Kelola Akun Guru</h1>
        <p className="text-sm text-muted-foreground">
          Kelola data dewan guru, verifikasi pendaftaran akun baru, dan atur penugasan wali kelas.
        </p>
      </div>

      <TeacherTable initialTeachers={formattedTeachers} classList={classNames} />
    </div>
  );
}
