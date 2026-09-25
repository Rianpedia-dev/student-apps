import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

function getPrisma() {
  const url = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sisfo_alazhar";
  try {
    const parsed = new URL(url);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const adapter = new PrismaMariaDb({
      host: parsed.hostname || "localhost",
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || "root"),
      password: decodeURIComponent(parsed.password || ""),
      database: parsed.pathname.replace(/^\//, "") || "sisfo_alazhar",
      connectionLimit: 10,
      ssl: isLocal ? undefined : { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
    return new PrismaClient({ adapter });
  } catch {
    const adapter = new PrismaMariaDb({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "sisfo_alazhar",
    });
    return new PrismaClient({ adapter });
  }
}

const prisma = getPrisma();

async function main() {
  console.log("=========================================");
  console.log("🌱 Memulai Seeding Database Student Apps Cairo Palembang...");
  console.log("=========================================");

  // Pre-generate password hashes
  const hashAdmin = await bcrypt.hash("admin123", 10);
  const hashGuru = await bcrypt.hash("guru123", 10);
  const hashSiswa = await bcrypt.hash("siswa123", 10);

  // ---------------------------------------------------------------------------
  // 1. DATA KELAS (15 Rombongan Belajar Kelas 4, 5, 6)
  // ---------------------------------------------------------------------------
  console.log("\n📦 Menyiapkan data kelas (SD & SMP)...");
  const classesData = [
    // SD - Kelas 4
    { nama_kelas: "Kelas 4 - Mehmed Al Fatih", jenjang: "SD", tingkat: 4, wali_kelas: "Ustadzah Fatimah, S.Pd", jumlah_siswa: "28", code_restrict: "2739" },
    { nama_kelas: "Kelas 4 - Sayfuddin Al Quthuz", jenjang: "SD", tingkat: 4, wali_kelas: "Ustadz Ahmad, S.Pd.I", jumlah_siswa: "26", code_restrict: "2957" },
    { nama_kelas: "Kelas 4 - Sholahuddin Al Ayubi", jenjang: "SD", tingkat: 4, wali_kelas: "Ustadzah Maryam, M.Pd", jumlah_siswa: "27", code_restrict: "3419" },
    { nama_kelas: "Kelas 4 - Sulaiman Al Qanuni", jenjang: "SD", tingkat: 4, wali_kelas: "Ustadz Ibrahim, S.Pd", jumlah_siswa: "25", code_restrict: "3458" },
    { nama_kelas: "Kelas 4 - Mushab bin Umair", jenjang: "SD", tingkat: 4, wali_kelas: "Ustadzah Aisyah, S.Pd", jumlah_siswa: "28", code_restrict: "2816" },

    // SD - Kelas 5
    { nama_kelas: "Kelas 5 - Al Bukhari", jenjang: "SD", tingkat: 5, wali_kelas: "Ustadz Hasan, S.Pd", jumlah_siswa: "29", code_restrict: "9375, 1989" },
    { nama_kelas: "Kelas 5 - Muslim", jenjang: "SD", tingkat: 5, wali_kelas: "Ustadzah Khadijah, S.Pd.I", jumlah_siswa: "28", code_restrict: "1890, 2371" },
    { nama_kelas: "Kelas 5 - Abu Daud", jenjang: "SD", tingkat: 5, wali_kelas: "Ustadz Ridwan, S.Kom", jumlah_siswa: "27", code_restrict: "1690, 2560" },
    { nama_kelas: "Kelas 5 - Tirmidzi", jenjang: "SD", tingkat: 5, wali_kelas: "Ustadzah Nurul, M.Pd", jumlah_siswa: "28", code_restrict: "1990, 7373" },
    { nama_kelas: "Kelas 5 - An Nasa'i", jenjang: "SD", tingkat: 5, wali_kelas: "Ustadz Faisal, S.Pd", jumlah_siswa: "29", code_restrict: "1996, 2203" },

    // SD - Kelas 6
    { nama_kelas: "Kelas 6 - Tholhah bin Ubaidillah", jenjang: "SD", tingkat: 6, wali_kelas: "Ustadz Mansyur, S.Pd", jumlah_siswa: "30", code_restrict: "6183" },
    { nama_kelas: "Kelas 6 - Anas bin Malik", jenjang: "SD", tingkat: 6, wali_kelas: "Ustadzah Zahra, S.Pd", jumlah_siswa: "29", code_restrict: "6843" },
    { nama_kelas: "Kelas 6 - Jabir bin Abdillah", jenjang: "SD", tingkat: 6, wali_kelas: "Ustadz Harun, S.Pd.I", jumlah_siswa: "28", code_restrict: "1204" },
    { nama_kelas: "Kelas 6 - Mu'adz bin Jabal", jenjang: "SD", tingkat: 6, wali_kelas: "Ustadzah Salma, M.Pd", jumlah_siswa: "30", code_restrict: "4952" },
    { nama_kelas: "Kelas 6 - Urwah bin Zubair", jenjang: "SD", tingkat: 6, wali_kelas: "Ustadz Yahya, S.Pd", jumlah_siswa: "28", code_restrict: "1972" },

    // SMP - Kelas 7
    { nama_kelas: "Kelas 7 - Ibnu Sina", jenjang: "SMP", tingkat: 7, wali_kelas: "Ustadz Farhan, S.Pd", jumlah_siswa: "28", code_restrict: "7101" },
    { nama_kelas: "Kelas 7 - Al Khawarizmi", jenjang: "SMP", tingkat: 7, wali_kelas: "Ustadzah Nadia, M.Pd", jumlah_siswa: "27", code_restrict: "7102" },
    { nama_kelas: "Kelas 7 - Al Biruni", jenjang: "SMP", tingkat: 7, wali_kelas: "Ustadz Zulkifli, S.Si", jumlah_siswa: "26", code_restrict: "7103" },
    { nama_kelas: "Kelas 7 - Jabir Ibnu Hayyan", jenjang: "SMP", tingkat: 7, wali_kelas: "Ustadzah Rina, S.Pd", jumlah_siswa: "28", code_restrict: "7104" },

    // SMP - Kelas 8
    { nama_kelas: "Kelas 8 - Ibnu Khaldun", jenjang: "SMP", tingkat: 8, wali_kelas: "Ustadz Syakir, Lc", jumlah_siswa: "28", code_restrict: "8201" },
    { nama_kelas: "Kelas 8 - Al Razi", jenjang: "SMP", tingkat: 8, wali_kelas: "Ustadzah Maya, M.Si", jumlah_siswa: "27", code_restrict: "8202" },
    { nama_kelas: "Kelas 8 - Al Kindi", jenjang: "SMP", tingkat: 8, wali_kelas: "Ustadz Taufik, S.Pd", jumlah_siswa: "25", code_restrict: "8203" },
    { nama_kelas: "Kelas 8 - Ibnu Battuta", jenjang: "SMP", tingkat: 8, wali_kelas: "Ustadzah Laila, S.Hum", jumlah_siswa: "29", code_restrict: "8204" },

    // SMP - Kelas 9
    { nama_kelas: "Kelas 9 - Al Farabi", jenjang: "SMP", tingkat: 9, wali_kelas: "Ustadz Dimas, M.Kom", jumlah_siswa: "29", code_restrict: "9301" },
    { nama_kelas: "Kelas 9 - Tariq bin Ziyad", jenjang: "SMP", tingkat: 9, wali_kelas: "Ustadz Bilal, S.Pd.I", jumlah_siswa: "28", code_restrict: "9302" },
    { nama_kelas: "Kelas 9 - Salahuddin Al Ayyubi", jenjang: "SMP", tingkat: 9, wali_kelas: "Ustadzah Safitri, S.Pd", jumlah_siswa: "30", code_restrict: "9303" },
    { nama_kelas: "Kelas 9 - Umar bin Abdul Aziz", jenjang: "SMP", tingkat: 9, wali_kelas: "Ustadz Husein, M.Pd", jumlah_siswa: "28", code_restrict: "9304" },
  ];

  for (const c of classesData) {
    const existing = await prisma.kelas.findFirst({
      where: { nama_kelas: c.nama_kelas },
    });
    if (!existing) {
      await prisma.kelas.create({ data: c });
    } else {
      await prisma.kelas.update({
        where: { id: existing.id },
        data: { jenjang: c.jenjang, tingkat: c.tingkat },
      });
    }

    const existRestrict = await prisma.restrict.findFirst({
      where: { nama_kelas: c.nama_kelas },
    });
    if (!existRestrict) {
      await prisma.restrict.create({
        data: {
          nama_kelas: c.nama_kelas,
          code_restrict: c.code_restrict,
        },
      });
    }
  }
  console.log(`✅ ${classesData.length} kelas (SD & SMP) berhasil disiapkan.`);

  // ---------------------------------------------------------------------------
  // 2. DATA ADMINISTRATOR
  // ---------------------------------------------------------------------------
  console.log("\n👤 Menyiapkan data Administrator...");
  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      password: hashAdmin,
      password1: "admin123",
      status: "3",
    },
    create: {
      name: "Administrator SDIA",
      email: "admin@gmail.com",
      password: hashAdmin,
      password1: "admin123",
      status: "3", // Admin
      gender: "L",
      notes: "Akun Super Administrator",
    },
  });
  console.log("✅ Administrator disiapkan (email: admin@gmail.com, password: admin123).");

  // ---------------------------------------------------------------------------
  // 3. DATA GURU (Wali Kelas & Guru Mata Pelajaran)
  // ---------------------------------------------------------------------------
  console.log("\n👨‍🏫 Menyiapkan data Guru...");
  const teachersData = [
    // 1. Akun Demo Utama Guru
    {
      name: "Ustadzah Fatimah, S.Pd",
      email: "guru@gmail.com",
      password: hashGuru,
      password1: "guru123",
      status: "4", // Guru + Wali Kelas
      gender: "P",
      nip: "198501152010012001",
      guru_bidang: "Pendidikan Agama Islam & Budi Pekerti",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "fatimah.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Kolonel H. Barlian KM 6.5, Palembang",
      notes: "Wali Kelas 4 Mehmed Al Fatih",
    },
    // Wali Kelas Kelas 4
    {
      name: "Ustadz Ahmad, S.Pd.I",
      email: "ahmad.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198603202011011002",
      guru_bidang: "Bahasa Arab",
      kelas: "Kelas 4 - Sayfuddin Al Quthuz",
      appleid: "ahmad.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Demang Lebar Daun No. 28, Palembang",
      notes: "Wali Kelas 4 Sayfuddin Al Quthuz",
    },
    {
      name: "Ustadzah Maryam, M.Pd",
      email: "maryam.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "P",
      nip: "198807122012022003",
      guru_bidang: "Matematika",
      kelas: "Kelas 4 - Sholahuddin Al Ayubi",
      appleid: "maryam.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Mayor Ruslan No. 15, Palembang",
      notes: "Wali Kelas 4 Sholahuddin Al Ayubi",
    },
    {
      name: "Ustadz Ibrahim, S.Pd",
      email: "ibrahim.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198409052009011004",
      guru_bidang: "Tematik & IPA",
      kelas: "Kelas 4 - Sulaiman Al Qanuni",
      appleid: "ibrahim.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Jenderal Ahmad Yani No. 12, Palembang",
      notes: "Wali Kelas 4 Sulaiman Al Qanuni",
    },
    {
      name: "Ustadzah Aisyah, S.Pd",
      email: "aisyah.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "P",
      nip: "199011232014022005",
      guru_bidang: "Bahasa Inggris",
      kelas: "Kelas 4 - Mushab bin Umair",
      appleid: "aisyah.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Angkatan 45 No. 88, Palembang",
      notes: "Wali Kelas 4 Mushab bin Umair",
    },

    // Wali Kelas Kelas 5
    {
      name: "Ustadz Hasan, S.Pd",
      email: "hasan.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198705182011011006",
      guru_bidang: "Al-Qur'an & Tahfidz",
      kelas: "Kelas 5 - Al Bukhari",
      appleid: "hasan.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. R. Soekamto No. 42, Palembang",
      notes: "Wali Kelas 5 Al Bukhari",
    },
    {
      name: "Ustadzah Khadijah, S.Pd.I",
      email: "khadijah.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "P",
      nip: "198902142013022007",
      guru_bidang: "Akidah Akhlak & Fiqih",
      kelas: "Kelas 5 - Muslim",
      appleid: "khadijah.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Basuki Rahmat No. 70, Palembang",
      notes: "Wali Kelas 5 Muslim",
    },
    {
      name: "Ustadz Ridwan, S.Kom",
      email: "ridwan.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "199104082015011008",
      guru_bidang: "Informatika & Robotika",
      kelas: "Kelas 5 - Abu Daud",
      appleid: "ridwan.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Veteran No. 34, Palembang",
      notes: "Wali Kelas 5 Abu Daud",
    },
    {
      name: "Ustadzah Nurul, M.Pd",
      email: "nurul.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "P",
      nip: "198806252012022009",
      guru_bidang: "Ilmu Pengetahuan Alam (IPA)",
      kelas: "Kelas 5 - Tirmidzi",
      appleid: "nurul.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Kapten A. Rivai No. 19, Palembang",
      notes: "Wali Kelas 5 Tirmidzi",
    },
    {
      name: "Ustadz Faisal, S.Pd",
      email: "faisal.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "199208102016011010",
      guru_bidang: "PJOK (Pendidikan Jasmani)",
      kelas: "Kelas 5 - An Nasa'i",
      appleid: "faisal.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Residen H. Abdul Rozak, Palembang",
      notes: "Wali Kelas 5 An Nasa'i",
    },

    // Wali Kelas Kelas 6
    {
      name: "Ustadz Mansyur, S.Pd",
      email: "mansyur.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198301302008011011",
      guru_bidang: "Bahasa Indonesia",
      kelas: "Kelas 6 - Tholhah bin Ubaidillah",
      appleid: "mansyur.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Sudirman No. 120, Palembang",
      notes: "Wali Kelas 6 Tholhah bin Ubaidillah",
    },
    {
      name: "Ustadzah Zahra, S.Pd",
      email: "zahra.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "P",
      nip: "199003152014022012",
      guru_bidang: "Matematika Tingkat Lanjut",
      kelas: "Kelas 6 - Anas bin Malik",
      appleid: "zahra.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. MP. Mangkunegara No. 8, Palembang",
      notes: "Wali Kelas 6 Anas bin Malik",
    },
    {
      name: "Ustadz Harun, S.Pd.I",
      email: "harun.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198612012010011013",
      guru_bidang: "Sejarah Kebudayaan Islam (SKI)",
      kelas: "Kelas 6 - Jabir bin Abdillah",
      appleid: "harun.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Srijaya Negara, Bukit Besar, Palembang",
      notes: "Wali Kelas 6 Jabir bin Abdillah",
    },
    {
      name: "Ustadzah Salma, M.Pd",
      email: "salma.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "P",
      nip: "198710202011022014",
      guru_bidang: "Seni Budaya & Prakarya (SBdP)",
      kelas: "Kelas 6 - Mu'adz bin Jabal",
      appleid: "salma.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Letnan Murod No. 55, Palembang",
      notes: "Wali Kelas 6 Mu'adz bin Jabal",
    },
    {
      name: "Ustadz Yahya, S.Pd",
      email: "yahya.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198509122009011015",
      guru_bidang: "Pendidikan Pancasila / PKn",
      kelas: "Kelas 6 - Urwah bin Zubair",
      appleid: "yahya.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Radial No. 24, Palembang",
      notes: "Wali Kelas 6 Urwah bin Zubair",
    },

    // Guru Mata Pelajaran (Non-Wali Kelas)
    {
      name: "Ustadz Hendra Kurniawan, S.Pd",
      email: "hendra.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "2", // Guru Mata Pelajaran
      gender: "L",
      nip: "199304152017011016",
      guru_bidang: "Tahsin & Tahfidz Al-Qur'an",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "hendra.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Sukabangun II No. 17, Palembang",
      notes: "Guru Spesialis Tahsin dan Tahfidz",
    },
    {
      name: "Ustadzah Dewi Sartika, S.Pd",
      email: "dewi.guru@alazhar.sch.id",
      password: hashGuru,
      password1: "guru123",
      status: "2", // Guru Mata Pelajaran
      gender: "P",
      nip: "199408222018022017",
      guru_bidang: "English for Cambridge Curriculum",
      kelas: "Kelas 5 - Al Bukhari",
      appleid: "dewi.cairo@icloud.com",
      passwordappleid: "AppleGuru123!",
      address: "Jl. Kebun Bunga No. 63, Palembang",
      notes: "Guru Native English Language",
    },
  ];

  for (const t of teachersData) {
    await prisma.user.upsert({
      where: { email: t.email },
      update: {
        name: t.name,
        nip: t.nip,
        guru_bidang: t.guru_bidang,
        gender: t.gender,
        kelas: t.kelas,
        status: t.status,
        password: t.password,
        password1: t.password1,
        appleid: t.appleid,
        passwordappleid: t.passwordappleid,
        address: t.address,
        notes: t.notes,
      },
      create: t,
    });
  }
  console.log(`✅ ${teachersData.length} data Guru berhasil disiapkan (password default: guru123).`);

  // ---------------------------------------------------------------------------
  // 4. DATA SISWA (Terdistribusi di Berbagai Kelas)
  // ---------------------------------------------------------------------------
  console.log("\n🎓 Menyiapkan data Siswa...");
  const studentsData = [
    // --- Akun Siswa Teladan ---
    {
      name: "Muhammad Rayhan",
      email: "siswa1@gmail.com",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404001",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "rayhan.demo1@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "95",
      address: "Jl. Jenderal Sudirman No. 45, Palembang",
      skills: "Tahfidz Juz 30, Robotika, Sains",
      notes: "Siswa Al-Azhar",
    },
    {
      name: "Khalid Al-Ghazi",
      email: "siswa2@gmail.com",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404002",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "khalid.demo2@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "90",
      address: "Jl. Basuki Rahmat No. 12, Palembang",
      skills: "Panahan, Futsal, Tartil",
      notes: "Siswa Al-Azhar",
    },
    {
      name: "Zahra Salsabila",
      email: "siswa3@gmail.com",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404003",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "zahra.demo3@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "92",
      address: "Jl. Kolonel H. Barlian No. 33, Palembang",
      skills: "Pidato Bahasa Inggris, Kaligrafi, Matematika",
      notes: "Siswa Al-Azhar",
    },
    {
      name: "Muhammad Rayhan Al-Fatih",
      email: "siswa@gmail.com", // Akun Demo Utama Siswa
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404001",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "rayhan.alfatih@icloud.com",
      passwordappleid: "AppleRayhan123!",
      point: "95",
      address: "Jl. Jenderal Sudirman No. 45, Palembang",
      skills: "Tahfidz Juz 30, Robotika, Sains",
      notes: "Siswa berprestasi dalam sains dan tahfidz.",
    },
    {
      name: "Khalid bin Walid Al-Ghazi",
      email: "khalid.ghazi@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404002",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "khalid.ghazi@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "88",
      address: "Jl. Basuki Rahmat No. 12, Palembang",
      skills: "Panahan, Futsal, Tartil",
      notes: "Aktif dalam kegiatan olahraga sekolah.",
    },
    {
      name: "Zahra Amira Salsabila",
      email: "zahra.salsabila@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404003",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "zahra.amira@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "92",
      address: "Jl. Kolonel H. Barlian No. 33, Palembang",
      skills: "Pidato Bahasa Inggris, Kaligrafi, Matematika",
      notes: "Juara lomba pidato bahasa Inggris tingkat kota.",
    },
    {
      name: "Umar Al-Faruq Pratama",
      email: "umar.pratama@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404004",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "umar.faruq@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "78",
      address: "Jl. R. Soekamto No. 5B, Palembang",
      skills: "Catur, Coding Scratch, Tahfidz",
      notes: "Minat tinggi di bidang logika dan IT.",
    },
    {
      name: "Naira Syakira Azzahra",
      email: "naira.azzahra@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404005",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "naira.syakira@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "85",
      address: "Jl. Demang Lebar Daun No. 71, Palembang",
      skills: "Menggambar Digital iPad, Tilawah",
      notes: "Kreatif dan rajin mengumpulkan tugas.",
    },
    {
      name: "Kenzie Arkan Atharizz",
      email: "kenzie.atharizz@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404006",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "kenzie.arkan@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "82",
      address: "Jl. Veteran No. 89, Palembang",
      skills: "Taekwondo, Matematika Cepat",
      notes: "Disiplin dan bertanggung jawab.",
    },
    {
      name: "Siti Fatimah Azzahra",
      email: "fatimah.siti@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404007",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "fatimah.siti@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "90",
      address: "Jl. Mayor Ruslan No. 20, Palembang",
      skills: "Tahfidz Juz 29-30, Menulis Puisi",
      notes: "Bakat sastra dan hafalan yang kuat.",
    },
    {
      name: "Abdullah Faqih Al-Anshori",
      email: "abdullah.faqih@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404008",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      appleid: "abdullah.faqih@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "84",
      address: "Jl. Angkatan 45 No. 14, Palembang",
      skills: "Adzan, Tilawah Al-Qur'an",
      notes: "Sering menjadi muadzin saat sholat berjamaah.",
    },

    // --- Kelas 4 - Sayfuddin Al Quthuz ---
    {
      name: "Hamzah Asadullah Al-Qudsi",
      email: "hamzah.asad@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404011",
      kelas: "Kelas 4 - Sayfuddin Al Quthuz",
      appleid: "hamzah.asad@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "86",
      address: "Jl. Sumpah Pemuda No. 10, Palembang",
      skills: "Berenang, Pencak Silat, Tahfidz",
      notes: "Fisik tangguh dan berjiwa kepemimpinan.",
    },
    {
      name: "Alyssa Khansa Nabila",
      email: "alyssa.nabila@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404012",
      kelas: "Kelas 4 - Sayfuddin Al Quthuz",
      appleid: "alyssa.khansa@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "94",
      address: "Jl. POM IX No. 23, Palembang",
      skills: "Olimpiade Sains, Bahasa Inggris",
      notes: "Peringkat 1 paralel kelas 4 semester lalu.",
    },
    {
      name: "Bilal Al-Habasyi Putra",
      email: "bilal.putra@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404013",
      kelas: "Kelas 4 - Sayfuddin Al Quthuz",
      appleid: "bilal.putra@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "79",
      address: "Jl. Srijaya Negara No. 4, Palembang",
      skills: "Pramuka, Drum Band",
      notes: "Suka bekerjasama dalam tim.",
    },
    {
      name: "Yasmin Safira Ramadhani",
      email: "yasmin.safira@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404014",
      kelas: "Kelas 4 - Sayfuddin Al Quthuz",
      appleid: "yasmin.safira@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "89",
      address: "Jl. Kapten Cek Syeh No. 31, Palembang",
      skills: "Story Telling, Desain Poster",
      notes: "Pandai bercerita kisah-kisah teladan sahabat nabi.",
    },

    // --- Kelas 4 - Sholahuddin Al Ayubi ---
    {
      name: "Thariq Ziyad Ramadhan",
      email: "thariq.ramadhan@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202404021",
      kelas: "Kelas 4 - Sholahuddin Al Ayubi",
      appleid: "thariq.ziyad@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "87",
      address: "Jl. Radial No. 78, Palembang",
      skills: "Pencak Silat, Tahsin",
      notes: "Sopan dan tekun dalam beribadah.",
    },
    {
      name: "Syifa Nur Marwah",
      email: "syifa.marwah@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202404022",
      kelas: "Kelas 4 - Sholahuddin Al Ayubi",
      appleid: "syifa.marwah@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "91",
      address: "Jl. Ariodillah No. 16, Palembang",
      skills: "Pildacil, Menulis Cerpen",
      notes: "Komunikatif dan percaya diri tinggi.",
    },

    // --- Kelas 5 - Al Bukhari ---
    {
      name: "Hafidz Al-Hasan Ar-Rasyid",
      email: "hafidz.alhasan@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202305001",
      kelas: "Kelas 5 - Al Bukhari",
      appleid: "hafidz.hasan@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "98",
      address: "Jl. MP Mangkunegara No. 90, Palembang",
      skills: "Tahfidz 3 Juz (28, 29, 30), Hadits Arbain",
      notes: "Kandidat Best Student teladan tahun ajaran ini.",
    },
    {
      name: "Annisa Lathifah Zahir",
      email: "annisa.zahir@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202305002",
      kelas: "Kelas 5 - Al Bukhari",
      appleid: "annisa.zahir@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "96",
      address: "Jl. Sukabangun I No. 45, Palembang",
      skills: "Olimpiade Matematika, Kaligrafi Khot Naskhi",
      notes: "Sangat teliti dan disiplin dalam pengerjaan tugas.",
    },
    {
      name: "Dzaki Arsyad Maulana",
      email: "dzaki.maulana@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202305003",
      kelas: "Kelas 5 - Al Bukhari",
      appleid: "dzaki.arsyad@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "83",
      address: "Jl. Swadaya No. 12, Pakjo, Palembang",
      skills: "Robotik Arduino, Coding Python dasar",
      notes: "Juara festival teknologi anak tingkat provinsi.",
    },
    {
      name: "Nayla Azkadina Rania",
      email: "nayla.azkadina@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202305004",
      kelas: "Kelas 5 - Al Bukhari",
      appleid: "nayla.azkadina@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "89",
      address: "Jl. Tanjung Siapi-api KM 9, Palembang",
      skills: "Bahasa Arab, Puisi Islami",
      notes: "Fasih berbahasa Arab percakapan sehari-hari.",
    },

    // --- Kelas 5 - Muslim ---
    {
      name: "Ali Murtadha Syahputra",
      email: "ali.syahputra@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202305011",
      kelas: "Kelas 5 - Muslim",
      appleid: "ali.murtadha@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "82",
      address: "Jl. Pangeran Antasari No. 67, Palembang",
      skills: "Futsal, Tahsin",
      notes: "Kapten tim futsal SDIA Cairo.",
    },
    {
      name: "Maryam Qonitah Al-Hafidzah",
      email: "maryam.qonitah@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202305012",
      kelas: "Kelas 5 - Muslim",
      appleid: "maryam.qonitah@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "93",
      address: "Jl. Kapten Cek Syeh No. 51, Palembang",
      skills: "Tahfidz Juz 29 & 30, Bahasa Inggris",
      notes: "Berakhlak mulia dan rajin sholat tepat waktu.",
    },

    // --- Kelas 5 - Abu Daud ---
    {
      name: "Fathir Ar-Rasyid Siregar",
      email: "fathir.arrasyid@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202305021",
      kelas: "Kelas 5 - Abu Daud",
      appleid: "fathir.arrasyid@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "85",
      address: "Jl. Seduduk Putih No. 19, Palembang",
      skills: "Karya Ilmiah Remaja, Desain 3D",
      notes: "Suka mengeksplorasi eksperimen sains.",
    },
    {
      name: "Nadia Humaira Firdaus",
      email: "nadia.firdaus@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202305022",
      kelas: "Kelas 5 - Abu Daud",
      appleid: "nadia.firdaus@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "90",
      address: "Jl. Bambang Utoyo No. 38, Palembang",
      skills: "Tilawatil Qur'an, Nasyid",
      notes: "Vokal merdu dan tartil membaca Al-Qur'an.",
    },

    // --- Kelas 6 - Tholhah bin Ubaidillah ---
    {
      name: "Ahmad Mujahid Fisabilillah",
      email: "ahmad.mujahid@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202206001",
      kelas: "Kelas 6 - Tholhah bin Ubaidillah",
      appleid: "ahmad.mujahid@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "100",
      address: "Jl. Veteran Komp. Al-Azhar No. 1, Palembang",
      skills: "Ketua OSIS, Tahfidz 4 Juz, Pidato 3 Bahasa",
      notes: "Ketua murid teladan teladan utama SD Al-Azhar Cairo.",
    },
    {
      name: "Yasmin Mumtazah Zahirah",
      email: "yasmin.mumtazah@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202206002",
      kelas: "Kelas 6 - Tholhah bin Ubaidillah",
      appleid: "yasmin.mumtazah@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "97",
      address: "Jl. Jenderal Sudirman KM 3.5, Palembang",
      skills: "Olimpiade IPA Nasional, Debat Bahasa Inggris",
      notes: "Meraih medali perak olimpiade sains nasional.",
    },
    {
      name: "Fakhri Azzam Khairy",
      email: "fakhri.khairy@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202206003",
      kelas: "Kelas 6 - Tholhah bin Ubaidillah",
      appleid: "fakhri.khairy@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "88",
      address: "Jl. Musi II Komp. Poligon, Palembang",
      skills: "Bulu Tangkis, Robotika LEGO",
      notes: "Siswa berprestasi di bidang olahraga dan robotik.",
    },
    {
      name: "Salma Haura Insyirah",
      email: "salma.insyirah@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202206004",
      kelas: "Kelas 6 - Tholhah bin Ubaidillah",
      appleid: "salma.haura@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "92",
      address: "Jl. Demang Lebar Daun No. 99, Palembang",
      skills: "Tahfidz Juz 30 & 29, Kaligrafi",
      notes: "Karya kaligrafinya terpajang di galeri sekolah.",
    },

    // --- Kelas 6 - Anas bin Malik ---
    {
      name: "Revan Al-Farizi Nugraha",
      email: "revan.alfarizi@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202206011",
      kelas: "Kelas 6 - Anas bin Malik",
      appleid: "revan.alfarizi@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "81",
      address: "Jl. Basuki Rahmat No. 110, Palembang",
      skills: "Fotografi Sekolah, Editor Video",
      notes: "Membantu dokumentasi berbagai kegiatan sekolah.",
    },
    {
      name: "Keisha Almeera Putri",
      email: "keisha.almeera@siswa.alazhar.sch.id",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "P",
      nis: "202206012",
      kelas: "Kelas 6 - Anas bin Malik",
      appleid: "keisha.almeera@icloud.com",
      passwordappleid: "AppleSiswa123!",
      point: "89",
      address: "Jl. Kapten Marzuki No. 44, Palembang",
      skills: "Matematika Nalaria Realistik, Menggambar",
      notes: "Rajin dan memiliki kemampuan analitis yang tajam.",
    },
  ];

  for (const s of studentsData) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        nis: s.nis,
        gender: s.gender,
        kelas: s.kelas,
        status: s.status,
        point: s.point,
        skills: s.skills,
        notes: s.notes,
        password: s.password,
        password1: s.password1,
        appleid: s.appleid,
        passwordappleid: s.passwordappleid,
        address: s.address,
      },
      create: s,
    });
  }
  console.log(`✅ ${studentsData.length} data Siswa berhasil disiapkan (password default: siswa123).`);

  // ---------------------------------------------------------------------------
  // 5. TAHUN AJAR
  // ---------------------------------------------------------------------------
  console.log("\n📅 Menyiapkan Tahun Pelajaran...");
  const existTahun = await prisma.tahunAjar.findFirst({
    where: { tahun: "2026/2027", semester: "Semester 1" },
  });
  if (!existTahun) {
    await prisma.tahunAjar.create({
      data: {
        tahun: "2026/2027",
        semester: "Semester 1",
      },
    });
  }
  console.log("✅ Tahun Pelajaran 2026/2027 Semester 1 disiapkan.");

  // ---------------------------------------------------------------------------
  // 6. PENGUMUMAN SEKOLAH
  // ---------------------------------------------------------------------------
  console.log("\n📢 Menyiapkan Pengumuman Sekolah...");
  const existAnnouncement = await prisma.pengumuman.findFirst({
    where: {
      OR: [
        { title: "Selamat Datang di Student Apps Cairo Palembang v2.0" },
        { title: "Selamat Datang di SISFO SDIA Cairo Palembang v2.0" },
      ],
    },
  });
  if (!existAnnouncement) {
    await prisma.pengumuman.create({
      data: {
        from: "IT Al-Azhar",
        title: "Selamat Datang di Student Apps Cairo Palembang v2.0",
        pengumuman: "<p>Alhamdulillah, Sistem Informasi Sekolah (Student Apps) SD Islam Al-Azhar Cairo Palembang telah diperbarui ke versi modern. Seluruh civitas akademika dapat memantau kegiatan, absensi, checklist ibadah sholat, dan reward siswa dengan lebih mudah dan cepat.</p><p>Barakallahu fiikum.</p>",
        like: "25",
      },
    });
  }

  const existTahfidz = await prisma.pengumuman.findFirst({
    where: { title: "Jadwal Ujian Tasmi' & Tahfidz Al-Qur'an Semester Ganjil" },
  });
  if (!existTahfidz) {
    await prisma.pengumuman.create({
      data: {
        from: "Koordinator Keagamaan",
        title: "Jadwal Ujian Tasmi' & Tahfidz Al-Qur'an Semester Ganjil",
        pengumuman: "<p>Diberitahukan kepada seluruh Ananda kelas 4, 5, dan 6 bahwa Ujian Tasmi' Al-Qur'an Juz 30, 29, dan 28 akan dilaksanakan mulai pekan depan. Mohon Ayah/Bunda senantiasa memantau mutaba'ah sholat dan muroja'ah di rumah.</p>",
        like: "18",
      },
    });
  }
  console.log("✅ Pengumuman sekolah disiapkan.");


  // ---------------------------------------------------------------------------
  // 8. DATA AGENDA & KEGIATAN KALENDER SEKOLAH
  // ---------------------------------------------------------------------------
  console.log("\n📅 Menyiapkan Agenda & Kalender Kegiatan Sekolah...");
  const existEvents = await prisma.event.count();
  if (existEvents === 0) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const defaultEvents = [
      {
        title: "Sholat Dhuha & Muroja'ah Pagi",
        kelas: "Semua Kelas",
        from: "admin",
        start: new Date(y, m, d, 7, 15),
        end: new Date(y, m, d, 8, 0),
        deskripsi: "Pembiasaan ibadah sholat dhuha berjamaah dan hafalan Juz 30 di Masjid Al-Azhar Cairo",
        backgroundColor: "green",
      },
      {
        title: "Kuis Tematik Terpadu",
        kelas: "Semua Kelas",
        from: "admin",
        start: new Date(y, m, d + 1, 9, 30),
        end: new Date(y, m, d + 1, 11, 0),
        deskripsi: "Evaluasi pemahaman materi tematik harian dan literasi",
        backgroundColor: "blue",
      },
      {
        title: "Rapat Koordinasi Dewan Guru",
        kelas: "Semua Kelas",
        from: "admin",
        start: new Date(y, m, d + 2, 13, 0),
        end: new Date(y, m, d + 2, 15, 0),
        deskripsi: "Evaluasi pembelajaran Cambridge dan koordinasi kurikulum mingguan",
        backgroundColor: "purple",
      },
      {
        title: "Field Trip Edukasi & Sains",
        kelas: "Semua Kelas",
        from: "admin",
        start: new Date(y, m, d + 4, 8, 0),
        end: new Date(y, m, d + 4, 14, 30),
        deskripsi: "Kunjungan edukatif observasi sains dan kebudayaan",
        backgroundColor: "orange",
      },
      {
        title: "Simulasi Penilaian Tengah Semester",
        kelas: "Semua Kelas",
        from: "admin",
        start: new Date(y, m, d + 6, 10, 0),
        end: new Date(y, m, d + 6, 12, 0),
        deskripsi: "Latihan persiapan PTS berbasis CBT dan iPad sekolah",
        backgroundColor: "red",
      },
      {
        title: "Kajian Keislaman & Keputrian",
        kelas: "Semua Kelas",
        from: "admin",
        start: new Date(y, m, d + 8, 8, 30),
        end: new Date(y, m, d + 8, 11, 0),
        deskripsi: "Peningkatan wawasan akhlakul karimah dan sirah nabawiyah",
        backgroundColor: "pink",
      },
    ];

    for (const ev of defaultEvents) {
      await prisma.event.create({ data: ev });
    }
    console.log(`✅ ${defaultEvents.length} agenda kegiatan sekolah berhasil disiapkan.`);
  } else {
    console.log(`✅ Data agenda kegiatan sudah ada (${existEvents} kegiatan).`);
  }

  // ---------------------------------------------------------------------------
  // 12. DEMO SMP ACCOUNTS (Guru & Siswa SMP)
  // ---------------------------------------------------------------------------
  console.log("\n👨‍🏫 Menyiapkan Akun Demo SMP...");
  const guruSmp = await prisma.user.upsert({
    where: { email: "guru.smp@gmail.com" },
    update: { password: hashGuru, password1: "guru123" },
    create: {
      name: "Ustadz Farhan, S.Pd",
      email: "guru.smp@gmail.com",
      password: hashGuru,
      password1: "guru123",
      status: "4",
      gender: "L",
      nip: "198703122011011005",
      guru_bidang: "Matematika & Sains",
      kelas: "Kelas 7 - Ibnu Sina",
      address: "Jl. Basuki Rahmat No. 88, Palembang",
      notes: "Wali Kelas 7 Ibnu Sina & Guru Matematika SMP",
    },
  });

  const siswaSmp = await prisma.user.upsert({
    where: { email: "siswa.smp@gmail.com" },
    update: { password: hashSiswa, password1: "siswa123" },
    create: {
      name: "Ahmad Fathan Al-Ghazali",
      email: "siswa.smp@gmail.com",
      password: hashSiswa,
      password1: "siswa123",
      status: "1",
      gender: "L",
      nis: "202407001",
      kelas: "Kelas 7 - Ibnu Sina",
      point: "100",
      skills: "Olimpiade Matematika, Robotika, Tahfidz 3 Juz",
      notes: "Ketua Kelas 7 Ibnu Sina",
    },
  });

  // ---------------------------------------------------------------------------
  // 13. MASTER MATA PELAJARAN
  // ---------------------------------------------------------------------------
  console.log("\n📚 Menyiapkan Master Data Mata Pelajaran...");
  const subjectsData = [
    { kode_mapel: "PAI", nama_mapel: "Pendidikan Agama Islam & Adab", jenjang: "SEMUA", icon: "BookHeart", warna: "emerald", deskripsi: "Pembelajaran akidah, fiqih ibadah, sirah nabawiyah, dan pembiasaan adab islami harian." },
    { kode_mapel: "TAHFIDZ", nama_mapel: "Tahfidz & Tahsin Al-Qur'an", jenjang: "SEMUA", icon: "Sparkles", warna: "amber", deskripsi: "Bimbingan hafalan Al-Qur'an tartil metode Al-Azhar dengan target kelulusan mutqin." },
    { kode_mapel: "BARAB", nama_mapel: "Bahasa Arab", jenjang: "SEMUA", icon: "Languages", warna: "teal", deskripsi: "Penguasaan mufrodat, percakapan sehari-hari, dan kaidah dasar bahasa Al-Qur'an." },
    { kode_mapel: "BING", nama_mapel: "English Bilingual / Cambridge", jenjang: "SEMUA", icon: "Globe", warna: "blue", deskripsi: "Pengembangan active listening, speaking, reading, dan writing standar Cambridge." },
    { kode_mapel: "BIND", nama_mapel: "Bahasa Indonesia", jenjang: "SEMUA", icon: "BookOpenText", warna: "sky", deskripsi: "Keterampilan literasi, menulis kreatif, pemahaman teks, dan retorika komunikasi." },
    { kode_mapel: "MTK", nama_mapel: "Matematika", jenjang: "SEMUA", icon: "Calculator", warna: "indigo", deskripsi: "Penguatan logika numerik, pemecahan masalah (HOTS), geometri, dan aljabar praktis." },
    { kode_mapel: "IPA", nama_mapel: "Ilmu Pengetahuan Alam (Sains)", jenjang: "SEMUA", icon: "Atom", warna: "violet", deskripsi: "Eksplorasi fenomena alam, eksperimen laboratorium, sains biologi dan fisika terapan." },
    { kode_mapel: "IPS", nama_mapel: "Ilmu Pengetahuan Sosial", jenjang: "SMP", icon: "Compass", warna: "orange", deskripsi: "Kajian sejarah peradaban, geografi kepulauan, interaksi sosial, dan ekonomi." },
    { kode_mapel: "INFOR", nama_mapel: "Informatika & Coding", jenjang: "SEMUA", icon: "Laptop", warna: "rose", deskripsi: "Pembelajaran literasi digital iPad, computational thinking, algoritma, dan coding." },
    { kode_mapel: "PJOK", nama_mapel: "Pendidikan Jasmani & Olahraga", jenjang: "SEMUA", icon: "Activity", warna: "lime", deskripsi: "Kebugaran jasmani, pembinaan olahraga sunnah (panahan, renang), dan sportivitas." },
  ];

  for (const s of subjectsData) {
    const existSub = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: s.kode_mapel } });
    if (!existSub) {
      await prisma.mataPelajaran.create({ data: s });
    }
  }
  console.log(`✅ ${subjectsData.length} Master Mata Pelajaran siap.`);

  // ---------------------------------------------------------------------------
  // 14. JADWAL PELAJARAN (Untuk Kelas 4 SD & Kelas 7 SMP)
  // ---------------------------------------------------------------------------
  console.log("\n🗓️ Menyiapkan Jadwal Pelajaran...");
  const kelasSD = await prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" } });
  const kelasSMP = await prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 7 - Ibnu Sina" } });
  const guruSD = await prisma.user.findFirst({ where: { email: "guru@gmail.com" } });
  const mapelPai = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PAI" } });
  const mapelMtk = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "MTK" } });
  const mapelIpa = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPA" } });
  const mapelInfor = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "INFOR" } });
  const mapelBarab = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BARAB" } });

  if (kelasSD && guruSD && mapelPai && mapelMtk && mapelBarab) {
    const existJadwalSD = await prisma.jadwalPelajaran.findFirst({ where: { kelas_id: kelasSD.id } });
    if (!existJadwalSD) {
      await prisma.jadwalPelajaran.createMany({
        data: [
          { kelas_id: kelasSD.id, mapel_id: mapelPai.id, guru_id: guruSD.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "R. Mehmed Al Fatih" },
          { kelas_id: kelasSD.id, mapel_id: mapelMtk.id, guru_id: guruSD.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "R. Mehmed Al Fatih" },
          { kelas_id: kelasSD.id, mapel_id: mapelBarab.id, guru_id: guruSD.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "R. Mehmed Al Fatih" },
        ],
      });
    }
  }

  if (kelasSMP && guruSmp && mapelMtk && mapelIpa && mapelInfor) {
    const existJadwalSMP = await prisma.jadwalPelajaran.findFirst({ where: { kelas_id: kelasSMP.id } });
    if (!existJadwalSMP) {
      await prisma.jadwalPelajaran.createMany({
        data: [
          { kelas_id: kelasSMP.id, mapel_id: mapelMtk.id, guru_id: guruSmp.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Lab Komputer / iPad" },
          { kelas_id: kelasSMP.id, mapel_id: mapelIpa.id, guru_id: guruSmp.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "Lab Sains Terpadu" },
          { kelas_id: kelasSMP.id, mapel_id: mapelInfor.id, guru_id: guruSmp.id, hari: "Kamis", jam_mulai: "10:30", jam_selesai: "12:00", ruang: "Digital Classroom" },
        ],
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 15. SAMPLE TUGAS & SUBMISSION (Untuk Demo Koreksi In-Browser)
  // ---------------------------------------------------------------------------
  console.log("\n📝 Menyiapkan Data Tugas & Penilaian In-Browser...");
  if (kelasSD && guruSD && mapelMtk) {
    let tugasMtk = await prisma.tugas.findFirst({ where: { kelas_id: kelasSD.id, judul: "Latihan Pecahan Desimal & Nilai Tempat" } });
    if (!tugasMtk) {
      tugasMtk = await prisma.tugas.create({
        data: {
          kelas_id: kelasSD.id,
          mapel_id: mapelMtk.id,
          guru_id: guruSD.id,
          judul: "Latihan Pecahan Desimal & Nilai Tempat",
          deskripsi: "<p>Assalamu'alaikum Ananda sholeh & sholehah,</p><p>Silakan kerjakan latihan soal matematika halaman 45 nomor 1 sampai 5 di buku catatan atau iPad. Unggah hasil pekerjaanmu dalam format <strong>PDF atau foto jernih (PNG/JPG)</strong> agar Ustadzah bisa langsung koreksi dan beri nilai bintang ⭐</p>",
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 hari lagi
          poin_maksimal: 100,
          status: "aktif",
        },
      });
    }

    const siswaDemoSD = await prisma.user.findFirst({ where: { email: "siswa@gmail.com" } });
    if (tugasMtk && siswaDemoSD) {
      const existSub = await prisma.tugasSubmission.findUnique({
        where: { tugas_id_siswa_id: { tugas_id: tugasMtk.id, siswa_id: siswaDemoSD.id } },
      });
      if (!existSub) {
        await prisma.tugasSubmission.create({
          data: {
            tugas_id: tugasMtk.id,
            siswa_id: siswaDemoSD.id,
            file_url: "/images/SISFO-SD.png", // Sample preview file
            file_name: "Tugas_Matematika_Rayhan.png",
            file_type: "png",
            file_size: 154200,
            catatan_siswa: "Assalamu'alaikum Ustadzah, tugas sudah saya selesaikan dengan teliti. Mohon koreksinya ya Ustadzah.",
            status: "menunggu_penilaian",
            submitted_at: new Date(),
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 16. SAMPLE CHAT GURU & SISWA
  // ---------------------------------------------------------------------------
  console.log("\n💬 Menyiapkan Sample Percakapan Chat...");
  const demoSiswa = await prisma.user.findFirst({ where: { email: "siswa@gmail.com" } });
  if (demoSiswa && guruSD) {
    const [u1, u2] = demoSiswa.id < guruSD.id ? [demoSiswa.id, guruSD.id] : [guruSD.id, demoSiswa.id];
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { user_one_id_user_two_id: { user_one_id: u1, user_two_id: u2 } },
    });
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          type: "DIRECT",
          user_one_id: u1,
          user_two_id: u2,
          last_message: "Wa'alaikumussalam Rayhan. Bagus sekali, sudah Ustadzah periksa ya.",
          last_message_at: new Date(),
        },
      });

      await prisma.chatMessage.createMany({
        data: [
          {
            room_id: chatRoom.id,
            sender_id: demoSiswa.id,
            message: "Assalamu'alaikum Ustadzah, apakah tugas matematika nomor 3 harus disederhanakan sampai bentuk terkecil?",
            is_read: true,
            read_at: new Date(),
            created_at: new Date(Date.now() - 1000 * 60 * 30),
          },
          {
            room_id: chatRoom.id,
            sender_id: guruSD.id,
            message: "Wa'alaikumussalam Rayhan. Iya betul Ananda, disederhanakan sampai bentuk pecahan paling sederhana ya. Semangat!",
            is_read: true,
            read_at: new Date(),
            created_at: new Date(Date.now() - 1000 * 60 * 15),
          },
        ],
      });
    }
  }

  console.log("\n=========================================");
  console.log("🎉 Seeding Database Selesai dengan Sukses!");
  console.log("=========================================");
  console.log("Akun Demo yang Siap Digunakan:");
  console.log("👑 Admin     : admin@gmail.com / admin123");
  console.log("👩‍🏫 Guru SD  : guru@gmail.com / guru123 (Ustadzah Fatimah - Wali Kelas 4)");
  console.log("👨‍🏫 Guru SMP : guru.smp@gmail.com / guru123 (Ustadz Farhan - Wali Kelas 7 Ibnu Sina)");
  console.log("🎓 Siswa SD  : siswa@gmail.com / siswa123 (Muhammad Rayhan - Kelas 4)");
  console.log("🎓 Siswa SMP : siswa.smp@gmail.com / siswa123 (Ahmad Fathan - Kelas 7 Ibnu Sina)");
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeder error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
