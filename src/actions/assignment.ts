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
    return { success: false, error: "Mohon lengkapi semua kolom bertanda wajib." };
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

  if (!tugasIdStr || !file || file.size === 0) {
    return { success: false, error: "File tugas wajib diunggah." };
  }

  const tugasId = BigInt(tugasIdStr);
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { success: false, error: "Format file harus berupa PDF, PNG, atau JPG." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "Ukuran file tugas maksimal 10MB." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFileName = `tugas-${tugasId}-siswa-${session.id}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeFileName), buffer);

    const fileUrl = `/uploads/tugas/${safeFileName}`;
    const fileType = ext === ".pdf" ? "pdf" : "png";
    const studentId = BigInt(session.id);

    // Cek apakah tenggat terlewati
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
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        catatan_siswa: catatanSiswa,
        status: initialStatus,
        submitted_at: new Date(),
      },
      update: {
        file_url: fileUrl,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        catatan_siswa: catatanSiswa,
        status: initialStatus,
        submitted_at: new Date(),
      },
    });

    revalidatePath("/siswa/tugas");
    revalidatePath(`/siswa/tugas/${tugasIdStr}`);
    revalidatePath(`/guru/tugas/${tugasIdStr}`);
    return { success: true, message: "Alhamdulillah, tugasmu berhasil dikumpulkan! Ustadz/Ustadzah akan segera memeriksa." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengumpulkan tugas." };
  }
}

export async function gradeTugasAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    return { success: false, error: "Hanya guru atau admin yang berhak menilai tugas." };
  }

  const submissionId = BigInt(formData.get("submission_id") as string);
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

    revalidatePath(`/guru/tugas/${updated.tugas_id}`);
    revalidatePath("/siswa/tugas");
    return { success: true, message: "Koreksi dan nilai berhasil disimpan tanpa download!" };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan penilaian." };
  }
}
