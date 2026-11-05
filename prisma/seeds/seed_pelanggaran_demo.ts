import prisma from "../../src/lib/prisma";
import bcrypt from "bcryptjs";
import { formatViolationKeterangan } from "../../src/lib/constants/violations";

async function main() {
  console.log("=====================================================");
  console.log("🛡️ Memulai Seeding Data Contoh Pelanggaran Demo...");
  console.log("=====================================================");

  const hashGuru = await bcrypt.hash("guru123", 10);
  const hashSiswa = await bcrypt.hash("siswa123", 10);

  // 1. Pastikan Akun Demo yang ada di Tombol Login sudah terdaftar di database
  console.log("1. Memeriksa & memastikan akun demo login...");

  const demoAccountsToEnsure = [
    // Guru SD
    {
      email: "guru.sd@gmail.com",
      name: "Ustadzah Nurul, S.Pd",
      pw: hashGuru,
      status: "2",
      jenjang: "SD",
      gender: "P",
      nip: "198902142013012003",
      guru_bidang: "Tematik & IPAS",
    },
    // Walas SD
    {
      email: "walas.sd@gmail.com",
      name: "Ustadzah Fatimah, S.Pd",
      pw: hashGuru,
      status: "4",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "P",
      nip: "198501152010012001",
      guru_bidang: "Pendidikan Agama Islam",
    },
    // Guru SMP
    {
      email: "guru.smp@gmail.com",
      name: "Ustadz Wildan, M.Pd",
      pw: hashGuru,
      status: "2",
      jenjang: "SMP",
      gender: "L",
      nip: "198604182012011002",
      guru_bidang: "Matematika SMP",
    },
    // Walas SMP
    {
      email: "walas.smp@gmail.com",
      name: "Ustadz Farhan, S.Pd",
      pw: hashGuru,
      status: "4",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
      gender: "L",
      nip: "198703122011011005",
      guru_bidang: "Bahasa Inggris SMP",
    },
    // Guru SD & SMP (Lintas)
    {
      email: "guru.lintas@gmail.com",
      name: "Ustadz Ahmad, S.Pd.I",
      pw: hashGuru,
      status: "2",
      jenjang: "ALL",
      gender: "L",
      nip: "198603202011011002",
      guru_bidang: "Bahasa Arab (SD & SMP)",
    },
    // Siswa SD
    {
      email: "siswa.sd@gmail.com",
      name: "Muhammad Rayhan Al-Fatih",
      pw: hashSiswa,
      status: "1",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "L",
      nis: "202404001",
      point: "90",
    },
    // Siswa SMP
    {
      email: "siswa.smp@gmail.com",
      name: "Haidar Ali SMP",
      pw: hashSiswa,
      status: "1",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
      gender: "L",
      nis: "202407001",
      point: "85",
    },
    // Siswa Tambahan Kelas 4 (Teman Sekelas Siswa SD)
    {
      email: "siswa2@gmail.com",
      name: "Khalid Al-Ghazi",
      pw: hashSiswa,
      status: "1",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "L",
      nis: "202404002",
      point: "92",
    },
    {
      email: "siswa3@gmail.com",
      name: "Zahra Salsabila",
      pw: hashSiswa,
      status: "1",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "P",
      nis: "202404003",
      point: "95",
    },
    // Siswa Tambahan Kelas 7 (Teman Sekelas Siswa SMP)
    {
      email: "siswa.smp2@gmail.com",
      name: "Fadhil Athallah SMP",
      pw: hashSiswa,
      status: "1",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
      gender: "L",
      nis: "202407002",
      point: "88",
    },
  ];

  const userMap = new Map<string, any>();

  for (const acc of demoAccountsToEnsure) {
    let user = await prisma.user.findUnique({
      where: { email: acc.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: acc.name,
          email: acc.email,
          password: acc.pw,
          password1: null,
          status: acc.status,
          jenjang: acc.jenjang,
          kelas: acc.kelas || null,
          gender: acc.gender,
          nis: acc.nis || null,
          nip: acc.nip || null,
          guru_bidang: acc.guru_bidang || null,
          point: acc.point || "100",
        },
      });
      console.log(`   + Akun dibuat: ${acc.email} (${acc.name})`);
    } else {
      // Pastikan nama, jenjang & kelas sesuai demo
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: acc.name,
          jenjang: acc.jenjang,
          kelas: acc.kelas || user.kelas,
          status: acc.status,
        },
      });
      console.log(`   ✓ Akun siap: ${acc.email} (ID: ${user.id})`);
    }

    userMap.set(acc.email, user);
  }

  // 2. Bersihkan catatan pelanggaran demo lama agar tidak duplikat
  console.log("\n2. Membersihkan catatan pelanggaran demo lama...");
  const demoUserIds = Array.from(userMap.values()).map((u) => u.id.toString());
  const deleted = await prisma.pelanggaran.deleteMany({
    where: {
      OR: [
        { user_id: { in: demoUserIds } },
        { guru_nama: { in: demoAccountsToEnsure.filter((a) => a.status === "2" || a.status === "4").map((a) => a.name) } },
      ],
    },
  });
  console.log(`   - Menghapus ${deleted.count} record demo lama.`);

  // 3. Buat Catatan Pelanggaran Baru Sesuai Skenario Demo
  console.log("\n3. Menyusun catatan pelanggaran lengkap...");

  const guruSD = userMap.get("guru.sd@gmail.com")!;
  const walasSD = userMap.get("walas.sd@gmail.com")!;
  const guruSMP = userMap.get("guru.smp@gmail.com")!;
  const walasSMP = userMap.get("walas.smp@gmail.com")!;
  const guruLintas = userMap.get("guru.lintas@gmail.com")!;

  const siswaSD = userMap.get("siswa.sd@gmail.com")!;
  const siswaSD2 = userMap.get("siswa2@gmail.com")!;
  const siswaSD3 = userMap.get("siswa3@gmail.com")!;

  const siswaSMP = userMap.get("siswa.smp@gmail.com")!;
  const siswaSMP2 = userMap.get("siswa.smp2@gmail.com")!;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const monthsAgo = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - months);
    return d;
  };

  const sampleViolations = [
    // =========================================================================
    // A. SISWA SD (Muhammad Rayhan Al-Fatih) - Berbagai Guru, Semester & Kelas
    // =========================================================================
    {
      student: siswaSD,
      guru: guruSD,
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kategori: "Kedisiplinan iPad & Digital",
      tingkatan: "SEDANG",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SD",
      created_at: daysAgo(2),
      rawKeterangan: "Membuka game edukasi non-materi pada saat jam pembelajaran Tematik & IPAS berlangsung.",
      tindakan: "Diberi teguran santun dan layar iPad dikunci sementara oleh guru pengampu.",
    },
    {
      student: siswaSD,
      guru: walasSD,
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kategori: "Ibadah & Karakter Islami",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SD",
      created_at: daysAgo(11),
      rawKeterangan: "Terlambat (masbuk) hadir Sholat Dhuha berjamaah di masjid karena masih mengobrol di kelas.",
      tindakan: "Diberikan nasihat lisan oleh wali kelas agar bergegas saat adzan berkumandang.",
    },
    {
      student: siswaSD,
      guru: guruLintas,
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kategori: "Seragam & Kerapian Atribut",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SD",
      created_at: daysAgo(24),
      rawKeterangan: "Tidak mengenakan peci hitam resmi Al-Azhar saat pelaksanaan upacara bendera hari Senin.",
      tindakan: "Diingatkan untuk selalu menyiapkan atribut upacara pada malam hari sebelum tidur.",
    },
    // Histori Kelas 3 - Semester 2 (Untuk menguji fitur filter histori kelas/semester siswa)
    {
      student: siswaSD,
      guru: guruSD,
      kelas: "Kelas 3 - Ibnu Batutah",
      kategori: "Kedisiplinan iPad & Digital",
      tingkatan: "RINGAN",
      semester: "Semester 2 - 2025/2026",
      tahun_pelajaran: "2025/2026",
      jenjang: "SD",
      created_at: monthsAgo(5),
      rawKeterangan: "Lupa mengisi daya baterai iPad dari rumah sehingga baterai tersisa di bawah 10% saat KBM.",
      tindakan: "Meminjam kabel charger sekolah di ruang guru dan berjanji mengisi daya penuh dari rumah.",
    },
    // Histori Kelas 3 - Semester 1
    {
      student: siswaSD,
      guru: walasSD,
      kelas: "Kelas 3 - Ibnu Batutah",
      kategori: "Ketertiban & Kehadiran Kelas",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2025/2026",
      tahun_pelajaran: "2025/2026",
      jenjang: "SD",
      created_at: monthsAgo(10),
      rawKeterangan: "Terlambat masuk ke ruang kelas setelah waktu istirahat makan siang selesai.",
      tindakan: "Diberi pembinaan kedisiplinan waktu oleh wali kelas.",
    },

    // =========================================================================
    // B. TEMAN SEKELAS SD (Untuk Monitoring Walas SD di Kelas 4)
    // =========================================================================
    {
      student: siswaSD2, // Khalid Al-Ghazi
      guru: walasSD,
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kategori: "Ketertiban & Kehadiran Kelas",
      tingkatan: "SEDANG",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SD",
      created_at: daysAgo(4),
      rawKeterangan: "Meninggalkan ruang kelas tanpa izin saat guru sedang menyiapkan modul pembelajaran.",
      tindakan: "Dialog refleksi bersama wali kelas dan merapikan perpustakaan kelas.",
    },
    {
      student: siswaSD2, // Khalid Al-Ghazi
      guru: guruSD,
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kategori: "Seragam & Kerapian Atribut",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SD",
      created_at: daysAgo(16),
      rawKeterangan: "Mengenakan kaus kaki putih polos yang tidak sesuai dengan ketentuan seragam sekolah.",
      tindakan: "Diberi catatan di buku penghubung siswa untuk orang tua.",
    },
    {
      student: siswaSD3, // Zahra Salsabila
      guru: walasSD,
      kelas: "Kelas 4 - Mehmed Al Fatih",
      kategori: "Ibadah & Karakter Islami",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SD",
      created_at: daysAgo(7),
      rawKeterangan: "Lupa membawa mukena bersih untuk pelaksanaan sholat Dzuhur berjamaah.",
      tindakan: "Meminjam mukena cadangan musholla dan diingatkan untuk menaruh mukena di loker.",
    },

    // =========================================================================
    // C. SISWA SMP (Haidar Ali SMP) - Berbagai Guru, Semester & Kelas
    // =========================================================================
    {
      student: siswaSMP,
      guru: guruSMP,
      kelas: "Kelas 7 - Ibnu Sina",
      kategori: "Kedisiplinan iPad & Digital",
      tingkatan: "SEDANG",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SMP",
      created_at: daysAgo(3),
      rawKeterangan: "Mencoba mengakses media sosial saat jam KBM Matematika SMP berlangsung.",
      tindakan: "Konseling edukasi digital oleh guru mapel dan penugasan latihan Matematika tambahan.",
    },
    {
      student: siswaSMP,
      guru: walasSMP,
      kelas: "Kelas 7 - Ibnu Sina",
      kategori: "Ibadah & Karakter Islami",
      tingkatan: "SEDANG",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SMP",
      created_at: daysAgo(14),
      rawKeterangan: "Bercanda dan mengganggu teman di saf sholat saat dzikir setelah sholat Dzuhur berjamaah.",
      tindakan: "Dibimbing wali kelas untuk muroja'ah Surat Al-Mulk ayat 1-10 secara khusyuk.",
    },
    {
      student: siswaSMP,
      guru: guruLintas,
      kelas: "Kelas 7 - Ibnu Sina",
      kategori: "Adab, Sikap & Etika Santri",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SMP",
      created_at: daysAgo(28),
      rawKeterangan: "Meninggikan nada bicara saat berdiskusi kelompok di dalam kelas Bahasa Arab.",
      tindakan: "Diberi nasihat lisan mengenai adab bertutur kata santun sesama penuntut ilmu.",
    },
    // Histori Semester 2 Lalu saat SMP
    {
      student: siswaSMP,
      guru: walasSMP,
      kelas: "Kelas 7 - Ibnu Sina",
      kategori: "Seragam & Kerapian Atribut",
      tingkatan: "RINGAN",
      semester: "Semester 2 - 2025/2026",
      tahun_pelajaran: "2025/2026",
      jenjang: "SMP",
      created_at: monthsAgo(6),
      rawKeterangan: "Memakai sepatu dengan tali berwarna neon yang tidak sesuai seragam resmi SMP Al-Azhar.",
      tindakan: "Diberikan teguran santun untuk segera mengganti dengan tali sepatu hitam polos.",
    },

    // =========================================================================
    // D. TEMAN SEKELAS SMP (Untuk Monitoring Walas SMP di Kelas 7)
    // =========================================================================
    {
      student: siswaSMP2, // Fadhil Athallah SMP
      guru: walasSMP,
      kelas: "Kelas 7 - Ibnu Sina",
      kategori: "Ketertiban & Kehadiran Kelas",
      tingkatan: "SEDANG",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SMP",
      created_at: daysAgo(5),
      rawKeterangan: "Tidak melaksanakan piket kebersihan kelas sesuai jadwal yang telah disepakati bersama.",
      tindakan: "Melaksanakan piket kebersihan pengganti bersama teman regu piket.",
    },
    {
      student: siswaSMP2, // Fadhil Athallah SMP
      guru: guruSMP,
      kelas: "Kelas 7 - Ibnu Sina",
      kategori: "Kedisiplinan iPad & Digital",
      tingkatan: "RINGAN",
      semester: "Semester 1 - 2026/2027",
      tahun_pelajaran: "2026/2027",
      jenjang: "SMP",
      created_at: daysAgo(20),
      rawKeterangan: "Terlambat mengunci layar iPad saat ustadz meminta fokus memperhatikan papan tulis.",
      tindakan: "Diberikan peringatan lisan dan pembiasaan fokus belajar di kelas.",
    },
  ];

  let insertedCount = 0;
  for (const item of sampleViolations) {
    const formattedKeterangan = formatViolationKeterangan({
      keterangan: item.rawKeterangan,
      severity: item.tingkatan as any,
      tindakan: item.tindakan,
    });

    await prisma.pelanggaran.create({
      data: {
        user_id: item.student.id.toString(),
        nama: item.student.name,
        kelas: item.kelas,
        kategori: item.kategori,
        keterangan: formattedKeterangan,
        tingkatan: item.tingkatan,
        semester: item.semester,
        tahun_pelajaran: item.tahun_pelajaran,
        jenjang: item.jenjang,
        guru_id: item.guru.id,
        guru_nama: item.guru.name,
        created_at: item.created_at,
      },
    });
    insertedCount++;
  }

  console.log(`\n✅ Berhasil menambahkan ${insertedCount} data pelanggaran contoh untuk akun demo!`);
  console.log("=====================================================");
  console.log("Daftar Akun yang Siap Diuji:");
  console.log(" 1. Siswa SD      : siswa.sd@gmail.com    (Punya 5 catatan, 2 semester berbeda, 2 kelas berbeda)");
  console.log(" 2. Walas SD      : walas.sd@gmail.com    (Monitoring Kelas 4 - Mehmed Al Fatih: 6 catatan)");
  console.log(" 3. Guru SD       : guru.sd@gmail.com     (Dapat mencatat & melihat seluruh siswa SD)");
  console.log(" 4. Siswa SMP     : siswa.smp@gmail.com   (Punya 4 catatan, 2 semester berbeda)");
  console.log(" 5. Walas SMP     : walas.smp@gmail.com   (Monitoring Kelas 7 - Ibnu Sina: 6 catatan)");
  console.log(" 6. Guru SMP      : guru.smp@gmail.com    (Dapat mencatat & melihat seluruh siswa SMP)");
  console.log(" 7. Guru SD & SMP : guru.lintas@gmail.com (Dapat mencatat siswa SD maupun SMP)");
  console.log("=====================================================");
}

main()
  .catch((e) => {
    console.error("Gagal menjalankan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

