import mysql from "mysql2/promise";

const LOCAL_DB_URL = "mysql://root:@localhost:3306/student-app";
const REMOTE_DB_URL = "mysql://2jsdE8KwwSrScdG.root:OuScPAxSg3m0d7Vb@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/student-app";

interface CleanTarget {
  name: string;
  url: string;
  isRemote: boolean;
}

const targets: CleanTarget[] = [
  { name: "Local Laragon (MySQL)", url: LOCAL_DB_URL, isRemote: false },
  { name: "Remote TiDB Cloud (AWS Singapore)", url: REMOTE_DB_URL, isRemote: true },
];

async function clearDataOnDatabase(target: CleanTarget) {
  console.log(`\n=============================================================`);
  console.log(`🧹 Membersihkan Data pada: ${target.name}`);
  console.log(`📡 URL: ${target.url.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`=============================================================`);

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      uri: target.url,
      ssl: target.isRemote ? { rejectUnauthorized: false } : undefined,
    });
    console.log(`✅ Berhasil terhubung ke ${target.name}!`);

    // Nonaktifkan pemeriksaan foreign key sementara untuk truncate/delete yang bersih
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Bersihkan tabel-tabel anak yang bergantung pada kelas, mapel, guru, siswa
    const dependentTables = [
      "tbl_tugas_jawaban_siswa",
      "tbl_tugas_submission",
      "tbl_tugas_soal_opsi",
      "tbl_tugas_soal",
      "tbl_tugas",
      "tbl_pertemuan_progress",
      "tbl_pertemuan",
      "tbl_jadwal_pelajaran",
      "tbl_absen",
      "tbl_chat_messages",
      "tbl_chat_rooms",
      "tbl_kelas_online_attendance",
      "tbl_kelas_online",
      "tbl_pelanggaran",
      "tb_prestasi",
      "tbl_restrict",
    ];

    console.log("\n🗑️  Membersihkan data relasi & aktivitas belajar...");
    for (const tbl of dependentTables) {
      try {
        const [delRes]: any = await conn.query(`DELETE FROM \`${tbl}\``);
        console.log(`   • ${tbl}: ${delRes.affectedRows || 0} baris dihapus.`);
      } catch (err: any) {
        // Jika tabel belum ada, lewati
        console.warn(`   • ${tbl}: dilewati (${err.message})`);
      }
    }

    // 2. Kosongkan tabel kelas
    console.log("\n🗑️  Mengosongkan tabel kelas (tbl_kelas)...");
    try {
      const [delKelas]: any = await conn.query("DELETE FROM `tbl_kelas`");
      console.log(`   • tbl_kelas: ${delKelas.affectedRows} kelas (SD & SMP) berhasil dihapus.`);
    } catch (e: any) {
      console.warn(`   • tbl_kelas warning: ${e.message}`);
    }

    // 3. Kosongkan tabel mata pelajaran
    console.log("\n🗑️  Mengosongkan tabel mata pelajaran (tbl_mata_pelajaran)...");
    try {
      const [delMapel]: any = await conn.query("DELETE FROM `tbl_mata_pelajaran`");
      console.log(`   • tbl_mata_pelajaran: ${delMapel.affectedRows} mapel berhasil dihapus.`);
    } catch (e: any) {
      console.warn(`   • tbl_mata_pelajaran warning: ${e.message}`);
    }

    // 4. Hapus data pengguna (Siswa SD/SMP status='1', Guru status='2' & '4', Pending status='0')
    // TETAP PERTAHANKAN ADMIN (status='3')
    console.log("\n🗑️  Menghapus akun Siswa & Guru (mempertahankan Admin status='3')...");
    const [delUsers]: any = await conn.query(
      "DELETE FROM `users` WHERE status IN ('0', '1', '2', '4')"
    );
    console.log(`   • users: ${delUsers.affectedRows} akun siswa & guru berhasil dihapus.`);

    // Aktifkan kembali pemeriksaan foreign key
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // 5. Cek & Verifikasi sisa data di database
    console.log("\n📊 Ringkasan Sisa Data di Database:");
    const [remainingUsers]: any = await conn.query(`
      SELECT id, name, email, status, jenjang 
      FROM users 
      ORDER BY id ASC
    `);
    const [kelasLeft]: any = await conn.query("SELECT COUNT(*) as c FROM tbl_kelas");
    const [mapelLeft]: any = await conn.query("SELECT COUNT(*) as c FROM tbl_mata_pelajaran");

    console.log(`   • Sisa Kelas: ${kelasLeft[0].c}`);
    console.log(`   • Sisa Mata Pelajaran: ${mapelLeft[0].c}`);
    console.log(`   • Sisa Akun Admin (Tetap Tersimpan): ${remainingUsers.length} akun`);
    console.table(remainingUsers);

    console.log(`✅ ${target.name} BERHASIL DIBERSIHKAN!`);
  } catch (err: any) {
    console.error(`❌ Gagal membersihkan ${target.name}:`, err.message);
  } finally {
    if (conn) {
      try {
        await conn.query("SET FOREIGN_KEY_CHECKS = 1");
        await conn.end();
      } catch {}
    }
  }
}

async function main() {
  console.log("=============================================================");
  console.log("🚨 OPERASI PENGOSONGAN DATA SISWA, GURU, KELAS, & MAPEL");
  console.log("=============================================================");

  for (const t of targets) {
    await clearDataOnDatabase(t);
  }

  console.log("\n=============================================================");
  console.log("🎉 SELURUH DATABASE BERHASIL DIKOSONGKAN SESUAI INSTRUKSI!");
  console.log("=============================================================");
}

main();
