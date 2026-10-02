import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TeacherInteractiveTaskReview } from "@/components/features/assignment/teacher/teacher-interactive-task-review";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    tugasId: string;
    subId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

export default async function GuruReviewTugasPage({ params, searchParams }: PageProps) {
  const { tugasId, subId } = await params;
  const { from } = await searchParams;
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
          soal: {
            include: {
              opsi: {
                orderBy: { nomor_urut: "asc" },
              },
            },
            orderBy: { nomor_urut: "asc" },
          },
        },
      },
      siswa: {
        select: {
          id: true,
          name: true,
          nis: true,
          image: true,
          gender: true,
        },
      },
      jawaban: true,
    },
  });

  if (!submission) notFound();

  // Fetch sibling submissions in this task for Speed-Grader next/previous navigation
  const allSubs = await prisma.tugasSubmission.findMany({
    where: { tugas_id: submission.tugas_id },
    select: { id: true },
    orderBy: { submitted_at: "asc" },
  });

  const currentIndex = allSubs.findIndex((s) => s.id === submission.id);
  const prevSubId = currentIndex > 0 ? allSubs[currentIndex - 1].id.toString() : null;
  const nextSubId =
    currentIndex >= 0 && currentIndex < allSubs.length - 1
      ? allSubs[currentIndex + 1].id.toString()
      : null;

  const jawabanMap = new Map(
    (submission.jawaban || []).map((j) => [j.soal_id.toString(), j])
  );

  const questionsList = submission.tugas.soal.map((s, idx) => {
    const studentAns = jawabanMap.get(s.id.toString());
    return {
      id: s.id.toString(),
      nomor_urut: idx + 1,
      tipe_soal: s.tipe_soal,
      pertanyaan: s.pertanyaan,
      gambar_soal: s.gambar_soal,
      bobot_poin: s.bobot_poin,
      kunci_jawaban: s.kunci_jawaban,
      pembahasan: s.pembahasan,
      opsi: s.opsi.map((o) => ({
        id: o.id.toString(),
        label: o.label,
        teks_opsi: o.teks_opsi,
        gambar_opsi: o.gambar_opsi,
        is_benar: o.is_benar,
      })),
      jawabanSiswa: studentAns
        ? {
            jawaban_siswa: studentAns.jawaban_siswa,
            is_benar: studentAns.is_benar,
            poin_didapat: studentAns.poin_didapat,
            catatan_koreksi: studentAns.catatan_koreksi,
          }
        : null,
    };
  });

  return (
    <TeacherInteractiveTaskReview
      tugasId={submission.tugas_id.toString()}
      tugasJudul={submission.tugas.judul}
      mapelNama={submission.tugas.mapel.nama_mapel}
      kelasNama={submission.tugas.kelas.nama_kelas}
      poinMaksimal={submission.tugas.poin_maksimal}
      submission={{
        id: submission.id.toString(),
        nilai: submission.nilai,
        status: submission.status,
        catatanGuru: submission.catatan_guru,
        durasiDetik: submission.durasi_detik,
        submittedAt: submission.submitted_at.toISOString(),
        siswa: {
          id: submission.siswa.id.toString(),
          name: submission.siswa.name,
          nis: submission.siswa.nis,
          image: submission.siswa.image,
          gender: submission.siswa.gender,
        },
      }}
      questions={questionsList}
      prevSubId={prevSubId}
      nextSubId={nextSubId}
      fromOrigin={from}
    />
  );
}
