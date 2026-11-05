import * as XLSX from "xlsx";

export interface ScheduleExcelRow {
  no?: number;
  jenjang: string;
  namaKelas: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  kodeMapel: string;
  namaMapel: string;
  niyGuru?: string;
  namaGuru: string;
  tahunPelajaran?: string;
  semester?: string;
}

export interface ScheduleReferenceData {
  classes: Array<{ id: string; nama: string; jenjang: string }>;
  subjects: Array<{ id: string; nama: string; kode: string; jenjang?: string }>;
  teachers: Array<{ id: string; nama: string; nip?: string | null; guru_bidang?: string | null }>;
}

/**
 * Membuat template Excel resmi untuk import jadwal pelajaran.
 * Sheet 1: Template Format Isian
 * Sheet 2: Data Referensi (Kelas, Mapel, Guru) agar penginput tidak salah ketik.
 */
export function generateScheduleTemplateBuffer(ref: ScheduleReferenceData): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Format
  const templateRows = [
    {
      "No": 1,
      "Jenjang": "SD",
      "Nama Kelas": ref.classes[0]?.nama || "Kelas 4 - Mehmed Al Fatih",
      "Hari": "Senin",
      "Jam Mulai (HH:MM)": "07:30",
      "Jam Selesai (HH:MM)": "08:50",
      "Kode Mapel": ref.subjects[0]?.kode || "PAI",
      "Nama Mata Pelajaran": ref.subjects[0]?.nama || "Pendidikan Agama Islam",
      "NIY Guru": ref.teachers[0]?.nip || "19850101",
      "Nama Guru Pengampu": ref.teachers[0]?.nama || "Ustadz Ahmad, S.Pd.",
      "Tahun Pelajaran": "2026/2027",
      "Semester (1/2)": "1",
    },
    {
      "No": 2,
      "Jenjang": "SD",
      "Nama Kelas": ref.classes[0]?.nama || "Kelas 4 - Mehmed Al Fatih",
      "Hari": "Senin",
      "Jam Mulai (HH:MM)": "08:50",
      "Jam Selesai (HH:MM)": "10:10",
      "Kode Mapel": ref.subjects[1]?.kode || "MTK",
      "Nama Mata Pelajaran": ref.subjects[1]?.nama || "Matematika",
      "NIY Guru": ref.teachers[1]?.nip || "19880202",
      "Nama Guru Pengampu": ref.teachers[1]?.nama || "Ustadzah Siti, S.Si.",
      "Tahun Pelajaran": "2026/2027",
      "Semester (1/2)": "1",
    },
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths
  wsTemplate["!cols"] = [
    { wch: 6 },  // No
    { wch: 10 }, // Jenjang
    { wch: 30 }, // Nama Kelas
    { wch: 12 }, // Hari
    { wch: 18 }, // Jam Mulai
    { wch: 18 }, // Jam Selesai
    { wch: 14 }, // Kode Mapel
    { wch: 30 }, // Nama Mapel
    { wch: 16 }, // NIY Guru
    { wch: 30 }, // Nama Guru
    { wch: 16 }, // Tahun Pelajaran
    { wch: 16 }, // Semester
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, "Template Jadwal");

  // Sheet 2: Data Referensi
  const refKelasRows = ref.classes.map((c, i) => ({
    "No": i + 1,
    "Nama Kelas Valid": c.nama,
    "Jenjang": c.jenjang,
  }));
  const wsRefKelas = XLSX.utils.json_to_sheet(refKelasRows);
  wsRefKelas["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsRefKelas, "Ref Kelas");

  const refMapelRows = ref.subjects.map((m, i) => ({
    "No": i + 1,
    "Kode Mapel Valid": m.kode,
    "Nama Mapel Valid": m.nama,
  }));
  const wsRefMapel = XLSX.utils.json_to_sheet(refMapelRows);
  wsRefMapel["!cols"] = [{ wch: 6 }, { wch: 15 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsRefMapel, "Ref Mapel");

  const refGuruRows = ref.teachers.map((t, i) => ({
    "No": i + 1,
    "NIY Guru": t.nip || "-",
    "Nama Guru Valid": t.nama,
    "Bidang": t.guru_bidang || "-",
  }));
  const wsRefGuru = XLSX.utils.json_to_sheet(refGuruRows);
  wsRefGuru["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsRefGuru, "Ref Guru");

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(out);
}

/**
 * Ekspor data jadwal ke file Excel (.xlsx) dengan auto-fit kolom dan styling rapi.
 */
export function exportSchedulesToExcelBuffer(
  schedules: Array<{
    id: string;
    kelasNama: string;
    jenjang: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    mapelKode: string;
    mapelNama: string;
    guruNama: string;
    guruNiy?: string;
    tahunPelajaran?: string;
    semester?: string;
  }>,
  title: string
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const rows = schedules.map((s, idx) => ({
    "No": idx + 1,
    "Jenjang": s.jenjang || "SD",
    "Rombel Kelas": s.kelasNama,
    "Hari": s.hari,
    "Jam Mulai": s.jamMulai,
    "Jam Selesai": s.jamSelesai,
    "Kode Mapel": s.mapelKode,
    "Mata Pelajaran": s.mapelNama,
    "NIY Guru": s.guruNiy || "-",
    "Guru Pengampu": s.guruNama,
    "Tahun Pelajaran": s.tahunPelajaran || "2026/2027",
    "Semester": s.semester === "2" ? "2 (Genap)" : "1 (Ganjil)",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = [
    { wch: 6 },  // No
    { wch: 10 }, // Jenjang
    { wch: 28 }, // Rombel Kelas
    { wch: 12 }, // Hari
    { wch: 12 }, // Jam Mulai
    { wch: 12 }, // Jam Selesai
    { wch: 14 }, // Kode Mapel
    { wch: 32 }, // Mata Pelajaran
    { wch: 16 }, // NIY Guru
    { wch: 30 }, // Guru Pengampu
    { wch: 16 }, // Tahun Pelajaran
    { wch: 16 }, // Semester
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Pelajaran");

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(out);
}

/**
 * Mem-parse file Excel jadwal pelajaran yang diupload.
 */
export function parseScheduleExcelBuffer(
  buffer: ArrayBuffer | Buffer,
  ref: ScheduleReferenceData,
  defaultTahun: string = "2026/2027",
  defaultSemester: string = "1"
): {
  validRows: Array<{
    kelasId: bigint;
    mapelId: bigint;
    guruId: bigint;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    tahunPelajaran: string;
    semester: string;
    kelasNama: string;
    mapelNama: string;
    guruNama: string;
  }>;
  errors: string[];
} {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("File Excel kosong atau tidak memiliki sheet.");
  }

  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  if (rawRows.length === 0) {
    throw new Error("Sheet Excel tidak memiliki baris data jadwal.");
  }

  // Siapkan lookup map dengan normalisasi case-insensitive
  const classMap = new Map<string, { id: string; nama: string }>();
  ref.classes.forEach((c) => {
    classMap.set(c.nama.trim().toLowerCase(), { id: c.id, nama: c.nama });
  });

  const subjectMap = new Map<string, { id: string; nama: string; kode: string }>();
  ref.subjects.forEach((m) => {
    subjectMap.set(m.kode.trim().toLowerCase(), { id: m.id, nama: m.nama, kode: m.kode });
    subjectMap.set(m.nama.trim().toLowerCase(), { id: m.id, nama: m.nama, kode: m.kode });
  });

  const teacherMap = new Map<string, { id: string; nama: string }>();
  ref.teachers.forEach((t) => {
    teacherMap.set(t.nama.trim().toLowerCase(), { id: t.id, nama: t.nama });
    if (t.nip) {
      teacherMap.set(t.nip.trim().toLowerCase(), { id: t.id, nama: t.nama });
    }
  });

  const validDays = new Set(["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"]);

  const validRows: Array<{
    kelasId: bigint;
    mapelId: bigint;
    guruId: bigint;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    tahunPelajaran: string;
    semester: string;
    kelasNama: string;
    mapelNama: string;
    guruNama: string;
  }> = [];

  const errors: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Header di baris 1

    // Ekstrak nilai dari berbagai variasi nama kolom
    const rawKelas = (row["Nama Kelas"] || row["Kelas"] || row["Rombel Kelas"] || "") as string;
    const rawHari = (row["Hari"] || "") as string;
    const rawJamMulai = (row["Jam Mulai (HH:MM)"] || row["Jam Mulai"] || "") as string;
    const rawJamSelesai = (row["Jam Selesai (HH:MM)"] || row["Jam Selesai"] || "") as string;
    const rawKodeMapel = (row["Kode Mapel"] || row["Kode"] || "") as string;
    const rawNamaMapel = (row["Nama Mata Pelajaran"] || row["Mata Pelajaran"] || row["Nama Mapel"] || "") as string;
    const rawNiyGuru = (row["NIY Guru"] || row["NIY"] || row["NIP Guru"] || "") as string;
    const rawNamaGuru = (row["Nama Guru Pengampu"] || row["Nama Guru"] || row["Guru"] || "") as string;
    const rawTahun = (row["Tahun Pelajaran"] || defaultTahun) as string;
    const rawSemester = (row["Semester (1/2)"] || row["Semester"] || defaultSemester) as string;

    const kelasStr = String(rawKelas).trim();
    const hariStr = String(rawHari).trim();
    const jamMulaiStr = String(rawJamMulai).trim();
    const jamSelesaiStr = String(rawJamSelesai).trim();
    const kodeMapelStr = String(rawKodeMapel).trim();
    const namaMapelStr = String(rawNamaMapel).trim();
    const namaGuruStr = String(rawNamaGuru).trim();
    const niyGuruStr = String(rawNiyGuru).trim();

    // Validasi field kosong
    if (!kelasStr) {
      errors.push(`Baris ${rowNum}: Nama Kelas tidak boleh kosong.`);
      return;
    }
    if (!hariStr) {
      errors.push(`Baris ${rowNum}: Hari tidak boleh kosong.`);
      return;
    }
    if (!jamMulaiStr || !jamSelesaiStr) {
      errors.push(`Baris ${rowNum}: Jam Mulai & Jam Selesai wajib diisi.`);
      return;
    }

    // Match Kelas
    const matchedClass = classMap.get(kelasStr.toLowerCase());
    if (!matchedClass) {
      errors.push(`Baris ${rowNum}: Kelas "${kelasStr}" tidak ditemukan di database.`);
      return;
    }

    // Match Hari
    const hariLower = hariStr.toLowerCase();
    if (!validDays.has(hariLower)) {
      errors.push(`Baris ${rowNum}: Hari "${hariStr}" tidak valid (Gunakan Senin-Sabtu).`);
      return;
    }
    const formattedHari = hariLower.charAt(0).toUpperCase() + hariLower.slice(1);

    // Match Mapel (bisa via kode atau nama)
    const matchedMapel =
      (kodeMapelStr ? subjectMap.get(kodeMapelStr.toLowerCase()) : null) ||
      (namaMapelStr ? subjectMap.get(namaMapelStr.toLowerCase()) : null);

    if (!matchedMapel) {
      errors.push(`Baris ${rowNum}: Mata Pelajaran "${kodeMapelStr || namaMapelStr}" tidak ditemukan.`);
      return;
    }

    // Match Guru (bisa via NIY atau Nama)
    const matchedGuru =
      (niyGuruStr ? teacherMap.get(niyGuruStr.toLowerCase()) : null) ||
      (namaGuruStr ? teacherMap.get(namaGuruStr.toLowerCase()) : null);

    if (!matchedGuru) {
      errors.push(`Baris ${rowNum}: Guru "${namaGuruStr || niyGuruStr}" tidak ditemukan di sistem.`);
      return;
    }

    // Format Jam (HH:mm)
    const formatTime = (t: string) => {
      const parts = t.replace(".", ":").split(":");
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
      }
      return t;
    };

    const finalJamMulai = formatTime(jamMulaiStr);
    const finalJamSelesai = formatTime(jamSelesaiStr);

    const semesterClean = String(rawSemester).includes("2") ? "2" : "1";
    const tahunClean = String(rawTahun).trim() || defaultTahun;

    validRows.push({
      kelasId: BigInt(matchedClass.id),
      mapelId: BigInt(matchedMapel.id),
      guruId: BigInt(matchedGuru.id),
      hari: formattedHari,
      jamMulai: finalJamMulai,
      jamSelesai: finalJamSelesai,
      tahunPelajaran: tahunClean,
      semester: semesterClean,
      kelasNama: matchedClass.nama,
      mapelNama: matchedMapel.nama,
      guruNama: matchedGuru.nama,
    });
  });

  return { validRows, errors };
}

