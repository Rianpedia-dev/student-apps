/**
 * Domain Type Definitions for Student, Teacher & Admin Dashboard Data
 */

import type { PengumumanItem, PrestasiItem, KelasItem } from "./index";

export interface DashboardClassmate {
  id: string;
  name: string;
  image?: string | null;
  gender?: string | null;
}

export interface StudentDashboardSummary {
  user: {
    id: string;
    name: string;
    nis: string;
    image: string | null;
    gender?: string | null;
    kelas: string;
    points: number;
  };
  kelasInfo: KelasItem | null;
  totalHadirBulanIni: number;
  totalKegiatanBulanIni: number;
  classmates: DashboardClassmate[];
  announcements: PengumumanItem[];
  achievements: PrestasiItem[];
  scheduleToday: {
    id: string;
    mapel: string;
    guru: string;
    jamMulai: string;
    jamSelesai: string;
    ruangan?: string | null;
  }[];
}

export interface TeacherDashboardSummary {
  user: {
    id: string;
    name: string;
    nip?: string | null;
    image?: string | null;
    guruBidang?: string | null;
  };
  totalSiswaBinaan: number;
  totalKelasDiajar: number;
  totalTugasAktif: number;
  jadwalHariIni: any[];
  pengumumanTerbaru: PengumumanItem[];
}
