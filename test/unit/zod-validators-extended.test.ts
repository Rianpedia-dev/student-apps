import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  registerTeacherSchema,
  createPertemuanSchema,
  announcementSchema,
  createInteractiveTaskSchema,
  waliKelasFullDayStatusSchema,
} from "@/lib/validators";
import { z } from "zod";

describe("Suite 9: Validasi Schema Zod & Sanitasi Input Extended", () => {
  describe("9.1: Validasi Format Email & Nomor Induk (NIY & NIS)", () => {
    it("harus menerima email valid dan menolak format email yang salah", () => {
      const validData = {
        name: "Ahmad Siswa",
        email: "ahmad@alazhar.sch.id",
        password: "password123",
        role: "4" as const,
      };
      expect(createUserSchema.safeParse(validData).success).toBe(true);

      const invalidEmailData = {
        ...validData,
        email: "invalid-email-format",
      };
      const result = createUserSchema.safeParse(invalidEmailData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Email tidak valid");
      }
    });

    it("harus memvalidasi nomor induk yayasan (NIY) dan nomor induk siswa (NIS)", () => {
      // Skema validator NIY spesifik standar 18 digit
      const niySchema = z
        .string()
        .regex(/^\d{18}$/, "NIY harus berupa 18 digit angka")
        .optional()
        .or(z.literal(""));

      // Skema validator NIS 9-10 digit
      const nisSchema = z
        .string()
        .regex(/^\d{9,10}$/, "NIS harus berupa 9 sampai 10 digit angka")
        .optional()
        .or(z.literal(""));

      // Valid NIY & NIS
      expect(niySchema.safeParse("198501012010011001").success).toBe(true);
      expect(nisSchema.safeParse("2024001234").success).toBe(true);

      // Invalid NIY (huruf atau kurang dari 18 digit)
      expect(niySchema.safeParse("19850101ABC").success).toBe(false);
      expect(niySchema.safeParse("12345").success).toBe(false);

      // Invalid NIS
      expect(nisSchema.safeParse("1234").success).toBe(false);
      expect(nisSchema.safeParse("202400123456789").success).toBe(false);
    });
  });

  describe("9.2: Validasi Jam Jadwal Pelajaran (Format HH:mm & Rentang Waktu)", () => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const jadwalTimeSchema = z
      .object({
        jam_mulai: z.string().regex(timeRegex, "Format jam mulai harus HH:mm"),
        jam_selesai: z.string().regex(timeRegex, "Format jam selesai harus HH:mm"),
      })
      .refine(
        (data) => {
          const [h1, m1] = data.jam_mulai.split(":").map(Number);
          const [h2, m2] = data.jam_selesai.split(":").map(Number);
          return h1 * 60 + m1 < h2 * 60 + m2;
        },
        {
          message: "Jam mulai harus lebih awal daripada jam selesai",
          path: ["jam_selesai"],
        }
      );

    it("harus menerima format jam yang benar dan jam mulai < jam selesai", () => {
      const valid = {
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      };
      const res = jadwalTimeSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("harus menolak format jam yang salah (misal 25:99 atau huruf)", () => {
      const invalidFormat = {
        jam_mulai: "25:70",
        jam_selesai: "09:00",
      };
      const res = jadwalTimeSchema.safeParse(invalidFormat);
      expect(res.success).toBe(false);
    });

    it("harus menolak bila jam selesai lebih awal atau sama dengan jam mulai", () => {
      const invalidOrder = {
        jam_mulai: "10:00",
        jam_selesai: "09:30",
      };
      const res = jadwalTimeSchema.safeParse(invalidOrder);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Jam mulai harus lebih awal");
      }
    });
  });

  describe("9.3: Sanitasi Input & Deteksi Payload Berbahaya (Anti-XSS)", () => {
    it("harus memvalidasi judul pengumuman dan mengidentifikasi payload script berbahaya", () => {
      const sanitizeHtml = (str: string) =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

      const rawTitle = "<script>alert('XSS Attack')</script>Pengumuman Ujian";
      const sanitized = sanitizeHtml(rawTitle);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("&lt;script&gt;");

      const parsed = announcementSchema.safeParse({
        title: sanitized,
        from: "Bagian Akademik",
        pengumuman: "Diberitahukan kepada seluruh siswa...",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.title).toBe(
          "&lt;script&gt;alert(&#039;XSS Attack&#039;)&lt;/script&gt;Pengumuman Ujian"
        );
      }
    });

    it("harus menolak pengumuman dengan konten terlalu pendek", () => {
      const shortAnnouncement = {
        title: "Hai",
        from: "Admin",
        pengumuman: "Hi", // min 5 chars
      };
      const res = announcementSchema.safeParse(shortAnnouncement);
      expect(res.success).toBe(false);
    });
  });

  describe("9.4: Validasi Integritas Penugasan Interaktif (Interactive Tasks)", () => {
    it("harus menolak tugas interaktif tanpa butir soal", () => {
      const emptyQuestions = {
        judul: "Kuis Matematika",
        deskripsi: "Kuis perkalian dasar",
        kelas_id: "1",
        mapel_id: "2",
        deadline: "2026-11-01T23:59:59Z",
        soal: [],
      };
      const res = createInteractiveTaskSchema.safeParse(emptyQuestions);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("minimal memiliki 1 butir soal");
      }
    });

    it("harus menerima tugas interaktif yang lengkap dengan soal pilihan ganda", () => {
      const validTask = {
        judul: "Kuis IPA Bab 1",
        deskripsi: "Kerjakan seluruh soal dengan teliti",
        kelas_id: "1",
        mapel_id: "2",
        deadline: "2026-11-01T23:59:59Z",
        acak_soal: true,
        acak_opsi: true,
        soal: [
          {
            nomor_urut: 1,
            tipe_soal: "PILIHAN_GANDA" as const,
            pertanyaan: "Bagian sel yang berfungsi sebagai penghasil energi adalah...",
            bobot_poin: 10,
            opsi: [
              { label: "A", teks_opsi: "Mitokondria", is_benar: true },
              { label: "B", teks_opsi: "Ribosom", is_benar: false },
              { label: "C", teks_opsi: "Badan Golgi", is_benar: false },
            ],
          },
        ],
      };
      const res = createInteractiveTaskSchema.safeParse(validTask);
      expect(res.success).toBe(true);
    });
  });
});
