import prisma from "@/lib/prisma";

/**
 * SEEDER PRESENSI KBM (MATA PELAJARAN)
 * 
 * Seeder ini mengisi data absensi berbasis mata pelajaran yang realistis untuk:
 * 1. Hari Ini (Live Real-Time Monitoring & Wali Kelas Matrix)
 *    - Menghasilkan status Hadir, Sakit Seharian (Wali Kelas sync), Izin, dan Bolos Terdeteksi (Discrepancy)
 * 2. 14 Hari Efektif Sekolah Sebelumnya (Historical KBM Recap)
 *    - Menghasilkan riwayat rekap bulanan kelas, progress kehadiran siswa, dan statistik audit kepatuhan admin
 */
async function main() {
  console.log("=================================================");
  console.log("📋 Memulai Seeding Data Presensi Siswa (Per Mapel)...");
  console.log("=================================================");

  // 1. Ambil semua Jadwal Pelajaran aktif beserta relasi kelas, mapel, dan guru
  const schedules = await prisma.jadwalPelajaran.findMany({
    include: {
      kelas: true,
      mapel: true,
      guru: true,
    },
    orderBy: [{ kelas_id: "asc" }, { hari: "asc" }, { jam_mulai: "asc" }],
  });

  if (schedules.length === 0) {
    console.error("❌ Tidak ada data Jadwal Pelajaran (KBM) ditemukan.");
    console.log("💡 Jalankan seed jadwal terlebih dahulu: npm run seed:jadwal");
    return;
  }

  console.log(`🔍 Ditemukan ${schedules.length} jadwal KBM aktif.`);

  // 2. Ambil siswa aktif per kelas
  const kelasNames = Array.from(new Set(schedules.map((s) => s.kelas.nama_kelas)));
  const allStudents = await prisma.user.findMany({
    where: {
      status: "1",
      kelas: { in: kelasNames },
    },
    orderBy: { name: "asc" },
  });

  const studentsByClass = new Map<string, typeof allStudents>();
  for (const student of allStudents) {
    if (!student.kelas) continue;
    const list = studentsByClass.get(student.kelas) || [];
    list.push(student);
    studentsByClass.set(student.kelas, list);
  }

  console.log(`👥 Ditemukan ${allStudents.length} siswa aktif di ${kelasNames.length} kelas.`);

  // Mapping nama hari Bahasa Indonesia ke getDay() (0: Minggu, 1: Senin, ..., 6: Sabtu)
  const dayNameToIndex: Record<string, number> = {
    Minggu: 0,
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
    Sabtu: 6,
  };

  const dayIndexToName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  // 3. Tentukan rentang tanggal:
  // - Hari ini (Today)
  // - 20 hari ke belakang (mencakup ~14-16 hari KBM efektif sekolah, Senin s/d Jumat)
  const now = new Date();
  const targetDates: { dateStr: string; dayName: string; isToday: boolean; month: string }[] = [];

  for (let i = 21; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayOfWeek = d.getDay();
    // Abaikan hari Sabtu (6) dan Minggu (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = dayIndexToName[dayOfWeek];
    const isToday = i === 0;

    targetDates.push({ dateStr, dayName, isToday, month: String(d.getMonth() + 1) });
  }

  console.log(`📅 Menyiapkan presensi untuk ${targetDates.length} hari KBM aktif.`);

  // 4. Siapkan kumpulan record absensi
  const recordsToInsert: Array<{
    user_id: bigint;
    kelas: string;
    kelas_id: bigint;
    mapel_id: bigint;
    jadwal_id: bigint;
    guru_id: bigint;
    keterangan: string;
    catatan: string | null;
    date: string;
    month: string;
    jam_ke: string;
  }> = [];

  let todayCount = 0;
  let historyCount = 0;

  for (const dateItem of targetDates) {
    const { dateStr, dayName, isToday, month } = dateItem;

    // Filter jadwal yang berjalan di hari ini (Senin, Selasa, dll.)
    const matchingSchedules = schedules.filter((s) => s.hari.toLowerCase() === dayName.toLowerCase());

    for (const sch of matchingSchedules) {
      const studentsInClass = studentsByClass.get(sch.kelas.nama_kelas) || [];
      if (studentsInClass.length === 0) continue;

      const jamKe = `${sch.jam_mulai} - ${sch.jam_selesai}`;

      studentsInClass.forEach((student, index) => {
        let keterangan = "Hadir";
        let catatan: string | null = null;

        if (isToday) {
          // Kasus Khusus untuk HARI INI (untuk mendemokan seluruh skenario di dashboard):
          // Siswa 1 (index 1): Sakit Seharian (diset oleh Wali Kelas)
          if (index === 1) {
            keterangan = "Sakit";
            catatan = "Diset oleh Wali Kelas (Surat Dokter flu & demam terlampir)";
          }
          // Siswa 2 (index 2): Bolos Terdeteksi / Cabut Pelajaran
          // (Misal: Jika jam kedua/siang maka Alpha, jika pagi Hadir)
          else if (index === 2) {
            if (sch.jam_mulai >= "09:00") {
              keterangan = "Alpha";
              catatan = "Tidak berada di kelas saat sesi dimulai (Bolos)";
            } else {
              keterangan = "Hadir";
              catatan = "Hadir sesi pagi";
            }
          }
          // Siswa 3 (index 3): Izin
          else if (index === 3) {
            keterangan = "Izin";
            catatan = "Izin mewakili sekolah di lomba tahfidz";
          }
          // Siswa lainnya: Hadir (dengan catatan berkala)
          else {
            keterangan = "Hadir";
            if (index % 5 === 0) {
              catatan = "Sangat aktif dalam diskusi KBM";
            } else if (index % 7 === 0) {
              catatan = "Terlambat 5 menit (sudah lapor piket)";
            }
          }
          todayCount++;
        } else {
          // Kasus Historis (14 hari sebelumnya):
          // Menggunakan algoritma hash deterministik agar rasio kehadiran stabil di ~92-96%
          const seedValue = (Number(student.id) * 31 + Number(sch.mapel_id) * 17 + parseInt(dateStr.replace(/-/g, "").slice(-4), 10)) % 100;

          if (seedValue < 90) {
            keterangan = "Hadir";
            if (seedValue % 8 === 0) {
              catatan = "Aktif dan tertib";
            }
          } else if (seedValue < 95) {
            keterangan = "Sakit";
            catatan = "Sakit (surat orang tua)";
          } else if (seedValue < 98) {
            keterangan = "Izin";
            catatan = "Izin keperluan keluarga";
          } else {
            keterangan = "Alpha";
            catatan = "Tanpa keterangan";
          }
          historyCount++;
        }

        recordsToInsert.push({
          user_id: student.id,
          kelas: sch.kelas.nama_kelas,
          kelas_id: sch.kelas.id,
          mapel_id: sch.mapel_id,
          jadwal_id: sch.id,
          guru_id: sch.guru_id,
          keterangan,
          catatan,
          date: dateStr,
          month,
          jam_ke: jamKe,
        });
      });
    }
  }

  console.log(`\n💾 Menyimpan ${recordsToInsert.length} data presensi ke database...`);

  // 5. Bersihkan data presensi seeder pada tanggal-tanggal target agar tidak duplikat
  const targetDateStrings = targetDates.map((t) => t.dateStr);
  const deletedOld = await prisma.absen.deleteMany({
    where: {
      date: { in: targetDateStrings },
      mapel_id: { not: null },
    },
  });
  console.log(`🧹 Membersihkan ${deletedOld.count} data presensi mapel lama pada rentang tanggal target.`);

  // 6. Masukkan record secara batch (500 baris per batch untuk performa optimal)
  const batchSize = 500;
  let insertedTotal = 0;

  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const chunk = recordsToInsert.slice(i, i + batchSize);
    await prisma.absen.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    insertedTotal += chunk.length;
    process.stdout.write(`⏳ Tersimpan: ${insertedTotal} / ${recordsToInsert.length} baris...\r`);
  }

  console.log(`\n=================================================`);
  console.log(`🎉 Seeding Data Presensi Siswa Sukses!`);
  console.log(`-------------------------------------------------`);
  console.log(`- Total Record Presensi : ${recordsToInsert.length}`);
  console.log(`- Presensi Hari Ini     : ${todayCount} record`);
  console.log(`- Presensi Historis     : ${historyCount} record`);
  console.log(`- Tanggal Tercover      : ${targetDates[0]?.dateStr} s/d ${targetDates[targetDates.length - 1]?.dateStr}`);
  console.log(`- Fitur Siap Diuji      :`);
  console.log(`  1. /guru/attendance (Hub Jadwal & Presensi Hari Ini)`);
  console.log(`  2. /guru/attendance/matrix (Matriks Wali Kelas & Alert Bolos)`);
  console.log(`  3. /guru/attendance/recap (Rekap Bulanan Mapel & PDF A4)`);
  console.log(`  4. /admin/attendance (Monitoring Kepatuhan Sekolah)`);
  console.log(`  5. /siswa/attendance (Portal Siswa: Riwayat & Persentase)`);
  console.log(`=================================================`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal menjalankan seeder presensi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
