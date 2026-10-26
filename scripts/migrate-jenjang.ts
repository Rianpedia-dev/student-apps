import "dotenv/config";
import mysql from "mysql2/promise";

async function migrateDatabase(name: string, connectionUri: string, isRemote: boolean) {
  console.log(`\n========================================`);
  console.log(`🚀 Migrating database: ${name}`);
  console.log(`========================================`);

  let conn;
  try {
    conn = await mysql.createConnection({
      uri: connectionUri,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });
    console.log(`✅ Connected to ${name}`);

    // 1. Check if column 'jenjang' exists
    const [cols]: any = await conn.query("SHOW COLUMNS FROM users LIKE 'jenjang'");
    if (cols.length === 0) {
      console.log(`Adding 'jenjang' column to 'users'...`);
      await conn.query("ALTER TABLE users ADD COLUMN jenjang VARCHAR(20) NULL AFTER status");
      console.log(`✅ Column 'jenjang' added.`);
    } else {
      console.log(`ℹ️ Column 'jenjang' already exists.`);
    }

    // 2. Check if index exists
    const [indexes]: any = await conn.query("SHOW INDEX FROM users WHERE Key_name = 'users_jenjang_status_index'");
    if (indexes.length === 0) {
      console.log(`Adding index 'users_jenjang_status_index'...`);
      try {
        await conn.query("ALTER TABLE users ADD INDEX users_jenjang_status_index (jenjang, status)");
        console.log(`✅ Index 'users_jenjang_status_index' added.`);
      } catch (idxErr: any) {
        console.warn(`Warning adding index: ${idxErr.message}`);
      }
    } else {
      console.log(`ℹ️ Index 'users_jenjang_status_index' already exists.`);
    }

    // 3. Update existing users data
    console.log(`Running backfill for users.jenjang...`);

    // Admin -> ALL
    const [resAdmin]: any = await conn.query(
      "UPDATE users SET jenjang = 'ALL' WHERE status = '3' AND (jenjang IS NULL OR jenjang = '')"
    );
    console.log(`✅ Updated ${resAdmin.affectedRows} admin users to 'ALL'.`);

    // Siswa -> SMP / SD
    const [resSiswa]: any = await conn.query(`
      UPDATE users
      SET jenjang = CASE
        WHEN kelas LIKE 'Kelas 7%' OR kelas LIKE 'Kelas 8%' OR kelas LIKE 'Kelas 9%' OR kelas LIKE '%SMP%' THEN 'SMP'
        ELSE 'SD'
      END
      WHERE status = '1' AND (jenjang IS NULL OR jenjang = '')
    `);
    console.log(`✅ Updated ${resSiswa.affectedRows} siswa users.`);

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
    console.log(`✅ Updated ${resGuru.affectedRows} guru users.`);

    // Fallback for unassigned
    const [resRest]: any = await conn.query(
      "UPDATE users SET jenjang = 'SD' WHERE jenjang IS NULL OR jenjang = ''"
    );
    console.log(`✅ Updated ${resRest.affectedRows} remaining users to 'SD'.`);

    // Verify
    const [countByJenjang]: any = await conn.query(`
      SELECT COALESCE(jenjang, 'NULL') as jenjang, status, COUNT(*) as total
      FROM users
      GROUP BY jenjang, status
      ORDER BY status, jenjang
    `);
    console.log(`\n📊 User count by jenjang & status on ${name}:`);
    console.table(countByJenjang);

  } catch (err: any) {
    console.error(`❌ Migration error on ${name}:`, err.message);
  } finally {
    if (conn) await conn.end();
  }
}

async function main() {
  const envUrl = process.env.DATABASE_URL || "";
  const localUrl = "mysql://root:@localhost:3306/student-app";

  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    await migrateDatabase("Remote/TiDB", envUrl, true);
  }

  // Also migrate local database if available
  await migrateDatabase("Local MySQL", localUrl, false);
}

main().catch(console.error);
