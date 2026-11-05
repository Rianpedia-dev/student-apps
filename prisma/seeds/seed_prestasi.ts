import prisma from "@/lib/prisma";
import { calculateAchievementPoints } from "@/lib/achievement-points";

async function main() {
  console.log("=========================================");
  console.log("🏆 Memulai Seeding Data Prestasi Siswa Skala 1-16...");
  console.log("=========================================");

  // 1. Ambil daftar siswa aktif dari database
  const students = await prisma.user.findMany({
    where: { status: "1" },
    select: {
      id: true,
      name: true,
      kelas: true,
      email: true,
      nis: true,
      gender: true,
      jenjang: true,
    },
    orderBy: { id: "asc" },
  });

  if (students.length === 0) {
    console.log("❌ Tidak ada data siswa ditemukan. Jalankan seed siswa terlebih dahulu.");
    return;
  }

  console.log(`ℹ️ Ditemukan ${students.length} siswa aktif di database.`);

  const findStudent = (identifier: string) => {
    return students.find(
      (s) =>
        s.email.toLowerCase() === identifier.toLowerCase() ||
        s.name.toLowerCase().includes(identifier.toLowerCase())
    );
  };

  // 2. Daftar prestasi variatif skala 1-16
  const prestasiTemplates = [
    {
      studentLookup: "siswa@gmail.com", // Muhammad Rayhan Al-Fatih
      fallbackName: "Muhammad Rayhan Al-Fatih",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 1 Olimpiade Sains & Matematika Nasional (OSMN) 2026",
      tingkat: "Nasional",
      peringkat: "Juara 1",
      fotoanak: "/images/best-student.avif",
      daysAgo: 2,
    },
    {
      studentLookup: "siswa@gmail.com", // Muhammad Rayhan Al-Fatih
      fallbackName: "Muhammad Rayhan Al-Fatih",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Medali Emas Islamic Science Olympiad Tingkat Internasional",
      tingkat: "Internasional",
      peringkat: "Juara 1",
      fotoanak: "/images/best-student.avif",
      daysAgo: 10,
    },
    {
      studentLookup: "zahra", // Zahra Amira Salsabila
      fallbackName: "Zahra Amira Salsabila",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 1 Musabaqah Hifdzil Qur'an (MHQ) 3 Juz Antar SD Islam Se-Sumatera",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      fotoanak: "/images/best-point.avif",
      daysAgo: 4,
    },
    {
      studentLookup: "zahra", // Zahra Amira Salsabila
      fallbackName: "Zahra Amira Salsabila",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 3",
      prestasi: "Juara Harapan 1 MHQ Pelajar Nasional 2025",
      tingkat: "Nasional",
      peringkat: "Harapan",
      fotoanak: "/images/best-point.avif",
      daysAgo: 200,
    },
    {
      studentLookup: "khalid", // Khalid bin Walid Al-Ghazi
      fallbackName: "Khalid bin Walid Al-Ghazi",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 1 Turnamen Panahan Tradisional Pelajar Al-Azhar Se-Sumbagsel",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      fotoanak: "/images/best-student.avif",
      daysAgo: 7,
    },
    {
      studentLookup: "umar", // Umar Al-Faruq Pratama
      fallbackName: "Umar Al-Faruq Pratama",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 1 Olimpiade Bahasa Arab (OBA) Tingkat Provinsi Sumatera Selatan",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      fotoanak: "/images/best-point.avif",
      daysAgo: 12,
    },
    {
      studentLookup: "naira", // Naira Syakira Azzahra
      fallbackName: "Naira Syakira Azzahra",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Juara Harapan Lomba Cipta Puisi Islami Kota Palembang",
      tingkat: "Daerah/Kota",
      peringkat: "Harapan",
      fotoanak: "/images/best-point.avif",
      daysAgo: 15,
    },
    {
      studentLookup: "fatimah", // Siti Fatimah Azzahra
      fallbackName: "Siti Fatimah Azzahra",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 2 Lomba Kaligrafi Kontemporer Tingkat SD Se-Kota Palembang",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 2",
      fotoanak: "/images/best-point.avif",
      daysAgo: 18,
    },
    {
      studentLookup: "hamzah", // Hamzah Asadullah Al-Qudsi
      fallbackName: "Hamzah Asadullah Al-Qudsi",
      fallbackKelas: "Kelas 4 - Sayfuddin Al Quthuz",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 1 English Speech & Story Telling Contest Al-Azhar Cup 2026",
      tingkat: "Dalam Sekolah",
      peringkat: "Juara 1",
      fotoanak: "/images/best-student.avif",
      daysAgo: 22,
    },
    {
      studentLookup: "alyssa", // Alyssa Khansa Nabila
      fallbackName: "Alyssa Khansa Nabila",
      fallbackKelas: "Kelas 4 - Sayfuddin Al Quthuz",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 2 Festival Seni Nasyid & Da'i Cilik Ramadhan 1447 H",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 2",
      fotoanak: "/images/best-point.avif",
      daysAgo: 25,
    },
    {
      studentLookup: "hafidz", // Hafidz Al-Hasan Ar-Rasyid
      fallbackName: "Hafidz Al-Hasan Ar-Rasyid",
      fallbackKelas: "Kelas 5 - Al Bukhari",
      kelas_saat: "Kelas 5",
      prestasi: "Juara 1 MHQ 5 Juz Festival Anak Sholeh Indonesia (FASI) Provinsi Sumsel",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      fotoanak: "/images/best-student.avif",
      daysAgo: 30,
    },
    {
      studentLookup: "thariq", // Thariq Ziyad Ramadhan
      fallbackName: "Thariq Ziyad Ramadhan",
      fallbackKelas: "Kelas 4 - Sholahuddin Al Ayubi",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 1 Kejuaraan Taekwondo Pelajar Antar Dojang Se-Sumatera",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 1",
      fotoanak: "/images/best-student.avif",
      daysAgo: 35,
    },
    {
      studentLookup: "syifa", // Syifa Nur Marwah
      fallbackName: "Syifa Nur Marwah",
      fallbackKelas: "Kelas 4 - Sholahuddin Al Ayubi",
      kelas_saat: "Kelas 4",
      prestasi: "Juara 2 Lomba Cerdas Cermat PAI Tingkat SD Se-Kota Palembang",
      tingkat: "Daerah/Kota",
      peringkat: "Juara 2",
      fotoanak: "/images/best-point.avif",
      daysAgo: 40,
    },
  ];

  let createdCount = 0;

  for (const item of prestasiTemplates) {
    const student = findStudent(item.studentLookup) || students[0];
    const userId = student ? student.id.toString() : "19";
    const nama = student ? student.name : item.fallbackName;
    const kelas = student && student.kelas ? student.kelas : item.fallbackKelas;
    const jenjang = student?.jenjang || (/smp|kelas\s*(7|8|9)/i.test(kelas) ? "SMP" : "SD");
    const poin = calculateAchievementPoints(item.tingkat, item.peringkat);

    const existing = await prisma.prestasi.findFirst({
      where: {
        id_user: userId,
        prestasi: item.prestasi,
      },
    });

    const createdAtDate = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);

    if (!existing) {
      await prisma.prestasi.create({
        data: {
          id_user: userId,
          nama: nama,
          kelas: kelas,
          kelas_saat_prestasi: item.kelas_saat,
          tahun_ajaran: item.daysAgo > 100 ? "2024/2025" : "2025/2026",
          tingkat: item.tingkat,
          peringkat: item.peringkat,
          poin: poin,
          jenjang: jenjang,
          fotoanak: item.fotoanak,
          prestasi: item.prestasi,
          tanggal_prestasi: createdAtDate,
          created_at: createdAtDate,
          updated_at: createdAtDate,
        },
      });
      createdCount++;
      console.log(`  ✨ [+${poin} Poin | ${item.tingkat} - ${item.peringkat}] ${nama} - ${item.prestasi}`);
    } else {
      await prisma.prestasi.update({
        where: { id: existing.id },
        data: {
          tingkat: item.tingkat,
          peringkat: item.peringkat,
          poin: poin,
          kelas_saat_prestasi: item.kelas_saat,
          jenjang: jenjang,
        },
      });
      console.log(`  ⏩ Prestasi diperbarui: [+${poin} Poin] ${nama} - ${item.prestasi}`);
    }
  }

  const finalCount = await prisma.prestasi.count();
  console.log("=========================================");
  console.log(`✅ Berhasil menambahkan ${createdCount} data prestasi baru.`);
  console.log(`🏆 Total data prestasi di database sekarang: ${finalCount} data.`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding prestasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
