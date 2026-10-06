import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherTaskList, TeacherTaskItem } from "@/components/features/assignment/teacher-task-list";
import { DashboardBreadcrumb } from "@/components/shared/dashboard-breadcrumb";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    mapelId?: string;
    kelasId?: string;
    status?: string;
  }>;
}

export default async function GuruTugasListPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { mapelId, kelasId, status } = await searchParams;
  const guruId = BigInt(session.id);

  const parsedMapelId = mapelId && /^\d+$/.test(mapelId) ? BigInt(mapelId) : null;
  const parsedKelasId = kelasId && /^\d+$/.test(kelasId) ? BigInt(kelasId) : null;
  const isSpecificView = Boolean(parsedMapelId);

  // Ambil informasi mapel dan kelas aktif jika ada
  const [activeMapel, activeKelas] = await Promise.all([
    parsedMapelId
      ? prisma.mataPelajaran.findUnique({ where: { id: parsedMapelId } })
      : null,
    parsedKelasId
      ? prisma.kelas.findUnique({ where: { id: parsedKelasId } })
      : null,
  ]);

  // Query filter tugas
  const whereClause: any = {
    OR: [
      { guru_id: guruId },
      ...(session.kelas ? [{ kelas: { nama_kelas: session.kelas } }] : []),
    ],
  };

  if (parsedMapelId) {
    whereClause.mapel_id = parsedMapelId;
  }
  if (parsedKelasId) {
    whereClause.kelas_id = parsedKelasId;
  }

  // Ambil data tugas lengkap dengan kelas, mapel, pertemuan, dan submissions
  const rawTasks = await prisma.tugas.findMany({
    where: whereClause,
    include: {
      kelas: true,
      mapel: true,
      pertemuan: {
        select: {
          id: true,
          pertemuan_ke: true,
          judul: true,
        },
      },
      submissions: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Ambil data jadwal mengajar untuk melengkapi daftar kelas & mapel di filter dropdown jika view umum
  const teacherSchedules = isSpecificView
    ? []
    : await prisma.jadwalPelajaran.findMany({
        where: session.role === "guru" ? { guru_id: guruId } : {},
        include: { kelas: true, mapel: true },
      });

  // Extract unique classes and subjects for filter dropdowns
  const classMap = new Map<string, string>();
  const subjectMap = new Map<string, string>();

  teacherSchedules.forEach((sch) => {
    classMap.set(sch.kelas_id.toString(), sch.kelas.nama_kelas);
    subjectMap.set(sch.mapel_id.toString(), sch.mapel.nama_mapel);
  });

  rawTasks.forEach((t) => {
    classMap.set(t.kelas_id.toString(), t.kelas.nama_kelas);
    subjectMap.set(t.mapel_id.toString(), t.mapel.nama_mapel);
  });

  const availableClasses = Array.from(classMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  const availableSubjects = Array.from(subjectMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  const tasks: TeacherTaskItem[] = rawTasks.map((task) => {
    const totalSubs = task.submissions.length;
    const waiting = task.submissions.filter(
      (s) => s.status === "menunggu_penilaian" || s.status === "terlambat" || s.status === "perlu_revisi"
    ).length;
    const graded = task.submissions.filter((s) => s.status === "sudah_dinilai").length;

    return {
      id: task.id.toString(),
      judul: task.judul,
      deskripsi: task.deskripsi,
      mapelId: task.mapel_id.toString(),
      mapelNama: task.mapel.nama_mapel,
      mapelWarna: task.mapel.warna,
      kelasId: task.kelas_id.toString(),
      kelasNama: task.kelas.nama_kelas,
      pertemuanId: task.pertemuan_id ? task.pertemuan_id.toString() : null,
      pertemuanKe: task.pertemuan ? task.pertemuan.pertemuan_ke : null,
      pertemuanJudul: task.pertemuan ? task.pertemuan.judul : null,
      deadline: task.deadline.toISOString(),
      poinMaksimal: task.poin_maksimal,
      totalSubmissions: totalSubs,
      waitingCount: waiting,
      gradedCount: graded,
    };
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <DashboardBreadcrumb
        backHref="/guru/mapel"
        backLabel={isSpecificView ? "Kembali ke Jadwal & Mapel" : "Jadwal & Mapel"}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 bg-card/60 backdrop-blur-xs p-5 rounded-2xl border border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {activeMapel ? `Tugas: ${activeMapel.nama_mapel}` : "Daftar Tugas & Penilaian"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {activeKelas
              ? `${activeKelas.nama_kelas} • Kelola penugasan dan periksa hasil belajar siswa.`
              : activeMapel
              ? `Kelola penugasan untuk mata pelajaran ${activeMapel.nama_mapel}.`
              : "Kelola penugasan kelas, periksa lembar kerja siswa, dan evaluasi hasil belajar secara langsung."}
          </p>
        </div>

        <Link
          href={`/guru/tugas/create${mapelId ? `?mapelId=${mapelId}${kelasId ? `&kelasId=${kelasId}` : ""}&from=mapel` : ""}`}
          className="shrink-0"
        >
          <Button className="h-9 sm:h-10 text-xs font-bold gap-1.5 rounded-xl shadow-xs w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Buat Tugas Baru</span>
          </Button>
        </Link>
      </div>

      {/* Daftar Tugas Siswa */}
      <TeacherTaskList
        tasks={tasks}
        availableClasses={availableClasses}
        availableSubjects={availableSubjects}
        initialMapelId={mapelId}
        initialKelasId={kelasId}
        initialStatus={status}
        isSpecificView={isSpecificView}
        activeMapelNama={activeMapel?.nama_mapel}
        activeKelasNama={activeKelas?.nama_kelas}
      />
    </div>
  );
}
