import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["1", "2", "4"], { message: "Pilih role" }),
  kelas: z.string().optional(),
  appleid: z.string().optional(),
  passwordappleid: z.string().optional(),
  gender: z.enum(["L", "P"]).optional(),
  nis: z.string().optional(),
  nip: z.string().optional(),
  guru_bidang: z.string().optional(),
});

export const achievementSchema = z.object({
  id_user: z.string().min(1, "ID siswa wajib diisi"),
  nama: z.string().min(1, "Nama siswa wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  fotoanak: z.string().min(1, "Foto prestasi wajib diisi"),
  prestasi: z.string().min(1, "Deskripsi prestasi wajib diisi"),
});
