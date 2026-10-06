import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardBreadcrumb } from "@/components/shared/dashboard-breadcrumb";
import { StudentTaskQuestList, StudentTaskItem } from "@/components/features/assignment/student-task-quest-list";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    mapelId?: string;
  }>;
}

export default async function SiswaTugasListPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const { mapelId } = await searchParams;

  const studentClass = session.kelas || "";
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: studentClass },
  });

  // Filter tugas berdasarkan mapelId jika tersedia
  const rawTasks = kelas
    ? await prisma.tugas.findMany({
        where: {
          kelas_id: kelas.id,
          status: "aktif",
          ...(mapelId ? { mapel_id: BigInt(mapelId) } : {}),
        },
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

  // Ambil nama mapel jika ada filter
  const mapelName = mapelId && rawTasks.length > 0
    ? rawTasks[0].mapel.nama_mapel
    : null;

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
      tampilkanNilaiInstan: t.tampilkan_nilai_instan,
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
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back Navigation */}
      <DashboardBreadcrumb
        backHref="/siswa/mapel"
        backLabel="Mapel & Tugas"
      />

      {/* Header */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {mapelName ? `Tugas: ${mapelName}` : "Tugas & Evaluasi Belajar"}
        </h1>
      </div>

      {/* Daftar Tugas Siswa */}
      <StudentTaskQuestList tasks={tasks} />
    </div>
  );
}
