import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Clock, User, Download, FileText } from "lucide-react";
import { FileSubmissionZone } from "@/components/assignment/file-submission-zone";

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
        catatanSiswa: sub.catatan_siswa,
        status: sub.status,
        nilai: sub.nilai,
        catatanGuru: sub.catatan_guru,
        annotatedFileUrl: sub.annotated_file_url,
        submittedAt: sub.submitted_at.toISOString(),
      }
    : null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Tombol Kembali Sederhana */}
      <div>
        <Link
          href="/siswa/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>
      </div>

      {/* Informasi Tugas */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
        {/* Header Mapel & Tenggat */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
              {tugas.mapel.nama_mapel}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {tugas.kelas.nama_kelas}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>
              Tenggat:{" "}
              {new Date(tugas.deadline).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Judul & Guru */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">
            {tugas.judul}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Guru Pengampu: <span className="font-semibold text-foreground">{tugas.guru.name}</span> • Maksimal:{" "}
            <span className="font-semibold text-foreground">{tugas.poin_maksimal} Poin</span>
          </p>
        </div>

        {/* Petunjuk / Soal */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-xs sm:text-sm text-foreground/90 space-y-2 leading-relaxed">
          <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
            Instruksi Soal:
          </p>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm"
            dangerouslySetInnerHTML={{ __html: tugas.deskripsi }}
          />
        </div>

        {/* Lampiran File Soal Jika Ada */}
        {tugas.file_petunjuk && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Lampiran Lembar Soal dari Guru</span>
            </div>
            <a
              href={tugas.file_petunjuk}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Buka Dokumen</span>
            </a>
          </div>
        )}
      </div>

      {/* Bagian Pengumpulan & Nilai Siswa */}
      <FileSubmissionZone
        tugasId={tugas.id.toString()}
        poinMaksimal={tugas.poin_maksimal}
        existingSubmission={existingSubmission}
      />
    </div>
  );
}
