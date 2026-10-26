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

export const sdTeachers: TeacherData[] = [
  { no: 1, nama: "Abdul Aziz", gender: "L", email: "abdulaziz@gmail.com", password: "abdulaziz@gmail.com" },
  { no: 2, nama: "Achmad Ridhollah, S.I.Kom.", gender: "L", email: "achmad@gmail.com", password: "achmad@gmail.com" },
  { no: 3, nama: "Adel Fadhlillah, S.Pd., Gr.", gender: "P", email: "adelfadhlillah@gmail.com", password: "adelfadhlillah@gmail.com" },
  { no: 4, nama: "Adelia Aulie Natasha, S.Pd., Gr.", gender: "P", email: "adelia@gmail.com", password: "adelia@gmail.com" },
  { no: 5, nama: "Adetea Juliza H., S.Sos.", gender: "P", email: "adetea@gmail.com", password: "adetea@gmail.com" },
  { no: 6, nama: "Ahmad Fajri, S.Pd.", gender: "L", email: "ahmadfajri@gmail.com", password: "ahmadfajri@gmail.com" },
  { no: 7, nama: "Ahmadi, S.Pd.I., Gr., M.Pd.", gender: "L", email: "ahmadi@gmail.com", password: "ahmadi@gmail.com" },
  { no: 8, nama: "Aisyah Rido, S.Pd.", gender: "P", email: "aisyah@gmail.com", password: "aisyah@gmail.com" },
  { no: 9, nama: "Alma Latifah, S.Pd., Gr.", gender: "P", email: "alma@gmail.com", password: "alma@gmail.com" },
  { no: 10, nama: "Anadya Saymona, S.Pd., Gr.", gender: "P", email: "anadya@gmail.com", password: "anadya@gmail.com" },
  { no: 11, nama: "Andrayani, S.Pd.I., Gr., MA.Pd.", gender: "P", email: "andrayani@gmail.com", password: "andrayani@gmail.com" },
  { no: 12, nama: "Anggun Primadona, S.Pd., Gr.", gender: "P", email: "anggun@gmail.com", password: "anggun@gmail.com" },
  { no: 13, nama: "Annisa Amartya Zahra, Lc.", gender: "P", email: "annisa@gmail.com", password: "annisa@gmail.com" },
  { no: 14, nama: "Annisa Rahmawati, S.Pd.", gender: "P", email: "annisa.rahmawati@gmail.com", password: "annisa.rahmawati@gmail.com" },
  { no: 15, nama: "Antika Sari, S.Pd.", gender: "P", email: "antika@gmail.com", password: "antika@gmail.com" },
  { no: 16, nama: "Astuti Khoirunnisa, S.Pd.", gender: "P", email: "astuti@gmail.com", password: "astuti@gmail.com" },
  { no: 17, nama: "Asef Fahrizal, S.S., M.A.", gender: "L", email: "asef@gmail.com", password: "asef@gmail.com" },
  { no: 18, nama: "Afrilia Lavigne, S.Pd., Gr.", gender: "P", email: "afrilia@gmail.com", password: "afrilia@gmail.com" },
  { no: 19, nama: "Ayu Febriyanti, S.Pd.", gender: "P", email: "ayufebriyanti@gmail.com", password: "ayufebriyanti@gmail.com" },
  { no: 20, nama: "Ayu Kurnia Mulya Ningsih, S.Pd.", gender: "P", email: "ayukurnia@gmail.com", password: "ayukurnia@gmail.com" },
  { no: 21, nama: "Ayu Oktariza Irawan, S.Pd., Gr.", gender: "P", email: "ayuoktariza@gmail.com", password: "ayuoktariza@gmail.com" },
  { no: 22, nama: "Ayu Pramita, S.Pd., Gr.", gender: "P", email: "ayupramita.sd@gmail.com", password: "ayupramita.sd@gmail.com" },
  { no: 23, nama: "Bambang Try Sutrisno, S.Pd., Gr.", gender: "L", email: "bambang@gmail.com", password: "bambang@gmail.com" },
  { no: 24, nama: "Bella Agustina, S.Pd., Gr.", gender: "P", email: "bella@gmail.com", password: "bella@gmail.com" },
  { no: 25, nama: "Dea Safiera, S.Si., Gr.", gender: "P", email: "dea@gmail.com", password: "dea@gmail.com" },
  { no: 26, nama: "Dela Agustin, S.Pd.", gender: "P", email: "dela@gmail.com", password: "dela@gmail.com" },
  { no: 27, nama: "Dian Ghazali, S.Kom., Gr.", gender: "L", email: "dian@gmail.com", password: "dian@gmail.com" },
  { no: 28, nama: "Dina Novita, S.Pd., Gr.", gender: "P", email: "dina@gmail.com", password: "dina@gmail.com" },
  { no: 29, nama: "Dwi Syahrani, S.Pd.", gender: "P", email: "dwisyahrani@gmail.com", password: "dwisyahrani@gmail.com" },
  { no: 30, nama: "Dwi Tria Nadila, S.Pd.", gender: "P", email: "dwitria@gmail.com", password: "dwitria@gmail.com" },
  { no: 31, nama: "Ega Septiana, S.Pd., Gr.", gender: "P", email: "ega@gmail.com", password: "ega@gmail.com" },
  { no: 32, nama: "Eka Fitri Azuari, S.Pd., Gr.", gender: "P", email: "ekafitri@gmail.com", password: "ekafitri@gmail.com" },
  { no: 33, nama: "Eka Sri Wahyuni, S.Pd., Gr.", gender: "P", email: "ekasri@gmail.com", password: "ekasri@gmail.com" },
  { no: 34, nama: "Endang Ridhayani, S.Sos., S.Pd.", gender: "P", email: "endang@gmail.com", password: "endang@gmail.com" },
  { no: 35, nama: "Fadillah Aryani, S.Pd., Gr., M.Pd.", gender: "P", email: "fadillah@gmail.com", password: "fadillah@gmail.com" },
  { no: 36, nama: "Fadlin Hadini, S.Pd., Gr., M.Pd.", gender: "L", email: "fadlin@gmail.com", password: "fadlin@gmail.com" },
  { no: 37, nama: "Fairuz, S.SI., Gr.", gender: "P", email: "fairuz@gmail.com", password: "fairuz@gmail.com" },
  { no: 38, nama: "Faradilah Riaurita, S.Pd., Gr.", gender: "P", email: "faradilah@gmail.com", password: "faradilah@gmail.com" },
  { no: 39, nama: "Fatoni Agus Setiawan, S.Pd., Gr.", gender: "L", email: "fatoni@gmail.com", password: "fatoni@gmail.com" },
  { no: 40, nama: "Febriansyah, S.Pd., Gr.", gender: "L", email: "febriansyah@gmail.com", password: "febriansyah@gmail.com" },
  { no: 41, nama: "Fidia Lestari, S.Pd., Gr., M.Pd.", gender: "P", email: "fidia@gmail.com", password: "fidia@gmail.com" },
  { no: 42, nama: "Fitri Ramadhani, S.Pd., Gr.", gender: "P", email: "fitriramadhani@gmail.com", password: "fitriramadhani@gmail.com" },
  { no: 43, nama: "Fitria Dian Savira, S.Pd.", gender: "P", email: "fitriadian@gmail.com", password: "fitriadian@gmail.com" },
  { no: 44, nama: "Fitria Romadhona, S.Si.", gender: "P", email: "fitriaromadhona@gmail.com", password: "fitriaromadhona@gmail.com" },
  { no: 45, nama: "Gilang Satria, S.Pd.", gender: "L", email: "gilang@gmail.com", password: "gilang@gmail.com" },
  { no: 46, nama: "Gustomi, S.Pd.", gender: "L", email: "gustomi@gmail.com", password: "gustomi@gmail.com" },
  { no: 47, nama: "H. Deni Adi Marsya, Lc., Gr., M.H.", gender: "L", email: "deni@gmail.com", password: "deni@gmail.com" },
  { no: 48, nama: "H. Muhammad Rizky, Lc., Gr., M.Pd.", gender: "L", email: "rizky@gmail.com", password: "rizky@gmail.com" },
  { no: 49, nama: "Hafsah Rizqiyah, S.Pd., Gr.", gender: "P", email: "hafsah@gmail.com", password: "hafsah@gmail.com" },
  { no: 50, nama: "Hanum Mufidah, S.Pd., Gr.", gender: "P", email: "hanum@gmail.com", password: "hanum@gmail.com" },
  { no: 51, nama: "Hikma Hidayati, S.Pd., Gr.", gender: "P", email: "hikma@gmail.com", password: "hikma@gmail.com" },
  { no: 52, nama: "Indah Ayu Lestari, S.Pd.", gender: "P", email: "indah@gmail.com", password: "indah@gmail.com" },
  { no: 53, nama: "Indriati Agustin Andayani, S.Pd., Gr.", gender: "P", email: "indriati@gmail.com", password: "indriati@gmail.com" },
  { no: 54, nama: "Jumeri, S.Hum., M.Ed.", gender: "L", email: "jumeri@gmail.com", password: "jumeri@gmail.com" },
  { no: 55, nama: "Jumitria, S.Pd.", gender: "P", email: "jumitria@gmail.com", password: "jumitria@gmail.com" },
  { no: 56, nama: "Kiagus Chaidir, S.S., M.Hum.", gender: "L", email: "chaidir@gmail.com", password: "chaidir@gmail.com" },
  { no: 57, nama: "Kharisma Romadhon, S.Pd., M.Pd.", gender: "L", email: "kharisma@gmail.com", password: "kharisma@gmail.com" },
  { no: 58, nama: "Lidiawati, Lc., Gr., M.Ag.", gender: "P", email: "lidiawati@gmail.com", password: "lidiawati@gmail.com" },
  { no: 59, nama: "Loveiany Ilmiah Zulni, S.Psi.", gender: "P", email: "loveiany@gmail.com", password: "loveiany@gmail.com" },
  { no: 60, nama: "Lusy Syawitri, S.Pd., Gr., M.Pd.", gender: "P", email: "lusy@gmail.com", password: "lusy@gmail.com" },
  { no: 61, nama: "M. Nashir, S.Ag., Gr.", gender: "L", email: "nashir@gmail.com", password: "nashir@gmail.com" },
  { no: 62, nama: "Maida Rinawati, S.Pd.I., Gr.", gender: "P", email: "maida@gmail.com", password: "maida@gmail.com" },
  { no: 63, nama: "Mar’atun Hasanah, S.Pd.", gender: "P", email: "maratun@gmail.com", password: "maratun@gmail.com" },
  { no: 64, nama: "Marini Pashadyna Anugrah, S.Pd.", gender: "P", email: "marini.sd@gmail.com", password: "marini.sd@gmail.com" },
  { no: 65, nama: "Masagus M. Ihsan, S.Pd., Gr.", gender: "L", email: "ihsan@gmail.com", password: "ihsan@gmail.com" },
  { no: 66, nama: "Mela Apriani, S.Pd.", gender: "P", email: "mela@gmail.com", password: "mela@gmail.com" },
  { no: 67, nama: "Merly Andani, S.Pd.", gender: "P", email: "merly@gmail.com", password: "merly@gmail.com" },
  { no: 68, nama: "Meylianda Badikenita, S.Pd., Gr.", gender: "P", email: "meylianda@gmail.com", password: "meylianda@gmail.com" },
  { no: 69, nama: "Muhammad Basir, S.Pd.", gender: "L", email: "basir@gmail.com", password: "basir@gmail.com" },
  { no: 70, nama: "Muhammad Farhan", gender: "L", email: "farhan@gmail.com", password: "farhan@gmail.com" },
  { no: 71, nama: "Muhammad Ikhwan Khairi, Lc.", gender: "L", email: "ikhwan@gmail.com", password: "ikhwan@gmail.com" },
  { no: 72, nama: "Muhammad Mursaliin Kurniawan, S.Kom.", gender: "L", email: "mursaliin@gmail.com", password: "mursaliin@gmail.com" },
  { no: 73, nama: "Nafidhah Isna Maulida, S.Pd.", gender: "P", email: "nafidhah@gmail.com", password: "nafidhah@gmail.com" },
  { no: 74, nama: "Naufal Dermawan, S.Pd.", gender: "L", email: "naufal@gmail.com", password: "naufal@gmail.com" },
  { no: 75, nama: "Nesa Kristi Damayanti, S.Pd., Gr.", gender: "P", email: "nesa@gmail.com", password: "nesa@gmail.com" },
  { no: 76, nama: "Nisa Aryani, S.Ag., S.Pd., Gr., M.Pd.", gender: "P", email: "nisa@gmail.com", password: "nisa@gmail.com" },
  { no: 77, nama: "Nova Sagita, S.Pd.I., M.Pd.", gender: "P", email: "novasagita@gmail.com", password: "novasagita@gmail.com" },
  { no: 78, nama: "Nura Erviana, S.Pd.", gender: "P", email: "nura@gmail.com", password: "nura@gmail.com" },
  { no: 79, nama: "Nurkholilah, S.Pd., Gr.", gender: "P", email: "nurkholilah@gmail.com", password: "nurkholilah@gmail.com" },
  { no: 80, nama: "Putri Erwani, S.Pd., M.Pd.", gender: "P", email: "putrierwani@gmail.com", password: "putrierwani@gmail.com" },
  { no: 81, nama: "Putri Wulandari, S.Psi.", gender: "P", email: "putriwulandari@gmail.com", password: "putriwulandari@gmail.com" },
  { no: 82, nama: "Rahmat Prayuda, S.Pd., Gr.", gender: "L", email: "rahmat@gmail.com", password: "rahmat@gmail.com" },
  { no: 83, nama: "Rahmi Aulia, S.Psi.", gender: "P", email: "rahmi@gmail.com", password: "rahmi@gmail.com" },
  { no: 84, nama: "Ratih Amelia, S.Pd., Gr.", gender: "P", email: "ratih@gmail.com", password: "ratih@gmail.com" },
  { no: 85, nama: "Ratna Dwi Chandra, S.Pd.", gender: "P", email: "ratna@gmail.com", password: "ratna@gmail.com" },
  { no: 86, nama: "Rara Yurisia, S.Pd., M.Pd.", gender: "P", email: "rara@gmail.com", password: "rara@gmail.com" },
  { no: 87, nama: "Ria Safitri, S.Pd.", gender: "P", email: "ria@gmail.com", password: "ria@gmail.com" },
  { no: 88, nama: "Rika Wijayanti, S.Pd., Gr.", gender: "P", email: "rika@gmail.com", password: "rika@gmail.com" },
  { no: 89, nama: "Riskiya Febriyani, S.Pd., M.Pd.", gender: "P", email: "riskiya@gmail.com", password: "riskiya@gmail.com" },
  { no: 90, nama: "Rizki Qori Trinita, S.Pd., Gr.", gender: "P", email: "rizkiqori@gmail.com", password: "rizkiqori@gmail.com" },
  { no: 91, nama: "Ruri Febriyanti, S.Pd., Gr., M.Pd.", gender: "P", email: "ruri@gmail.com", password: "ruri@gmail.com" },
  { no: 92, nama: "Safarina, S.Pd.I., Gr.", gender: "P", email: "safarina@gmail.com", password: "safarina@gmail.com" },
  { no: 93, nama: "Saftriana Indrasari, S.Pd.", gender: "P", email: "saftriana@gmail.com", password: "saftriana@gmail.com" },
  { no: 94, nama: "Silviana Herawati, S.Pd.", gender: "P", email: "silviana@gmail.com", password: "silviana@gmail.com" },
  { no: 95, nama: "Siti Nur Asia, S.Pd.I., Gr.", gender: "P", email: "sitinurasia@gmail.com", password: "sitinurasia@gmail.com" },
  { no: 96, nama: "Solehah, S.Pd.", gender: "P", email: "solehah@gmail.com", password: "solehah@gmail.com" },
  { no: 97, nama: "Surya Purnama, S.Pd.I., Gr.", gender: "L", email: "surya@gmail.com", password: "surya@gmail.com" },
  { no: 98, nama: "Tuti Herawati, S.Pd., Gr.", gender: "P", email: "tuti@gmail.com", password: "tuti@gmail.com" },
  { no: 99, nama: "Wilda Wulandari, S.Pd., Gr., M.Ag.", gender: "P", email: "wilda@gmail.com", password: "wilda@gmail.com" },
  { no: 100, nama: "Widya Andini Isfandari, S.Pd., Gr.", gender: "P", email: "widyaandini@gmail.com", password: "widyaandini@gmail.com" },
  { no: 101, nama: "Widya Susanti, S.Pd., Gr.", gender: "P", email: "widyasusanti@gmail.com", password: "widyasusanti@gmail.com" },
  { no: 102, nama: "Yelda Nurul Annisa, S.Pd., Gr.", gender: "P", email: "yelda@gmail.com", password: "yelda@gmail.com" },
  { no: 103, nama: "Yuli Wantini, S.Pd., Gr.", gender: "P", email: "yuli@gmail.com", password: "yuli@gmail.com" },
  { no: 104, nama: "Yuniar Robiaty, S.Pd.", gender: "P", email: "yuniar@gmail.com", password: "yuniar@gmail.com" },
  { no: 105, nama: "Yunita Komariah, S.Pd., Gr.", gender: "P", email: "yunita@gmail.com", password: "yunita@gmail.com" },
  { no: 106, nama: "Zanna Intan Pratiwi, S.Pd., Gr.", gender: "P", email: "zanna@gmail.com", password: "zanna@gmail.com" },
];

async function generateTeacherSDExcel() {
  const wb = XLSX.utils.book_new();

  // Ambil referensi kelas dan mapel resmi SD dari DB jika tersedia
  let classList: string[] = [];
  let subjectList: string[] = [];

  try {
    const [dbClasses, dbSubjects] = await Promise.all([
      prisma.kelas.findMany({
        where: { jenjang: "SD" },
        orderBy: [{ tingkat: "asc" }, { nama_kelas: "asc" }],
        select: { nama_kelas: true },
      }),
      prisma.mataPelajaran.findMany({
        where: { jenjang: { in: ["SD", "SEMUA"] } },
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
    "NIP",
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

  const dataRows = sdTeachers.map((t) => [
    "", // NIP dikosongkan sesuai permintaan
    t.nama,
    "SD", // Jenjang SD
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
    { wch: 18 }, // NIP
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
    ["No", "Daftar Rombel SD Al-Azhar", "Daftar Mata Pelajaran Resmi"],
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
    ["NIP", "Nomor Induk Pegawai", "Opsional", "Dikosongkan sesuai permintaan"],
    ["Nama Lengkap", "Nama guru lengkap beserta gelar akademik", "Wajib", "Terisi 106 nama guru resmi Jenjang SD"],
    ["Jenjang (SD/SMP/ALL)", "Pilihan: SD, SMP, atau ALL (lintas jenjang)", "Opsional", "Diset SD untuk seluruh guru"],
    ["Status", "Status pengguna di sistem Al-Azhar", "Opsional", "Terisi 'Guru'"],
    ["Email", "Email login guru", "Wajib", "Format: [nama_depan]@gmail.com (unik)"],
    ["Password", "Kata sandi login awal guru", "Wajib", "Disamakan dengan email guru"],
    ["Jenis Kelamin (L/P)", "L = Laki-laki, P = Perempuan / Muslimah", "Opsional", "Telah disesuaikan: L atau P"],
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

  const rootPath = path.resolve(process.cwd(), "Data_Guru_SD_AlAzhar.xlsx");
  const publicPath = path.resolve(process.cwd(), "public", "Data_Guru_SD_AlAzhar.xlsx");

  XLSX.writeFile(wb, rootPath);
  XLSX.writeFile(wb, publicPath);

  console.log("Teacher SD Excel files generated successfully:");
  console.log("- " + rootPath);
  console.log("- " + publicPath);
  console.log("Total teachers:", sdTeachers.length);
  const countL = sdTeachers.filter((t) => t.gender === "L").length;
  const countP = sdTeachers.filter((t) => t.gender === "P").length;
  console.log(`Gender breakdown: ${countL} Laki-laki (L), ${countP} Perempuan/Muslimah (P)`);
}

generateTeacherSDExcel().finally(() => prisma.$disconnect());
