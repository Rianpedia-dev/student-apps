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
  
  // Support both multi-file ("files") and single-file ("file")
  const rawFiles = formData.getAll("files") as (File | string)[];
  const singleFile = formData.get("file") as File | null;
  
  const files: File[] = [];
  for (const item of rawFiles) {
    if (item instanceof File && item.size > 0) {
      files.push(item);
    }
  }
  if (files.length === 0 && singleFile instanceof File && singleFile.size > 0) {
    files.push(singleFile);
  }

  // Support keeping previously uploaded attachments if any
  const existingAttachmentsJson = formData.get("existing_attachments") as string | null;

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

  // Parse preserved existing attachments
  let preservedAttachments: Array<{ id: string; url: string; name: string; type: string; size?: number }> = [];
  if (existingAttachmentsJson) {
    try {
      preservedAttachments = JSON.parse(existingAttachmentsJson);
    } catch {
      preservedAttachments = [];
    }
  } else if (existing?.attachments) {
    try {
      preservedAttachments = JSON.parse(existing.attachments);
    } catch {
      preservedAttachments = [];
    }
  } else if (existing?.file_url && existing.file_url !== "text_submission") {
    preservedAttachments = [{
      id: "legacy-1",
      url: existing.file_url,
      name: existing.file_name || "Lembar Tugas",
      type: existing.file_type || "image",
      size: existing.file_size || 0,
    }];
  }

  const hasNewFiles = files.length > 0;
  const hasPreservedFiles = preservedAttachments.length > 0;
  const hasTextAnswer = catatanSiswa.trim().length > 0;

  if (!hasNewFiles && !hasPreservedFiles && !hasTextAnswer) {
    return { success: false, error: "Silakan unggah foto/file lembar tugas atau tulis jawaban Anda." };
  }

  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".doc", ".docx"];
  const newUploadedAttachments: Array<{ id: string; url: string; name: string; type: string; size: number }> = [];

  const uploadDir = path.join(process.cwd(), "public", "uploads", "tugas");
  await mkdir(uploadDir, { recursive: true });

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = path.extname(f.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return { success: false, error: `Format file "${f.name}" tidak didukung. Gunakan PDF atau Foto.` };
    }

    if (f.size > 20 * 1024 * 1024) {
      return { success: false, error: `Ukuran file "${f.name}" melebihi batas 20MB.` };
    }

    try {
      const bytes = await f.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeFileName = `tugas-${tugasId}-siswa-${session.id}-${Date.now()}-${i}${ext}`;
      await writeFile(path.join(uploadDir, safeFileName), buffer);

      const fileType = ext === ".pdf" ? "pdf" : [".doc", ".docx"].includes(ext) ? "doc" : "image";
      newUploadedAttachments.push({
        id: `att-${Date.now()}-${i}`,
        url: `/uploads/tugas/${safeFileName}`,
        name: f.name,
        type: fileType,
        size: f.size,
      });
    } catch (e) {
      console.error("Gagal menyimpan file tugas:", e);
      return { success: false, error: "Gagal menyimpan salah satu file ke server." };
    }
  }

  const allAttachments = [...preservedAttachments, ...newUploadedAttachments];
  const attachmentsJson = allAttachments.length > 0 ? JSON.stringify(allAttachments) : null;

  // Backward compatibility fields
  const primaryAttachment = allAttachments[0];
  const fileUrl = primaryAttachment ? primaryAttachment.url : "text_submission";
  const fileName = primaryAttachment ? primaryAttachment.name : "Jawaban Teks Siswa";
  const fileType = primaryAttachment ? primaryAttachment.type : "text";
  const fileSize = primaryAttachment?.size || 0;

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
        attachments: attachmentsJson,
        catatan_siswa: catatanSiswa,
        status: initialStatus,
        submitted_at: new Date(),
      },
      update: {
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        attachments: attachmentsJson,
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
    return { success: true, message: "Alhamdulillah, tugas berhasil dikumpulkan! 🚀" };
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
  const rawAnnotatedData = (formData.get("annotated_data") as string) || null;

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
        ...(rawAnnotatedData ? { annotated_data: rawAnnotatedData } : {}),
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
    return { success: false, error: err.message || "Gagal menyimpan nilai." };
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
