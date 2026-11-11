import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  optimizeImage,
  isImageFileName,
  isImageMimeType,
  ImageCategory,
} from "./image-optimizer";
import {
  getDefaultMaxFileSizeBytes,
  getUploadRootDir,
  hasValidMagicBytes,
} from "./storage";

export type UploadCategory =
  | "avatar"
  | "attachment"
  | "achievement"
  | "best_student"
  | "material"
  | "task_worksheet"
  | "task_submission"
  | "task_media"
  | "chat";

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

interface CategoryPolicy {
  subDir: string;
  getMaxBytes: () => number;
  imageCategory: ImageCategory;
  allowImages: boolean;
  allowedDocExtensions: readonly string[];
  formatErrorMessage: string;
}

const SAFE_CHAT_DOC_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
] as const;

const MATERIAL_DOC_EXTENSIONS = [
  ...SAFE_CHAT_DOC_EXTENSIONS,
  ".mp4",
  ".webm",
] as const;

const MIME_TO_DOC_EXTENSION: Array<[string, string]> = [
  ["application/pdf", ".pdf"],
  ["application/vnd.openxmlformats-officedocument.presentationml", ".pptx"],
  ["application/vnd.ms-powerpoint", ".ppt"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml", ".docx"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml", ".xlsx"],
  ["application/vnd.ms-excel", ".xls"],
  ["text/plain", ".txt"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
];

const CATEGORY_POLICIES: Record<UploadCategory, CategoryPolicy> = {
  avatar: {
    subDir: "images",
    getMaxBytes: getDefaultMaxFileSizeBytes,
    imageCategory: "avatar",
    allowImages: true,
    allowedDocExtensions: [],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload file gambar (PNG, JPG, WebP, dll).",
  },
  achievement: {
    subDir: "images",
    getMaxBytes: getDefaultMaxFileSizeBytes,
    imageCategory: "achievement",
    allowImages: true,
    allowedDocExtensions: [],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload file gambar (PNG, JPG, WebP, dll).",
  },
  best_student: {
    subDir: "images",
    getMaxBytes: getDefaultMaxFileSizeBytes,
    imageCategory: "best_student",
    allowImages: true,
    allowedDocExtensions: [],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload file gambar (PNG, JPG, WebP, dll).",
  },
  attachment: {
    subDir: "files",
    getMaxBytes: getDefaultMaxFileSizeBytes,
    imageCategory: "attachment",
    allowImages: true,
    allowedDocExtensions: [".pdf"],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload dokumen PDF atau file gambar (JPG, PNG, WebP).",
  },
  material: {
    subDir: "materials",
    getMaxBytes: () => 35 * 1024 * 1024, // 35MB untuk modul PPT / PDF / Video
    imageCategory: "material",
    allowImages: true,
    allowedDocExtensions: MATERIAL_DOC_EXTENSIONS,
    formatErrorMessage:
      "Format file tidak didukung. Harap unggah berkas PDF, PowerPoint (PPT/PPTX), Word (DOC/DOCX), Excel, Gambar, atau Video (MP4/WebM).",
  },
  task_worksheet: {
    subDir: "tugas",
    getMaxBytes: () => 25 * 1024 * 1024, // 25MB untuk lembar soal PDF/Image
    imageCategory: "task_media",
    allowImages: true,
    allowedDocExtensions: [".pdf"],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload dokumen PDF atau file gambar (JPG, PNG, WebP).",
  },
  task_submission: {
    subDir: "tugas",
    getMaxBytes: () => 25 * 1024 * 1024, // 25MB untuk pengerjaan tugas PDF/Image
    imageCategory: "task_media",
    allowImages: true,
    allowedDocExtensions: [".pdf"],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload dokumen PDF atau file gambar (JPG, PNG, WebP).",
  },
  task_media: {
    subDir: path.join("tugas", "media"),
    getMaxBytes: getDefaultMaxFileSizeBytes,
    imageCategory: "task_media",
    allowImages: true,
    allowedDocExtensions: [],
    formatErrorMessage: "Format file tidak diizinkan. Harap upload file gambar (PNG, JPG, WebP).",
  },
  chat: {
    subDir: "chat",
    getMaxBytes: getDefaultMaxFileSizeBytes,
    imageCategory: "chat",
    allowImages: true,
    allowedDocExtensions: SAFE_CHAT_DOC_EXTENSIONS,
    formatErrorMessage:
      "Format lampiran chat tidak didukung. Gunakan Gambar (JPG/PNG/WebP) atau dokumen (PDF/Word/Excel/PPT/TXT).",
  },
};

function inferDocExtension(originalExt: string, mimeType: string): string {
  if (originalExt) return originalExt;
  for (const [mimePrefix, ext] of MIME_TO_DOC_EXTENSION) {
    if (mimeType.startsWith(mimePrefix) || mimeType.includes(mimePrefix)) {
      return ext;
    }
  }
  return "";
}

function toPublicSubDirUrl(subDir: string, fileName: string): string {
  const posixSubDir = subDir.replace(/\\/g, "/");
  return `/uploads/${posixSubDir}/${fileName}`;
}

/**
 * Validasi dan simpan file yang diupload ke storage dengan optimasi Sharp otomatis & validasi magic bytes:
 * - Foto Profil (Guru/Siswa): WebP max 800x800 -> /uploads/images/
 * - Foto Prestasi & Best Student: WebP max 1600x1600 -> /uploads/images/
 * - Lampiran Pengumuman: Gambar WebP (max 1600px), PDF tervalidasi -> /uploads/files/
 * - Materi Pelajaran: Gambar WebP (max 1600px), dokumen/video tervalidasi -> /uploads/materials/
 * - Lembar Soal & Pengerjaan Tugas: PDF tervalidasi, Gambar WebP (max 1600px) -> /uploads/tugas/
 * - Media Soal Interaktif: Gambar WebP -> /uploads/tugas/media/
 * - Lampiran Chat: Gambar WebP atau dokumen aman tervalidasi -> /uploads/chat/
 */
export async function saveUploadedFile(
  file: File | Blob | null | undefined,
  options: UploadOptions
): Promise<UploadResult> {
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return { success: false, error: "File tidak ditemukan atau kosong." };
  }

  const { category } = options;
  const policy = CATEGORY_POLICIES[category];
  if (!policy) {
    return { success: false, error: "Kategori upload tidak valid." };
  }

  let originalExt = "";
  let originalName = "";
  if ("name" in file && typeof file.name === "string") {
    originalName = file.name;
    if (file.name.includes(".")) {
      originalExt = path.extname(file.name).toLowerCase();
    }
  }

  const maxBytes = policy.getMaxBytes();

  // 1. Validasi batas ukuran file asli
  if (file.size > maxBytes) {
    const maxMb = Math.max(1, Math.round(maxBytes / (1024 * 1024)));
    return {
      success: false,
      error: `Ukuran file melebihi batas maksimum ${maxMb}MB.`,
    };
  }

  const mimeType = (file.type || "").toLowerCase();

  // Tolak SVG secara eksplisit untuk menghindari vektor script/SSRF
  if (originalExt === ".svg" || mimeType.includes("svg")) {
    return {
      success: false,
      error: "Format SVG tidak diizinkan demi keamanan. Gunakan format PNG, JPG, atau WebP.",
    };
  }

  const resolvedDocExt = inferDocExtension(originalExt, mimeType);
  const isAllowedDoc =
    Boolean(resolvedDocExt) && policy.allowedDocExtensions.includes(resolvedDocExt);

  const isExplicitImageExt = isImageFileName(originalName);
  const isImageOnlyCategory = policy.allowedDocExtensions.length === 0;
  const isImageCandidate =
    policy.allowImages &&
    !isAllowedDoc &&
    (isExplicitImageExt || isImageMimeType(mimeType) || isImageOnlyCategory);

  // 2. Validasi kelayakan format berdasarkan kategori
  if (!isAllowedDoc && !isImageCandidate) {
    return {
      success: false,
      error: policy.formatErrorMessage,
    };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0 || buffer.length > maxBytes) {
      return { success: false, error: "Ukuran atau isi berkas tidak valid." };
    }

    const randomHex = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const targetDir = path.join(getUploadRootDir(), policy.subDir);
    await mkdir(targetDir, { recursive: true });

    // 3. JIKA BERUPA GAMBAR: Validasi & optimasi otomatis menggunakan Sharp
    if (isImageCandidate) {
      const optRes = await optimizeImage(buffer, {
        category: policy.imageCategory,
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

      return {
        success: true,
        filePath: toPublicSubDirUrl(policy.subDir, fileName),
        fileName,
        fileSize: optRes.size,
        fileType: "webp",
      };
    }

    // 4. JIKA DOKUMEN / VIDEO NON-GAMBAR: Wajib lolos validasi magic bytes
    if (!hasValidMagicBytes(buffer, resolvedDocExt)) {
      return {
        success: false,
        error: `Isi berkas tidak cocok dengan format ${resolvedDocExt} yang valid atau berkas rusak.`,
      };
    }

    const fileName = `${category}-${timestamp}-${randomHex}${resolvedDocExt}`;
    const fullFilePath = path.join(targetDir, fileName);
    await writeFile(fullFilePath, buffer);

    return {
      success: true,
      filePath: toPublicSubDirUrl(policy.subDir, fileName),
      fileName: originalName || fileName,
      fileSize: buffer.length,
      fileType: resolvedDocExt.replace(".", "").toLowerCase(),
    };
  } catch (error) {
    console.error("Gagal menyimpan file yang diupload:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat memproses dan menyimpan berkas.",
    };
  }
}

/**
 * Memvalidasi, mengoptimasi (Sharp -> WebP), dan menyimpan gambar Data URL Base64
 * dari editor kanvas tugas siswa maupun lembar koreksi guru.
 */
export async function saveBase64Image(
  dataUrl: string | null | undefined,
  options: { category?: "task_submission" | "task_worksheet" | "task_media"; prefix?: string } = {}
): Promise<UploadResult> {
  if (!dataUrl || typeof dataUrl !== "string") {
    return { success: false, error: "Data gambar kanvas kosong." };
  }

  const matches = dataUrl.trim().match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!matches || matches.length !== 3) {
    return { success: false, error: "Format gambar kanvas base64 tidak didukung." };
  }

  const category = options.category || "task_submission";
  const policy = CATEGORY_POLICIES[category];
  const maxBytes = policy.getMaxBytes();

  const cleanBase64 = matches[2].replace(/\s+/g, "");
  const estimatedBytes = Math.floor((cleanBase64.length * 3) / 4);
  if (estimatedBytes <= 0 || estimatedBytes > maxBytes) {
    const maxMb = Math.max(1, Math.round(maxBytes / (1024 * 1024)));
    return {
      success: false,
      error: `Ukuran gambar kanvas melebihi batas maksimum ${maxMb}MB.`,
    };
  }

  try {
    const rawBuffer = Buffer.from(cleanBase64, "base64");
    if (rawBuffer.length === 0 || rawBuffer.length > maxBytes) {
      return { success: false, error: "Ukuran gambar kanvas tidak valid." };
    }

    const optRes = await optimizeImage(rawBuffer, {
      category: policy.imageCategory,
    });
    if (!optRes.success) {
      return {
        success: false,
        error: optRes.error || "Gambar kanvas tidak valid atau rusak.",
      };
    }

    const prefix = (options.prefix || "canvas").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;
    const targetDir = path.join(getUploadRootDir(), policy.subDir);
    await mkdir(targetDir, { recursive: true });
    await writeFile(path.join(targetDir, fileName), optRes.buffer);

    return {
      success: true,
      filePath: toPublicSubDirUrl(policy.subDir, fileName),
      fileName,
      fileSize: optRes.size,
      fileType: "webp",
    };
  } catch (error) {
    console.error("Gagal memproses gambar kanvas base64:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan gambar kanvas.",
    };
  }
}
