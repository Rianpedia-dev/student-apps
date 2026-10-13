import sharp from "sharp";

export type ImageCategory =
  | "avatar"
  | "attachment"
  | "achievement"
  | "best_student"
  | "material"
  | "task_media"
  | "chat"
  | "general";

export interface OptimizeImageOptions {
  category?: ImageCategory;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  effort?: number;
}

export interface OptimizedImageResult {
  success: true;
  buffer: Buffer;
  format: "webp";
  width: number;
  height: number;
  size: number;
  originalFormat: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  isAlreadyOptimized?: boolean;
}

export interface OptimizeImageError {
  success: false;
  error: string;
}

export type OptimizeImageResponse = OptimizedImageResult | OptimizeImageError;

// Dimensi maksimum per kategori
const CATEGORY_CONFIG: Record<
  ImageCategory,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  avatar: { maxWidth: 800, maxHeight: 800, quality: 80 },
  achievement: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  attachment: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  best_student: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  material: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  task_media: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  chat: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  general: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
};

// Format gambar yang diizinkan untuk dioptimasi
const SUPPORTED_INPUT_FORMATS = new Set([
  "jpeg",
  "jpg",
  "png",
  "webp",
  "gif",
  "avif",
  "tiff",
  "svg",
  "heif",
]);

// Ekstensi umum yang mengindikasikan file gambar
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".bmp",
  ".tiff",
  ".tif",
  ".svg",
  ".heic",
  ".heif",
]);

/**
 * Cek cepat apakah nama file atau ekstensi mengindikasikan gambar
 */
export function isImageFileName(filename?: string | null): boolean {
  if (!filename) return false;
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filename.substring(dotIndex).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Cek cepat apakah MIME type mengindikasikan gambar
 */
export function isImageMimeType(mime?: string | null): boolean {
  if (!mime) return false;
  const cleanMime = mime.toLowerCase();
  return cleanMime.startsWith("image/") && !cleanMime.includes("svg");
}

/**
 * Optimasi buffer gambar menggunakan Sharp:
 * 1. Validasi format aktual dan integritas gambar melalui Sharp metadata.
 * 2. Cek batas dimensi/piksel untuk mencegah memory bomb.
 * 3. Rotasi otomatis berdasarkan EXIF orientasi kamera.
 * 4. Resize proporsional (fit inside) tanpa memperbesar gambar kecil (withoutEnlargement).
 * 5. Pertahankan transparansi saluran alpha.
 * 6. Kompresi dan konversi ke WebP (kualitas 80).
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResponse> {
  if (!inputBuffer || inputBuffer.length === 0) {
    return { success: false, error: "Berkas gambar kosong atau tidak ditemukan." };
  }

  const category = options.category || "general";
  const preset = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;

  const maxWidth = options.maxWidth ?? preset.maxWidth;
  const maxHeight = options.maxHeight ?? preset.maxHeight;
  const quality = options.quality ?? preset.quality;
  const effort = options.effort ?? 4; // Keseimbangan kecepatan dan efisiensi kompresi

  try {
    // Inisialisasi Sharp dengan batas piksel aman (~25 MegaPiksel) untuk proteksi DoS
    const imagePipeline = sharp(inputBuffer, {
      failOn: "error",
      limitInputPixels: 25_000_000,
    });

    const metadata = await imagePipeline.metadata();

    // Validasi format aktual dari file
    if (!metadata.format || !SUPPORTED_INPUT_FORMATS.has(metadata.format.toLowerCase())) {
      return {
        success: false,
        error: "Format berkas tidak didukung. Harap unggah gambar JPG, PNG, atau WebP yang valid.",
      };
    }

    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    if (origWidth === 0 || origHeight === 0) {
      return {
        success: false,
        error: "Berkas gambar rusak atau tidak memiliki dimensi yang valid.",
      };
    }

    // Proteksi batas dimensi ekstrem
    if (origWidth > 8000 || origHeight > 8000) {
      return {
        success: false,
        error: "Dimensi gambar terlalu besar (maksimal 8000x8000 piksel).",
      };
    }

    // Hindari re-encoding ganda jika gambar SUDAH WebP, dimensi sudah sesuai, dan ukuran relatif kecil (< 300KB)
    if (
      metadata.format === "webp" &&
      origWidth <= maxWidth &&
      origHeight <= maxHeight &&
      inputBuffer.length < 300 * 1024
    ) {
      return {
        success: true,
        buffer: inputBuffer,
        format: "webp",
        width: origWidth,
        height: origHeight,
        size: inputBuffer.length,
        originalFormat: metadata.format,
        originalSize: inputBuffer.length,
        originalWidth: origWidth,
        originalHeight: origHeight,
        isAlreadyOptimized: true,
      };
    }

    // Pipeline pemrosesan Sharp
    // 1. .rotate(): Otomatis sesuaikan orientasi berdasarkan metadata EXIF
    // 2. .resize(): Proporsional fit inside, tanpa memperbesar gambar kecil
    // 3. .webp(): Konversi ke WebP kualitas 80, pertahankan transparansi alpha
    const processedBuffer = await sharp(inputBuffer, {
      failOn: "error",
      limitInputPixels: 25_000_000,
    })
      .rotate()
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort,
        alphaQuality: 85,
      })
      .toBuffer();

    // Dapatkan metadata hasil pemrosesan
    const outputMetadata = await sharp(processedBuffer).metadata();

    return {
      success: true,
      buffer: processedBuffer,
      format: "webp",
      width: outputMetadata.width || origWidth,
      height: outputMetadata.height || origHeight,
      size: processedBuffer.length,
      originalFormat: metadata.format,
      originalSize: inputBuffer.length,
      originalWidth: origWidth,
      originalHeight: origHeight,
    };
  } catch (error: any) {
    // Tangani file corrupt atau palsu (misal text file di-rename ke .jpg)
    console.error("Gagal memproses gambar dengan Sharp:", error?.message || error);
    return {
      success: false,
      error: "Berkas gambar tidak valid atau rusak.",
    };
  }
}
