import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskResultView } from "@/components/features/assignment/result/task-result-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tugasId: string }>;
}

export default async function SiswaTugasHasilPage({ params }: PageProps) {
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
      submissions: {
        where: { siswa_id: studentId },
        include: {
          jawaban: true,
        },
      },
    },
  });

  if (!tugas) notFound();

  const submission = tugas.submissions[0];
  if (!submission || submission.status === "sedang_mengerjakan") {
    redirect(`/siswa/tugas/${tugasId}`);
  }

  const jawabanMap = new Map(
    (submission.jawaban || []).map((j) => [j.soal_id.toString(), j])
  );

  const questionsList = tugas.soal.map((s, idx) => {
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
    <TaskResultView
      tugasId={tugas.id.toString()}
      tugasJudul={tugas.judul}
      mapelNama={tugas.mapel.nama_mapel}
      kelasNama={tugas.kelas.nama_kelas}
      poinMaksimal={tugas.poin_maksimal}
      tampilkanNilaiInstan={tugas.tampilkan_nilai_instan}
      submission={{
        id: submission.id.toString(),
        nilai: submission.nilai,
        totalBenar: submission.total_benar ?? 0,
        totalSalah: submission.total_salah ?? 0,
        durasiDetik: submission.durasi_detik,
        status: submission.status,
        catatanGuru: submission.catatan_guru,
        submittedAt: submission.submitted_at.toISOString(),
      }}
      questions={questionsList}
    />
  );
}
