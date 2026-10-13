export type ViolationSeverity = "RINGAN" | "SEDANG" | "BERAT";
export type ViolationStatus = "TERCATAT" | "DIBINA" | "SELESAI";

export interface ViolationPresetItem {
  id: string;
  label: string;
  severity: ViolationSeverity;
  defaultPoints: number;
}

export interface ViolationCategoryMeta {
  id: string;
  name: string;
  description: string;
  color: "amber" | "purple" | "rose" | "teal" | "blue";
  iconName: string;
  presets: ViolationPresetItem[];
}

export const VIOLATION_SEVERITY_CONFIG: Record<
  ViolationSeverity,
  {
    label: string;
    points: number;
    color: "amber" | "orange" | "rose";
    badgeVariant: "amber" | "destructive" | "purple" | "default";
    description: string;
  }
> = {
  RINGAN: {
    label: "Ringan",
    points: 5,
    color: "amber",
    badgeVariant: "amber",
    description: "Nasihat lisan & pembiasaan mandiri oleh guru/wali kelas",
  },
  SEDANG: {
    label: "Sedang",
    points: 15,
    color: "orange",
    badgeVariant: "purple",
    description: "Konseling wali kelas & tugas pembinaan edukatif",
  },
  BERAT: {
    label: "Berat",
    points: 30,
    color: "rose",
    badgeVariant: "destructive",
    description: "Pendampingan khusus wali kelas, guru BK, dan orang tua",
  },
};

export const VIOLATION_CATEGORIES: ViolationCategoryMeta[] = [
  {
    id: "ibadah",
    name: "Ibadah & Karakter Islami",
    description: "Ketertiban sholat fardhu/dhuha, adab tilawah, dan ibadah harian",
    color: "teal",
    iconName: "BookOpenCheck",
    presets: [
      { id: "ibadah-1", label: "Terlambat / Masbuk Sholat Berjamaah", severity: "RINGAN", defaultPoints: 5 },
      { id: "ibadah-2", label: "Tidak membawa perlengkapan sholat (Sajadah/Mukena)", severity: "RINGAN", defaultPoints: 5 },
      { id: "ibadah-3", label: "Bercanda atau mengganggu teman saat sholat/dzikir", severity: "SEDANG", defaultPoints: 10 },
      { id: "ibadah-4", label: "Sengaja tidak mengikuti sholat berjamaah tanpa uzur", severity: "BERAT", defaultPoints: 25 },
    ],
  },
  {
    id: "ipad",
    name: "Kedisiplinan iPad & Digital",
    description: "Penggunaan perangkat edukasi iPad secara bertanggung jawab",
    color: "blue",
    iconName: "Tablet",
    presets: [
      { id: "ipad-1", label: "iPad tidak diisi daya sebelum jam KBM dimulai", severity: "RINGAN", defaultPoints: 5 },
      { id: "ipad-2", label: "Membuka game / aplikasi non-pelajaran di jam KBM", severity: "SEDANG", defaultPoints: 15 },
      { id: "ipad-3", label: "Tidak mengunci layar saat diminta oleh ustadz/ustadzah", severity: "SEDANG", defaultPoints: 10 },
      { id: "ipad-4", label: "Mencoba melewati (bypass) kode pembatasan iPad sekolah", severity: "BERAT", defaultPoints: 25 },
    ],
  },
  {
    id: "seragam",
    name: "Seragam & Kerapian Atribut",
    description: "Kerapian busana muslim/muslimah dan kelengkapan atribut sekolah",
    color: "purple",
    iconName: "Shirt",
    presets: [
      { id: "seragam-1", label: "Atribut upacara tidak lengkap (Dasi/Topi/Peci)", severity: "RINGAN", defaultPoints: 5 },
      { id: "seragam-2", label: "Memakai seragam yang tidak sesuai dengan jadwal harian", severity: "RINGAN", defaultPoints: 5 },
      { id: "seragam-3", label: "Sepatu atau kaus kaki tidak sesuai ketentuan sekolah", severity: "RINGAN", defaultPoints: 5 },
      { id: "seragam-4", label: "Kerapian rambut / kuku / riasan tidak sesuai tata tertib", severity: "SEDANG", defaultPoints: 10 },
    ],
  },
  {
    id: "ketertiban",
    name: "Ketertiban & Kehadiran Kelas",
    description: "Kedisiplinan waktu masuk kelas, piket, dan ketertiban lingkungan",
    color: "amber",
    iconName: "Clock",
    presets: [
      { id: "tertib-1", label: "Terlambat masuk ke ruang kelas saat pergantian jam", severity: "RINGAN", defaultPoints: 5 },
      { id: "tertib-2", label: "Tidak melaksanakan tugas piket kebersihan kelas", severity: "RINGAN", defaultPoints: 5 },
      { id: "tertib-3", label: "Meninggalkan ruang kelas tanpa izin dari guru pengampu", severity: "SEDANG", defaultPoints: 15 },
      { id: "tertib-4", label: "Membuang sampah sembarangan di lingkungan sekolah", severity: "SEDANG", defaultPoints: 10 },
    ],
  },
  {
    id: "akhlak",
    name: "Adab, Sikap & Etika Santri",
    description: "Sopan santun kepada guru, tutur kata terpuji, dan ukhuwah sesama teman",
    color: "rose",
    iconName: "HeartHandshake",
    presets: [
      { id: "akhlak-1", label: "Mengabaikan instruksi atau berbicara saat guru menjelaskan", severity: "RINGAN", defaultPoints: 5 },
      { id: "akhlak-2", label: "Bertutur kata kurang sopan atau meninggikan nada bicara", severity: "SEDANG", defaultPoints: 15 },
      { id: "akhlak-3", label: "Mengolok-olok atau memanggil teman dengan sebutan buruk", severity: "SEDANG", defaultPoints: 15 },
      { id: "akhlak-4", label: "Tindakan perundungan (bullying) atau perkelahian fisik", severity: "BERAT", defaultPoints: 30 },
    ],
  },
];

/**
 * Metadata parser untuk field keterangan yang tersimpan di tbl_pelanggaran.
 * Mendukung format terstruktur: "[STATUS:SELESAI][SEV:SEDANG][PTS:10] Deskripsi kejadian"
 * Tetap ramah membaca format catatan polos lama.
 */
export interface ParsedViolation {
  status?: ViolationStatus;
  severity: ViolationSeverity;
  points: number;
  cleanKeterangan: string;
  tindakan?: string;
}

export function parseViolationKeterangan(rawKeterangan?: string | null): ParsedViolation {
  if (!rawKeterangan) {
    return {
      status: "TERCATAT",
      severity: "RINGAN",
      points: 5,
      cleanKeterangan: "-",
    };
  }

  let text = rawKeterangan.trim();
  let status: ViolationStatus = "TERCATAT";
  let severity: ViolationSeverity = "RINGAN";
  let points = 5;
  let tindakan: string | undefined = undefined;

  // Bersihkan Status Tag lama jika ada
  text = text.replace(/\[STATUS:(TERCATAT|DIBINA|SELESAI)\]/i, "").trim();

  // Cek Severity Tag: [SEV:RINGAN|SEDANG|BERAT]
  const sevMatch = text.match(/\[SEV:(RINGAN|SEDANG|BERAT)\]/i);
  if (sevMatch) {
    severity = sevMatch[1].toUpperCase() as ViolationSeverity;
    text = text.replace(sevMatch[0], "").trim();
    points = VIOLATION_SEVERITY_CONFIG[severity]?.points ?? 5;
  }

  // Cek Points Tag: [PTS:15]
  const ptsMatch = text.match(/\[PTS:(\d+)\]/i);
  if (ptsMatch) {
    points = parseInt(ptsMatch[1], 10) || points;
    text = text.replace(ptsMatch[0], "").trim();
  }

  // Cek Tindakan Pembinaan Tag: [TINDAKAN:Nasihat lisan oleh wali kelas]
  const tindakanMatch = text.match(/\[TINDAKAN:(.*?)\]/i);
  if (tindakanMatch) {
    tindakan = tindakanMatch[1].trim();
    text = text.replace(tindakanMatch[0], "").trim();
  }

  return {
    status,
    severity,
    points,
    cleanKeterangan: text || rawKeterangan,
    tindakan,
  };
}

/**
 * Format string penyimpanan untuk tbl_pelanggaran.keterangan
 */
export function formatViolationKeterangan(params: {
  keterangan: string;
  severity?: ViolationSeverity;
  points?: number;
  tindakan?: string;
  status?: string; // deprecated optional
}): string {
  const severity = params.severity || "RINGAN";
  const points = params.points ?? (VIOLATION_SEVERITY_CONFIG[severity]?.points || 5);

  let formatted = `[SEV:${severity}][PTS:${points}]`;
  if (params.tindakan && params.tindakan.trim()) {
    formatted += `[TINDAKAN:${params.tindakan.trim()}]`;
  }
  formatted += ` ${params.keterangan.trim()}`;
  return formatted.trim();
}

/**
 * Cari meta kategori berdasarkan nama
 */
export function getCategoryMeta(categoryName?: string | null): ViolationCategoryMeta | undefined {
  if (!categoryName) return undefined;
  const lower = categoryName.toLowerCase();
  return VIOLATION_CATEGORIES.find(
    (c) => c.name.toLowerCase() === lower || lower.includes(c.id) || lower.includes(c.name.toLowerCase().split(" ")[0])
  );
}

/**
 * Panduan Tata Tertib & Adab Al-Azhar Cairo untuk Tab Panduan Siswa
 */
export const SCHOOL_RULES_GUIDE = [
  {
    title: "Adab dan Ibadah Harian",
    rules: [
      "Wajib mengikuti Sholat Dhuha dan Sholat Dzuhur berjamaah secara khusyuk.",
      "Membawa perlengkapan sholat pribadi (sajadah, peci untuk ikhwan, mukena untuk akhwat) dalam kondisi bersih dan wangi.",
      "Menjaga adab zikir dan doa bersama setelah sholat, tidak bersuara keras atau bercanda.",
    ],
  },
  {
    title: "Kedisiplinan & Etika iPad Edukasi",
    rules: [
      "iPad adalah sarana penunjang pembelajaran resmi; pastikan baterai telah terisi penuh dari rumah.",
      "Dilarang menginstal game, membuka media sosial, atau membuka konten non-akademik selama jam KBM.",
      "Dilarang mematikan atau memotong kode pembatasan (Apple Restriction Code) sekolah.",
      "Kunci layar (lock screen) dengan tertib saat guru sedang memberikan penjelasan.",
    ],
  },
  {
    title: "Seragam & Identitas Diri Santri",
    rules: [
      "Mengenakan seragam resmi harian Al-Azhar Cairo sesuai jadwal yang telah ditentukan.",
      "Memakai atribut upacara lengkap (topi, dasi, ikat pinggang, dan sepatu hitam tertutup).",
      "Menjaga kerapian potongan rambut bagi santri ikhwan dan ketertiban jilbab bagi santri akhwat.",
    ],
  },
  {
    title: "Akhlakul Karimah & Ukhuwah Islamiyah",
    rules: [
      "Mengucapkan salam dan bersikap takzim kepada para ustadz, ustadzah, dan seluruh staf sekolah.",
      "Menjaga lisan dari perkataan kotor, dusta, gunjingan, atau panggilan buruk antar sesama teman.",
      "Mengedepankan semangat tolong-menolong, ukhuwah Islamiyah, dan menolak keras segala bentuk perundungan (bullying).",
    ],
  },
];
