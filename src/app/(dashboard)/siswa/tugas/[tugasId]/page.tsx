import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Clock, Calendar, BookOpen, User, Download, FileText } from "lucide-react";
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
  const existingSubmission = sub ? {
    fileUrl: sub.file_url,
    fileName: sub.file_name,
    fileType: sub.file_type,
    catatanSiswa: sub.catatan_siswa,
    status: sub.status,
    nilai: sub.nilai,
    catatanGuru: sub.catatan_guru,
  } : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/siswa/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>
      </div>

      {/* Task Details Card */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary uppercase">
              {tugas.mapel.nama_mapel}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {tugas.kelas.nama_kelas}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Tenggat: {new Date(tugas.deadline).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} WIB
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
            {tugas.judul}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>Diberikan oleh: <strong className="text-foreground">{tugas.guru.name}</strong></span>
          </p>
        </div>

        {/* Task Description / Instructions */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-xs sm:text-sm text-foreground/90 space-y-2 leading-relaxed">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Instruksi Pengerjaan:</h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm"
            dangerouslySetInnerHTML={{ __html: tugas.deskripsi }}
          />
        </div>

        {/* Teacher's Attachment / Guide File if any */}
        {tugas.file_petunjuk && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">Lampiran Petunjuk / Lembar Soal</p>
                <p className="text-[11px] text-muted-foreground">Unduh atau buka panduan dari guru</p>
              </div>
            </div>
            <a
              href={tugas.file_petunjuk}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Buka File</span>
            </a>
          </div>
        )}
      </div>

      {/* Submission Upload & Preview Zone */}
      <FileSubmissionZone
        tugasId={tugas.id.toString()}
        poinMaksimal={tugas.poin_maksimal}
        existingSubmission={existingSubmission}
      />
    </div>
  );
}
