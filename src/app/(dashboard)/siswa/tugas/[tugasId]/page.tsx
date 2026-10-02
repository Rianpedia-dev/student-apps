import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { StudentTaskLobbyCard } from "@/components/features/assignment/student-task-lobby-card";

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

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back to Mission Board */}
      <div>
        <Link
          href="/siswa/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-xl border border-transparent hover:border-border transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>
      </div>

      {/* Task Lobby Card */}
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
    </div>
  );
}
