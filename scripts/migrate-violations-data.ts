import prisma from "../src/lib/prisma";
import { parseViolationKeterangan } from "../src/lib/constants/violations";

async function main() {
  console.log("Checking existing tbl_pelanggaran records...");
  const records = await prisma.pelanggaran.findMany();
  console.log(`Found ${records.length} records.`);

  let updatedCount = 0;
  for (const record of records) {
    let needsUpdate = false;
    const dataToUpdate: any = {};

    // 1. tingkatan
    if (!record.tingkatan && record.keterangan) {
      const parsed = parseViolationKeterangan(record.keterangan);
      dataToUpdate.tingkatan = parsed.severity || "RINGAN";
      needsUpdate = true;
    }

    // 2. jenjang (from class name)
    if (!record.jenjang && record.kelas) {
      const isSmp = /SMP|Kelas (7|8|9)/i.test(record.kelas);
      dataToUpdate.jenjang = isSmp ? "SMP" : "SD";
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.pelanggaran.update({
        where: { id: record.id },
        data: dataToUpdate,
      });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} records with default tingkatan and jenjang.`);
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

