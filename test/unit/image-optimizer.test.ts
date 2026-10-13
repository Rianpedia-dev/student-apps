import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { optimizeImage } from "../../src/lib/image-optimizer";

describe("Image Optimizer Service with Sharp", () => {
  it("harus sukses mengonversi JPEG ke WebP dan mengompres ukuran", async () => {
    // Buat gambar JPEG dummy 1200x800
    const rawJpeg = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 255, g: 100, b: 50 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await optimizeImage(rawJpeg, { category: "general" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe("webp");
      expect(result.width).toBeLessThanOrEqual(1600);
      expect(result.height).toBeLessThanOrEqual(1600);
      expect(result.originalFormat).toBe("jpeg");
      expect(result.size).toBeGreaterThan(0);
      // Validasi metadata buffer hasil dengan Sharp
      const meta = await sharp(result.buffer).metadata();
      expect(meta.format).toBe("webp");
    }
  });

  it("harus sukses mengonversi PNG transparan ke WebP dan mempertahankan alpha channel", async () => {
    // Buat gambar PNG dengan transparansi RGBA
    const rawPng = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 0, g: 128, b: 255, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImage(rawPng, { category: "avatar" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe("webp");
      expect(result.originalFormat).toBe("png");
      const meta = await sharp(result.buffer).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.hasAlpha).toBe(true);
    }
  });

  it("harus mempertahankan WebP yang sudah optimal tanpa re-encode ganda", async () => {
    // WebP kecil
    const smallWebp = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 10, g: 200, b: 100 },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    const result = await optimizeImage(smallWebp, { category: "avatar" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe("webp");
      expect(result.isAlreadyOptimized).toBe(true);
      expect(result.size).toBe(smallWebp.length);
    }
  });

  it("harus me-resize gambar besar (misal 3000x2000) agar tidak melebihi 1600 piksel dengan mempertahankan rasio aspek", async () => {
    const largeJpeg = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 50, g: 50, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeImage(largeJpeg, { category: "achievement" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.width).toBe(1600);
      // Rasio aspek 3000:2000 = 3:2 -> 1600:1067
      expect(result.height).toBe(Math.round((2000 / 3000) * 1600));
      expect(result.size).toBeLessThan(largeJpeg.length);
    }
  });

  it("TIDAK boleh memperbesar (upscale) gambar kecil yang dimensinya di bawah batas maksimum", async () => {
    const smallPng = await sharp({
      create: {
        width: 250,
        height: 150,
        channels: 3,
        background: { r: 200, g: 150, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImage(smallPng, { category: "general" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.width).toBe(250);
      expect(result.height).toBe(150);
    }
  });

  it("harus menolak file bukan gambar meskipun dinamai .jpg (fake image / plain text)", async () => {
    const fakeImageBuffer = Buffer.from("Ini bukan gambar, ini hanyalah teks biasa.");

    const result = await optimizeImage(fakeImageBuffer, { category: "avatar" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("tidak valid atau rusak");
    }
  });

  it("harus menolak buffer kosong", async () => {
    const emptyBuffer = Buffer.alloc(0);

    const result = await optimizeImage(emptyBuffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("kosong");
    }
  });

  it("harus menolak gambar dengan dimensi ekstrem (> 8000px)", async () => {
    const hugeDimensionBuffer = await sharp({
      create: {
        width: 8001,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeImage(hugeDimensionBuffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("terlalu besar");
    }
  });

  it("benchmark: mengukur byte aktual kompresi sebelum dan sesudah optimasi", async () => {
    // 1. JPEG Foto 2000x1500
    const rawJpeg = await sharp({
      create: {
        width: 2000,
        height: 1500,
        channels: 3,
        background: { r: 180, g: 120, b: 70 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const resJpeg = await optimizeImage(rawJpeg, { category: "achievement" });
    expect(resJpeg.success).toBe(true);

    // 2. PNG Foto 1200x1200
    const rawPng = await sharp({
      create: {
        width: 1200,
        height: 1200,
        channels: 4,
        background: { r: 34, g: 139, b: 34, alpha: 0.8 },
      },
    })
      .png()
      .toBuffer();

    const resPng = await optimizeImage(rawPng, { category: "avatar" });
    expect(resPng.success).toBe(true);

    if (resJpeg.success && resPng.success) {
      console.log("=== BENCHMARK OPTIMASI GAMBAR ===");
      console.log(`JPEG (Achievement) Asli: ${rawJpeg.length} bytes -> WebP: ${resJpeg.size} bytes (${((1 - resJpeg.size / rawJpeg.length) * 100).toFixed(1)}% hemat, Dimensi: ${resJpeg.width}x${resJpeg.height})`);
      console.log(`PNG (Avatar) Asli: ${rawPng.length} bytes -> WebP: ${resPng.size} bytes (${((1 - resPng.size / rawPng.length) * 100).toFixed(1)}% hemat, Dimensi: ${resPng.width}x${resPng.height})`);
    }
  });
});
