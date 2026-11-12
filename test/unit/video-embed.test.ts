import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrls,
  getYouTubeVideoId,
  isVideoFile,
  resolveLearningVideo,
} from "@/lib/video-embed";

describe("Learning Video Embed & CSP Configuration", () => {
  describe("getYouTubeVideoId & getYouTubeEmbedUrl", () => {
    it("mengekstrak ID video dari berbagai format URL YouTube yang valid", () => {
      const id = "b4wS9W10O1M";
      const expected = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

      expect(getYouTubeEmbedUrl(`https://www.youtube.com/watch?v=${id}`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://www.youtube.com/watch?app=desktop&v=${id}&t=30s`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://m.youtube.com/watch?v=${id}`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://youtu.be/${id}?si=share123`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://www.youtube.com/shorts/${id}`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://www.youtube.com/live/${id}?feature=share`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://www.youtube.com/embed/${id}`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`https://www.youtube-nocookie.com/embed/${id}`)).toBe(expected);
      expect(getYouTubeEmbedUrl(`youtu.be/${id}`)).toBe(expected);
    });

    it("mengembalikan null untuk ID YouTube tidak valid atau bukan URL YouTube", () => {
      expect(getYouTubeVideoId("https://youtube.com/watch?v=123")).toBeNull();
      expect(getYouTubeEmbedUrl("https://vimeo.com/123456789")).toBeNull();
      expect(getYouTubeEmbedUrl("")).toBeNull();
      expect(getYouTubeEmbedUrl(null)).toBeNull();
    });

    it("menghasilkan daftar URL thumbnail YouTube dari URL maupun ID video", () => {
      expect(getYouTubeThumbnailUrls("https://youtu.be/b4wS9W10O1M")).toEqual([
        "https://i.ytimg.com/vi/b4wS9W10O1M/maxresdefault.jpg",
        "https://i.ytimg.com/vi/b4wS9W10O1M/hqdefault.jpg",
      ]);
      expect(getYouTubeThumbnailUrls("b4wS9W10O1M")).toEqual([
        "https://i.ytimg.com/vi/b4wS9W10O1M/maxresdefault.jpg",
        "https://i.ytimg.com/vi/b4wS9W10O1M/hqdefault.jpg",
      ]);
      expect(getYouTubeThumbnailUrls("https://vimeo.com/123456789")).toEqual([]);
      expect(getYouTubeThumbnailUrls(null)).toEqual([]);
    });
  });

  describe("resolveLearningVideo", () => {
    it("memetakan tautan YouTube, Google Drive, dan Vimeo menjadi iframe embed", () => {
      expect(resolveLearningVideo("https://www.youtube.com/watch?v=NybHckSEQBI")).toEqual({
        kind: "iframe",
        provider: "youtube",
        embedUrl: "https://www.youtube-nocookie.com/embed/NybHckSEQBI?rel=0",
        originalUrl: "https://www.youtube.com/watch?v=NybHckSEQBI",
      });

      expect(
        resolveLearningVideo("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view?usp=sharing")
      ).toEqual({
        kind: "iframe",
        provider: "gdrive",
        embedUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/preview",
        originalUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view?usp=sharing",
      });

      expect(resolveLearningVideo("https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQr")).toEqual({
        kind: "iframe",
        provider: "gdrive",
        embedUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/preview",
        originalUrl: "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQr",
      });

      expect(resolveLearningVideo("https://vimeo.com/987654321")).toEqual({
        kind: "iframe",
        provider: "vimeo",
        embedUrl: "https://player.vimeo.com/video/987654321",
        originalUrl: "https://vimeo.com/987654321",
      });
    });

    it("memetakan file video langsung lokal maupun HTTPS ke pemutar video HTML5", () => {
      expect(resolveLearningVideo("/uploads/materials/material-123.mp4")).toEqual({
        kind: "video",
        provider: "direct",
        videoSrc: "/uploads/materials/material-123.mp4",
        originalUrl: "/uploads/materials/material-123.mp4",
      });

      expect(resolveLearningVideo("https://cdn.example.com/materi.webm?v=2")).toEqual({
        kind: "video",
        provider: "direct",
        videoSrc: "https://cdn.example.com/materi.webm?v=2",
        originalUrl: "https://cdn.example.com/materi.webm?v=2",
      });
    });

    it("memetakan URL non-embed menjadi tautan eksternal dan menolak skema berbahaya", () => {
      expect(resolveLearningVideo("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQr")).toEqual({
        kind: "link",
        provider: "external",
        originalUrl: "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQr",
      });

      expect(resolveLearningVideo("javascript:alert(1)")).toBeNull();
      expect(resolveLearningVideo("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(resolveLearningVideo("   ")).toBeNull();
    });
  });

  describe("isVideoFile", () => {
    it("mendeteksi file video berdasarkan ekstensi URL maupun tipe MIME", () => {
      expect(isVideoFile("/uploads/materials/modul.mp4")).toBe(true);
      expect(isVideoFile("/uploads/materials/modul.webm?download=1")).toBe(true);
      expect(isVideoFile("/uploads/materials/modul-tanpa-ekstensi", "video/mp4")).toBe(true);
      expect(isVideoFile("/uploads/materials/modul-tanpa-ekstensi", "mp4")).toBe(true);
      expect(isVideoFile("/uploads/materials/modul.pdf", "pdf")).toBe(false);
      expect(isVideoFile("/uploads/materials/gambar.webp", "webp")).toBe(false);
    });
  });

  describe("next.config.ts Content-Security-Policy", () => {
    it("mengizinkan domain embed video pembelajaran pada frame-src", async () => {
      const headerEntries = await nextConfig.headers?.();
      expect(headerEntries).toBeDefined();

      const globalRule = headerEntries?.find((entry) => entry.source === "/:path*");
      const cspHeader = globalRule?.headers.find((h) => h.key === "Content-Security-Policy");
      expect(cspHeader).toBeDefined();

      const cspValue = cspHeader?.value || "";
      const frameSrcDirective = cspValue
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("frame-src "));

      expect(frameSrcDirective).toContain("'self'");
      expect(frameSrcDirective).toContain("https://*.daily.co");
      expect(frameSrcDirective).toContain("https://www.youtube-nocookie.com");
      expect(frameSrcDirective).toContain("https://www.youtube.com");
      expect(frameSrcDirective).toContain("https://player.vimeo.com");
      expect(frameSrcDirective).toContain("https://drive.google.com");

      const imgSrcDirective = cspValue
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("img-src "));

      expect(imgSrcDirective).toContain("https://i.ytimg.com");
    });
  });
});

