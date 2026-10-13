import { z } from "zod";

export const questionOptionSchema = z.object({
  label: z.string().min(1, "Label opsi wajib diisi"),
  teks_opsi: z.string().optional().nullable(),
  gambar_opsi: z.string().optional().nullable(),
  is_benar: z.boolean().default(false),
});

export const questionItemSchema = z.object({
  id: z.string().optional(),
  nomor_urut: z.number().int().min(1),
  tipe_soal: z.enum(["PILIHAN_GANDA", "PILIHAN_GAMBAR", "ISIAN_SINGKAT", "ESAI"]),
  pertanyaan: z.string().min(1, "Pertanyaan wajib diisi"),
  gambar_soal: z.string().optional().nullable(),
  bobot_poin: z.number().min(1),
  kunci_jawaban: z.string().optional().nullable(),
  pembahasan: z.string().optional().nullable(),
  opsi: z.array(questionOptionSchema).default([]),
});

export const createInteractiveTaskSchema = z.object({
  judul: z.string().min(3, "Judul tugas minimal 3 karakter"),
  deskripsi: z.string().min(5, "Deskripsi tugas minimal 5 karakter"),
  kelas_id: z.string().min(1, "Kelas wajib dipilih"),
  mapel_id: z.string().min(1, "Mata pelajaran wajib dipilih"),
  pertemuan_id: z.string().optional().nullable(),
  deadline: z.string().min(1, "Batas waktu (deadline) wajib diisi"),
  durasi_menit: z.number().int().positive().optional().nullable(),
  acak_soal: z.boolean().optional().default(false),
  acak_opsi: z.boolean().optional().default(false),
  tampilkan_nilai_instan: z.boolean().optional().default(true),
  poin_maksimal: z.number().optional().default(100),
  soal: z.array(questionItemSchema).min(1, "Tugas interaktif minimal memiliki 1 butir soal"),
});
