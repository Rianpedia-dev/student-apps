import prisma from "../src/lib/prisma";
import { calculateAchievementPoints } from "../src/lib/achievement-points";

async function main() {
  console.log("Memeriksa dan menormalisasi data prestasi eksisting...");
  const records = await prisma.prestasi.findMany();
  console.log(`Ditemukan ${records.length} data prestasi.`);

  let updated = 0;
  for (const item of records) {
    const text = (item.prestasi || "").toLowerCase();

    // 1. Deteksi Tingkat
    let tingkat = "Dalam Sekolah";
    if (text.includes("internasional") || text.includes("international") || text.includes("world")) {
      tingkat = "Internasional";
    } else if (text.includes("nasional") || text.includes("indonesia") || text.includes("osn") || text.includes("osmn")) {
      tingkat = "Nasional";
    } else if (text.includes("provinsi") || text.includes("kota") || text.includes("sumsel") || text.includes("palembang") || text.includes("fasi")) {
      tingkat = "Daerah/Kota";
    }

    // 2. Deteksi Peringkat
    let peringkat = "Juara 1";
    if (text.includes("juara 1") || text.includes("emas") || text.includes("gold") || text.includes("1st")) {
      peringkat = "Juara 1";
    } else if (text.includes("juara 2") || text.includes("perak") || text.includes("silver") || text.includes("2nd")) {
      peringkat = "Juara 2";
    } else if (text.includes("juara 3") || text.includes("perunggu") || text.includes("bronze") || text.includes("3rd")) {
      peringkat = "Juara 3";
    } else if (text.includes("harapan")) {
      peringkat = "Harapan";
    }

    // 3. Hitung Poin
    const poin = calculateAchievementPoints(tingkat, peringkat);

    // 4. Deteksi Kelas Saat Prestasi
    let kelasSaat = item.kelas_saat_prestasi;
    if (!kelasSaat || kelasSaat.trim() === "") {
      const match = (item.kelas || "").match(/Kelas\s*(\d+)/i);
      kelasSaat = match ? `Kelas ${match[1]}` : (item.kelas || "Kelas 4");
    }

    // 5. Deteksi Jenjang
    let jenjang = item.jenjang;
    if (!jenjang || jenjang === "") {
      jenjang = /smp|kelas\s*(7|8|9)/i.test(item.kelas || "") ? "SMP" : "SD";
    }

    await prisma.prestasi.update({
      where: { id: item.id },
      data: {
        tingkat,
        peringkat,
        poin,
        kelas_saat_prestasi: kelasSaat,
        jenjang,
        tahun_ajaran: item.tahun_ajaran || "2025/2026",
      },
    });
    updated++;
  }

  console.log(`Berhasil menormalisasi ${updated} data prestasi.`);
}

main()
  .catch((e) => {
    console.error("Error migrating prestasi data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

