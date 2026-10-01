export { cn } from "cn";

/**
 * Mendapatkan Tahun Pelajaran dan Semester berjalan berdasarkan aturan PRD Section 18:
 * - Jika bulan saat ini >= Juli (7): Tahun Pelajaran = {tahun}/{tahun+1}, Semester 1
 * - Jika bulan saat ini < Juli (7): Tahun Pelajaran = {tahun-1}/{tahun}, Semester 2
 */
export function getAcademicYear(dateInput: Date = new Date()) {
  const currentMonth = dateInput.getMonth() + 1; // 1-12
  const currentYear = dateInput.getFullYear();

  if (currentMonth >= 7) {
    return {
      tahunPelajaran: `${currentYear}/${currentYear + 1}`,
      semester: "Semester 1",
      semesterNum: 1,
    };
  } else {
    return {
      tahunPelajaran: `${currentYear - 1}/${currentYear}`,
      semester: "Semester 2",
      semesterNum: 2,
    };
  }
}

export function formatDateIndo(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return "-";
  const date = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return String(dateStrOrObj);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return "-";
  const date = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return String(dateStrOrObj);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getRoleFromStatus(status: string | number): "admin" | "guru" | "siswa" | "unverified" {
  const s = String(status);
  if (s === "3") return "admin";
  if (s === "2" || s === "4") return "guru";
  if (s === "1") return "siswa";
  return "unverified";
}

export function getRoleLabel(status: string | number): string {
  const s = String(status);
  if (s === "3") return "Administrator";
  if (s === "4") return "Guru & Wali Kelas";
  if (s === "2") return "Guru";
  if (s === "1") return "Siswa";
  return "Belum Terverifikasi";
}

/**
 * Mendapatkan URL foto profil default berdasarkan gender:
 * - Laki-laki ('L', 'laki-laki', 'pria', dll) -> /profil-default-laki-laki.avif
 * - Perempuan ('P', 'perempuan', 'wanita', dll) -> /profil-default-perempuan.avif
 */
export function getDefaultProfileImage(gender?: string | null, name?: string | null): string {
  if (gender) {
    const g = String(gender).trim().toUpperCase();
    if (g === "P" || g === "PEREMPUAN" || g === "WANITA" || g === "F" || g === "FEMALE") {
      return "/profil-default-perempuan.avif";
    }
    if (g === "L" || g === "LAKI-LAKI" || g === "PRIA" || g === "M" || g === "MALE") {
      return "/profil-default-laki-laki.avif";
    }
  }

  // Cek nama jika gender belum tersedia
  if (name) {
    const lower = name.toLowerCase();
    const femaleKeywords = [
      "ustadzah", "zahra", "salsabila", "fatimah", "aisyah", "maryam", "khadijah",
      "nurul", "salma", "dewi", "nadia", "yasmin", "keisha", "safitri", "rina",
      "maya", "laila", "putri", "haura", "insyirah", "amira", "humaira"
    ];
    if (femaleKeywords.some((kw) => lower.includes(kw))) {
      return "/profil-default-perempuan.avif";
    }
  }

  return "/profil-default-laki-laki.avif";
}

/**
 * Mengembalikan foto profil jika pengguna sudah mengunggah, atau foto default sesuai gender/nama jika belum update.
 */
export function getUserProfileImage(image?: string | null, gender?: string | null, name?: string | null): string {
  if (image && typeof image === "string" && image.trim() !== "" && image !== "null" && image !== "undefined") {
    return image;
  }
  return getDefaultProfileImage(gender, name);
}

/**
 * Bobot urutan hari standar sekolah dari Senin ke Minggu/Ahad.
 */
export const HARI_ORDER_WEIGHTS: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
  minggu: 7,
  ahad: 7,
};

export function getHariWeight(hari?: string | null): number {
  if (!hari) return 999;
  const key = hari.trim().toLowerCase();
  return HARI_ORDER_WEIGHTS[key] ?? 100;
}

export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 9999;
  const clean = timeStr.trim();
  const start = clean.split("-")[0]?.trim() || clean;
  const parts = start.split(":");
  if (parts.length < 2) return 9999;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h)) return 9999;
  return h * 60 + (isNaN(m) ? 0 : m);
}

export function compareScheduleTime(
  hariA?: string | null,
  jamMulaiA?: string | null,
  jamSelesaiA?: string | null,
  hariB?: string | null,
  jamMulaiB?: string | null,
  jamSelesaiB?: string | null
): number {
  const dayA = getHariWeight(hariA);
  const dayB = getHariWeight(hariB);
  if (dayA !== dayB) {
    return dayA - dayB;
  }

  const startA = parseTimeToMinutes(jamMulaiA);
  const startB = parseTimeToMinutes(jamMulaiB);
  if (startA !== startB) {
    return startA - startB;
  }

  const endA = parseTimeToMinutes(jamSelesaiA);
  const endB = parseTimeToMinutes(jamSelesaiB);
  if (endA !== endB) {
    return endA - endB;
  }

  return 0;
}

/**
 * Mengurutkan daftar mata pelajaran secara kronologis:
 * 1. Berdasarkan hari (Senin -> Selasa -> Rabu -> Kamis -> Jumat -> dst)
 * 2. Berdasarkan jam mulai paling awal ke paling akhir
 * 3. Mata pelajaran tanpa jadwal ditaruh di akhir, diurutkan menurut nama mapel
 */
export function sortSubjectsBySchedule<
  T extends {
    jadwalHari?: string | null;
    jadwalWaktu?: string | null;
    jamMulai?: string | null;
    namaMapel: string;
  }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dayA = getHariWeight(a.jadwalHari);
    const dayB = getHariWeight(b.jadwalHari);

    if (dayA !== dayB) {
      return dayA - dayB;
    }

    if (dayA < 999) {
      const timeA = parseTimeToMinutes(a.jamMulai || a.jadwalWaktu);
      const timeB = parseTimeToMinutes(b.jamMulai || b.jadwalWaktu);
      if (timeA !== timeB) return timeA - timeB;
    }

    return a.namaMapel.localeCompare(b.namaMapel);
  });
}

