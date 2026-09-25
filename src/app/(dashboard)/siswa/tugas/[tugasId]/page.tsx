import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { StudentTaskQuestionCard } from "@/components/assignment/student-task-question-card";
import { KidsSubmissionZone } from "@/components/assignment/kids-submission-zone";

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
      submissions: {
        where: { siswa_id: BigInt(session.id) },
      },
    },
  });

  if (!tugas) notFound();

  const sub = tugas.submissions[0];
  const existingSubmission = sub
    ? {
        fileUrl: sub.file_url,
        fileName: sub.file_name,
        fileType: sub.file_type,
        fileSize: sub.file_size,
        attachments: sub.attachments,
        catatanSiswa: sub.catatan_siswa,
        status: sub.status,
        nilai: sub.nilai,
        catatanGuru: sub.catatan_guru,
        annotatedFileUrl: sub.annotated_file_url,
        annotatedData: sub.annotated_data,
        submittedAt: sub.submitted_at.toISOString(),
      }
    : null;

  const deadlineFormatted = new Date(tugas.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back to Mission Board */}
      <div>
        <Link
          href="/siswa/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-xl border border-transparent hover:border-border transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Papan Misi Tugas</span>
        </Link>
      </div>

      {/* Task Information & Zero-Download Question Viewer */}
      <StudentTaskQuestionCard
        mapelNama={tugas.mapel.nama_mapel}
        kelasNama={tugas.kelas.nama_kelas}
        guruNama={tugas.guru.name}
        judul={tugas.judul}
        deskripsi={tugas.deskripsi}
        deadlineFormatted={deadlineFormatted}
        poinMaksimal={tugas.poin_maksimal}
        filePetunjuk={tugas.file_petunjuk}
      />

      {/* Kids-Friendly Multi-Attachment Submission & Correction Zone */}
      <KidsSubmissionZone
        tugasId={tugas.id.toString()}
        tugasJudul={tugas.judul}
        poinMaksimal={tugas.poin_maksimal}
        existingSubmission={existingSubmission}
      />
    </div>
  );
}
