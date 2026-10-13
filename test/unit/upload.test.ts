import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { saveUploadedFile } from "../../src/lib/upload";
import fs from "fs/promises";
import path from "path";

describe("saveUploadedFile with Sharp Integration", () => {
  it("harus mengoptimasi gambar avatar JPEG menjadi WebP pada public/uploads/images/", async () => {
    // Buat buffer JPEG 1000x1000
    const jpegBuffer = await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const file = new File([jpegBuffer], "avatar_test.jpg", { type: "image/jpeg" });
    const res = await saveUploadedFile(file, { category: "avatar" });

    expect(res.success).toBe(true);
    expect(res.filePath).toBeDefined();
    expect(res.filePath?.endsWith(".webp")).toBe(true);
    expect(res.filePath?.startsWith("/uploads/images/")).toBe(true);
    expect(res.fileType).toBe("webp");

    // Pastikan berkas benar-benar ada di disk dan valid WebP
    if (res.filePath) {
      const diskPath = path.join(process.cwd(), "public", res.filePath.replace(/^\//, ""));
      const savedBuffer = await fs.readFile(diskPath);
      const meta = await sharp(savedBuffer).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBeLessThanOrEqual(800);
      expect(meta.height).toBeLessThanOrEqual(800);

      // Bersihkan berkas tes
      await fs.unlink(diskPath).catch(() => {});
    }
  });

  it("harus menyimpan PDF pada kategori attachment tanpa memproses dengan Sharp", async () => {
    const dummyPdfContent = Buffer.from("%PDF-1.4 dummy pdf document content");
    const file = new File([dummyPdfContent], "surat-pengumuman.pdf", { type: "application/pdf" });

    const res = await saveUploadedFile(file, { category: "attachment" });

    expect(res.success).toBe(true);
    expect(res.filePath).toBeDefined();
    expect(res.filePath?.endsWith(".pdf")).toBe(true);
    expect(res.filePath?.startsWith("/uploads/files/")).toBe(true);
    expect(res.fileType).toBe("pdf");

    if (res.filePath) {
      const diskPath = path.join(process.cwd(), "public", res.filePath.replace(/^\//, ""));
      const savedBuffer = await fs.readFile(diskPath);
      expect(savedBuffer.toString()).toBe("%PDF-1.4 dummy pdf document content");

      // Bersihkan berkas tes
      await fs.unlink(diskPath).catch(() => {});
    }
  });

  it("harus menolak file fake image (teks yang dinamai .png) pada kategori achievement", async () => {
    const fakeBuffer = Buffer.from("Bukan gambar!");
    const file = new File([fakeBuffer], "trofi.png", { type: "image/png" });

    const res = await saveUploadedFile(file, { category: "achievement" });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).toContain("tidak valid atau rusak");
  });

  it("harus menolak file yang melampaui batas ukuran", async () => {
    // 12MB buffer
    const largeBuffer = Buffer.alloc(12 * 1024 * 1024);
    const file = new File([largeBuffer], "huge.jpg", { type: "image/jpeg" });

    const res = await saveUploadedFile(file, { category: "avatar" });

    expect(res.success).toBe(false);
    expect(res.error).toContain("melebihi batas maksimum");
  });
});
