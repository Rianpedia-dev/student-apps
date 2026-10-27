import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Script Migrasi Password Plaintext ke Bcrypt Hash
 * Merujuk ke plan-update-.md Fase 1 Task 1.3
 *
 * Mengambil semua pengguna yang masih menyimpan password plaintext di kolom `password1`,
 * mengenkripsi ulang dengan bcrypt (salt rounds = 12), lalu mengosongkan kolom `password1` menjadi null.
 */
export async function migratePasswords() {
  console.log("🔒 [MIGRATION] Memulai audit dan migrasi kolom legacy password1...");

  try {
    const usersWithPlaintext = await prisma.user.findMany({
      where: {
        password1: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        password1: true,
        password: true,
      },
    });

    console.log(`📊 Ditemukan ${usersWithPlaintext.length} pengguna dengan kolom password1.`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithPlaintext) {
      try {
        const raw = user.password1?.trim();
        if (raw && raw.length > 0) {
          const hashed = await bcrypt.hash(raw, 12);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              password: hashed,
              password1: null,
            },
          });
        } else {
          // Kosongkan string hampa
          await prisma.user.update({
            where: { id: user.id },
            data: {
              password1: null,
            },
          });
        }
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`  Processed ${successCount}/${usersWithPlaintext.length} users...`);
        }
      } catch (err) {
        console.error(`❌ Gagal memigrasi user ${user.email} (ID: ${user.id}):`, err);
        errorCount++;
      }
    }

    console.log(
      `✅ [SELESAI] Migrasi tuntas. ${successCount} berhasil diupdate, ${errorCount} error.`
    );
    return { total: usersWithPlaintext.length, success: successCount, errors: errorCount };
  } catch (error) {
    console.error("❌ Fatal error saat migrasi password:", error);
    throw error;
  }
}

if (process.argv[1]?.includes("migrate-passwords")) {
  migratePasswords()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
