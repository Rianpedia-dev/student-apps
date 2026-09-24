import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { InBrowserGrader } from "@/components/assignment/in-browser-grader";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    tugasId: string;
    subId: string;
  }>;
}

export default async function GuruReviewTugasPage({ params }: PageProps) {
  const { tugasId, subId } = await params;
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const isNum = /^\d+$/.test(subId);
  if (!isNum) notFound();

  const submission = await prisma.tugasSubmission.findUnique({
    where: { id: BigInt(subId) },
    include: {
      tugas: {
        include: {
          mapel: true,
          kelas: true,
        },
      },
      siswa: {
        select: {
          id: true,
          name: true,
          nis: true,
          image: true,
        },
      },
    },
  });

  if (!submission) notFound();

  return (
    <InBrowserGrader
      submission={{
        id: submission.id.toString(),
        tugasId: submission.tugas_id.toString(),
        tugasJudul: submission.tugas.judul,
        mapelNama: submission.tugas.mapel.nama_mapel,
        kelasNama: submission.tugas.kelas.nama_kelas,
        deadline: submission.tugas.deadline.toISOString(),
        fileUrl: submission.file_url,
        fileName: submission.file_name,
        fileType: submission.file_type,
        catatanSiswa: submission.catatan_siswa,
        status: submission.status,
        nilai: submission.nilai,
        catatanGuru: submission.catatan_guru,
        submittedAt: submission.submitted_at.toISOString(),
        siswa: {
          id: submission.siswa.id.toString(),
          name: submission.siswa.name,
          nis: submission.siswa.nis,
          image: submission.siswa.image,
        },
      }}
    />
  );
}
