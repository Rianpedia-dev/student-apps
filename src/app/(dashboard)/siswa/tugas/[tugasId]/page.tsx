import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { StudentTaskLobbyCard } from "@/components/features/assignment/student-task-lobby-card";
import { StudentDocumentTaskCard } from "@/components/features/assignment/student/student-document-task-card";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function SiswaTugasDetailPage({ params }: PageProps) {
  const { tugasId } = await params;
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(tugasId);
  if (!isNum) notFound();

  const tugas = await prisma.tugas.findUnique({
    where: { id: BigInt(tugasId) },
    include: {
      mapel: true,
      kelas: true,
      guru: { select: { name: true, image: true, email: true } },
      soal: { select: { id: true } },
      submissions: {
        where: { siswa_id: BigInt(session.id) },
      },
    },
  });

  if (!tugas) notFound();

  const sub = tugas.submissions[0];
  const existingSubmission = sub
    ? {
        id: sub.id.toString(),
        status: sub.status,
        nilai: sub.nilai,
        catatanGuru: sub.catatan_guru,
        catatanSiswa: sub.catatan_siswa,
        fileUrl: sub.file_url,
        fileName: sub.file_name,
        fileType: sub.file_type,
        annotatedFileUrl: sub.annotated_file_url,
        annotatedData: sub.annotated_data,
        totalBenar: sub.total_benar ?? 0,
        totalSalah: sub.total_salah ?? 0,
        submittedAt: sub.submitted_at.toISOString(),
      }
    : null;

  const isLate = new Date() > new Date(tugas.deadline);

  const deadlineFormatted = new Date(tugas.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDocumentTask =
    tugas.tipe_pengerjaan === "LEMBAR_KERJA" ||
    (Boolean(tugas.file_petunjuk) && tugas.soal.length === 0);

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {/* Back to Mission Board */}
      <div>
        <Link
          href={`/siswa/mapel/${tugas.mapel_id}/tugas`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group bg-muted/40 hover:bg-muted px-3.5 py-2 rounded-xl border border-border/60 min-h-9"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>
      </div>

      {isDocumentTask && tugas.file_petunjuk ? (
        <StudentDocumentTaskCard
          tugasId={tugas.id.toString()}
          judul={tugas.judul}
          deskripsi={tugas.deskripsi}
          fileSoalUrl={tugas.file_petunjuk}
          mapelNama={tugas.mapel.nama_mapel}
          kelasNama={tugas.kelas.nama_kelas}
          guruNama={tugas.guru.name}
          deadlineFormatted={deadlineFormatted}
          isLate={isLate}
          poinMaksimal={tugas.poin_maksimal}
          existingSubmission={existingSubmission}
        />
      ) : (
        /* Task Lobby Card for CBT */
        <StudentTaskLobbyCard
          tugasId={tugas.id.toString()}
          judul={tugas.judul}
          deskripsi={tugas.deskripsi}
          mapelNama={tugas.mapel.nama_mapel}
          kelasNama={tugas.kelas.nama_kelas}
          guruNama={tugas.guru.name}
          deadlineFormatted={deadlineFormatted}
          isLate={isLate}
          totalSoal={tugas.soal.length}
          durasiMenit={tugas.durasi_menit}
          poinMaksimal={tugas.poin_maksimal}
          existingSubmission={existingSubmission}
        />
      )}
    </div>
  );
}
