import * as XLSX from "xlsx";
import * as path from "path";
import prisma from "../src/lib/prisma";

interface TeacherData {
  no: number;
  nama: string;
  gender: "L" | "P";
  email: string;
  password: string;
}

const teachers: TeacherData[] = [
  { no: 1, nama: "Diah Sakinah, S.Pd.I., Gr.", gender: "P", email: "diah@gmail.com", password: "diah@gmail.com" },
  { no: 2, nama: "Adriana Dwi Ismita, S.Pd., Gr.", gender: "P", email: "adriana@gmail.com", password: "adriana@gmail.com" },
  { no: 3, nama: "Kurniaty Lestari, S.Pd. Gr.", gender: "P", email: "kurniaty@gmail.com", password: "kurniaty@gmail.com" },
  { no: 4, nama: "Jefriyansah, S.Pd.I., M.Pd., Gr.", gender: "L", email: "jefriyansah@gmail.com", password: "jefriyansah@gmail.com" },
  { no: 5, nama: "Mitra Erchandra, M.Pd., Gr.", gender: "L", email: "mitra@gmail.com", password: "mitra@gmail.com" },
  { no: 6, nama: "Halimatussa'diah, S.Ag.", gender: "P", email: "halimatussadiah@gmail.com", password: "halimatussadiah@gmail.com" },
  { no: 7, nama: "M. Alif Akbar, S.Pd., Gr.", gender: "L", email: "alif@gmail.com", password: "alif@gmail.com" },
  { no: 8, nama: "Mutmainnah, S.Pd., Gr.", gender: "P", email: "mutmainnah@gmail.com", password: "mutmainnah@gmail.com" },
  { no: 9, nama: "Marina Oktavia, S.Pd., Gr.", gender: "P", email: "marina@gmail.com", password: "marina@gmail.com" },
  { no: 10, nama: "Inka Widiarti, M.Pd., Gr.", gender: "P", email: "inka@gmail.com", password: "inka@gmail.com" },
  { no: 11, nama: "Muhammad Bagir, S.Pd.", gender: "L", email: "bagir@gmail.com", password: "bagir@gmail.com" },
  { no: 12, nama: "Muhamad Fathul Arifin, S.Pd., M.Ag.", gender: "L", email: "fathul@gmail.com", password: "fathul@gmail.com" },
  { no: 13, nama: "Wahyudi, S.Pd.I., M.Pd., Gr.", gender: "L", email: "wahyudi@gmail.com", password: "wahyudi@gmail.com" },
  { no: 14, nama: "Siti Mardhatillah, S.Pd.", gender: "P", email: "mardhatillah@gmail.com", password: "mardhatillah@gmail.com" },
  { no: 15, nama: "Ayu Lestari, S.H., Gr.", gender: "P", email: "ayulestari@gmail.com", password: "ayulestari@gmail.com" },
  { no: 16, nama: "Intan Mawarni, S.Sos.", gender: "P", email: "intan@gmail.com", password: "intan@gmail.com" },
  { no: 17, nama: "Hilda Oktarina, S.Pd., Gr.", gender: "P", email: "hilda@gmail.com", password: "hilda@gmail.com" },
  { no: 18, nama: "Dwi Tugiastuti, S.Pd.", gender: "P", email: "dwi@gmail.com", password: "dwi@gmail.com" },
  { no: 19, nama: "Arnela Sopiyanti, S.Pd., Gr.", gender: "P", email: "arnela@gmail.com", password: "arnela@gmail.com" },
  { no: 20, nama: "Nova Yunita , S.Pd., Gr.", gender: "P", email: "nova@gmail.com", password: "nova@gmail.com" },
  { no: 21, nama: "Diko Harjuni Tanera, S.Pd., Gr.", gender: "L", email: "diko@gmail.com", password: "diko@gmail.com" },
  { no: 22, nama: "Rima Febriani, S.Pd., Gr.", gender: "P", email: "rima@gmail.com", password: "rima@gmail.com" },
  { no: 23, nama: "Nopri Litanti, S.Pd., Gr.", gender: "P", email: "nopri@gmail.com", password: "nopri@gmail.com" },
  { no: 24, nama: "Rekha Oktavia, S.Pd., Gr.", gender: "P", email: "rekha@gmail.com", password: "rekha@gmail.com" },
  { no: 25, nama: "Fitri Sugiarti, S.Pd., Gr.", gender: "P", email: "fitri@gmail.com", password: "fitri@gmail.com" },
  { no: 26, nama: "Yuda Ardiansyah, S.Pd.", gender: "L", email: "yuda@gmail.com", password: "yuda@gmail.com" },
  { no: 27, nama: "Yosine Susi, S.Si., Gr.", gender: "P", email: "yosine@gmail.com", password: "yosine@gmail.com" },
  { no: 28, nama: "Ujang Supriyadi, M.Pd., Gr.", gender: "L", email: "ujang@gmail.com", password: "ujang@gmail.com" },
  { no: 29, nama: "Rani Suci Ramadhini, S.Pd., Gr.", gender: "P", email: "rani@gmail.com", password: "rani@gmail.com" },
  { no: 30, nama: "Syarifah Najiya, S.Pd., Gr.", gender: "P", email: "syarifah@gmail.com", password: "syarifah@gmail.com" },
  { no: 31, nama: "Miftahul Rayyan Fitrienn, S.Pd., Gr.", gender: "P", email: "miftahul@gmail.com", password: "miftahul@gmail.com" },
  { no: 32, nama: "Sakinah, S.Pd., Gr.", gender: "P", email: "sakinah@gmail.com", password: "sakinah@gmail.com" },
  { no: 33, nama: "Rena Astrlia, S.Pd., Gr.", gender: "P", email: "rena@gmail.com", password: "rena@gmail.com" },
  { no: 34, nama: "Kgs. Aidil Firmansyah, S.Pd., Gr.", gender: "L", email: "aidil@gmail.com", password: "aidil@gmail.com" },
  { no: 35, nama: "Hanny Fransiscka, S.Pd., Gr.", gender: "P", email: "hanny@gmail.com", password: "hanny@gmail.com" },
  { no: 36, nama: "Putri Purnama Sari, S.Pd., Gr.", gender: "P", email: "putri@gmail.com", password: "putri@gmail.com" },
  { no: 37, nama: "Salsabil Triajeng Priseli, S.Pd.", gender: "P", email: "salsabil@gmail.com", password: "salsabil@gmail.com" },
  { no: 38, nama: "Siti Rabiah, S.Pd., Gr.", gender: "P", email: "rabiah@gmail.com", password: "rabiah@gmail.com" },
  { no: 39, nama: "Ayu Pramita, S.Pd., Gr", gender: "P", email: "ayupramita@gmail.com", password: "ayupramita@gmail.com" },
  { no: 40, nama: "Susilo Nugroho, M.Pd., Gr.", gender: "L", email: "susilo@gmail.com", password: "susilo@gmail.com" },
  { no: 41, nama: "Liga Saputra, S.Pd., Gr.", gender: "L", email: "liga@gmail.com", password: "liga@gmail.com" },
  { no: 42, nama: "Ilham Satria Mandala, S.Pd., Gr.", gender: "L", email: "ilham@gmail.com", password: "ilham@gmail.com" },
  { no: 43, nama: "Wahyu Hartomo, S.Kom., Gr.", gender: "L", email: "wahyu@gmail.com", password: "wahyu@gmail.com" },
  { no: 44, nama: "Andri Kurniawan, S.Pd.Gr.", gender: "L", email: "andri@gmail.com", password: "andri@gmail.com" },
  { no: 45, nama: "Kgs. Said, S.Pd., Gr.", gender: "L", email: "said@gmail.com", password: "said@gmail.com" },
  { no: 46, nama: "Larasati Maulidiyah, A.Md. Kom.", gender: "P", email: "larasati@gmail.com", password: "larasati@gmail.com" },
  { no: 47, nama: "Gontorudin, S.Pd., Gr.", gender: "L", email: "gontorudin@gmail.com", password: "gontorudin@gmail.com" },
  { no: 48, nama: "Dasuliansyah, S.Ag.", gender: "L", email: "dasuliansyah@gmail.com", password: "dasuliansyah@gmail.com" },
  { no: 49, nama: "Arwadi, S.Pd.", gender: "L", email: "arwadi@gmail.com", password: "arwadi@gmail.com" },
  { no: 50, nama: "Ahmad Sopian, S.K.M.", gender: "L", email: "ahmad@gmail.com", password: "ahmad@gmail.com" },
  { no: 51, nama: "R. A. Putri Lathifah, S.Pd.", gender: "P", email: "lathifah@gmail.com", password: "lathifah@gmail.com" },
  { no: 52, nama: "Yardiyono, S.Sos., Gr.", gender: "L", email: "yardiyono@gmail.com", password: "yardiyono@gmail.com" },
  { no: 53, nama: "M. Boy Sandi", gender: "L", email: "boysandi@gmail.com", password: "boysandi@gmail.com" },
  { no: 54, nama: "Mitha Nur Oktavia, S.Pd.", gender: "P", email: "mitha@gmail.com", password: "mitha@gmail.com" },
  { no: 55, nama: "Umar Abdul Aziz, S.H.", gender: "L", email: "umar@gmail.com", password: "umar@gmail.com" },
  { no: 56, nama: "M. Royyan Jaya, S. Hum.", gender: "L", email: "royyan@gmail.com", password: "royyan@gmail.com" },
  { no: 57, nama: "Husin, S.Pd., Gr.", gender: "L", email: "husin@gmail.com", password: "husin@gmail.com" },
  { no: 58, nama: "Afah Annisa, S.Hum.", gender: "P", email: "afah@gmail.com", password: "afah@gmail.com" },
  { no: 59, nama: "Jaka Perkasa, Lc., M. Ag.", gender: "L", email: "jaka@gmail.com", password: "jaka@gmail.com" },
  { no: 60, nama: "Risma Anggina Nasution, Lc.", gender: "P", email: "risma@gmail.com", password: "risma@gmail.com" },
  { no: 61, nama: "Aulia Muti'ah, S.Pd., Gr.", gender: "P", email: "aulia@gmail.com", password: "aulia@gmail.com" },
  { no: 62, nama: "Juliantina Dwi Rahma Wati, S.Pd.", gender: "P", email: "juliantina@gmail.com", password: "juliantina@gmail.com" },
  { no: 63, nama: "Kgs. M. Fadlillahi Akbar, S.Psi., MM., Gr.", gender: "L", email: "fadlillahi@gmail.com", password: "fadlillahi@gmail.com" },
  { no: 64, nama: "Salma Tsaniyah, S.SI", gender: "P", email: "salma@gmail.com", password: "salma@gmail.com" },
  { no: 65, nama: "Habib Ahmad Riziq, S.Tr.Kom", gender: "L", email: "habib@gmail.com", password: "habib@gmail.com" },
];

async function generateTeacherExcel() {
  const wb = XLSX.utils.book_new();

  // Ambil referensi kelas dan mapel resmi dari DB jika tersedia
  let classList: string[] = [];
  let subjectList: string[] = [];

  try {
    const [dbClasses, dbSubjects] = await Promise.all([
      prisma.kelas.findMany({
        where: { jenjang: "SMP" },
        orderBy: [{ tingkat: "asc" }, { nama_kelas: "asc" }],
        select: { nama_kelas: true },
      }),
      prisma.mataPelajaran.findMany({
        orderBy: { nama_mapel: "asc" },
        select: { nama_mapel: true },
      }),
    ]);
    classList = dbClasses.map((c) => c.nama_kelas);
    subjectList = dbSubjects.map((s) => s.nama_mapel);
  } catch (err) {
    console.warn("DB query warning (using fallback ref):", err);
  }

  // Sheet 1: Template Guru (Format baku import)
  const headers = [
    "NIY",
    "Nama Lengkap",
    "Jenjang (SD/SMP/ALL)",
    "Status",
    "Email",
    "Password",
    "Jenis Kelamin (L/P)",
    "Bidang Studi",
    "Peran (Guru/Wali Kelas)",
    "Kelas Wali",
    "Apple ID",
    "Password Apple ID",
  ];

  const dataRows = teachers.map((t) => [
    "", // NIY dikosongkan sesuai permintaan
    t.nama,
    "SMP", // Jenjang SMP
    "Guru", // Status pengguna: Guru
    t.email,
    t.password,
    t.gender,
    "", // Bidang studi opsional
    "Guru", // Peran guru aktif
    "", // Kelas wali opsional
    "", // Apple ID opsional
    "", // Password Apple ID opsional
  ]);

  const wsData = [headers, ...dataRows];
  const wsTeachers = XLSX.utils.aoa_to_sheet(wsData);

  // Atur lebar kolom
  wsTeachers["!cols"] = [
    { wch: 18 }, // NIY
    { wch: 42 }, // Nama Lengkap
    { wch: 22 }, // Jenjang (SD/SMP/ALL)
    { wch: 15 }, // Status
    { wch: 28 }, // Email
    { wch: 28 }, // Password
    { wch: 20 }, // Jenis Kelamin (L/P)
    { wch: 25 }, // Bidang Studi
    { wch: 24 }, // Peran (Guru/Wali Kelas)
    { wch: 30 }, // Kelas Wali
    { wch: 25 }, // Apple ID
    { wch: 22 }, // Password Apple ID
  ];

  // Sheet 2: Referensi Kelas & Mapel
  const maxRows = Math.max(classList.length, subjectList.length, 1);
  const refRows = [
    ["No", "Daftar Rombel SMP Al-Azhar", "Daftar Mata Pelajaran Resmi"],
    ...Array.from({ length: maxRows }, (_, idx) => [
      idx + 1,
      classList[idx] || "",
      subjectList[idx] || "",
    ]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef["!cols"] = [{ wch: 6 }, { wch: 35 }, { wch: 35 }];

  // Sheet 3: Panduan Pengisian
  const guideRows = [
    ["Kolom", "Keterangan", "Wajib / Opsional", "Aturan / Nilai Pada File Ini"],
    ["NIY", "Nomor Induk Yayasan", "Opsional", "Dikosongkan sesuai permintaan"],
    ["Nama Lengkap", "Nama guru lengkap beserta gelar akademik", "Wajib", "Terisi 65 nama guru resmi"],
    ["Jenjang (SD/SMP/ALL)", "Pilihan: SD, SMP, atau ALL (lintas jenjang)", "Opsional", "Diset SMP untuk seluruh guru"],
    ["Status", "Status pengguna di sistem Al-Azhar", "Opsional", "Terisi 'Guru'"],
    ["Email", "Email login guru", "Wajib", "Format: [nama_depan]@gmail.com (unik)"],
    ["Password", "Kata sandi login awal guru", "Wajib", "Disamakan dengan email guru"],
    ["Jenis Kelamin (L/P)", "L = Laki-laki, P = Perempuan / Muslimah", "Opsional", "Telah disesuaikan: 28 L dan 37 P"],
    ["Bidang Studi", "Mata pelajaran yang diampu", "Opsional", "Dapat diisi saat jadwal / nanti"],
    ["Peran (Guru/Wali Kelas)", "Peran penugasan", "Opsional", "Diset default 'Guru'"],
    ["Kelas Wali", "Rombel yang diwalikan (jika peran Wali Kelas)", "Opsional", "Dapat diatur di Super Admin Kelola Kelas"],
    ["Apple ID", "Apple ID iPad guru", "Opsional", "Dapat diinput belakangan"],
    ["Password Apple ID", "Sandi Apple ID iPad guru", "Opsional", "Dapat diinput belakangan"],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide["!cols"] = [{ wch: 24 }, { wch: 45 }, { wch: 18 }, { wch: 45 }];

  // Pasang sheets
  XLSX.utils.book_append_sheet(wb, wsTeachers, "Template Guru");
  XLSX.utils.book_append_sheet(wb, wsRef, "Referensi Kelas & Mapel");
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Kolom");

  const rootPath = path.resolve(process.cwd(), "Data_Guru_SMP_AlAzhar.xlsx");
  const publicPath = path.resolve(process.cwd(), "public", "Data_Guru_SMP_AlAzhar.xlsx");
  const templatePath = path.resolve(process.cwd(), "Template_Import_Guru_AlAzhar.xlsx");

  XLSX.writeFile(wb, rootPath);
  XLSX.writeFile(wb, publicPath);
  XLSX.writeFile(wb, templatePath);

  console.log("Teacher Excel files generated successfully:");
  console.log("- " + rootPath);
  console.log("- " + publicPath);
  console.log("- " + templatePath);
  console.log("Total teachers:", teachers.length);
  const countL = teachers.filter((t) => t.gender === "L").length;
  const countP = teachers.filter((t) => t.gender === "P").length;
  console.log(`Gender breakdown: ${countL} Laki-laki (L), ${countP} Perempuan/Muslimah (P)`);
}

generateTeacherExcel().finally(() => prisma.$disconnect());
