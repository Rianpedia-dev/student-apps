import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StudentTaskQuestList, StudentTaskItem } from "@/components/assignment/student-task-quest-list";

export const dynamic = "force-dynamic";

export default async function SiswaTugasListPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentClass = session.kelas || "";
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: studentClass },
  });

  const rawTasks = kelas
    ? await prisma.tugas.findMany({
        where: { kelas_id: kelas.id, status: "aktif" },
        include: {
          mapel: true,
          guru: { select: { name: true } },
          submissions: {
            where: { siswa_id: BigInt(session.id) },
          },
        },
        orderBy: { deadline: "asc" },
      })
    : [];

  const tasks: StudentTaskItem[] = rawTasks.map((t) => {
    const sub = t.submissions[0];
    return {
      id: t.id.toString(),
      judul: t.judul,
      deskripsi: t.deskripsi,
      mapelNama: t.mapel.nama_mapel,
      guruNama: t.guru.name,
      deadline: t.deadline.toISOString(),
      poinMaksimal: t.poin_maksimal,
      submission: sub
        ? {
            status: sub.status,
            nilai: sub.nilai,
            submittedAt: sub.submitted_at.toISOString(),
            catatanGuru: sub.catatan_guru,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Sederhana & Jelas */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Tugas Siswa
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Lihat daftar tugas kelas, kumpulkan lembar tugas, dan periksa nilai dari guru.
        </p>
      </div>

      {/* Daftar Tugas Siswa */}
      <StudentTaskQuestList tasks={tasks} />
    </div>
  );
}
