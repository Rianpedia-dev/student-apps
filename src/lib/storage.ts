import path from "path";

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ResolvedUploadPath {
  valid: true;
  fullPath: string;
  relativePath: string;
  publicUrl: string;
}

export interface InvalidUploadPath {
  valid: false;
  reason: "empty" | "invalid_encoding" | "outside_uploads";
}

export type ResolveUploadResult = ResolvedUploadPath | InvalidUploadPath;

/**
 * Mengembalikan direktori root penyimpanan upload dari env `UPLOAD_DIR`
 * atau fallback ke `<cwd>/public/uploads`.
 */
export function getUploadRootDir(): string {
  const envDir = process.env.UPLOAD_DIR?.trim();
  if (envDir) {
    return path.isAbsolute(envDir)
      ? path.resolve(envDir)
      : path.resolve(/*turbopackIgnore: true*/ process.cwd(), envDir);
  }
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
}

/**
 * Mengembalikan batas ukuran upload bawaan dari env `MAX_FILE_SIZE` (bytes)
 * atau fallback 10MB.
 */
export function getDefaultMaxFileSizeBytes(): number {
  const raw = process.env.MAX_FILE_SIZE?.trim();
  if (!raw) return DEFAULT_MAX_FILE_SIZE_BYTES;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_MAX_FILE_SIZE_BYTES;
}

/**
 * Memvalidasi dan menyelesaikan URL/path upload menjadi path disk absolut yang aman
 * terhadap directory traversal (`..`), null byte, dan path di luar root upload.
 */
export function resolveUploadFilePath(rawFilePath: string): ResolveUploadResult {
  if (!rawFilePath || typeof rawFilePath !== "string") {
    return { valid: false, reason: "empty" };
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawFilePath).trim();
  } catch {
    return { valid: false, reason: "invalid_encoding" };
  }

  if (!decoded || decoded.includes("\0")) {
    return { valid: false, reason: "outside_uploads" };
  }

  // Normalisasi slash agar konsisten di Linux maupun Windows
  const slashNormalized = decoded.replace(/\\/g, "/");
  const withoutLeadingSlash = slashNormalized.replace(/^\/+/, "");

  // Tolak jika mengandung segmen traversal sebelum/sesudah normalisasi
  if (withoutLeadingSlash.split("/").some((seg) => seg === "..")) {
    return { valid: false, reason: "outside_uploads" };
  }

  if (withoutLeadingSlash !== "uploads" && !withoutLeadingSlash.startsWith("uploads/")) {
    return { valid: false, reason: "outside_uploads" };
  }

  const relativeInsideUploads = withoutLeadingSlash.replace(/^uploads\/?/, "");
  if (!relativeInsideUploads) {
    return { valid: false, reason: "outside_uploads" };
  }

  const rootDir = getUploadRootDir();
  const fullPath = path.resolve(rootDir, relativeInsideUploads);
  const rootPrefix = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;

  if (!fullPath.startsWith(rootPrefix)) {
    return { valid: false, reason: "outside_uploads" };
  }

  const cleanPosixRel = relativeInsideUploads.replace(/\/+/g, "/");
  return {
    valid: true,
    fullPath,
    relativePath: cleanPosixRel,
    publicUrl: `/uploads/${cleanPosixRel}`,
  };
}

function startsWithBytes(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Memverifikasi magic bytes (file signature) untuk file non-gambar agar tidak mudah
 * dipalsukan hanya dengan mengubah ekstensi atau header MIME browser.
 */
export function hasValidMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length === 0) return false;
  const cleanExt = ext.toLowerCase();

  if (cleanExt === ".pdf") {
    let slice = buffer.subarray(0, Math.min(buffer.length, 32));
    // Lewati UTF-8 BOM jika ada
    if (startsWithBytes(slice, [0xef, 0xbb, 0xbf])) {
      slice = slice.subarray(3);
    }
    const head = slice.toString("latin1").replace(/^[\s\r\n]+/, "");
    return head.startsWith("%PDF-");
  }

  if (cleanExt === ".docx" || cleanExt === ".xlsx" || cleanExt === ".pptx") {
    return (
      startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
      startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
      startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08])
    );
  }

  if (cleanExt === ".doc" || cleanExt === ".xls" || cleanExt === ".ppt") {
    return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }

  if (cleanExt === ".mp4") {
    return buffer.length >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }

  if (cleanExt === ".webm") {
    return startsWithBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3]);
  }

  if (cleanExt === ".txt") {
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    return !sample.includes(0x00);
  }

  return false;
}

