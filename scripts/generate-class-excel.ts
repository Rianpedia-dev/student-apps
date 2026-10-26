import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

interface ClassData {
  nama: string;
  jenjang: "SD" | "SMP";
  tingkat: number;
}

// 46 data kelas tersusun rapi berdasarkan jenjang dan tingkat
const classes: ClassData[] = [
  // Kelas 3 SD (7 kelas)
  { nama: "Kelas 3 - Ibnu Batutah", jenjang: "SD", tingkat: 3 },
  { nama: "Kelas 3 - Ibnu Nafis", jenjang: "SD", tingkat: 3 },
  { nama: "Kelas 3 - Ibnu Kholdun", jenjang: "SD", tingkat: 3 },
  { nama: "Kelas 3 - Ibnu Rusyd", jenjang: "SD", tingkat: 3 },
  { nama: "Kelas 3 - Ibnu Hayyan", jenjang: "SD", tingkat: 3 },
  { nama: "Kelas 3 - Ibnu Firnas", jenjang: "SD", tingkat: 3 },
  { nama: "Kelas 3 - Ibnu Thufail", jenjang: "SD", tingkat: 3 },

  // Kelas 4 SD (6 kelas)
  { nama: "Kelas 4 - Mehmed Al Fatih", jenjang: "SD", tingkat: 4 },
  { nama: "Kelas 4 - Sayfuddin Al Quthuz", jenjang: "SD", tingkat: 4 },
  { nama: "Kelas 4 - Sholahuddin Al Ayubi", jenjang: "SD", tingkat: 4 },
  { nama: "Kelas 4 - Sulaiman Al Qanuni", jenjang: "SD", tingkat: 4 },
  { nama: "Kelas 4 - Mushab bin Umair", jenjang: "SD", tingkat: 4 },
  { nama: "Kelas 4 - Uqbah bin Nafi'", jenjang: "SD", tingkat: 4 },

  // Kelas 5 SD (5 kelas)
  { nama: "Kelas 5 - An Nasai", jenjang: "SD", tingkat: 5 },
  { nama: "Kelas 5 - Abu Daud", jenjang: "SD", tingkat: 5 },
  { nama: "Kelas 5 - Al Bukhari", jenjang: "SD", tingkat: 5 },
  { nama: "Kelas 5 - Muslim", jenjang: "SD", tingkat: 5 },
  { nama: "Kelas 5 - Tirmidzi", jenjang: "SD", tingkat: 5 },

  // Kelas 6 SD (5 kelas)
  { nama: "Kelas 6 - Tholhah bin Ubaidillah", jenjang: "SD", tingkat: 6 },
  { nama: "Kelas 6 - Anas bin Malik", jenjang: "SD", tingkat: 6 },
  { nama: "Kelas 6 - Jabir bin Abdillah", jenjang: "SD", tingkat: 6 },
  { nama: "Kelas 6 - Mu'adz bin Jabal", jenjang: "SD", tingkat: 6 },
  { nama: "Kelas 6 - Urwah bin Zubair", jenjang: "SD", tingkat: 6 },

  // Kelas 7 SMP (8 kelas)
  { nama: "Kelas 7 - Khalid bin Walid", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Saad bin Abi Waqqash", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Thariq bin Ziyad", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Amru bin Ash", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Zaid bin Haritsah", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Hamzah bin Abdul Muthalib", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Usamah bin Zaid", jenjang: "SMP", tingkat: 7 },
  { nama: "Kelas 7 - Abdullah bin Abbas", jenjang: "SMP", tingkat: 7 },

  // Kelas 8 SMP (8 kelas)
  { nama: "Kelas 8 - Imam Hambali", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Syafi'i", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Ghazali", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Hanafi", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Maliki", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Nawawi", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Asy'ari", jenjang: "SMP", tingkat: 8 },
  { nama: "Kelas 8 - Imam Bhaihaqi", jenjang: "SMP", tingkat: 8 },

  // Kelas 9 SMP (7 kelas)
  { nama: "Kelas 9 - Musthafa Al-Maraghi", jenjang: "SMP", tingkat: 9 },
  { nama: "Kelas 9 - Abdul Halim Mahmud", jenjang: "SMP", tingkat: 9 },
  { nama: "Kelas 9 - Ibrahim Al-Barmawi", jenjang: "SMP", tingkat: 9 },
  { nama: "Kelas 9 - Salim Al-Bisyri", jenjang: "SMP", tingkat: 9 },
  { nama: "Kelas 9 - Hasan Al-Quwaisini", jenjang: "SMP", tingkat: 9 },
  { nama: "Kelas 9 - Sayyid Muhammad Thanthawy", jenjang: "SMP", tingkat: 9 },
  { nama: "Kelas 9 - Abdullah Asy-Syarqowi", jenjang: "SMP", tingkat: 9 },
];

function generateExcel() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Kelas (Format resmi siap import)
  const headers = [
    "Nama Kelas",
    "Jenjang (SD/SMP)",
    "Tingkat (3-9)",
    "Wali Kelas",
    "Kapasitas Siswa",
    "Code Restrict iPad",
  ];

  const dataRows = classes.map((c) => [
    c.nama,
    c.jenjang,
    c.tingkat,
    "", // Wali Kelas sengaja dikosongkan sesuai permintaan
    "", // Kapasitas Siswa sengaja dikosongkan sesuai permintaan
    "", // Code Restrict iPad sengaja dikosongkan
  ]);

  const wsData = [headers, ...dataRows];
  const wsKelas = XLSX.utils.aoa_to_sheet(wsData);

  // Atur lebar kolom agar rapi saat dibuka di Excel
  wsKelas["!cols"] = [
    { wch: 38 }, // Nama Kelas
    { wch: 18 }, // Jenjang (SD/SMP)
    { wch: 15 }, // Tingkat (3-9)
    { wch: 30 }, // Wali Kelas
    { wch: 18 }, // Kapasitas Siswa
    { wch: 22 }, // Code Restrict iPad
  ];

  // Sheet 2: Referensi Guru
  const teacherRows = [
    ["No", "Nama Guru / Wali", "Jenjang", "Catatan"],
    [1, "Ustadzah Nurul, S.Pd", "SD", "Guru aktif di sistem"],
    [2, "Ustadz Ahmad, S.Pd.I", "ALL", "Guru aktif di sistem"],
    ["-", "(Guru lainnya dapat diinput pada Langkah 3)", "-", "Wali kelas dapat diset belakangan di Kelola Kelas"],
  ];
  const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRows);
  wsTeachers["!cols"] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 12 },
    { wch: 45 },
  ];

  // Sheet 3: Panduan Pengisian
  const guideRows = [
    ["Kolom", "Keterangan", "Wajib / Opsional", "Contoh Nilai", "Status pada File Ini"],
    ["Nama Kelas", "Nama rombel / kelas resmi Al-Azhar", "Wajib", "Kelas 3 - Ibnu Batutah", "Terisi lengkap (46 rombel)"],
    ["Jenjang (SD/SMP)", "Pilihan: SD atau SMP", "Opsional (Otomatis)", "SD / SMP", "Terisi otomatis sesuai tingkat"],
    ["Tingkat (3-9)", "Angka kelas: 3, 4, 5, 6, 7, 8, atau 9", "Opsional (Otomatis)", "3", "Terisi sesuai tingkat rombel"],
    ["Wali Kelas", "Nama guru wali kelas (sesuai sheet Referensi Guru)", "Opsional", "Ustadz Ahmad Fauzi, S.Pd", "Dikosongkan (bisa diisi nanti)"],
    ["Kapasitas Siswa", "Perkiraan kuota siswa per kelas (angka)", "Opsional", "28", "Dikosongkan (otomatis dihitung saat siswa join)"],
    ["Code Restrict iPad", "Kode 4-digit restrict iPad untuk kelas", "Opsional", "2739", "Dikosongkan (dapat diset di Super Admin)"],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide["!cols"] = [
    { wch: 22 },
    { wch: 40 },
    { wch: 20 },
    { wch: 28 },
    { wch: 35 },
  ];

  // Pasang sheets ke Workbook
  XLSX.utils.book_append_sheet(wb, wsKelas, "Data Kelas");
  XLSX.utils.book_append_sheet(wb, wsTeachers, "Referensi Guru");
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Kolom");

  const rootPath = path.resolve(process.cwd(), "Data_Kelas_AlAzhar.xlsx");
  const publicPath = path.resolve(process.cwd(), "public", "Data_Kelas_AlAzhar.xlsx");
  const templatePath = path.resolve(process.cwd(), "Template_Import_Kelas_AlAzhar.xlsx");

  XLSX.writeFile(wb, rootPath);
  XLSX.writeFile(wb, publicPath);
  XLSX.writeFile(wb, templatePath);

  console.log("Excel files generated successfully:");
  console.log("- " + rootPath);
  console.log("- " + publicPath);
  console.log("- " + templatePath);
  console.log("Total classes:", classes.length);
}

generateExcel();
