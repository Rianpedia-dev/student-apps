"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function createTugasAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak membuat tugas." };
  }

  const judul = (formData.get("judul") as string)?.trim();
  const deskripsi = (formData.get("deskripsi") as string)?.trim();
  const kelas_id = BigInt(formData.get("kelas_id") as string);
  const mapel_id = BigInt(formData.get("mapel_id") as string);
  const deadlineStr = formData.get("deadline") as string;
  const poinMaksimal = parseInt(formData.get("poin_maksimal") as string) || 100;
  const filePetunjuk = formData.get("file_petunjuk") as File | null;

  if (!judul || !deskripsi || !kelas_id || !mapel_id || !deadlineStr) {
    return { success: false, error: "Mohon lengkapi semua kolom yang wajib diisi." };
  }

  let petunjukUrl: string | null = null;
  if (filePetunjuk && filePetunjuk.size > 0) {
    try {
      const ext = path.extname(filePetunjuk.name).toLowerCase();
      const safeName = `petunjuk-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas");
      await mkdir(uploadDir, { recursive: true });
      const bytes = await filePetunjuk.arrayBuffer();
      await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));
      petunjukUrl = `/uploads/tugas/${safeName}`;
    } catch (e) {
      console.error("Gagal mengunggah file petunjuk:", e);
    }
  }

  try {
    const tugas = await prisma.tugas.create({
      data: {
        kelas_id,
        mapel_id,
        guru_id: BigInt(session.id),
        judul,
        deskripsi,
        file_petunjuk: petunjukUrl,
        deadline: new Date(deadlineStr),
        poin_maksimal: poinMaksimal,
        status: "aktif",
      },
    });

    revalidatePath("/guru/tugas");
    revalidatePath("/siswa/tugas");
    revalidatePath("/siswa");
    return { success: true, message: "Tugas berhasil dibuat!", data: { id: tugas.id.toString() } };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuat tugas baru." };
  }
}

export async function deleteTugasAction(tugasId: string) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Akses ditolak." };
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

export async function submitTugasAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    return { success: false, error: "Akses ditolak. Hanya siswa yang dapat mengumpulkan tugas." };
  }

  const tugasIdStr = formData.get("tugas_id") as string;
  const catatanSiswa = (formData.get("catatan_siswa") as string) || "";
  const file = formData.get("file") as File | null;

  if (!tugasIdStr) {
    return { success: false, error: "ID Tugas tidak valid." };
  }

  const tugasId = BigInt(tugasIdStr);
  const studentId = BigInt(session.id);

  // Check if student already submitted
  const existing = await prisma.tugasSubmission.findUnique({
    where: {
      tugas_id_siswa_id: {
        tugas_id: tugasId,
        siswa_id: studentId,
      },
    },
  });

  const hasNewFile = file && file.size > 0;
  const hasExistingFile = existing && existing.file_url && existing.file_url !== "text_submission";
  const hasTextAnswer = catatanSiswa.trim().length > 0;

  if (!hasNewFile && !hasExistingFile && !hasTextAnswer) {
    return { success: false, error: "Silakan unggah file tugas (foto/PDF) atau tulis jawaban Anda." };
  }

  let fileUrl = existing?.file_url || "text_submission";
  let fileName = existing?.file_name || "Jawaban Teks Siswa";
  let fileType = existing?.file_type || "text";
  let fileSize = existing?.file_size || 0;

  if (hasNewFile) {
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".doc", ".docx"];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return { success: false, error: "Format file harus berupa PDF, Foto (PNG/JPG/WEBP), atau Dokumen Word." };
    }

    if (file.size > 15 * 1024 * 1024) {
      return { success: false, error: "Ukuran file tugas maksimal 15MB." };
    }

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeFileName = `tugas-${tugasId}-siswa-${session.id}-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, safeFileName), buffer);

      fileUrl = `/uploads/tugas/${safeFileName}`;
      fileType = ext === ".pdf" ? "pdf" : [".doc", ".docx"].includes(ext) ? "doc" : "image";
      fileName = file.name;
      fileSize = file.size;
    } catch (e) {
      console.error("Gagal menyimpan file tugas:", e);
      return { success: false, error: "Gagal menyimpan file ke server." };
    }
  }

  try {
    // Cek tenggat waktu
    const task = await prisma.tugas.findUnique({ where: { id: tugasId } });
    const isLate = task && task.deadline ? new Date() > task.deadline : false;
    const initialStatus = isLate ? "terlambat" : "menunggu_penilaian";

    await prisma.tugasSubmission.upsert({
      where: {
        tugas_id_siswa_id: {
          tugas_id: tugasId,
          siswa_id: studentId,
        },
      },
      create: {
        tugas_id: tugasId,
        siswa_id: studentId,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        catatan_siswa: catatanSiswa,
        status: initialStatus,
        submitted_at: new Date(),
      },
      update: {
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        catatan_siswa: catatanSiswa,
        status: initialStatus,
        submitted_at: new Date(),
      },
    });

    revalidatePath("/siswa");
    revalidatePath("/siswa/tugas");
    revalidatePath(`/siswa/tugas/${tugasIdStr}`);
    revalidatePath(`/guru/tugas/${tugasIdStr}`);
    revalidatePath("/guru/tugas");
    return { success: true, message: "Tugas berhasil dikumpulkan!" };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengumpulkan tugas." };
  }
}

export async function gradeTugasAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak menilai tugas." };
  }

  const submissionIdStr = formData.get("submission_id") as string;
  if (!submissionIdStr) {
    return { success: false, error: "Data tugas tidak ditemukan." };
  }
  const submissionId = BigInt(submissionIdStr);
  const nilaiStr = formData.get("nilai") as string;
  const catatanGuru = (formData.get("catatan_guru") as string) || "";
  const status = (formData.get("status") as string) || "sudah_dinilai";
  const annotatedDataUrl = (formData.get("annotated_file") as string) || null;

  const nilai = parseFloat(nilaiStr);
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    return { success: false, error: "Nilai harus berupa angka antara 0 hingga 100." };
  }

  let annotatedUrl: string | null = null;
  if (annotatedDataUrl && annotatedDataUrl.startsWith("data:image")) {
    try {
      const base64Data = annotatedDataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const safeName = `annotated-${submissionId}-${Date.now()}.png`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, safeName), buffer);
      annotatedUrl = `/uploads/tugas/${safeName}`;
    } catch (e) {
      console.error("Gagal menyimpan anotasi:", e);
    }
  }

  try {
    const updated = await prisma.tugasSubmission.update({
      where: { id: submissionId },
      data: {
        nilai,
        catatan_guru: catatanGuru,
        status,
        ...(annotatedUrl ? { annotated_file_url: annotatedUrl } : {}),
        graded_at: new Date(),
        graded_by: BigInt(session.id),
      },
      include: {
        tugas: true,
      },
    });

    revalidatePath("/guru/tugas");
    revalidatePath(`/guru/tugas/${updated.tugas_id}`);
    revalidatePath(`/guru/tugas/${updated.tugas_id}/review/${submissionIdStr}`);
    revalidatePath("/siswa");
    revalidatePath("/siswa/tugas");
    revalidatePath(`/siswa/tugas/${updated.tugas_id}`);
    return { success: true, message: "Nilai dan koreksi berhasil disimpan!" };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan penilaian." };
  }
}

export async function quickGradeTugasAction({
  submissionId,
  nilai,
  catatanGuru,
  status = "sudah_dinilai",
}: {
  submissionId: string;
  nilai: number;
  catatanGuru?: string;
  status?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak menilai tugas." };
  }

  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    return { success: false, error: "Nilai harus di rentang 0 hingga 100." };
  }

  try {
    const subId = BigInt(submissionId);
    const updated = await prisma.tugasSubmission.update({
      where: { id: subId },
      data: {
        nilai,
        catatan_guru: catatanGuru || "",
        status,
        graded_at: new Date(),
        graded_by: BigInt(session.id),
      },
      include: {
        tugas: true,
      },
    });

    revalidatePath("/guru/tugas");
    revalidatePath(`/guru/tugas/${updated.tugas_id}`);
    revalidatePath(`/guru/tugas/${updated.tugas_id}/review/${submissionId}`);
    revalidatePath("/siswa");
    revalidatePath("/siswa/tugas");
    revalidatePath(`/siswa/tugas/${updated.tugas_id}`);
    return { success: true, message: "Nilai berhasil disimpan!" };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan penilaian." };
  }
}
