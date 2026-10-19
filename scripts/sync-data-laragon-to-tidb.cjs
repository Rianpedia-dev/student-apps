const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

const localConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'student-app',
  dateStrings: true,
};

const tidbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2jsdE8KwwSrScdG.root',
  password: 'OuScPAxSg3m0d7Vb',
  database: 'student-app',
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  dateStrings: true,
};

async function sync() {
  console.log('Connecting to Laragon and TiDB Cloud...');
  const localConn = await mariadb.createConnection(localConfig);
  const tidbConn = await mariadb.createConnection(tidbConfig);

  try {
    // 1. Get all tables from local
    const tablesRes = await localConn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'student-app' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`
    );
    const tables = tablesRes.map((r) => r.TABLE_NAME);
    console.log(`Found ${tables.length} tables in local Laragon.`);

    // 2. Backup TiDB current data to JSON
    console.log('Creating backup of current TiDB Cloud data...');
    const tidbBackup = {};
    for (const table of tables) {
      try {
        const rows = await tidbConn.query(`SELECT * FROM \`${table}\``);
        tidbBackup[table] = rows;
      } catch (e) {
        tidbBackup[table] = [];
      }
    }
    const backupPath = path.join(__dirname, 'tidb-backup-before-sync.json');
    fs.writeFileSync(backupPath, JSON.stringify(tidbBackup, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
    console.log(`✅ Backup saved to: ${backupPath}`);

    // 3. Disable foreign key checks on TiDB
    await tidbConn.query('SET FOREIGN_KEY_CHECKS = 0');

    // 4. Copy each table from Laragon to TiDB
    console.log('\n--- Starting Data Sync from Laragon to TiDB Cloud ---');
    for (const table of tables) {
      process.stdout.write(`Syncing ${table.padEnd(30)} ... `);
      const rows = await localConn.query(`SELECT * FROM \`${table}\``);

      // Truncate table on TiDB
      await tidbConn.query(`DELETE FROM \`${table}\``);

      if (rows.length === 0) {
        console.log(`0 rows (cleared)`);
        continue;
      }

      // Get column names
      const sampleRow = rows[0];
      const columns = Object.keys(sampleRow);
      const colList = columns.map((c) => `\`${c}\``).join(', ');
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders})`;

      // Batch insert in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        for (const row of chunk) {
          const values = columns.map((c) => (row[c] === undefined ? null : row[c]));
          await tidbConn.query(sql, values);
        }
      }
      console.log(`✅ ${rows.length} rows synced`);
    }

    // 5. Re-enable foreign key checks on TiDB
    await tidbConn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ All tables synchronized successfully!');

    // 6. Verification
    console.log('\n=========================================');
    console.log('VERIFICATION: ROW COUNTS');
    console.log('=========================================');
    let allMatched = true;
    for (const table of tables) {
      const [localCnt] = await localConn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      const [tidbCnt] = await tidbConn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      const l = Number(localCnt.cnt);
      const t = Number(tidbCnt.cnt);
      const ok = l === t;
      if (!ok) allMatched = false;
      console.log(`${ok ? '✅' : '❌'} ${table.padEnd(30)} | Laragon: ${String(l).padStart(4)} | TiDB: ${String(t).padStart(4)}`);
    }

    if (allMatched) {
      console.log('\n🎉 SUCCESS: 100% of tables and row counts are IDENTICAL!');
    } else {
      console.log('\n⚠️ Some tables had count mismatches.');
    }
  } finally {
    await localConn.end();
    await tidbConn.end();
  }
}

sync().catch((err) => {
  console.error('Sync failed:', err);
});
