/**
 * Domain Type Definitions for Jadwal & Mata Pelajaran
 */

export type HariType = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";

export interface MataPelajaranItem {
  id: string;
  kode_mapel?: string | null;
  nama_mapel: string;
  jenjang?: string | null;
  tingkat?: number | null;
  deskripsi?: string | null;
  warna_tema?: string | null;
  ikon?: string | null;
  created_at?: Date | string | null;
}

export interface JadwalPelajaranItem {
  id: string;
  kelas_id: string;
  mapel_id: string;
  guru_id: string;
  hari: HariType | string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string | null;
  mapel?: MataPelajaranItem;
  guru?: {
    id: string;
    name: string;
    image?: string | null;
    email?: string | null;
    guru_bidang?: string | null;
  };
}
