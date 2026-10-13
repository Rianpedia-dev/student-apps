import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  optimizeImage,
  isImageFileName,
  isImageMimeType,
  ImageCategory,
} from "./image-optimizer";

export type UploadCategory =
  | "avatar"
  | "attachment"
  | "achievement"
  | "best_student"
  | "material";

interface UploadOptions {
  category: UploadCategory;
}

export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}

/**
 * Validasi dan simpan file yang diupload ke storage publik dengan optimasi Sharp otomatis:
 * - Foto Profil (Guru/Siswa): Otomatis optimasi WebP, max 800x800 -> /uploads/images/
 * - Foto Prestasi & Best Student: Otomatis optimasi WebP, max 1600x1600 -> /uploads/images/
 * - Lampiran Pengumuman: Gambar otomatis optimasi WebP (max 1600px), PDF disimpan asli -> /uploads/files/
 * - Materi Pelajaran: Gambar otomatis optimasi WebP (max 1600px), berkas dokumen/video disimpan asli -> /uploads/materials/
 */
export async function saveUploadedFile(
  file: File | Blob | null | undefined,
  options: UploadOptions
): Promise<UploadResult> {
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return { success: false, error: "File tidak ditemukan atau kosong." };
  }

  const { category } = options;

  // Ekstensi dari file jika ada
  let originalExt = "";
  let originalName = "";
  if ("name" in file && typeof file.name === "string") {
    originalName = file.name;
    if (file.name.includes(".")) {
      originalExt = path.extname(file.name).toLowerCase();
    }
  }

  const docExtensions = [
    ".pdf",
    ".ppt",
    ".pptx",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
    ".mp4",
    ".webm",
  ];

  // Tentukan batas ukuran dan sub-direktori tujuan
  let maxBytes = 10 * 1024 * 1024; // Default 10MB
  let subDir = "images";

  if (category === "avatar") {
    maxBytes = 10 * 1024 * 1024;
    subDir = "images";
  } else if (category === "attachment") {
    maxBytes = 10 * 1024 * 1024;
    subDir = "files";
  } else if (category === "achievement" || category === "best_student") {
    maxBytes = 10 * 1024 * 1024;
    subDir = "images";
  } else if (category === "material") {
    maxBytes = 35 * 1024 * 1024; // 35MB untuk modul PPT / PDF / Video
    subDir = "materials";
  }

  // 1. Validasi batas ukuran file asli
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      success: false,
      error: `Ukuran file melebihi batas maksimum ${maxMb}MB.`,
    };
  }

  const mimeType = (file.type || "").toLowerCase();
  const isImageCandidate =
    isImageFileName(originalName) ||
    isImageMimeType(mimeType) ||
    category === "avatar" ||
    category === "achievement" ||
    category === "best_student";

  const isPdf = mimeType === "application/pdf" || originalExt === ".pdf";
  const isDocExt = docExtensions.includes(originalExt);

  // 2. Validasi kelayakan format berdasarkan kategori
  if (category === "attachment") {
    if (!isPdf && !isImageCandidate) {
      return {
        success: false,
        error: "Format file tidak diizinkan. Harap upload dokumen PDF atau file gambar (JPG, PNG, WebP, dll).",
      };
    }
  } else if (category === "material") {
    const isAllowedMaterial =
      isImageCandidate ||
      isDocExt ||
      isPdf ||
      mimeType.includes("presentation") ||
      mimeType.includes("wordprocessingml") ||
      mimeType.includes("spreadsheet") ||
      mimeType.startsWith("video/");

    if (!isAllowedMaterial) {
      return {
        success: false,
        error: "Format file tidak didukung. Harap unggah berkas PDF, PowerPoint (PPT/PPTX), Word (DOC/DOCX), Excel, Gambar, atau Video (MP4).",
      };
    }
  } else {
    // Kategori khusus gambar (avatar, achievement, best_student)
    if (!isImageCandidate && !mimeType.startsWith("image/")) {
      return {
        success: false,
        error: "Format file tidak diizinkan. Harap upload file gambar (PNG, JPG, WebP, dll).",
      };
    }
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const randomHex = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const targetDir = path.join(process.cwd(), "public", "uploads", subDir);
    await mkdir(targetDir, { recursive: true });

    // 3. JIKA BERUPA GAMBAR: Optimasi otomatis menggunakan Sharp
    if (isImageCandidate && !isPdf && (!isDocExt || originalExt === ".png" || originalExt === ".jpg" || originalExt === ".jpeg")) {
      const optRes = await optimizeImage(buffer, {
        category: category as ImageCategory,
      });

      if (!optRes.success) {
        return {
          success: false,
          error: optRes.error || "Gagal memproses dan memvalidasi berkas gambar.",
        };
      }

      const fileName = `${category}-${timestamp}-${randomHex}.webp`;
      const fullFilePath = path.join(targetDir, fileName);
      await writeFile(fullFilePath, optRes.buffer);

      const publicUrl = `/uploads/${subDir}/${fileName}`;
      return {
        success: true,
        filePath: publicUrl,
        fileName,
        fileSize: optRes.size,
        fileType: "webp",
      };
    }

    // 4. JIKA BUKAN GAMBAR (Dokumen PDF / PPT / DOCX / Video): Simpan berkas asli dengan nama aman
    let ext = originalExt;
    if (!ext) {
      if (isPdf) ext = ".pdf";
      else if (mimeType.includes("presentation")) ext = ".pptx";
      else if (mimeType.includes("wordprocessingml")) ext = ".docx";
      else if (mimeType.includes("spreadsheet")) ext = ".xlsx";
      else if (mimeType.startsWith("video/")) ext = ".mp4";
      else ext = ".bin";
    }

    const fileName = `${category}-${timestamp}-${randomHex}${ext}`;
    const fullFilePath = path.join(targetDir, fileName);
    await writeFile(fullFilePath, buffer);

    const publicUrl = `/uploads/${subDir}/${fileName}`;
    return {
      success: true,
      filePath: publicUrl,
      fileName: originalName || fileName,
      fileSize: buffer.length,
      fileType: ext.replace(".", "").toLowerCase(),
    };
  } catch (error) {
    console.error("Gagal menyimpan file yang diupload:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat memproses dan menyimpan berkas.",
    };
  }
}
