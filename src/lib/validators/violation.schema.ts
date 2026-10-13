import { z } from "zod";

export const violationSchema = z.object({
  user_id: z.string().min(1, "Pilih siswa"),
  nama: z.string().optional(),
  kelas: z.string().optional(),
  kategori: z.string().min(1, "Kategori pelanggaran wajib diisi"),
  keterangan: z.string().min(1, "Keterangan wajib diisi"),
  severity: z.enum(["RINGAN", "SEDANG", "BERAT"]).optional(),
  points: z.coerce.number().optional(),
  status: z.enum(["TERCATAT", "DIBINA", "SELESAI"]).optional(),
  tindakan: z.string().optional(),
  date: z.string().optional(),
});
