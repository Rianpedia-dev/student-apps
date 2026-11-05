import { z } from "zod";

export const violationSchema = z.object({
  user_id: z.string().min(1, "Pilih siswa"),
  nama: z.string().optional(),
  kelas: z.string().optional(),
  kategori: z.string().min(1, "Kategori pelanggaran wajib diisi"),
  keterangan: z.string().min(1, "Keterangan wajib diisi"),
  severity: z.enum(["RINGAN", "SEDANG", "BERAT"]).optional(),
  tingkatan: z.enum(["RINGAN", "SEDANG"]).optional(),
  points: z.coerce.number().optional(),
  status: z.enum(["TERCATAT", "DIBINA", "SELESAI"]).optional(),
  tindakan: z.string().optional(),
  date: z.string().optional(),
  semester: z.string().optional(),
  tahun_pelajaran: z.string().optional(),
  jenjang: z.string().optional(),
  guru_id: z.string().optional(),
  guru_nama: z.string().optional(),
});
