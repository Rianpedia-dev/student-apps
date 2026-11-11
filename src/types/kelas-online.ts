export type KelasOnlineSessionType = "MAPEL" | "WALI_KELAS";

export interface TeacherClassOption {
  id: string;
  namaKelas: string;
  jenjang: string;
  tingkat: number | null;
}

export interface TeacherSubjectOption {
  id: string;
  kodeMapel: string;
  namaMapel: string;
  warna: string;
}

export interface TeacherPertemuanOption {
  id: string;
  kelasId: string;
  mapelId: string;
  pertemuanKe: number;
  judul: string;
}

export interface TeacherTodayScheduleItem {
  jadwalId: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  mapelWarna: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  activeRoomId: string | null;
}

export interface TeacherOnlineClassContext {
  guruId: string;
  guruName: string;
  guruBidang: string | null;
  status: string;
  isWaliKelas: boolean;
  waliKelas: TeacherClassOption | null;
  hasScheduleMapping: boolean;
  classes: TeacherClassOption[];
  subjectsByClass: Record<string, TeacherSubjectOption[]>;
  pertemuanByPair: Record<string, TeacherPertemuanOption[]>;
  todaySchedules: TeacherTodayScheduleItem[];
}

export interface OnlineClassRoomItem {
  id: string;
  room_name: string;
  room_url: string;
  guru_id: string;
  guru_name: string;
  kelas: string;
  kelas_id: string | null;
  mata_pelajaran: string | null;
  mapel_id: string | null;
  jadwal_id: string | null;
  pertemuan_id: string | null;
  pertemuan_ke: number | null;
  pertemuan_judul: string | null;
  session_type: KelasOnlineSessionType;
  topik: string | null;
  is_attendance_synced: boolean;
  status: string;
  started_at: string | null;
  ended_at?: string | null;
  duration_minutes?: number | null;
  active_participants?: number;
  total_attendance?: number;
}

export interface WaliKelasMonitorItem extends OnlineClassRoomItem {
  isOwnRoom: boolean;
}

export interface CreateRoomInitialPreset {
  sessionType?: KelasOnlineSessionType;
  kelasId?: string;
  mapelId?: string;
  pertemuanId?: string;
  jadwalId?: string;
  topik?: string;
}
