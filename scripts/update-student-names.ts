import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Memperbarui nama siswa di database...");

  // Update siswa1
  const s1 = await prisma.user.updateMany({
    where: { email: "siswa1@gmail.com" },
    data: { name: "Muhammad Rayhan" },
  });
  console.log("✓ Updated siswa1:", s1.count);

  // Update siswa2
  const s2 = await prisma.user.updateMany({
    where: { email: "siswa2@gmail.com" },
    data: { name: "Khalid Al-Ghazi" },
  });
  console.log("✓ Updated siswa2:", s2.count);

  // Update siswa3
  const s3 = await prisma.user.updateMany({
    where: { email: "siswa3@gmail.com" },
    data: { name: "Zahra Salsabila" },
  });
  console.log("✓ Updated siswa3:", s3.count);

  // Clean any remaining users having "(Siswa" in their name
  const allSiswa = await prisma.user.findMany({
    where: {
      name: { contains: "(Siswa" },
    },
    select: { id: true, name: true },
  });

  for (const s of allSiswa) {
    const cleaned = s.name.replace(/\s*\(Siswa\s*\d+\)/gi, "").trim();
    await prisma.user.update({
      where: { id: s.id },
      data: { name: cleaned },
    });
    console.log(`✓ Cleaned: "${s.name}" -> "${cleaned}"`);
  }

  console.log("Semua nama siswa berhasil diperbarui ke nama asli!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
