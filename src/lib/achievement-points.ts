export const TINGKAT_PRESTASI = [
  "Internasional",
  "Nasional",
  "Daerah/Kota",
  "Dalam Sekolah",
] as const;

export type TingkatPrestasi = (typeof TINGKAT_PRESTASI)[number];

export const PERINGKAT_PRESTASI = [
  "Juara 1",
  "Juara 2",
  "Juara 3",
  "Harapan",
] as const;

export type PeringkatPrestasi = (typeof PERINGKAT_PRESTASI)[number];

/**
 * Matriks Poin Skala 1 - 16
 *
 * Tingkat Kompetisi       | Juara 1 | Juara 2 | Juara 3 | Harapan
 * ----------------------- | ------- | ------- | ------- | -------
 * Internasional           | 16      | 15      | 14      | 13
 * Nasional                | 12      | 11      | 10      | 9
 * Daerah/Kota             | 8       | 7       | 6       | 5
 * Dalam Sekolah           | 4       | 3       | 2       | 1
 *
 * Catatan: Harapan 1, 2, 3 disederhanakan masuk ke "Harapan".
 */
export const ACHIEVEMENT_POINTS_MATRIX: Record<TingkatPrestasi, Record<PeringkatPrestasi, number>> = {
  Internasional: {
    "Juara 1": 16,
    "Juara 2": 15,
    "Juara 3": 14,
    Harapan: 13,
  },
  Nasional: {
    "Juara 1": 12,
    "Juara 2": 11,
    "Juara 3": 10,
    Harapan: 9,
  },
  "Daerah/Kota": {
    "Juara 1": 8,
    "Juara 2": 7,
    "Juara 3": 6,
    Harapan: 5,
  },
  "Dalam Sekolah": {
    "Juara 1": 4,
    "Juara 2": 3,
    "Juara 3": 2,
    Harapan: 1,
  },
};

/**
 * Menghitung poin prestasi berdasarkan tingkat dan peringkat juara
 */
export function calculateAchievementPoints(tingkat: string, peringkat: string): number {
  const normTingkat = (TINGKAT_PRESTASI.includes(tingkat as TingkatPrestasi)
    ? tingkat
    : "Dalam Sekolah") as TingkatPrestasi;

  let normPeringkat: PeringkatPrestasi = "Harapan";
  if (peringkat === "Juara 1" || peringkat === "Juara 2" || peringkat === "Juara 3") {
    normPeringkat = peringkat;
  } else if (peringkat.toLowerCase().includes("harapan")) {
    normPeringkat = "Harapan";
  }

  return ACHIEVEMENT_POINTS_MATRIX[normTingkat]?.[normPeringkat] ?? 1;
}

/**
 * Menghasilkan informasi badge dan warna berdasarkan tingkat kejuaraan
 */
export function getTingkatBadgeProps(tingkat: string) {
  switch (tingkat) {
    case "Internasional":
      return {
        label: "Internasional",
        colorClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        badgeGradient: "from-purple-600 to-indigo-600 text-white",
        icon: "🌍",
      };
    case "Nasional":
      return {
        label: "Nasional",
        colorClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        badgeGradient: "from-rose-600 to-red-600 text-white",
        icon: "🇮🇩",
      };
    case "Daerah/Kota":
      return {
        label: "Daerah / Kota",
        colorClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
        badgeGradient: "from-blue-600 to-cyan-600 text-white",
        icon: "🏛️",
      };
    default:
      return {
        label: "Dalam Sekolah",
        colorClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        badgeGradient: "from-emerald-600 to-teal-600 text-white",
        icon: "🏫",
      };
  }
}

/**
 * Menghasilkan informasi badge dan warna berdasarkan peringkat juara
 */
export function getPeringkatBadgeProps(peringkat: string) {
  switch (peringkat) {
    case "Juara 1":
      return {
        label: "Juara 1",
        colorClass: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
        badgeGradient: "from-amber-400 via-yellow-400 to-amber-500 text-slate-900 font-bold",
        icon: "🥇",
      };
    case "Juara 2":
      return {
        label: "Juara 2",
        colorClass: "bg-slate-400/15 text-slate-700 dark:text-slate-200 border-slate-400/30",
        badgeGradient: "from-slate-300 to-zinc-400 text-slate-900 font-bold",
        icon: "🥈",
      };
    case "Juara 3":
      return {
        label: "Juara 3",
        colorClass: "bg-orange-500/15 text-orange-800 dark:text-orange-200 border-orange-500/30",
        badgeGradient: "from-amber-700 via-orange-600 to-amber-800 text-white font-bold",
        icon: "🥉",
      };
    default:
      return {
        label: "Juara Harapan",
        colorClass: "bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/30",
        badgeGradient: "from-teal-600 to-emerald-600 text-white font-bold",
        icon: "🎖️",
      };
  }
}

/**
 * Ekstrak angka tingkat kelas (misal: "Kelas 4 - Mehmed Al Fatih" -> 4, "Kelas 7" -> 7)
 */
export function extractClassGrade(className?: string | null): number | null {
  if (!className) return null;
  const match = className.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Normalisasi string nama rombel / kelas untuk pembandingan fleksibel
 */
export function normalizeClassName(className?: string | null): string {
  return (className || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cek apakah dua rombel merupakan kelas yang sama
 * Mendukung variasi seperti:
 * - "Kelas 4 - Mehmed Al Fatih" vs "Kelas 4 - Mehmed Al Fatih"
 * - "Kelas 4 - Mehmed Al Fatih" vs "Mehmed Al Fatih"
 */
export function isSameRombel(classA?: string | null, classB?: string | null): boolean {
  if (!classA || !classB) return false;
  const normA = normalizeClassName(classA);
  const normB = normalizeClassName(classB);
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  return false;
}

/**
 * Mengevaluasi apakah suatu prestasi diraih di kelas sebelumnya (historical)
 * bagi seorang Wali Kelas tertentu.
 */
export function isAchievementFromPreviousClass(
  userClass?: string | null,
  kelasSaatPrestasi?: string | null,
  currentStudentClass?: string | null
): boolean {
  if (!userClass) return false;

  const userGrade = extractClassGrade(userClass);
  const histGrade = extractClassGrade(kelasSaatPrestasi);

  // Jika tingkat kelas saat prestasi lebih kecil dari tingkat kelas saat ini
  if (histGrade !== null && userGrade !== null && histGrade < userGrade) {
    return true;
  }

  // Jika tingkat kelasnya sama atau tidak ada angka, periksa rombel
  if (kelasSaatPrestasi) {
    const isHistGenericGrade =
      normalizeClassName(kelasSaatPrestasi) === `kelas ${userGrade}` ||
      normalizeClassName(kelasSaatPrestasi) === `${userGrade}`;

    if (isHistGenericGrade) {
      if (isSameRombel(userClass, currentStudentClass)) {
        return false;
      }
    }

    if (!isSameRombel(userClass, kelasSaatPrestasi) && !isHistGenericGrade) {
      return true;
    }
  }

  return false;
}


