import prisma from "../src/lib/prisma";
import { calculateAchievementPoints } from "../src/lib/achievement-points";

async function main() {
  console.log("Menambahkan data contoh prestasi siswa...");

  // 1. Data contoh untuk Muhammad Rayhan Al-Fatih (ID: 2808)
  const rayhanAchievements = [
    {
      id_user: "2808",
      nama: "Muhammad Rayhan Al-Fatih",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 4 - Mehmed Al Fatih",
      tahun_ajaran: "2025/2026",
      tingkat: "Internasional",
      peringkat: "Juara 1",
      poin: calculateAchievementPoints("Internasional", "Juara 1"),
      fotoanak: "/images/best-student.avif",
      prestasi: "Medali Emas Islamic Science & Robotic Olympiad Pelajar Asia 2026",
      jenjang: "SD",
      tanggal_prestasi: new Date("2026-03-15"),
    },
    {
      id_user: "2808",
      nama: "Muhammad Rayhan Al-Fatih",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 4 - Mehmed Al Fatih",
      tahun_ajaran: "2025/2026",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      poin: calculateAchievementPoints("Daerah/Kota", "Juara 1"),
      fotoanak: "/images/best-point.avif",
      prestasi: "Juara 1 Musabaqah Hifdzil Qur'an (MHQ) 3 Juz Tingkat Kota Palembang",
      jenjang: "SD",
      tanggal_prestasi: new Date("2026-01-22"),
    },
    {
      id_user: "2808",
      nama: "Muhammad Rayhan Al-Fatih",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 3 - Umar bin Khattab",
      tahun_ajaran: "2024/2025",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 2",
      poin: calculateAchievementPoints("Daerah/Kota", "Juara 2"),
      fotoanak: "/images/best-student.avif",
      prestasi: "Juara 2 Lomba Pidato Dai Cilik Bahasa Arab Tingkat Provinsi Sumsel",
      jenjang: "SD",
      tanggal_prestasi: new Date("2024-11-18"),
    },
    {
      id_user: "2808",
      nama: "Muhammad Rayhan Al-Fatih",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 3 - Umar bin Khattab",
      tahun_ajaran: "2024/2025",
      tingkat: "Dalam Sekolah",
      peringkat: "Juara 1",
      poin: calculateAchievementPoints("Dalam Sekolah", "Juara 1"),
      fotoanak: "/images/best-point.avif",
      prestasi: "Juara 1 Turnamen Panahan Tradisional Pelajar Al-Azhar Cup 2024",
      jenjang: "SD",
      tanggal_prestasi: new Date("2024-09-10"),
    },
  ];

  // 2. Data contoh untuk Zahra Salsabila (ID: 3453)
  const zahraAchievements = [
    {
      id_user: "3453",
      nama: "Zahra Salsabila",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 4 - Mehmed Al Fatih",
      tahun_ajaran: "2025/2026",
      tingkat: "Nasional",
      peringkat: "Juara 1",
      poin: calculateAchievementPoints("Nasional", "Juara 1"),
      fotoanak: "/images/best-point.avif",
      prestasi: "Juara 1 Storytelling Islami Bahasa Inggris Tingkat Nasional 2026",
      jenjang: "SD",
      tanggal_prestasi: new Date("2026-02-14"),
    },
    {
      id_user: "3453",
      nama: "Zahra Salsabila",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 4 - Mehmed Al Fatih",
      tahun_ajaran: "2025/2026",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      poin: calculateAchievementPoints("Daerah/Kota", "Juara 1"),
      fotoanak: "/images/best-student.avif",
      prestasi: "Juara 1 Cipta & Baca Puisi Religi Pelajar Se-Kota Palembang 2025",
      jenjang: "SD",
      tanggal_prestasi: new Date("2025-12-10"),
    },
    {
      id_user: "3453",
      nama: "Zahra Salsabila",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 3 - Aisyah binti Abu Bakar",
      tahun_ajaran: "2024/2025",
      tingkat: "Nasional",
      peringkat: "Juara 2",
      poin: calculateAchievementPoints("Nasional", "Juara 2"),
      fotoanak: "/images/best-point.avif",
      prestasi: "Juara 2 Olimpiade Literasi & Numerasi Al-Azhar Se-Indonesia",
      jenjang: "SD",
      tanggal_prestasi: new Date("2024-10-25"),
    },
    {
      id_user: "3453",
      nama: "Zahra Salsabila",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat_prestasi: "Kelas 3 - Aisyah binti Abu Bakar",
      tahun_ajaran: "2024/2025",
      tingkat: "Dalam Sekolah",
      peringkat: "Juara 1",
      poin: calculateAchievementPoints("Dalam Sekolah", "Juara 1"),
      fotoanak: "/images/best-student.avif",
      prestasi: "Juara 1 Spelling Bee Competition Tingkat SD Al-Azhar Cairo",
      jenjang: "SD",
      tanggal_prestasi: new Date("2024-08-18"),
    },
  ];

  for (const ach of [...rayhanAchievements, ...zahraAchievements]) {
    // Hindari duplikasi jika prestasi sudah ada
    const existing = await prisma.prestasi.findFirst({
      where: {
        id_user: ach.id_user,
        prestasi: ach.prestasi,
      },
    });

    if (!existing) {
      await prisma.prestasi.create({
        data: ach,
      });
      console.log(`✅ Ditambahkan: [${ach.nama}] ${ach.prestasi}`);
    } else {
      console.log(`ℹ️ Sudah ada: [${ach.nama}] ${ach.prestasi}`);
    }
  }

  console.log("Selesai menambahkan data contoh prestasi!");
}

main()
  .catch((e) => {
    console.error("Error seeding achievements:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

