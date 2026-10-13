import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(2, "Judul event wajib diisi"),
  kelas: z.string().min(1, "Pilih kelas"),
  from: z.string().optional(),
  start: z.string().min(1, "Tanggal mulai wajib diisi"),
  end: z.string().optional(),
  deskripsi: z.string().optional(),
  backgroundColor: z.string().optional(),
});
