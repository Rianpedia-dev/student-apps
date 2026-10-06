import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Periksa kembali email anda"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerTeacherSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().min(3, "Email / Username minimal 3 karakter"),
  appleid: z.string().min(1, "Apple ID wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  passwordappleid: z.string().min(1, "Password Apple ID wajib diisi"),
  guru_bidang: z.string().min(1, "Bidang studi wajib diisi"),
  gender: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  nip: z.string().optional(),
  kelas: z.string().optional().default("-"),
});

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

export const createClassSchema = z.object({
  nama_kelas: z.string().min(3, "Nama kelas minimal 3 karakter"),
  wali_kelas: z.string().optional(),
  jumlah_siswa: z.string().optional(),
  code_restrict: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  from: z.string().min(1, "Asal pengumuman wajib diisi"),
  pengumuman: z.string().min(5, "Konten pengumuman minimal 5 karakter"),
  file: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(2, "Judul event wajib diisi"),
  kelas: z.string().min(1, "Pilih kelas"),
  from: z.string().optional(),
  start: z.string().min(1, "Tanggal mulai wajib diisi"),
  end: z.string().optional(),
  deskripsi: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export const violationSchema = z.object({
  user_id: z.string().min(1, "Pilih siswa"),
  nama: z.string().optional(),
  kelas: z.string().optional(),
  kategori: z.string().min(1, "Kategori pelanggaran wajib diisi"),
  keterangan: z.string().min(1, "Keterangan wajib diisi"),
});

export const achievementSchema = z.object({
  id_user: z.string().min(1, "ID siswa wajib diisi"),
  nama: z.string().min(1, "Nama siswa wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  fotoanak: z.string().min(1, "Foto prestasi wajib diisi"),
  prestasi: z.string().min(1, "Deskripsi prestasi wajib diisi"),
});

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

export const attendanceRecordSchema = z.object({
  date: z.string().min(1, "Tanggal absensi wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  records: z.array(
    z.object({
      userId: z.string().min(1),
      keterangan: z.enum(["Hadir", "Sakit", "Izin", "Alpha"]),
    })
  ),
});

