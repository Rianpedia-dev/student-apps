import prisma from "@/lib/prisma";

async function main() {
  console.log("=========================================");
  console.log("🏆 Memulai Seeding Data Prestasi Siswa...");
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
    },
    orderBy: { id: "asc" },
  });

  if (students.length === 0) {
    console.log("❌ Tidak ada data siswa ditemukan. Jalankan seed siswa terlebih dahulu.");
    return;
  }

  console.log(`ℹ️ Ditemukan ${students.length} siswa aktif di database.`);

  // Helper untuk mencari siswa berdasarkan email atau nama
  const findStudent = (identifier: string) => {
    return students.find(
      (s) =>
        s.email.toLowerCase() === identifier.toLowerCase() ||
        s.name.toLowerCase().includes(identifier.toLowerCase())
    );
  };

  // 2. Daftar prestasi siswa teladan & berprestasi
  const prestasiTemplates = [
    {
      studentLookup: "siswa@gmail.com", // Muhammad Rayhan Al-Fatih
      fallbackName: "Muhammad Rayhan Al-Fatih",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Juara 1 Olimpiade Sains & Matematika Nasional (OSMN) 2026",
      fotoanak: "/images/best-student.avif",
      daysAgo: 2,
    },
    {
      studentLookup: "zahra", // Zahra Amira Salsabila
      fallbackName: "Zahra Amira Salsabila",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Juara 1 Musabaqah Hifdzil Qur'an (MHQ) 3 Juz Antar SD Islam Se-Sumatera",
      fotoanak: "/images/best-point.avif",
      daysAgo: 4,
    },
    {
      studentLookup: "khalid", // Khalid bin Walid Al-Ghazi
      fallbackName: "Khalid bin Walid Al-Ghazi",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Juara 1 Turnamen Panahan Tradisional Pelajar Al-Azhar Se-Sumbagsel",
      fotoanak: "/images/best-student.avif",
      daysAgo: 7,
    },
    {
      studentLookup: "siswa@gmail.com", // Muhammad Rayhan Al-Fatih
      fallbackName: "Muhammad Rayhan Al-Fatih",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Medali Emas Islamic Science Olympiad Tingkat Nasional",
      fotoanak: "/images/best-student.avif",
      daysAgo: 10,
    },
    {
      studentLookup: "umar", // Umar Al-Faruq Pratama
      fallbackName: "Umar Al-Faruq Pratama",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Juara 1 Olimpiade Bahasa Arab (OBA) Tingkat Provinsi Sumatera Selatan",
      fotoanak: "/images/best-point.avif",
      daysAgo: 12,
    },
    {
      studentLookup: "naira", // Naira Syakira Azzahra
      fallbackName: "Naira Syakira Azzahra",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Juara 1 Lomba Cipta & Baca Puisi Islami FASI Kota Palembang",
      fotoanak: "/images/best-point.avif",
      daysAgo: 15,
    },
    {
      studentLookup: "fatimah", // Siti Fatimah Azzahra
      fallbackName: "Siti Fatimah Azzahra",
      fallbackKelas: "Kelas 4 - Mehmed Al Fatih",
      prestasi: "Juara 1 Lomba Kaligrafi Kontemporer Tingkat SD Se-Kota Palembang",
      fotoanak: "/images/best-point.avif",
      daysAgo: 18,
    },
    {
      studentLookup: "hamzah", // Hamzah Asadullah Al-Qudsi
      fallbackName: "Hamzah Asadullah Al-Qudsi",
      fallbackKelas: "Kelas 4 - Sayfuddin Al Quthuz",
      prestasi: "Juara 1 English Speech & Story Telling Contest Al-Azhar Cup 2026",
      fotoanak: "/images/best-student.avif",
      daysAgo: 22,
    },
    {
      studentLookup: "alyssa", // Alyssa Khansa Nabila
      fallbackName: "Alyssa Khansa Nabila",
      fallbackKelas: "Kelas 4 - Sayfuddin Al Quthuz",
      prestasi: "Juara 2 Festival Seni Nasyid & Da'i Cilik Ramadhan 1447 H",
      fotoanak: "/images/best-point.avif",
      daysAgo: 25,
    },
    {
      studentLookup: "hafidz", // Hafidz Al-Hasan Ar-Rasyid
      fallbackName: "Hafidz Al-Hasan Ar-Rasyid",
      fallbackKelas: "Kelas 5 - Al Bukhari",
      prestasi: "Juara 1 MHQ 5 Juz Festival Anak Sholeh Indonesia (FASI) Provinsi Sumsel",
      fotoanak: "/images/best-student.avif",
      daysAgo: 30,
    },
    {
      studentLookup: "thariq", // Thariq Ziyad Ramadhan
      fallbackName: "Thariq Ziyad Ramadhan",
      fallbackKelas: "Kelas 4 - Sholahuddin Al Ayubi",
      prestasi: "Medali Emas Kejuaraan Taekwondo Pelajar Antar Dojang Se-Sumatera",
      fotoanak: "/images/best-student.avif",
      daysAgo: 35,
    },
    {
      studentLookup: "syifa", // Syifa Nur Marwah
      fallbackName: "Syifa Nur Marwah",
      fallbackKelas: "Kelas 4 - Sholahuddin Al Ayubi",
      prestasi: "Juara 1 Lomba Cerdas Cermat PAI Tingkat SD Se-Kota Palembang",
      fotoanak: "/images/best-point.avif",
      daysAgo: 40,
    },
  ];

  // 3. Bersihkan data prestasi lama jika ada (opsional, idempotensi)
  const existingCount = await prisma.prestasi.count();
  console.log(`ℹ️ Data prestasi saat ini: ${existingCount} data.`);

  let createdCount = 0;

  for (const item of prestasiTemplates) {
    const student = findStudent(item.studentLookup) || students[0];
    const userId = student ? student.id.toString() : "19";
    const nama = student ? student.name : item.fallbackName;
    const kelas = (student && student.kelas) ? student.kelas : item.fallbackKelas;

    // Cek apakah prestasi yang sama sudah ada untuk siswa tersebut agar tidak duplikat
    const existing = await prisma.prestasi.findFirst({
      where: {
        id_user: userId,
        prestasi: item.prestasi,
      },
    });

    if (!existing) {
      const createdAtDate = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.prestasi.create({
        data: {
          id_user: userId,
          nama: nama,
          kelas: kelas,
          fotoanak: item.fotoanak,
          prestasi: item.prestasi,
          created_at: createdAtDate,
          updated_at: createdAtDate,
        },
      });
      createdCount++;
      console.log(`  ✨ [${kelas}] ${nama} - ${item.prestasi}`);
    } else {
      console.log(`  ⏩ Prestasi sudah ada: [${kelas}] ${nama} - ${item.prestasi}`);
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
