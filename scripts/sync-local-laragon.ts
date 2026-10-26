import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const LOCAL_DB_URL = "mysql://root:@localhost:3306/student-app";

async function main() {
  console.log("=================================================");
  console.log("🚀 Memulai Sinkronisasi ke DB Local Laragon...");
  console.log(`📡 URL: ${LOCAL_DB_URL}`);
  console.log("=================================================");

  let conn;
  try {
    conn = await mysql.createConnection(LOCAL_DB_URL);
    console.log("✅ Berhasil terhubung ke database Laragon 'student-app'!");

    // -------------------------------------------------------------------------
    // 1. DDL: Skema Kolom 'jenjang' pada Tabel 'users'
    // -------------------------------------------------------------------------
    console.log("\n1️⃣ Memeriksa skema tabel 'users'...");
    const [userCols]: any = await conn.query("SHOW COLUMNS FROM users LIKE 'jenjang'");
    if (userCols.length === 0) {
      console.log("  ➕ Menambahkan kolom 'jenjang' ke tabel 'users'...");
      await conn.query("ALTER TABLE users ADD COLUMN jenjang VARCHAR(20) NULL AFTER status");
      console.log("  ✅ Kolom 'jenjang' berhasil ditambahkan.");
    } else {
      console.log("  ℹ️ Kolom 'jenjang' sudah ada di tabel 'users'.");
    }

    const [userIndexes]: any = await conn.query(
      "SHOW INDEX FROM users WHERE Key_name = 'users_jenjang_status_index'"
    );
    if (userIndexes.length === 0) {
      console.log("  ➕ Menambahkan index 'users_jenjang_status_index'...");
      try {
        await conn.query("ALTER TABLE users ADD INDEX users_jenjang_status_index (jenjang, status)");
        console.log("  ✅ Index 'users_jenjang_status_index' berhasil ditambahkan.");
      } catch (idxErr: any) {
        console.warn(`  ⚠️ Warning penambahan index: ${idxErr.message}`);
      }
    } else {
      console.log("  ℹ️ Index 'users_jenjang_status_index' sudah ada.");
    }

    // -------------------------------------------------------------------------
    // 2. DDL: Skema Kolom 'jenjang' & 'tingkat' pada 'tbl_kelas'
    // -------------------------------------------------------------------------
    console.log("\n2️⃣ Memeriksa skema tabel 'tbl_kelas'...");
    const [kelasCols]: any = await conn.query("SHOW COLUMNS FROM tbl_kelas LIKE 'jenjang'");
    if (kelasCols.length === 0) {
      console.log("  ➕ Menambahkan kolom 'jenjang' ke tabel 'tbl_kelas'...");
      await conn.query("ALTER TABLE tbl_kelas ADD COLUMN jenjang VARCHAR(20) NOT NULL DEFAULT 'SD' AFTER `nama-kelas`");
    }

    const [tingkatCols]: any = await conn.query("SHOW COLUMNS FROM tbl_kelas LIKE 'tingkat'");
    if (tingkatCols.length === 0) {
      console.log("  ➕ Menambahkan kolom 'tingkat' ke tabel 'tbl_kelas'...");
      await conn.query("ALTER TABLE tbl_kelas ADD COLUMN tingkat INT NULL DEFAULT 4 AFTER jenjang");
    }

    // -------------------------------------------------------------------------
    // 3. DDL: Skema Kolom 'jenjang' pada 'tbl_mata_pelajaran'
    // -------------------------------------------------------------------------
    console.log("\n3️⃣ Memeriksa skema tabel 'tbl_mata_pelajaran'...");
    const [mapelCols]: any = await conn.query("SHOW COLUMNS FROM tbl_mata_pelajaran LIKE 'jenjang'");
    if (mapelCols.length === 0) {
      console.log("  ➕ Menambahkan kolom 'jenjang' ke tabel 'tbl_mata_pelajaran'...");
      await conn.query("ALTER TABLE tbl_mata_pelajaran ADD COLUMN jenjang VARCHAR(20) NOT NULL DEFAULT 'SEMUA' AFTER nama_mapel");
    }

    // Pastikan Master Mata Pelajaran Ada
    const subjectsData = [
      { kode: "PAI", nama: "Pendidikan Agama Islam & Adab", jenjang: "SEMUA", icon: "BookHeart", warna: "emerald", desk: "Pembelajaran akidah, fiqih ibadah, sirah nabawiyah, dan pembiasaan adab islami harian." },
      { kode: "TAHFIDZ", nama: "Tahfidz & Tahsin Al-Qur'an", jenjang: "SEMUA", icon: "Sparkles", warna: "amber", desk: "Bimbingan hafalan Al-Qur'an tartil metode Al-Azhar dengan target kelulusan mutqin." },
      { kode: "BARAB", nama: "Bahasa Arab", jenjang: "SEMUA", icon: "Languages", warna: "teal", desk: "Penguasaan mufrodat, percakapan sehari-hari, dan kaidah dasar bahasa Al-Qur'an." },
      { kode: "BING", nama: "English Bilingual / Cambridge", jenjang: "SEMUA", icon: "Globe", warna: "blue", desk: "Pengembangan active listening, speaking, reading, dan writing standar Cambridge." },
      { kode: "BIND", nama: "Bahasa Indonesia", jenjang: "SEMUA", icon: "BookOpenText", warna: "sky", desk: "Keterampilan literasi, menulis kreatif, pemahaman teks, dan retorika komunikasi." },
      { kode: "MTK", nama: "Matematika", jenjang: "SEMUA", icon: "Calculator", warna: "indigo", desk: "Penguatan logika numerik, pemecahan masalah (HOTS), geometri, dan aljabar praktis." },
      { kode: "IPA", nama: "Ilmu Pengetahuan Alam (Sains)", jenjang: "SEMUA", icon: "Atom", warna: "violet", desk: "Eksplorasi fenomena alam, eksperimen laboratorium, sains biologi dan fisika terapan." },
      { kode: "IPS", nama: "Ilmu Pengetahuan Sosial", jenjang: "SMP", icon: "Compass", warna: "orange", desk: "Kajian sejarah peradaban, geografi kepulauan, interaksi sosial, dan ekonomi." },
      { kode: "INFOR", nama: "Informatika & Coding", jenjang: "SEMUA", icon: "Laptop", warna: "rose", desk: "Pembelajaran literasi digital iPad, computational thinking, algoritma, dan coding." },
      { kode: "PJOK", nama: "Pendidikan Jasmani & Olahraga", jenjang: "SEMUA", icon: "Activity", warna: "lime", desk: "Kebugaran jasmani, pembinaan olahraga sunnah (panahan, renang), dan sportivitas." },
    ];

    for (const s of subjectsData) {
      const [existingMapel]: any = await conn.query("SELECT id FROM tbl_mata_pelajaran WHERE kode_mapel = ?", [s.kode]);
      if (existingMapel.length === 0) {
        await conn.query(
          "INSERT INTO tbl_mata_pelajaran (kode_mapel, nama_mapel, jenjang, deskripsi, icon, warna, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [s.kode, s.nama, s.jenjang, s.desk, s.icon, s.warna]
        );
        console.log(`  ✨ Mapel baru: [${s.jenjang}] ${s.nama} (${s.kode})`);
      }
    }

    // -------------------------------------------------------------------------
    // 4. Data Kelas: Pastikan Kelas SMP Ada di Local Laragon
    // -------------------------------------------------------------------------
    console.log("\n4️⃣ Memeriksa & Menyinkronkan Kelas SMP...");
    const smpClasses = [
      { nama: "Kelas 7 - Ibnu Sina", jenjang: "SMP", tingkat: 7, wali: "Ustadz Farhan, S.Pd", code: "7101" },
      { nama: "Kelas 8 - Al Khawarizmi", jenjang: "SMP", tingkat: 8, wali: null, code: "8101" },
      { nama: "Kelas 9 - Al Biruni", jenjang: "SMP", tingkat: 9, wali: null, code: "9101" },
    ];

    for (const c of smpClasses) {
      const [existing]: any = await conn.query(
        "SELECT id FROM tbl_kelas WHERE `nama-kelas` = ?",
        [c.nama]
      );
      if (existing.length === 0) {
        await conn.query(
          "INSERT INTO tbl_kelas (`nama-kelas`, jenjang, tingkat, `wali-kelas`, `jumlah-siswa`, `code-restrict`, `kode-restrict`, created_at, updated_at) VALUES (?, ?, ?, ?, '28', ?, ?, NOW(), NOW())",
          [c.nama, c.jenjang, c.tingkat, c.wali, c.code, c.code]
        );
        console.log(`  ✨ Kelas baru ditambahkan: ${c.nama} (${c.jenjang})`);
      } else {
        await conn.query(
          "UPDATE tbl_kelas SET jenjang = ?, tingkat = ? WHERE id = ?",
          [c.jenjang, c.tingkat, existing[0].id]
        );
        console.log(`  🔄 Kelas diperbarui: ${c.nama} (${c.jenjang})`);
      }
    }

    // Update jenjang kelas SD yang masih null / belum terset
    await conn.query(`
      UPDATE tbl_kelas
      SET jenjang = CASE
        WHEN \`nama-kelas\` LIKE 'Kelas 7%' OR \`nama-kelas\` LIKE 'Kelas 8%' OR \`nama-kelas\` LIKE 'Kelas 9%' OR \`nama-kelas\` LIKE '%SMP%' THEN 'SMP'
        ELSE 'SD'
      END
    `);

    // -------------------------------------------------------------------------
    // 5. Backfill Jenjang Pengguna yang Sudah Ada
    // -------------------------------------------------------------------------
    console.log("\n5️⃣ Melakukan Backfill Jenjang Akun Pengguna...");

    // Admin -> ALL
    const [resAdmin]: any = await conn.query(
      "UPDATE users SET jenjang = 'ALL' WHERE status = '3' AND (jenjang IS NULL OR jenjang = '')"
    );
    console.log(`  ✅ Admin: ${resAdmin.affectedRows} akun di-update.`);

    // Siswa -> SMP / SD
    const [resSiswa]: any = await conn.query(`
      UPDATE users
      SET jenjang = CASE
        WHEN kelas LIKE 'Kelas 7%' OR kelas LIKE 'Kelas 8%' OR kelas LIKE 'Kelas 9%' OR kelas LIKE '%SMP%' THEN 'SMP'
        ELSE 'SD'
      END
      WHERE status = '1' AND (jenjang IS NULL OR jenjang = '')
    `);
    console.log(`  ✅ Siswa: ${resSiswa.affectedRows} akun di-update.`);

    // Guru -> ALL / SMP / SD
    const [resGuru]: any = await conn.query(`
      UPDATE users u
      LEFT JOIN (
        SELECT jp.guru_id,
               COUNT(DISTINCT k.jenjang) as distinct_jenjang,
               MAX(k.jenjang) as max_jenjang
        FROM tbl_jadwal_pelajaran jp
        JOIN tbl_kelas k ON jp.kelas_id = k.id
        GROUP BY jp.guru_id
      ) j ON u.id = j.guru_id
      SET u.jenjang = CASE
        WHEN j.distinct_jenjang > 1 THEN 'ALL'
        WHEN j.max_jenjang IS NOT NULL THEN j.max_jenjang
        WHEN u.kelas LIKE 'Kelas 7%' OR u.kelas LIKE 'Kelas 8%' OR u.kelas LIKE 'Kelas 9%' OR u.kelas LIKE '%SMP%' THEN 'SMP'
        ELSE 'SD'
      END
      WHERE u.status IN ('2', '4') AND (u.jenjang IS NULL OR u.jenjang = '')
    `);
    console.log(`  ✅ Guru: ${resGuru.affectedRows} akun di-update.`);

    // -------------------------------------------------------------------------
    // 6. Menyinkronkan 10 Akun Demo + Akun Legacy
    // -------------------------------------------------------------------------
    console.log("\n6️⃣ Menyinkronkan 10 Akun Demo & Akun Utama...");

    const hashAdmin = await bcrypt.hash("admin123", 10);
    const hashGuru = await bcrypt.hash("guru123", 10);
    const hashSiswa = await bcrypt.hash("siswa123", 10);

    const demoUsers = [
      // 1. Super Admin
      {
        email: "superadmin@gmail.com",
        name: "Super Administrator Al-Azhar",
        role: "admin",
        status: "3",
        jenjang: "ALL",
        password: hashAdmin,
        plainPw: "admin123",
        gender: "L",
        kelas: null,
        nip: "198001012005011001",
        bidang: null,
      },
      // 2. Admin SD
      {
        email: "admin.sd@gmail.com",
        name: "Admin SD Islam Al-Azhar",
        role: "admin",
        status: "3",
        jenjang: "SD",
        password: hashAdmin,
        plainPw: "admin123",
        gender: "L",
        kelas: null,
        nip: "198205122008011002",
        bidang: null,
      },
      // 3. Admin SMP
      {
        email: "admin.smp@gmail.com",
        name: "Admin SMP Islam Al-Azhar",
        role: "admin",
        status: "3",
        jenjang: "SMP",
        password: hashAdmin,
        plainPw: "admin123",
        gender: "L",
        kelas: null,
        nip: "198408232010011003",
        bidang: null,
      },
      // 4. Guru SD
      {
        email: "guru.sd@gmail.com",
        name: "Ustadzah Aisyah, S.Pd",
        role: "guru",
        status: "2",
        jenjang: "SD",
        password: hashGuru,
        plainPw: "guru123",
        gender: "P",
        kelas: null,
        nip: "198802142012012003",
        bidang: "Matematika SD",
      },
      // 5. Walas SD
      {
        email: "walas.sd@gmail.com",
        name: "Ustadzah Fatimah, S.Pd",
        role: "guru",
        status: "4",
        jenjang: "SD",
        password: hashGuru,
        plainPw: "guru123",
        gender: "P",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        nip: "198501152010012001",
        bidang: "Pendidikan Agama Islam (PAI)",
      },
      // 6. Guru SMP
      {
        email: "guru.smp@gmail.com",
        name: "Ustadz Ridwan, M.Pd",
        role: "guru",
        status: "2",
        jenjang: "SMP",
        password: hashGuru,
        plainPw: "guru123",
        gender: "L",
        kelas: null,
        nip: "198604182012011002",
        bidang: "Matematika SMP",
      },
      // 7. Walas SMP
      {
        email: "walas.smp@gmail.com",
        name: "Ustadz Farhan, S.Pd",
        role: "guru",
        status: "4",
        jenjang: "SMP",
        password: hashGuru,
        plainPw: "guru123",
        gender: "L",
        kelas: "Kelas 7 - Ibnu Sina",
        nip: "198703122011011005",
        bidang: "Bahasa Inggris SMP",
      },
      // 8. Guru Lintas
      {
        email: "guru.lintas@gmail.com",
        name: "Ustadz Ahmad, S.Pd.I",
        role: "guru",
        status: "2",
        jenjang: "ALL",
        password: hashGuru,
        plainPw: "guru123",
        gender: "L",
        kelas: null,
        nip: "198603202011011002",
        bidang: "Bahasa Arab (SD & SMP)",
      },
      // 9. Siswa SD
      {
        email: "siswa.sd@gmail.com",
        name: "Muhammad Rayhan Al-Fatih",
        role: "siswa",
        status: "1",
        jenjang: "SD",
        password: hashSiswa,
        plainPw: "siswa123",
        gender: "L",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        nis: "202404001",
        bidang: null,
      },
      // 10. Siswa SMP
      {
        email: "siswa.smp@gmail.com",
        name: "Haidar Ali SMP",
        role: "siswa",
        status: "1",
        jenjang: "SMP",
        password: hashSiswa,
        plainPw: "siswa123",
        gender: "L",
        kelas: "Kelas 7 - Ibnu Sina",
        nis: "202407001",
        bidang: null,
      },
      // Legacy Aliases
      {
        email: "admin@gmail.com",
        name: "Administrator SDIA",
        role: "admin",
        status: "3",
        jenjang: "ALL",
        password: hashAdmin,
        plainPw: "admin123",
        gender: "L",
        kelas: null,
        nip: "198001012005011001",
        bidang: null,
      },
      {
        email: "guru@gmail.com",
        name: "Ustadzah Fatimah, S.Pd",
        role: "guru",
        status: "4",
        jenjang: "SD",
        password: hashGuru,
        plainPw: "guru123",
        gender: "P",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        nip: "198501152010012001",
        bidang: "Pendidikan Agama Islam (PAI)",
      },
      {
        email: "siswa@gmail.com",
        name: "Muhammad Rayhan Al-Fatih",
        role: "siswa",
        status: "1",
        jenjang: "SD",
        password: hashSiswa,
        plainPw: "siswa123",
        gender: "L",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        nis: "202404001",
        bidang: null,
      },
    ];

    for (const u of demoUsers) {
      const [existing]: any = await conn.query("SELECT id FROM users WHERE email = ?", [u.email]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO users (name, email, password, password1, gender, status, jenjang, kelas, nip, nis, \`guru-bidang\`, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            u.name,
            u.email,
            u.password,
            u.plainPw,
            u.gender,
            u.status,
            u.jenjang,
            u.kelas,
            u.nip || null,
            (u as any).nis || null,
            u.bidang,
          ]
        );
        console.log(`  ✨ Akun baru dibuat: [${u.jenjang}] ${u.name} (${u.email})`);
      } else {
        await conn.query(
          `UPDATE users 
           SET name = ?, password = ?, password1 = ?, gender = ?, status = ?, jenjang = ?, kelas = ?, nip = ?, nis = ?, \`guru-bidang\` = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            u.name,
            u.password,
            u.plainPw,
            u.gender,
            u.status,
            u.jenjang,
            u.kelas,
            u.nip || null,
            (u as any).nis || null,
            u.bidang,
            existing[0].id,
          ]
        );
        console.log(`  🔄 Akun disinkronkan: [${u.jenjang}] ${u.name} (${u.email})`);
      }
    }

    // -------------------------------------------------------------------------
    // 7. Ringkasan Status Database Lokal
    // -------------------------------------------------------------------------
    console.log("\n=================================================");
    console.log("📊 STATUS AKHIR DATABASE LOCAL LARAGON (student-app):");
    console.log("=================================================");

    const [totalUsers]: any = await conn.query("SELECT COUNT(*) as count FROM users");
    const [totalKelasCount]: any = await conn.query("SELECT COUNT(*) as count FROM tbl_kelas");
    const [totalMapelCount]: any = await conn.query("SELECT COUNT(*) as count FROM tbl_mata_pelajaran");

    console.log(`• Total Pengguna di Database: ${totalUsers[0].count}`);
    console.log(`• Total Kelas (Rombel): ${totalKelasCount[0].count}`);
    console.log(`• Total Mata Pelajaran: ${totalMapelCount[0].count}`);

    const [summaryJenjang]: any = await conn.query(`
      SELECT 
        CASE 
          WHEN status = '3' THEN 'Admin'
          WHEN status IN ('2', '4') THEN 'Guru'
          WHEN status = '1' THEN 'Siswa'
          ELSE 'Lainnya'
        END as role_label,
        COALESCE(jenjang, 'NULL') as jenjang,
        COUNT(*) as total
      FROM users
      GROUP BY role_label, jenjang
      ORDER BY role_label, jenjang
    `);

    console.log("\n📈 Distribusi Jenjang per Peran Pengguna:");
    console.table(summaryJenjang);

    console.log("\n✅ SINKRONISASI KE LOCAL LARAGON SELESAI DENGAN SUKSES!");
  } catch (err: any) {
    console.error("❌ Terjadi kesalahan saat sinkronisasi:", err.message);
  } finally {
    if (conn) await conn.end();
  }
}

main();
