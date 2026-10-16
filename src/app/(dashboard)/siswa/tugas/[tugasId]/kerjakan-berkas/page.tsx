import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Sparkles } from "lucide-react";
import { StudentDocumentRunnerClient } from "./_components/student-document-runner-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function SiswaKerjakanTugasBerkasPage({ params }: PageProps) {
  const { tugasId } = await params;
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(tugasId);
  if (!isNum) notFound();

  const studentId = BigInt(session.id);
  const tId = BigInt(tugasId);

  const tugas = await prisma.tugas.findUnique({
    where: { id: tId },
    include: {
      mapel: true,
      kelas: true,
      guru: { select: { name: true } },
    },
  });

  if (!tugas || !tugas.file_petunjuk) {
    notFound();
  }

  // Fetch or upsert submission
  let submission = await prisma.tugasSubmission.findUnique({
    where: {
      tugas_id_siswa_id: {
        tugas_id: tId,
        siswa_id: studentId,
      },
    },
  });

  if (!submission) {
    submission = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tId,
        siswa_id: studentId,
        status: "sedang_mengerjakan",
        mulai_mengerjakan_at: new Date(),
        file_url: tugas.file_petunjuk,
        file_name: tugas.judul,
        file_type: "worksheet",
      },
    });
  }

  const isGraded = submission.status === "sudah_dinilai";

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Breadcrumb & Task Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <Link
          href={`/siswa/tugas/${tugasId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-xl border border-transparent hover:border-border transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail Tugas</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
            {tugas.judul}
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            • {tugas.mapel.nama_mapel}
          </span>
        </div>
      </div>

      {/* Main Interactive Canvas Workspace */}
      <div className="flex-1 w-full min-h-0">
        <StudentDocumentRunnerClient
          tugasId={tugas.id.toString()}
          tugasJudul={tugas.judul}
          fileSoalUrl={tugas.file_petunjuk}
          submissionId={submission.id.toString()}
          initialAnnotationData={submission.annotated_data}
          isGraded={isGraded}
        />
      </div>
    </div>
  );
}
