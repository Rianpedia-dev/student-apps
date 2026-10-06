/**
 * Domain Type Definitions for Tugas, Kuis & Ujian Interaktif
 */

export type TipeSoal = "PILIHAN_GANDA" | "PILIHAN_GAMBAR" | "ISIAN_SINGKAT" | "ESAI";

export type TipeTugas = "ONLINE_QUIZ" | "FILE_UPLOAD" | "TASK";

export type StatusTugas = "DRAFT" | "PUBLISHED" | "CLOSED";

export type StatusSubmission =
  | "BELUM_MENGERJAKAN"
  | "SEDANG_MENGERJAKAN"
  | "MENUNGGU_NILAI"
  | "SUDAH_DINILAI"
  | "TERLAMBAT";

export interface QuestionOptionInput {
  label: string; // A, B, C, D, E
  teks_opsi?: string | null;
  gambar_opsi?: string | null;
  is_benar: boolean;
}

export interface QuestionOptionItem extends QuestionOptionInput {
  id: string;
  soal_id: string;
}

export interface QuestionItemInput {
  id?: string;
  nomor_urut: number;
  tipe_soal: TipeSoal;
  pertanyaan: string;
  gambar_soal?: string | null;
  bobot_poin: number;
  kunci_jawaban?: string | null;
  pembahasan?: string | null;
  opsi: QuestionOptionInput[];
}

export interface QuestionItem extends Omit<QuestionItemInput, "opsi"> {
  id: string;
  tugas_id: string;
  opsi: QuestionOptionItem[];
}

export interface CreateInteractiveTaskInput {
  judul: string;
  deskripsi: string;
  kelas_id: string;
  mapel_id: string;
  pertemuan_id?: string | null;
  deadline: string;
  durasi_menit?: number | null;
  acak_soal?: boolean;
  acak_opsi?: boolean;
  tampilkan_nilai_instan?: boolean;
  poin_maksimal?: number;
  soal: QuestionItemInput[];
}

export interface StudentTaskSubmissionItem {
  id: string;
  siswa_id: string;
  status: StatusSubmission;
  nilai?: number | null;
  catatan_guru?: string | null;
  submitted_at?: Date | string | null;
}

export interface TaskListItem {
  id: string;
  judul: string;
  deskripsi?: string | null;
  kelas_id: string;
  nama_kelas?: string;
  mapel_id: string;
  nama_mapel?: string;
  pertemuan_id?: string | null;
  tipe_tugas: TipeTugas;
  durasi_menit?: number | null;
  deadline: Date | string;
  poin_maksimal: number;
  status: StatusTugas;
  total_soal?: number;
  total_submissions?: number;
  submission?: StudentTaskSubmissionItem | null;
}
