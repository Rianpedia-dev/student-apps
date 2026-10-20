import { describe, it, expect } from "vitest";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { saveUploadedFile } from "@/lib/upload";
import { TaskRecapInfo, TaskRecapStudent } from "@/lib/export-task-recap";

describe("WORKFLOW FITUR TUGAS BARU: Lembar Kerja Berkas (PDF & Image)", () => {
  // 1. Tes Unggah Soal PDF & Image
  describe("1. Pengunggahan Soal oleh Guru (Upload Soal PDF & Image)", () => {
    it("harus berhasil mengunggah berkas lembar soal PDF ke direktori /uploads/tugas/", async () => {
      const dummyPdf = Buffer.from("%PDF-1.4\n%Lembar Soal LKS Matematika Al-Azhar\n%%EOF");
      const file = new File([dummyPdf], "lks-matematika-bab1.pdf", { type: "application/pdf" });

      const res = await saveUploadedFile(file, { category: "task_worksheet" });

      expect(res.success).toBe(true);
      expect(res.filePath).toBeDefined();
      expect(res.filePath?.endsWith(".pdf")).toBe(true);
      expect(res.filePath?.startsWith("/uploads/tugas/")).toBe(true);
      expect(res.fileType).toBe("pdf");

      if (res.filePath) {
        const diskPath = path.join(process.cwd(), "public", res.filePath.replace(/^\//, ""));
        const exists = await fs.stat(diskPath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        // Bersihkan berkas tes
        await fs.unlink(diskPath).catch(() => {});
      }
    });

    it("harus berhasil mengunggah dan mengoptimasi berkas soal Gambar (PNG/JPEG) menjadi WebP di /uploads/tugas/", async () => {
      const dummyImgBuffer = await sharp({
        create: {
          width: 800,
          height: 1000,
          channels: 3,
          background: { r: 240, g: 240, b: 240 },
        },
      })
        .png()
        .toBuffer();

      const file = new File([dummyImgBuffer], "soal-ipa-diagram.png", { type: "image/png" });
      const res = await saveUploadedFile(file, { category: "task_worksheet" });

      expect(res.success).toBe(true);
      expect(res.filePath).toBeDefined();
      expect(res.filePath?.endsWith(".webp")).toBe(true);
      expect(res.filePath?.startsWith("/uploads/tugas/")).toBe(true);
      expect(res.fileType).toBe("webp");

      if (res.filePath) {
        const diskPath = path.join(process.cwd(), "public", res.filePath.replace(/^\//, ""));
        const savedBuffer = await fs.readFile(diskPath);
        const meta = await sharp(savedBuffer).metadata();
        expect(meta.format).toBe("webp");
        expect(meta.width).toBeLessThanOrEqual(1600);
        await fs.unlink(diskPath).catch(() => {});
      }
    });

    it("harus menolak format berkas selain PDF dan Gambar untuk lembar kerja", async () => {
      const fakeTextFile = new File(["console.log('malicious')"], "script.exe", { type: "application/x-msdownload" });
      const res = await saveUploadedFile(fakeTextFile, { category: "task_worksheet" });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Format file tidak diizinkan");
    });
  });

  // 2. Tes State Machine Alur Pengerjaan & Revisi Tugas
  describe("2. State Machine Alur Pengerjaan, Koreksi, & Revisi Siswa-Guru", () => {
    it("harus memvalidasi siklus status: belum -> sedang -> menunggu -> perlu revisi -> menunggu -> sudah dinilai", () => {
      interface SubmissionState {
        status: "belum_mengumpulkan" | "sedang_mengerjakan" | "menunggu_penilaian" | "perlu_revisi" | "sudah_dinilai";
        nilai: number | null;
        catatanGuru: string | null;
        annotatedData: string | null;
      }

      // Langkah 1: Awalnya siswa belum mengerjakan
      const sub: SubmissionState = {
        status: "belum_mengumpulkan",
        nilai: null,
        catatanGuru: null,
        annotatedData: null,
      };
      expect(sub.status).toBe("belum_mengumpulkan");

      // Langkah 2: Siswa membuka kanvas & autosave draft
      const autosaveDraft = (draftJson: string) => {
        sub.status = "sedang_mengerjakan";
        sub.annotatedData = draftJson;
      };
      autosaveDraft(JSON.stringify({ strokes: [{ tool: "pen", x: 10, y: 10 }] }));
      expect(sub.status).toBe("sedang_mengerjakan");
      expect(sub.annotatedData).toContain("pen");

      // Langkah 3: Siswa mengumpulkan tugas
      const submitTask = () => {
        sub.status = "menunggu_penilaian";
      };
      submitTask();
      expect(sub.status).toBe("menunggu_penilaian");

      // Langkah 4: Guru mengoreksi dan meminta revisi
      const requestRevision = (catatan: string) => {
        sub.status = "perlu_revisi";
        sub.catatanGuru = catatan;
      };
      requestRevision("Perbaiki jawaban nomor 2 ya ananda");
      expect(sub.status).toBe("perlu_revisi");
      expect(sub.catatanGuru).toBe("Perbaiki jawaban nomor 2 ya ananda");

      // Langkah 5: Siswa memperbaiki dan mengumpulkan kembali
      const resubmitTask = () => {
        sub.status = "menunggu_penilaian";
      };
      resubmitTask();
      expect(sub.status).toBe("menunggu_penilaian");

      // Langkah 6: Guru memberi nilai final
      const gradeTask = (nilaiFinal: number, apresiasi: string) => {
        sub.status = "sudah_dinilai";
        sub.nilai = nilaiFinal;
        sub.catatanGuru = apresiasi;
      };
      gradeTask(95, "Mumtaz! Jawaban revisi sudah sangat lengkap.");
      expect(sub.status).toBe("sudah_dinilai");
      expect(sub.nilai).toBe(95);
      expect(sub.catatanGuru).toContain("Mumtaz");
    });
  });

  // 3. Tes Struktur Data Anotasi Kanvas (Strokes, Texts, Stamps)
  describe("3. Serialisasi & Deserialisasi Data Anotasi In-App Canvas", () => {
    it("harus memvalidasi struktur data goresan pena, teks, dan stempel guru", () => {
      const sampleAnnotation = {
        version: 1,
        strokes: [
          {
            id: "stroke-1",
            tool: "pen" as const,
            color: "#2563eb",
            size: 3,
            points: [
              { x: 100, y: 150 },
              { x: 105, y: 155 },
              { x: 110, y: 160 },
            ],
            page: 1,
          },
          {
            id: "stroke-2",
            tool: "highlighter" as const,
            color: "#facc15",
            size: 8,
            points: [{ x: 50, y: 50 }],
            page: 1,
          },
        ],
        texts: [
          {
            id: "txt-1",
            text: "3/4 + 1/2 = 5/4",
            x: 120,
            y: 200,
            color: "#1e293b",
            fontSize: 16,
            page: 1,
          },
        ],
        stamps: [
          {
            id: "stamp-1",
            type: "check" as const,
            x: 250,
            y: 200,
            page: 1,
          },
          {
            id: "stamp-2",
            type: "star" as const,
            x: 300,
            y: 50,
            page: 1,
          },
        ],
      };

      const serialized = JSON.stringify(sampleAnnotation);
      expect(typeof serialized).toBe("string");

      const deserialized = JSON.parse(serialized);
      expect(deserialized.version).toBe(1);
      expect(deserialized.strokes.length).toBe(2);
      expect(deserialized.texts[0].text).toBe("3/4 + 1/2 = 5/4");
      expect(deserialized.stamps[0].type).toBe("check");
      expect(deserialized.stamps[1].type).toBe("star");
    });
  });

  // 4. Tes Agregasi Statistik & Rekap Nilai Kelas (Excel & PDF Logic)
  describe("4. Logika Kalkulasi Statistik Rekap Nilai Kelas", () => {
    const mockStudents: TaskRecapStudent[] = [
      {
        siswaId: "1",
        siswaName: "Ahmad Fauzan",
        siswaNis: "1001",
        siswaGender: "L",
        status: "sudah_dinilai",
        submittedAt: "2026-10-15T08:00:00.000Z",
        nilai: 90,
        catatanGuru: "Sangat baik",
      },
      {
        siswaId: "2",
        siswaName: "Fatimah Zahra",
        siswaNis: "1002",
        siswaGender: "P",
        status: "sudah_dinilai",
        submittedAt: "2026-10-15T08:15:00.000Z",
        nilai: 80,
        catatanGuru: "Bagus",
      },
      {
        siswaId: "3",
        siswaName: "Muhammad Bilal",
        siswaNis: "1003",
        siswaGender: "L",
        status: "sudah_dinilai",
        submittedAt: "2026-10-15T08:30:00.000Z",
        nilai: 70, // di bawah KKM 75
        catatanGuru: "Tingkatkan lagi",
      },
      {
        siswaId: "4",
        siswaName: "Khadijah Al-Kubro",
        siswaNis: "1004",
        siswaGender: "P",
        status: "perlu_revisi",
        submittedAt: "2026-10-15T09:00:00.000Z",
        nilai: null,
        catatanGuru: "Mohon revisi",
      },
      {
        siswaId: "5",
        siswaName: "Umar bin Khattab",
        siswaNis: "1005",
        siswaGender: "L",
        status: "belum_mengumpulkan",
        submittedAt: null,
        nilai: null,
        catatanGuru: null,
      },
    ];

    it("harus menghitung rata-rata, nilai tertinggi, terendah, dan ketuntasan KKM 75 dengan tepat", () => {
      const graded = mockStudents.filter((s) => s.nilai !== null && typeof s.nilai === "number");
      const scores = graded.map((s) => s.nilai as number);

      expect(scores.length).toBe(3);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(avg).toBe(80); // (90 + 80 + 70) / 3 = 80

      const max = Math.max(...scores);
      expect(max).toBe(90);

      const min = Math.min(...scores);
      expect(min).toBe(70);

      // KKM 75: 90 (Tuntas), 80 (Tuntas), 70 (Belum Tuntas) -> 2 dari 3 tuntas = 67%
      const tuntasCount = scores.filter((s) => s >= 75).length;
      expect(tuntasCount).toBe(2);
      const tuntasPercent = Math.round((tuntasCount / scores.length) * 100);
      expect(tuntasPercent).toBe(67);
    });

    it("harus menghasilkan workbook spreadsheet Excel (.xlsx) tanpa error", async () => {
      const XLSX = await import("xlsx");
      const taskInfo: TaskRecapInfo = {
        tugasId: "101",
        judul: "LKS Matematika Bab 3",
        mapelNama: "Matematika",
        kelasNama: "Kelas 4 Umar bin Khattab",
        poinMaksimal: 100,
        deadlineFormatted: "18 Okt 2026, 23:59",
        guruNama: "Ustadz Abdullah",
      };

      const tableRows = mockStudents.map((s, idx) => [
        idx + 1,
        s.siswaNis,
        s.siswaName,
        s.siswaGender === "P" ? "Perempuan" : "Laki-laki",
        s.status,
        s.nilai ?? "-",
        s.nilai && s.nilai >= 75 ? "Tuntas" : "Belum Tuntas",
        s.catatanGuru || "-",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([
        ["YAYASAN ASUH ASOSIASI ISLAM AL-AZHAR CAIRO PALEMBANG"],
        [`Tugas: ${taskInfo.judul} | Kelas: ${taskInfo.kelasNama}`],
        [],
        ["No", "NIS", "Nama Lengkap", "Gender", "Status", "Nilai", "KKM 75", "Catatan Guru"],
        ...tableRows,
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");

      // Verify book can be written to buffer
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });
});
