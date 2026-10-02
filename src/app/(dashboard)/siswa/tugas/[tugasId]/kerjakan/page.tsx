import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { InteractiveTaskRunner } from "@/components/features/assignment/runner/interactive-task-runner";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function SiswaKerjakanTugasPage({ params }: PageProps) {
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
      soal: {
        include: {
          opsi: {
            orderBy: { nomor_urut: "asc" },
          },
        },
        orderBy: { nomor_urut: "asc" },
      },
    },
  });

  if (!tugas) notFound();

  // Jika tugas belum memiliki soal, arahkan kembali
  if (tugas.soal.length === 0) {
    redirect(`/siswa/tugas/${tugasId}`);
  }

  // Cek apakah sudah pernah submit dan sudah selesai
  let submission = await prisma.tugasSubmission.findUnique({
    where: {
      tugas_id_siswa_id: {
        tugas_id: tId,
        siswa_id: studentId,
      },
    },
    include: {
      jawaban: true,
    },
  });

  // Jika tugas sudah dinilai atau selesai, langsung redirect ke halaman hasil
  if (
    submission &&
    (submission.status === "sudah_dinilai" ||
      submission.status === "selesai" ||
      submission.status === "menunggu_penilaian")
  ) {
    redirect(`/siswa/tugas/${tugasId}/hasil`);
  }

  // Jika belum ada submission, buat submission sesi baru
  if (!submission) {
    // Cek deadline
    if (new Date() > new Date(tugas.deadline)) {
      redirect(`/siswa/tugas/${tugasId}`);
    }

    submission = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tId,
        siswa_id: studentId,
        status: "sedang_mengerjakan",
        mulai_mengerjakan_at: new Date(),
        total_soal: tugas.soal.length,
        file_url: "interactive_cbt",
        file_name: "Pengerjaan Interaktif In-App",
        file_type: "interactive",
      },
      include: {
        jawaban: true,
      },
    });
  }

  // Persiapkan daftar soal
  let questionsList = tugas.soal.map((s, idx) => ({
    id: s.id.toString(),
    nomor_urut: idx + 1,
    tipe_soal: s.tipe_soal,
    pertanyaan: s.pertanyaan,
    gambar_soal: s.gambar_soal,
    bobot_poin: s.bobot_poin,
    opsi: s.opsi.map((o) => ({
      id: o.id.toString(),
      label: o.label,
      teks_opsi: o.teks_opsi,
      gambar_opsi: o.gambar_opsi,
    })),
  }));

  // Jika acak opsi diaktifkan
  if (tugas.acak_opsi) {
    questionsList = questionsList.map((q) => {
      if (q.opsi.length > 1) {
        // Pertahankan label A, B, C, D tetapi acak urutan teksnya
        const shuffledTeks = [...q.opsi].sort(() => Math.random() - 0.5);
        const remapped = q.opsi.map((orig, i) => ({
          ...orig,
          teks_opsi: shuffledTeks[i].teks_opsi,
          gambar_opsi: shuffledTeks[i].gambar_opsi,
        }));
        return { ...q, opsi: remapped };
      }
      return q;
    });
  }

  const initialAnswers = (submission.jawaban || []).map((j) => ({
    soalId: j.soal_id.toString(),
    jawaban: j.jawaban_siswa || "",
    isRagu: j.is_ragu,
  }));

  return (
    <InteractiveTaskRunner
      tugasId={tugas.id.toString()}
      tugasJudul={tugas.judul}
      mapelNama={tugas.mapel.nama_mapel}
      kelasNama={tugas.kelas.nama_kelas}
      durasiMenit={tugas.durasi_menit}
      submissionId={submission.id.toString()}
      questions={questionsList}
      initialAnswers={initialAnswers}
      mulaiMengerjakanAt={submission.mulai_mengerjakan_at?.toISOString() || null}
    />
  );
}
