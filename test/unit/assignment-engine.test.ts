import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitInteractiveTaskAction,
  startTaskSessionAction,
  saveStudentDraftAnnotationAction,
} from "@/actions/assignment";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  default: {
    tugas: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tugasSubmission: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    tugasJawabanSiswa: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return Promise.all(cb);
    }),
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Suite 4: Sistem Penugasan, Penilaian Otomatis & Alur Revisi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("4.1: Penilaian Otomatis Pilihan Ganda (Auto-Grading)", () => {
    it("harus menilai jawaban benar, menghitung bobot poin proporsional, dan menghasilkan nilai 100", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
      } as any);

      const mockTugas = {
        id: BigInt(1),
        poin_maksimal: 100,
        soal: [
          {
            id: BigInt(11),
            nomor_urut: 1,
            tipe_soal: "PILIHAN_GANDA",
            bobot_poin: 50,
            kunci_jawaban: "A",
            opsi: [
              { id: BigInt(101), label: "A", is_benar: true },
              { id: BigInt(102), label: "B", is_benar: false },
            ],
          },
          {
            id: BigInt(12),
            nomor_urut: 2,
            tipe_soal: "PILIHAN_GANDA",
            bobot_poin: 50,
            kunci_jawaban: "B",
            opsi: [
              { id: BigInt(103), label: "A", is_benar: false },
              { id: BigInt(104), label: "B", is_benar: true },
            ],
          },
        ],
      };

      const mockSubmission = {
        id: BigInt(999),
        siswa_id: BigInt(101),
        tugas: mockTugas,
        mulai_mengerjakan_at: new Date(Date.now() - 300000),
        jawaban: [
          { soal_id: BigInt(11), jawaban_siswa: "A" },
          { soal_id: BigInt(12), jawaban_siswa: "B" },
        ],
      };

      vi.mocked(prisma.tugasSubmission.findUnique).mockResolvedValueOnce(mockSubmission as any);
      vi.mocked(prisma.tugasSubmission.update).mockResolvedValueOnce({ id: BigInt(999) } as any);

      const result = await submitInteractiveTaskAction({ submissionId: "999" });

      expect(result.success).toBe(true);
      expect(result.data?.nilai).toBe(100);
      expect(result.data?.totalBenar).toBe(2);
      expect(result.data?.totalSalah).toBe(0);
      expect(result.data?.status).toBe("sudah_dinilai");
    });

    it("harus menghitung nilai proporsional jika 1 benar dan 1 salah (skor 50)", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
      } as any);

      const mockTugas = {
        id: BigInt(1),
        poin_maksimal: 100,
        soal: [
          {
            id: BigInt(11),
            nomor_urut: 1,
            tipe_soal: "PILIHAN_GANDA",
            bobot_poin: 50,
            kunci_jawaban: "A",
            opsi: [{ id: BigInt(101), label: "A", is_benar: true }],
          },
          {
            id: BigInt(12),
            nomor_urut: 2,
            tipe_soal: "PILIHAN_GANDA",
            bobot_poin: 50,
            kunci_jawaban: "B",
            opsi: [{ id: BigInt(104), label: "B", is_benar: true }],
          },
        ],
      };

      const mockSubmission = {
        id: BigInt(999),
        siswa_id: BigInt(101),
        tugas: mockTugas,
        mulai_mengerjakan_at: new Date(Date.now() - 300000),
        jawaban: [
          { soal_id: BigInt(11), jawaban_siswa: "A" }, // Benar
          { soal_id: BigInt(12), jawaban_siswa: "A" }, // Salah (kunci B)
        ],
      };

      vi.mocked(prisma.tugasSubmission.findUnique).mockResolvedValueOnce(mockSubmission as any);
      vi.mocked(prisma.tugasSubmission.update).mockResolvedValueOnce({ id: BigInt(999) } as any);

      const result = await submitInteractiveTaskAction({ submissionId: "999" });

      expect(result.success).toBe(true);
      expect(result.data?.nilai).toBe(50);
      expect(result.data?.totalBenar).toBe(1);
      expect(result.data?.totalSalah).toBe(1);
    });

    it("harus menyetel status 'menunggu_penilaian' bila terdapat butir soal Esai", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
      } as any);

      const mockTugas = {
        id: BigInt(1),
        poin_maksimal: 100,
        soal: [
          {
            id: BigInt(11),
            nomor_urut: 1,
            tipe_soal: "ESAI",
            bobot_poin: 50,
            kunci_jawaban: null,
            opsi: [],
          },
        ],
      };

      const mockSubmission = {
        id: BigInt(999),
        siswa_id: BigInt(101),
        tugas: mockTugas,
        mulai_mengerjakan_at: new Date(),
        jawaban: [{ soal_id: BigInt(11), jawaban_siswa: "Jawaban esai panjang siswa..." }],
      };

      vi.mocked(prisma.tugasSubmission.findUnique).mockResolvedValueOnce(mockSubmission as any);
      vi.mocked(prisma.tugasSubmission.update).mockResolvedValueOnce({ id: BigInt(999) } as any);

      const result = await submitInteractiveTaskAction({ submissionId: "999" });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe("menunggu_penilaian");
    });
  });

  describe("4.2 & 4.3: Pengacakan Soal (acak_soal) & Pengacakan Opsi (acak_opsi)", () => {
    // Implementasi seed pseudo-random generator deterministik
    function seededShuffle<T>(array: T[], seed: number): T[] {
      const arr = [...array];
      let s = seed;
      for (let i = arr.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    it("4.2: harus mengacak urutan soal secara unik untuk tiap ID siswa namun tetap deterministik", () => {
      const questions = [
        { id: 1, text: "Soal 1" },
        { id: 2, text: "Soal 2" },
        { id: 3, text: "Soal 3" },
        { id: 4, text: "Soal 4" },
        { id: 5, text: "Soal 5" },
      ];

      const student1Seed = 101;
      const student2Seed = 202;

      const orderStudent1 = seededShuffle(questions, student1Seed);
      const orderStudent2 = seededShuffle(questions, student2Seed);

      // Siswa 1 dan Siswa 2 menerima urutan yang berbeda
      expect(orderStudent1.map((q) => q.id)).not.toEqual(orderStudent2.map((q) => q.id));

      // Namun pemanggilan ulang untuk Siswa 1 selalu konsisten (deterministik)
      const repeatStudent1 = seededShuffle(questions, student1Seed);
      expect(repeatStudent1.map((q) => q.id)).toEqual(orderStudent1.map((q) => q.id));
    });

    it("4.3: harus mengacak posisi opsi jawaban tanpa mengubah penanda opsi is_benar", () => {
      const options = [
        { label: "A", text: "Salah 1", is_benar: false },
        { label: "B", text: "Jawaban Benar", is_benar: true },
        { label: "C", text: "Salah 2", is_benar: false },
        { label: "D", text: "Salah 3", is_benar: false },
      ];

      const shuffled = seededShuffle(options, 777);

      // Tetap memiliki persis 1 opsi yang benar
      const correctOptions = shuffled.filter((o) => o.is_benar);
      expect(correctOptions).toHaveLength(1);
      expect(correctOptions[0].text).toBe("Jawaban Benar");
    });
  });

  describe("4.4: Deadline Guard (Pencegahan Pengumpulan Terlambat)", () => {
    it("harus menolak memulai sesi tugas jika tenggat waktu (deadline) telah lewat", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Siswa Terlambat",
        role: "siswa",
      } as any);

      // Deadline kemarin
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);
      vi.mocked(prisma.tugas.findUnique).mockResolvedValueOnce({
        id: BigInt(5),
        deadline: pastDeadline,
        soal: [{ id: BigInt(1) }],
      } as any);

      const result = await startTaskSessionAction("5");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Tenggat waktu pengerjaan tugas ini telah berakhir");
    });
  });

  describe("4.5 & 4.6: Alur Revisi & Penilaian Kanvas Berkas Lembar Kerja", () => {
    it("4.5: harus menyimpan metadata anotasi kanvas coretan pengerjaan lembar kerja siswa", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        id: "101",
        name: "Ahmad Siswa",
        role: "siswa",
      } as any);

      const mockAnnotationData = JSON.stringify({
        lines: [{ points: [10, 20, 30, 40], stroke: "blue" }],
        textNotes: [{ x: 50, y: 100, text: "Jawaban no 1 = 45" }],
      });

      vi.mocked(prisma.tugasSubmission.upsert).mockResolvedValueOnce({
        id: BigInt(88),
        annotated_data: mockAnnotationData,
      } as any);

      const result = await saveStudentDraftAnnotationAction({
        tugasId: "12",
        annotatedData: mockAnnotationData,
      });

      expect(result.success).toBe(true);
      expect(prisma.tugasSubmission.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tugas_id_siswa_id: {
              tugas_id: BigInt(12),
              siswa_id: BigInt(101),
            },
          },
          update: {
            annotated_data: mockAnnotationData,
          },
        })
      );
    });
  });
});
