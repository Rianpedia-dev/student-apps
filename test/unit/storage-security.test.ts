import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import {
  getUploadRootDir,
  getDefaultMaxFileSizeBytes,
  resolveUploadFilePath,
  hasValidMagicBytes,
} from "@/lib/storage";
import { saveUploadedFile, saveBase64Image } from "@/lib/upload";
import { resetRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    chatRoom: { findUnique: vi.fn(), update: vi.fn() },
    chatMessage: { create: vi.fn() },
  },
}));

import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GET as downloadHandler } from "@/app/api/download/route";
import { sendMessageAction } from "@/actions/chat";

describe("Storage Security & Hardening (Fase 1)", () => {
  const createdFiles: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit();
  });

  afterEach(async () => {
    delete process.env.UPLOAD_DIR;
    delete process.env.MAX_FILE_SIZE;
    while (createdFiles.length > 0) {
      const f = createdFiles.pop();
      if (f) await fs.unlink(f).catch(() => {});
    }
  });

  describe("1. Env Configuration & Path Traversal Protection", () => {
    it("menghormati UPLOAD_DIR dan MAX_FILE_SIZE serta memiliki fallback aman", () => {
      delete process.env.UPLOAD_DIR;
      delete process.env.MAX_FILE_SIZE;
      expect(getUploadRootDir()).toBe(path.resolve(process.cwd(), "public", "uploads"));
      expect(getDefaultMaxFileSizeBytes()).toBe(10 * 1024 * 1024);

      process.env.UPLOAD_DIR = "./custom-uploads";
      process.env.MAX_FILE_SIZE = "5242880";
      expect(getUploadRootDir()).toBe(path.resolve(process.cwd(), "custom-uploads"));
      expect(getDefaultMaxFileSizeBytes()).toBe(5242880);

      process.env.MAX_FILE_SIZE = "invalid";
      expect(getDefaultMaxFileSizeBytes()).toBe(10 * 1024 * 1024);
    });

    it("menolak upaya path traversal, null byte, dan path di luar uploads", () => {
      expect(resolveUploadFilePath("/uploads/materials/modul.pdf").valid).toBe(true);
      expect(resolveUploadFilePath("uploads\\images\\foto.webp").valid).toBe(true);

      expect(resolveUploadFilePath("").valid).toBe(false);
      expect(resolveUploadFilePath("/uploads/").valid).toBe(false);
      expect(resolveUploadFilePath("/uploads/../../.env").valid).toBe(false);
      expect(resolveUploadFilePath("/uploads/%2e%2e/.env").valid).toBe(false);
      expect(resolveUploadFilePath("uploads/sub/../../secret.txt").valid).toBe(false);
      expect(resolveUploadFilePath("/uploads/a.pdf\0.png").valid).toBe(false);
      expect(resolveUploadFilePath("/images/logo.png").valid).toBe(false);
    });
  });

  describe("2. Magic Bytes Verification", () => {
    it("memvalidasi signature file PDF, ZIP/Office, MP4, WebM, dan TXT dengan benar", () => {
      expect(hasValidMagicBytes(Buffer.from("%PDF-1.7\n..."), ".pdf")).toBe(true);
      expect(hasValidMagicBytes(Buffer.from([0xef, 0xbb, 0xbf, 0x25, 0x50, 0x44, 0x46, 0x2d]), ".pdf")).toBe(true);
      expect(hasValidMagicBytes(Buffer.from("<html><script>alert(1)</script></html>"), ".pdf")).toBe(false);

      expect(hasValidMagicBytes(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]), ".docx")).toBe(true);
      expect(hasValidMagicBytes(Buffer.from("not a zip"), ".xlsx")).toBe(false);

      expect(hasValidMagicBytes(Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), ".mp4")).toBe(true);
      expect(hasValidMagicBytes(Buffer.from("fake mp4"), ".mp4")).toBe(false);

      expect(hasValidMagicBytes(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01]), ".webm")).toBe(true);
      expect(hasValidMagicBytes(Buffer.from("Catatan pertemuan 1"), ".txt")).toBe(true);
      expect(hasValidMagicBytes(Buffer.from([0x4d, 0x5a, 0x00, 0x01]), ".txt")).toBe(false);
    });
  });

  describe("3. Upload Security (Chat, Task Media, Magic Bytes, SVG/HTML Rejection)", () => {
    it("menolak file HTML, SVG, dan PDF palsu pada kategori chat & material", async () => {
      const htmlFile = new File([Buffer.from("<script>alert(1)</script>")], "xss.html", {
        type: "text/html",
      });
      const resHtml = await saveUploadedFile(htmlFile, { category: "chat" });
      expect(resHtml.success).toBe(false);

      const svgFile = new File([Buffer.from("<svg onload=alert(1)></svg>")], "icon.svg", {
        type: "image/svg+xml",
      });
      const resSvg = await saveUploadedFile(svgFile, { category: "avatar" });
      expect(resSvg.success).toBe(false);
      expect(resSvg.error).toContain("SVG tidak diizinkan");

      const fakePdf = new File([Buffer.from("<html>not really pdf</html>")], "tugas.pdf", {
        type: "application/pdf",
      });
      const resFakePdf = await saveUploadedFile(fakePdf, { category: "chat" });
      expect(resFakePdf.success).toBe(false);
      expect(resFakePdf.error).toContain("Isi berkas tidak cocok");
    });

    it("mengoptimasi gambar pada task_media ke WebP di /uploads/tugas/media/", async () => {
      const pngBuffer = await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 20, g: 120, b: 80 } },
      })
        .png()
        .toBuffer();

      const file = new File([pngBuffer], "stimulus.png", { type: "image/png" });
      const res = await saveUploadedFile(file, { category: "task_media" });

      expect(res.success).toBe(true);
      expect(res.filePath?.startsWith("/uploads/tugas/media/")).toBe(true);
      expect(res.fileType).toBe("webp");

      if (res.filePath) {
        const resolved = resolveUploadFilePath(res.filePath);
        if (resolved.valid) createdFiles.push(resolved.fullPath);
      }
    });

    it("saveBase64Image memvalidasi, mengoptimasi gambar kanvas ke WebP, dan menolak payload berbahaya", async () => {
      const invalidRes = await saveBase64Image("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==");
      expect(invalidRes.success).toBe(false);

      const pngBuffer = await sharp({
        create: { width: 300, height: 200, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toBuffer();
      const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

      const okRes = await saveBase64Image(dataUrl, { category: "task_submission", prefix: "canvas" });
      expect(okRes.success).toBe(true);
      expect(okRes.filePath?.startsWith("/uploads/tugas/canvas-")).toBe(true);
      expect(okRes.filePath?.endsWith(".webp")).toBe(true);

      if (okRes.filePath) {
        const resolved = resolveUploadFilePath(okRes.filePath);
        if (resolved.valid) createdFiles.push(resolved.fullPath);
      }
    });

    it("sendMessageAction menolak lampiran berbahaya dan tidak menyimpan pesan ke DB", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa Test",
        email: "siswa@test.id",
        role: "siswa",
        status: "1",
      });

      vi.mocked(prisma.chatRoom.findUnique).mockResolvedValueOnce({
        id: BigInt(10),
        user_one_id: BigInt(101),
        user_two_id: BigInt(202),
        userOne: { id: BigInt(101), status: "1" },
        userTwo: { id: BigInt(202), status: "2" },
      } as unknown as NonNullable<Awaited<ReturnType<typeof prisma.chatRoom.findUnique>>>);

      const formData = new FormData();
      formData.append("room_id", "10");
      formData.append("message", "");
      formData.append(
        "attachment",
        new File([Buffer.from("<html><script>alert(1)</script></html>")], "payload.html", {
          type: "text/html",
        })
      );

      const res = await sendMessageAction(formData);
      expect(res.success).toBe(false);
      expect(prisma.chatMessage.create).not.toHaveBeenCalled();
    });
  });

  describe("4. Endpoint /api/download Authentication & Streaming", () => {
    it("mengembalikan 401 jika tidak login atau akun unverified", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);
      const req1 = new NextRequest("http://localhost/api/download?file=/uploads/files/doc.pdf");
      const res1 = await downloadHandler(req1);
      expect(res1.status).toBe(401);

      vi.mocked(getSession).mockResolvedValueOnce({
        id: "99",
        name: "Belum Verifikasi",
        email: "u@test.id",
        role: "siswa",
        status: "0",
      });
      const req2 = new NextRequest("http://localhost/api/download?file=/uploads/files/doc.pdf");
      const res2 = await downloadHandler(req2);
      expect(res2.status).toBe(401);
    });

    it("mengembalikan 403 untuk path traversal saat sudah login", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa",
        email: "s@test.id",
        role: "siswa",
        status: "1",
      });

      const req = new NextRequest("http://localhost/api/download?file=/uploads/../../.env");
      const res = await downloadHandler(req);
      expect(res.status).toBe(403);
    });

    it("melakukan streaming file dan menyetel header keamanan saat file valid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa",
        email: "s@test.id",
        role: "siswa",
        status: "1",
      });

      const pdfBuffer = Buffer.from("%PDF-1.4\n%Test download stream\n%%EOF");
      const uploaded = await saveUploadedFile(
        new File([pdfBuffer], "modul-uji.pdf", { type: "application/pdf" }),
        { category: "attachment" }
      );
      expect(uploaded.success).toBe(true);

      const resolved = resolveUploadFilePath(uploaded.filePath!);
      if (resolved.valid) createdFiles.push(resolved.fullPath);

      const req = new NextRequest(
        `http://localhost/api/download?file=${encodeURIComponent(uploaded.filePath!)}&name=${encodeURIComponent("Modul Uji\r\nEvil")}`
      );
      const res = await downloadHandler(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Cache-Control")).toBe("private, no-cache");
      expect(res.headers.get("Content-Disposition")).not.toContain("\r");
      expect(res.headers.get("Content-Disposition")).not.toContain("\n");

      const downloadedBytes = Buffer.from(await res.arrayBuffer());
      expect(downloadedBytes.toString()).toBe(pdfBuffer.toString());
    });
  });
});
