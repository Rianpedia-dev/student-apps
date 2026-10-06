"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export interface QuestionOptionInput {
  label: string; // A, B, C, D, E
  teks_opsi?: string | null;
  gambar_opsi?: string | null;
  is_benar: boolean;
}

export interface QuestionItemInput {
  id?: string;
  nomor_urut: number;
  tipe_soal: "PILIHAN_GANDA" | "PILIHAN_GAMBAR" | "ISIAN_SINGKAT" | "ESAI";
  pertanyaan: string;
  gambar_soal?: string | null;
  bobot_poin: number;
  kunci_jawaban?: string | null;
  pembahasan?: string | null;
  opsi: QuestionOptionInput[];
}

export interface CreateInteractiveTaskInput {
  judul: string;
  deskripsi: string;
  kelas_id: string;
  mapel_id: string;
  pertemuan_id?: string | null;
  deadline: string;
  durasi_menit?: number | null;
  acak_soal?: boolean;
  acak_opsi?: boolean;
  tampilkan_nilai_instan?: boolean;
  poin_maksimal?: number;
  soal: QuestionItemInput[];
}

/**
 * Upload gambar untuk stimulus soal atau opsi jawaban
 */
export async function uploadTaskImageAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Akses ditolak." };
  }

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Tidak ada berkas gambar yang dipilih." };
  }

  const allowedExts = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return { success: false, error: "Format gambar harus berupa PNG, JPG, JPEG, atau WebP." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "Ukuran gambar maksimal 10MB." };
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas", "media");
    await mkdir(uploadDir, { recursive: true });

    const safeName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));

    return {
      success: true,
      url: `/uploads/tugas/media/${safeName}`,
    };
  } catch (err: any) {
    console.error("Gagal menyimpan gambar soal:", err);
    return { success: false, error: "Gagal menyimpan gambar ke server." };
  }
}

/**
 * Buat Tugas Interaktif Baru beserta Butir Soal dan Opsi
 */
export async function createInteractiveTugasAction(payload: CreateInteractiveTaskInput) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak membuat tugas." };
  }

  const {
    judul,
    deskripsi,
    kelas_id,
    mapel_id,
    pertemuan_id,
    deadline,
    durasi_menit,
    acak_soal = false,
    acak_opsi = false,
    tampilkan_nilai_instan = true,
    soal = [],
  } = payload;

  if (!judul?.trim() || !deskripsi?.trim() || !kelas_id || !mapel_id || !deadline) {
    return { success: false, error: "Mohon lengkapi semua data wajib pada Informasi Tugas." };
  }

  if (soal.length === 0) {
    return { success: false, error: "Tugas interaktif harus memiliki minimal 1 butir soal." };
  }

  // Validasi butir soal
  for (let i = 0; i < soal.length; i++) {
    const s = soal[i];
    if (!s.pertanyaan?.trim()) {
      return { success: false, error: `Soal nomor ${i + 1} belum memiliki teks pertanyaan.` };
    }
    if (s.tipe_soal === "PILIHAN_GANDA" || s.tipe_soal === "PILIHAN_GAMBAR") {
      if (!s.opsi || s.opsi.length < 2) {
        return { success: false, error: `Soal nomor ${i + 1} harus memiliki minimal 2 pilihan jawaban.` };
      }
      const hasCorrect = s.opsi.some((o) => o.is_benar);
      if (!hasCorrect) {
        return { success: false, error: `Soal nomor ${i + 1} belum ditentukan kunci jawaban benarnya.` };
      }
    }
  }

  // Hitung total poin maksimal dari seluruh butir soal
  const totalPoin = soal.reduce((acc, curr) => acc + (Number(curr.bobot_poin) || 10), 0);
  const poinMaksimal = payload.poin_maksimal || Math.max(10, Math.round(totalPoin));

  const parsedPertemuanId = pertemuan_id && /^\d+$/.test(pertemuan_id) ? BigInt(pertemuan_id) : null;

  try {
    const tugas = await prisma.$transaction(async (tx) => {
      // 1. Buat Header Tugas
      const createdTugas = await tx.tugas.create({
        data: {
          kelas_id: BigInt(kelas_id),
          mapel_id: BigInt(mapel_id),
          guru_id: BigInt(session.id),
          pertemuan_id: parsedPertemuanId,
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          deadline: new Date(deadline),
          poin_maksimal: poinMaksimal,
          status: "aktif",
          tipe_pengerjaan: "INTERAKTIF",
          durasi_menit: durasi_menit ? Number(durasi_menit) : null,
          acak_soal: Boolean(acak_soal),
          acak_opsi: Boolean(acak_opsi),
          tampilkan_nilai_instan: Boolean(tampilkan_nilai_instan),
        },
      });

      // 2. Buat Butir Soal dan Opsi
      for (let i = 0; i < soal.length; i++) {
        const item = soal[i];
        const correctOpsi = item.opsi?.find((o) => o.is_benar);
        const derivedKey = item.kunci_jawaban || correctOpsi?.label || null;

        const createdSoal = await tx.tugasSoal.create({
          data: {
            tugas_id: createdTugas.id,
            nomor_urut: item.nomor_urut || i + 1,
            tipe_soal: item.tipe_soal,
            pertanyaan: item.pertanyaan.trim(),
            gambar_soal: item.gambar_soal || null,
            bobot_poin: Number(item.bobot_poin) || 10,
            kunci_jawaban: derivedKey,
            pembahasan: item.pembahasan?.trim() || null,
          },
        });

        if (item.tipe_soal === "PILIHAN_GANDA" || item.tipe_soal === "PILIHAN_GAMBAR") {
          for (let j = 0; j < (item.opsi || []).length; j++) {
            const op = item.opsi[j];
            await tx.tugasSoalOpsi.create({
              data: {
                soal_id: createdSoal.id,
                label: op.label || String.fromCharCode(65 + j),
                teks_opsi: op.teks_opsi?.trim() || null,
                gambar_opsi: op.gambar_opsi || null,
                is_benar: Boolean(op.is_benar),
                nomor_urut: j + 1,
              },
            });
          }
        }
      }

      return createdTugas;
    });

    revalidatePath("/guru/tugas");
    revalidatePath("/guru/mapel");
    revalidatePath(`/guru/mapel/${mapel_id}`);
    revalidatePath("/siswa/tugas");
    revalidatePath("/siswa");

    return {
      success: true,
      message: "Alhamdulillah, tugas interaktif berhasil dibuat dan diterbitkan!",
      data: { id: tugas.id.toString() },
    };
  } catch (err: any) {
    console.error("Gagal membuat tugas interaktif:", err);
    return { success: false, error: err.message || "Gagal membuat tugas interaktif baru." };
  }
}

/**
 * Update Tugas Interaktif beserta Butir Soalnya
 */
export async function updateInteractiveTugasAction(tugasId: string, payload: CreateInteractiveTaskInput) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Akses ditolak." };
  }

  const {
    judul,
    deskripsi,
    kelas_id,
    mapel_id,
    pertemuan_id,
    deadline,
    durasi_menit,
    acak_soal = false,
    acak_opsi = false,
    tampilkan_nilai_instan = true,
    soal = [],
  } = payload;

  if (!judul?.trim() || !deskripsi?.trim() || !kelas_id || !mapel_id || !deadline) {
    return { success: false, error: "Harap lengkapi semua informasi tugas." };
  }

  if (soal.length === 0) {
    return { success: false, error: "Tugas harus memiliki minimal 1 butir soal." };
  }

  if (!tugasId || !/^\d+$/.test(tugasId)) {
    return { success: false, error: "ID tugas tidak valid." };
  }

  const totalPoin = soal.reduce((acc, curr) => acc + (Number(curr.bobot_poin) || 10), 0);
  const poinMaksimal = payload.poin_maksimal || Math.max(10, Math.round(totalPoin));
  const parsedPertemuanId = pertemuan_id && /^\d+$/.test(pertemuan_id) ? BigInt(pertemuan_id) : null;
  const tId = BigInt(tugasId);

  try {
    await prisma.$transaction(async (tx) => {
      // Update data header tugas
      await tx.tugas.update({
        where: { id: tId },
        data: {
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          kelas_id: BigInt(kelas_id),
          mapel_id: BigInt(mapel_id),
          pertemuan_id: parsedPertemuanId,
          deadline: new Date(deadline),
          poin_maksimal: poinMaksimal,
          durasi_menit: durasi_menit ? Number(durasi_menit) : null,
          acak_soal: Boolean(acak_soal),
          acak_opsi: Boolean(acak_opsi),
          tampilkan_nilai_instan: Boolean(tampilkan_nilai_instan),
        },
      });

      // Hapus butir soal lama untuk diganti dengan daftar soal baru
      await tx.tugasSoal.deleteMany({
        where: { tugas_id: tId },
      });

      // Insert butir soal baru
      for (let i = 0; i < soal.length; i++) {
        const item = soal[i];
        const correctOpsi = item.opsi?.find((o) => o.is_benar);
        const derivedKey = item.kunci_jawaban || correctOpsi?.label || null;

        const createdSoal = await tx.tugasSoal.create({
          data: {
            tugas_id: tId,
            nomor_urut: i + 1,
            tipe_soal: item.tipe_soal,
            pertanyaan: item.pertanyaan.trim(),
            gambar_soal: item.gambar_soal || null,
            bobot_poin: Number(item.bobot_poin) || 10,
            kunci_jawaban: derivedKey,
            pembahasan: item.pembahasan?.trim() || null,
          },
        });

        if (item.tipe_soal === "PILIHAN_GANDA" || item.tipe_soal === "PILIHAN_GAMBAR") {
          for (let j = 0; j < (item.opsi || []).length; j++) {
            const op = item.opsi[j];
            await tx.tugasSoalOpsi.create({
              data: {
                soal_id: createdSoal.id,
                label: op.label || String.fromCharCode(65 + j),
                teks_opsi: op.teks_opsi?.trim() || null,
                gambar_opsi: op.gambar_opsi || null,
                is_benar: Boolean(op.is_benar),
                nomor_urut: j + 1,
              },
            });
          }
        }
      }
    });

    revalidatePath("/guru/tugas");
    revalidatePath(`/guru/tugas/${tugasId}`);
    revalidatePath("/siswa/tugas");
    revalidatePath(`/siswa/tugas/${tugasId}`);

    return { success: true, message: "Tugas interaktif berhasil diperbarui!" };
  } catch (err: any) {
    console.error("Gagal mengupdate tugas:", err);
    return { success: false, error: err.message || "Gagal memperbarui tugas." };
  }
}

/**
 * Hapus Tugas
 */
export async function deleteTugasAction(tugasId: string) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Akses ditolak." };
  }

  if (!tugasId || !/^\d+$/.test(tugasId)) {
    return { success: false, error: "ID tugas tidak valid." };
  }

  try {
    await prisma.tugas.delete({
      where: { id: BigInt(tugasId) },
    });
    revalidatePath("/guru/tugas");
    revalidatePath("/siswa/tugas");
    revalidatePath("/siswa");
    return { success: true, message: "Tugas berhasil dihapus." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghapus tugas." };
  }
}

/**
 * Memulai sesi pengerjaan tugas interaktif oleh Siswa (Lobby -> Kerjakan)
 */
export async function startTaskSessionAction(tugasId: string) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    return { success: false, error: "Hanya siswa yang dapat mengerjakan tugas." };
  }

  if (!tugasId || !/^\d+$/.test(tugasId)) {
    return { success: false, error: "ID tugas tidak valid." };
  }

  const tId = BigInt(tugasId);
  const studentId = BigInt(session.id);

  try {
    const tugas = await prisma.tugas.findUnique({
      where: { id: tId },
      include: { soal: { select: { id: true } } },
    });

    if (!tugas) {
      return { success: false, error: "Tugas tidak ditemukan." };
    }

    // Cek tenggat waktu
    if (new Date() > new Date(tugas.deadline)) {
      return { success: false, error: "Tenggat waktu pengerjaan tugas ini telah berakhir." };
    }

    // Cari submission yang ada
    let submission = await prisma.tugasSubmission.findUnique({
      where: {
        tugas_id_siswa_id: {
          tugas_id: tId,
          siswa_id: studentId,
        },
      },
    });

    if (!submission) {
      // Buat submission baru berstatus sedang_mengerjakan
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
      });
    }

    return {
      success: true,
      data: {
        submissionId: submission.id.toString(),
        status: submission.status,
        mulaiMengerjakanAt: submission.mulai_mengerjakan_at?.toISOString() || null,
      },
    };
  } catch (err: any) {
    console.error("Gagal memulai sesi tugas:", err);
    return { success: false, error: err.message || "Gagal memulai pengerjaan." };
  }
}

/**
 * Autosave Real-Time: Simpan draft jawaban per butir soal
 */
export async function saveAnswerDraftAction({
  submissionId,
  soalId,
  jawaban,
  isRagu = false,
}: {
  submissionId: string;
  soalId: string;
  jawaban: string;
  isRagu?: boolean;
}) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const subId = BigInt(submissionId);
    const sId = BigInt(soalId);

    // Pastikan submission milik siswa yang bersangkutan
    const sub = await prisma.tugasSubmission.findUnique({
      where: { id: subId },
      select: { siswa_id: true, status: true },
    });

    if (!sub || sub.siswa_id.toString() !== session.id) {
      return { success: false, error: "Akses pengerjaan tidak valid." };
    }

    if (sub.status === "sudah_dinilai" || sub.status === "selesai") {
      return { success: false, error: "Tugas ini sudah selesai dikumpulkan." };
    }

    await prisma.tugasJawabanSiswa.upsert({
      where: {
        submission_id_soal_id: {
          submission_id: subId,
          soal_id: sId,
        },
      },
      create: {
        submission_id: subId,
        soal_id: sId,
        jawaban_siswa: jawaban,
        is_ragu: isRagu,
      },
      update: {
        jawaban_siswa: jawaban,
        is_ragu: isRagu,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Gagal menyimpan draft jawaban:", err);
    return { success: false, error: "Gagal menyimpan jawaban." };
  }
}

/**
 * Submit Akhir Tugas Interaktif: Auto-Grading instan untuk PG, kalkulasi total nilai
 */
export async function submitInteractiveTaskAction({
  submissionId,
}: {
  submissionId: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const subId = BigInt(submissionId);
    const submission = await prisma.tugasSubmission.findUnique({
      where: { id: subId },
      include: {
        tugas: {
          include: {
            soal: {
              include: { opsi: true },
              orderBy: { nomor_urut: "asc" },
            },
          },
        },
        jawaban: true,
      },
    });

    if (!submission) {
      return { success: false, error: "Data pengerjaan tidak ditemukan." };
    }

    if (submission.siswa_id.toString() !== session.id) {
      return { success: false, error: "Akses ditolak." };
    }

    const { tugas, jawaban } = submission;
    const jawabanMap = new Map(jawaban.map((j) => [j.soal_id.toString(), j]));

    let totalBenar = 0;
    let totalSalah = 0;
    let poinDiperolehOtomatis = 0;
    let totalBobotSoal = 0;
    let hasEssay = false;

    // Lakukan evaluasi per butir soal
    for (const soal of tugas.soal) {
      const sId = soal.id.toString();
      const studentAns = jawabanMap.get(sId);
      const chosen = studentAns?.jawaban_siswa?.trim() || "";
      totalBobotSoal += soal.bobot_poin;

      if (soal.tipe_soal === "PILIHAN_GANDA" || soal.tipe_soal === "PILIHAN_GAMBAR") {
        const correctOpsi = soal.opsi.find((o) => o.is_benar);
        const correctLabel = correctOpsi?.label?.trim().toUpperCase() || soal.kunci_jawaban?.trim().toUpperCase();
        const correctId = correctOpsi?.id?.toString();

        // Cari opsi yang dipilih siswa (bisa berupa ID opsi atau label A/B/C/D)
        const matchedOpsi = soal.opsi.find(
          (o) => o.id.toString() === chosen || (o.label && o.label.toUpperCase() === chosen.toUpperCase())
        );
        const isBenar = matchedOpsi
          ? Boolean(matchedOpsi.is_benar)
          : Boolean(
              (correctLabel && chosen.toUpperCase() === correctLabel) ||
              (correctId && chosen === correctId)
            );

        if (isBenar) {
          totalBenar++;
          poinDiperolehOtomatis += soal.bobot_poin;
        } else {
          totalSalah++;
        }

        // Simpan evaluasi ke record jawaban
        await prisma.tugasJawabanSiswa.upsert({
          where: {
            submission_id_soal_id: {
              submission_id: subId,
              soal_id: soal.id,
            },
          },
          create: {
            submission_id: subId,
            soal_id: soal.id,
            jawaban_siswa: chosen,
            is_benar: isBenar,
            poin_didapat: isBenar ? soal.bobot_poin : 0,
          },
          update: {
            is_benar: isBenar,
            poin_didapat: isBenar ? soal.bobot_poin : 0,
          },
        });
      } else if (soal.tipe_soal === "ISIAN_SINGKAT") {
        const key = (soal.kunci_jawaban || "").trim().toLowerCase();
        const ans = chosen.toLowerCase();
        const isBenar = key.length > 0 && ans === key;

        if (isBenar) {
          totalBenar++;
          poinDiperolehOtomatis += soal.bobot_poin;
        } else {
          totalSalah++;
        }

        await prisma.tugasJawabanSiswa.upsert({
          where: {
            submission_id_soal_id: {
              submission_id: subId,
              soal_id: soal.id,
            },
          },
          create: {
            submission_id: subId,
            soal_id: soal.id,
            jawaban_siswa: chosen,
            is_benar: isBenar,
            poin_didapat: isBenar ? soal.bobot_poin : 0,
          },
          update: {
            is_benar: isBenar,
            poin_didapat: isBenar ? soal.bobot_poin : 0,
          },
        });
      } else if (soal.tipe_soal === "ESAI") {
        hasEssay = true;
        await prisma.tugasJawabanSiswa.upsert({
          where: {
            submission_id_soal_id: {
              submission_id: subId,
              soal_id: soal.id,
            },
          },
          create: {
            submission_id: subId,
            soal_id: soal.id,
            jawaban_siswa: chosen,
            is_benar: null,
            poin_didapat: 0,
          },
          update: {
            is_benar: null,
          },
        });
      }
    }

    // Hitung persentase nilai (skala 0 - poin_maksimal atau 100)
    const basePoinMaksimal = tugas.poin_maksimal || 100;
    const rasioNilai = totalBobotSoal > 0 ? poinDiperolehOtomatis / totalBobotSoal : 0;
    const nilaiFinal = Math.round(rasioNilai * basePoinMaksimal * 10) / 10;

    const now = new Date();
    const mulai = submission.mulai_mengerjakan_at ? new Date(submission.mulai_mengerjakan_at) : now;
    const durasiDetik = Math.max(1, Math.round((now.getTime() - mulai.getTime()) / 1000));

    // Status: Jika ada soal esai, status menjadi menunggu_penilaian; jika objektif semua, langsung sudah_dinilai
    const finalStatus = hasEssay ? "menunggu_penilaian" : "sudah_dinilai";

    await prisma.tugasSubmission.update({
      where: { id: subId },
      data: {
        selesai_mengerjakan_at: now,
        durasi_detik: durasiDetik,
        total_soal: tugas.soal.length,
        total_benar: totalBenar,
        total_salah: totalSalah,
        nilai_otomatis: nilaiFinal,
        nilai: nilaiFinal,
        status: finalStatus,
        submitted_at: now,
      },
    });

    revalidatePath("/siswa/tugas");
    revalidatePath(`/siswa/tugas/${tugas.id}`);
    revalidatePath(`/guru/tugas/${tugas.id}`);

    return {
      success: true,
      message: "Alhamdulillah, tugas berhasil diselesaikan! 🚀",
      data: {
        submissionId: subId.toString(),
        tugasId: tugas.id.toString(),
        nilai: nilaiFinal,
        status: finalStatus,
        totalBenar,
        totalSalah,
      },
    };
  } catch (err: any) {
    console.error("Gagal submit tugas interaktif:", err);
    return { success: false, error: err.message || "Gagal mengumpulkan tugas." };
  }
}

/**
 * Guru memberi nilai manual untuk butir soal Esai
 */
export async function gradeInteractiveEssayAction({
  submissionId,
  soalId,
  poinDidapat,
  catatanKoreksi = "",
}: {
  submissionId: string;
  soalId: string;
  poinDidapat: number;
  catatanKoreksi?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak menilai." };
  }

  try {
    const subId = BigInt(submissionId);
    const sId = BigInt(soalId);

    const soal = await prisma.tugasSoal.findUnique({
      where: { id: sId },
      select: { bobot_poin: true, tugas_id: true },
    });

    if (!soal) {
      return { success: false, error: "Butir soal tidak ditemukan." };
    }

    const poin = Math.max(0, Math.min(soal.bobot_poin, Number(poinDidapat)));

    await prisma.tugasJawabanSiswa.update({
      where: {
        submission_id_soal_id: {
          submission_id: subId,
          soal_id: sId,
        },
      },
      data: {
        poin_didapat: poin,
        is_benar: poin > 0,
        catatan_koreksi: catatanKoreksi,
      },
    });

    // Hitung ulang akumulasi nilai di TugasSubmission
    const allJawaban = await prisma.tugasJawabanSiswa.findMany({
      where: { submission_id: subId },
      include: { soal: true },
    });

    const tugas = await prisma.tugas.findUnique({
      where: { id: soal.tugas_id },
      include: { soal: true },
    });

    const totalBobot = tugas?.soal.reduce((acc, s) => acc + s.bobot_poin, 0) || 100;
    const totalPoinDidapat = allJawaban.reduce((acc, j) => acc + (j.poin_didapat || 0), 0);
    const maxPoin = tugas?.poin_maksimal || 100;
    const finalScore = Math.round((totalPoinDidapat / totalBobot) * maxPoin * 10) / 10;

    await prisma.tugasSubmission.update({
      where: { id: subId },
      data: {
        nilai: finalScore,
        nilai_manual: totalPoinDidapat,
        status: "sudah_dinilai",
        graded_at: new Date(),
        graded_by: BigInt(session.id),
      },
    });

    revalidatePath(`/guru/tugas/${soal.tugas_id}`);
    revalidatePath(`/siswa/tugas/${soal.tugas_id}`);

    return { success: true, message: "Nilai soal esai berhasil disimpan!", nilaiFinal: finalScore };
  } catch (err: any) {
    console.error("Gagal memberi nilai esai:", err);
    return { success: false, error: err.message || "Gagal menyimpan nilai esai." };
  }
}

/**
 * Unified: Guru memberi nilai/catatan ATAU meminta revisi pada submission siswa
 */
export async function updateSubmissionAction({
  submissionId,
  catatan,
  nilaiOverride,
  requestRevision = false,
}: {
  submissionId: string;
  catatan: string;
  nilaiOverride?: number | null;
  requestRevision?: boolean;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Akses ditolak." };
  }

  if (requestRevision && !catatan?.trim()) {
    return { success: false, error: "Sertakan catatan revisi untuk siswa." };
  }

  try {
    const subId = BigInt(submissionId);
    const existing = await prisma.tugasSubmission.findUnique({
      where: { id: subId },
      include: { tugas: true },
    });
    if (!existing) return { success: false, error: "Submission tidak ditemukan." };

    const data: any = {
      catatan_guru: catatan.trim(),
      graded_at: new Date(),
      graded_by: BigInt(session.id),
      status: requestRevision ? "perlu_revisi" : "sudah_dinilai",
    };

    if (!requestRevision && typeof nilaiOverride === "number" && !isNaN(nilaiOverride)) {
      data.nilai = Math.max(0, Math.min(existing.tugas.poin_maksimal, nilaiOverride));
    }

    const updated = await prisma.tugasSubmission.update({ where: { id: subId }, data });

    revalidatePath(`/guru/tugas/${existing.tugas_id}`);
    revalidatePath(`/siswa/tugas/${existing.tugas_id}`);
    revalidatePath("/siswa/tugas");

    return {
      success: true,
      message: requestRevision ? "Permintaan revisi terkirim!" : "Nilai & catatan tersimpan!",
      data: { nilai: updated.nilai, status: updated.status },
    };
  } catch (err: any) {
    console.error("Gagal memperbarui submission:", err);
    return { success: false, error: err.message || "Gagal memperbarui." };
  }
}

/** @deprecated Gunakan updateSubmissionAction. Wrapper backward-compat. */
export async function updateTaskSubmissionNoteAction(args: { submissionId: string; catatanGuru: string; nilaiOverride?: number | null }) {
  return updateSubmissionAction({ submissionId: args.submissionId, catatan: args.catatanGuru, nilaiOverride: args.nilaiOverride });
}

/** @deprecated Gunakan updateSubmissionAction({ requestRevision: true }). */
export async function requestTaskRevisionAction(args: { submissionId: string; catatanRevisi: string }) {
  return updateSubmissionAction({ submissionId: args.submissionId, catatan: args.catatanRevisi, requestRevision: true });
}

