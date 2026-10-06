/**
 * Domain Type Definitions for Pertemuan & Materi KBM
 */

export type TipeMateri = "DOKUMEN" | "VIDEO" | "LINK" | "CATATAN";

export interface MateriAjarItem {
  id: string;
  pertemuan_id: string;
  judul: string;
  tipe: TipeMateri;
  url_file?: string | null;
  teks_konten?: string | null;
  urutan: number;
  created_at?: Date | string | null;
}

export interface ProgressSiswaItem {
  id: string;
  pertemuan_id: string;
  siswa_id: string;
  sudah_dibaca: boolean;
  selesai_pada?: Date | string | null;
}

export interface PertemuanItem {
  id: string;
  kelas_id: string;
  mapel_id: string;
  guru_id: string;
  pertemuan_ke: number;
  judul: string;
  deskripsi?: string | null;
  tanggal: Date | string;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  is_published: boolean;
  materi?: MateriAjarItem[];
  progressSiswa?: ProgressSiswaItem[];
  guru?: {
    id: string;
    name: string;
    image?: string | null;
    email?: string | null;
    guru_bidang?: string | null;
  };
}

export interface CreatePertemuanInput {
  kelas_id: string;
  mapel_id: string;
  pertemuan_ke: number;
  judul: string;
  deskripsi?: string;
  tanggal: string;
  jam_mulai?: string;
  jam_selesai?: string;
  is_published?: boolean;
}

export interface CreateMateriInput {
  pertemuan_id: string;
  judul: string;
  tipe: TipeMateri;
  url_file?: string | null;
  teks_konten?: string | null;
  urutan?: number;
}
