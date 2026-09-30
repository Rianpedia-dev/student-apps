import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Clock } from "lucide-react";
import { TeacherSubmissionsView, StudentSubmissionItem } from "@/components/features/assignment/teacher-submissions-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function GuruTugasSubmissionsPage({ params }: PageProps) {
  const { tugasId } = await params;
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(tugasId);
  if (!isNum) notFound();

  const tugas = await prisma.tugas.findUnique({
    where: { id: BigInt(tugasId) },
    include: {
      kelas: true,
      mapel: true,
      submissions: {
        include: {
          siswa: {
            select: { id: true, name: true, nis: true, image: true, email: true },
          },
        },
        orderBy: { submitted_at: "desc" },
      },
    },
  });

  if (!tugas) notFound();

  // Ambil semua siswa di kelas tugas
  const allStudentsInClass = await prisma.user.findMany({
    where: {
      kelas: tugas.kelas.nama_kelas,
      status: "1",
    },
    select: { id: true, name: true, nis: true, image: true, gender: true },
    orderBy: { name: "asc" },
  });

  const submissionMap = new Map(
    tugas.submissions.map((s) => [s.siswa_id.toString(), s])
  );

  const studentsData: StudentSubmissionItem[] = allStudentsInClass.map((student) => {
    const sId = student.id.toString();
    const sub = submissionMap.get(sId);

    if (sub) {
      return {
        siswaId: sId,
        siswaName: student.name,
        siswaNis: student.nis,
        siswaImage: student.image,
        siswaGender: student.gender,
        submissionId: sub.id.toString(),
        submittedAt: sub.submitted_at.toISOString(),
        fileUrl: sub.file_url,
        fileName: sub.file_name,
        fileType: sub.file_type,
        catatanSiswa: sub.catatan_siswa,
        status: sub.status,
        nilai: sub.nilai,
        catatanGuru: sub.catatan_guru,
        annotatedFileUrl: sub.annotated_file_url,
      };
    }

    return {
      siswaId: sId,
      siswaName: student.name,
      siswaNis: student.nis,
      siswaImage: student.image,
      siswaGender: student.gender,
      submissionId: null,
      submittedAt: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      catatanSiswa: null,
      status: "belum_mengumpulkan",
      nilai: null,
      catatanGuru: null,
      annotatedFileUrl: null,
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tombol Kembali Sederhana */}
      <div>
        <Link
          href="/guru/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {tugas.mapel.nama_mapel}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground">
                {tugas.kelas.nama_kelas}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {tugas.judul}
            </h1>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>
              Tenggat:{" "}
              {new Date(tugas.deadline).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Daftar Pengumpulan Siswa & Modal Koreksi Langsung */}
      <TeacherSubmissionsView
        tugasId={tugas.id.toString()}
        tugasJudul={tugas.judul}
        poinMaksimal={tugas.poin_maksimal}
        students={studentsData}
      />
    </div>
  );
}
