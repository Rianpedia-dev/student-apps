import { z } from "zod";

export const createPertemuanSchema = z.object({
  kelas_id: z.string().min(1, "Pilih kelas"),
  mapel_id: z.string().min(1, "Pilih mata pelajaran"),
  pertemuan_ke: z.number().int().min(1, "Pertemuan ke- harus berupa angka positif"),
  judul: z.string().min(3, "Judul materi / topik minimal 3 karakter"),
  deskripsi: z.string().optional(),
  tanggal: z.string().min(1, "Tanggal pertemuan wajib diisi"),
  jam_mulai: z.string().optional(),
  jam_selesai: z.string().optional(),
  is_published: z.boolean().optional().default(true),
});

export const createMateriSchema = z.object({
  pertemuan_id: z.string().min(1, "ID pertemuan wajib diisi"),
  judul: z.string().min(3, "Judul materi minimal 3 karakter"),
  tipe: z.enum(["DOKUMEN", "VIDEO", "LINK", "CATATAN"]),
  url_file: z.string().optional().nullable(),
  teks_konten: z.string().optional().nullable(),
  urutan: z.number().int().optional().default(1),
});
