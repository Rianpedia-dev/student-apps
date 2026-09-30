import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherTaskList, TeacherTaskItem } from "@/components/features/assignment/teacher-task-list";

export const dynamic = "force-dynamic";

export default async function GuruTugasListPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);

  const rawTasks = await prisma.tugas.findMany({
    where: {
      OR: [
        { guru_id: guruId },
        ...(session.kelas ? [{ kelas: { nama_kelas: session.kelas } }] : []),
      ],
    },
    include: {
      kelas: true,
      mapel: true,
      submissions: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const tasks: TeacherTaskItem[] = rawTasks.map((task) => {
    const totalSubs = task.submissions.length;
    const waiting = task.submissions.filter(
      (s) => s.status === "menunggu_penilaian" || s.status === "terlambat"
    ).length;
    const graded = task.submissions.filter((s) => s.status === "sudah_dinilai").length;

    return {
      id: task.id.toString(),
      judul: task.judul,
      deskripsi: task.deskripsi,
      mapelNama: task.mapel.nama_mapel,
      mapelWarna: task.mapel.warna,
      kelasNama: task.kelas.nama_kelas,
      deadline: task.deadline.toISOString(),
      poinMaksimal: task.poin_maksimal,
      totalSubmissions: totalSubs,
      waitingCount: waiting,
      gradedCount: graded,
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Tombol Buat Tugas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Daftar Tugas & Penilaian
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola penugasan kelas dan periksa lembar kerja siswa secara langsung.
          </p>
        </div>

        <Link href="/guru/tugas/create" className="shrink-0">
          <Button className="h-9 sm:h-10 text-xs font-semibold gap-1.5 rounded-xl shadow-xs w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Buat Tugas Baru</span>
          </Button>
        </Link>
      </div>

      {/* Daftar Tugas Siswa */}
      <TeacherTaskList tasks={tasks} />
    </div>
  );
}
