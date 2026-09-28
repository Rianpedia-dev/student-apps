import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("=== SEEDING JADWAL PELAJARAN LENGKAP (SENIN - JUMAT) ===");

  const kelasSD = await prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" } });
  const kelasSMP = await prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 7 - Ibnu Sina" } });

  if (!kelasSD) {
    console.error("Kelas 4 - Mehmed Al Fatih tidak ditemukan!");
    return;
  }

  // Ambil guru-guru
  const guruFatimah = await prisma.user.findFirst({ where: { email: "guru@gmail.com" } });
  const guruAhmad = (await prisma.user.findFirst({ where: { email: "ahmad.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruMaryam = (await prisma.user.findFirst({ where: { email: "maryam.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruIbrahim = (await prisma.user.findFirst({ where: { email: "ibrahim.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruAisyah = (await prisma.user.findFirst({ where: { email: "aisyah.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruHasan = (await prisma.user.findFirst({ where: { email: "hasan.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruRidwan = (await prisma.user.findFirst({ where: { email: "ridwan.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruFaisal = (await prisma.user.findFirst({ where: { email: "faisal.guru@alazhar.sch.id" } })) || guruFatimah;
  const guruSmp = (await prisma.user.findFirst({ where: { email: "guru.smp@gmail.com" } })) || guruFatimah;

  if (!guruFatimah) {
    console.error("Akun guru utama guru@gmail.com tidak ditemukan!");
    return;
  }

  // Ambil mapel
  const mapelPai = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PAI" } });
  const mapelMtk = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "MTK" } });
  const mapelBarab = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BARAB" } });
  const mapelBind = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BIND" } });
  const mapelTahfidz = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "TAHFIDZ" } });
  const mapelIpa = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPA" } });
  const mapelBing = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BING" } });
  const mapelInfor = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "INFOR" } });
  const mapelPjok = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PJOK" } });
  const mapelIps = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPS" } });

  // Hapus jadwal lama untuk Kelas 4 Mehmed Al Fatih
  await prisma.jadwalPelajaran.deleteMany({
    where: { kelas_id: kelasSD.id },
  });

  // Jadwal Kelas 4 - Mehmed Al Fatih (Lengkap Senin s/d Jumat, 10 Sesi Pertemuan)
  const jadwalSDList: Array<{
    kelas_id: bigint;
    mapel_id: bigint;
    guru_id: bigint;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    ruang: string;
  }> = [];

  // SENIN
  if (mapelPai && guruFatimah) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelPai.id,
      guru_id: guruFatimah.id,
      hari: "Senin",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruang: "R. Mehmed Al Fatih",
    });
  }
  if (mapelMtk && guruMaryam) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelMtk.id,
      guru_id: guruMaryam.id,
      hari: "Senin",
      jam_mulai: "09:30",
      jam_selesai: "11:00",
      ruang: "R. Mehmed Al Fatih",
    });
  }

  // SELASA
  if (mapelBarab && guruAhmad) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelBarab.id,
      guru_id: guruAhmad.id,
      hari: "Selasa",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruang: "R. Mehmed Al Fatih",
    });
  }
  if (mapelBind && guruFatimah) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelBind.id,
      guru_id: guruFatimah.id,
      hari: "Selasa",
      jam_mulai: "09:30",
      jam_selesai: "11:00",
      ruang: "R. Mehmed Al Fatih",
    });
  }

  // RABU
  if (mapelTahfidz && guruHasan) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelTahfidz.id,
      guru_id: guruHasan.id,
      hari: "Rabu",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruang: "Masjid Al-Azhar",
    });
  }
  if (mapelIpa && guruIbrahim) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelIpa.id,
      guru_id: guruIbrahim.id,
      hari: "Rabu",
      jam_mulai: "09:30",
      jam_selesai: "11:00",
      ruang: "Lab Sains Terpadu",
    });
  }

  // KAMIS
  if (mapelBing && guruAisyah) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelBing.id,
      guru_id: guruAisyah.id,
      hari: "Kamis",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruang: "R. Mehmed Al Fatih",
    });
  }
  if (mapelInfor && guruRidwan) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelInfor.id,
      guru_id: guruRidwan.id,
      hari: "Kamis",
      jam_mulai: "09:30",
      jam_selesai: "11:00",
      ruang: "Lab Komputer / iPad",
    });
  }

  // JUMAT
  if (mapelPjok && guruFaisal) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelPjok.id,
      guru_id: guruFaisal.id,
      hari: "Jumat",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      ruang: "Lapangan Olahraga",
    });
  }
  if (mapelPai && guruFatimah) {
    jadwalSDList.push({
      kelas_id: kelasSD.id,
      mapel_id: mapelPai.id,
      guru_id: guruFatimah.id,
      hari: "Jumat",
      jam_mulai: "09:30",
      jam_selesai: "10:45",
      ruang: "Masjid Al-Azhar",
    });
  }

  await prisma.jadwalPelajaran.createMany({
    data: jadwalSDList,
  });

  console.log(`✅ Berhasil membuat ${jadwalSDList.length} sesi jadwal pelajaran untuk Kelas 4 - Mehmed Al Fatih (Senin - Jumat)!`);

  // Jika kelas SMP ada, kita update juga
  if (kelasSMP && guruSmp) {
    await prisma.jadwalPelajaran.deleteMany({
      where: { kelas_id: kelasSMP.id },
    });

    const jadwalSMPList: Array<{
      kelas_id: bigint;
      mapel_id: bigint;
      guru_id: bigint;
      hari: string;
      jam_mulai: string;
      jam_selesai: string;
      ruang: string;
    }> = [];

    // SENIN
    if (mapelMtk) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelMtk.id,
        guru_id: guruSmp.id,
        hari: "Senin",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
        ruang: "R. Ibnu Sina",
      });
    }
    if (mapelBing && guruAisyah) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelBing.id,
        guru_id: guruAisyah.id,
        hari: "Senin",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
        ruang: "R. Ibnu Sina",
      });
    }

    // SELASA
    if (mapelBind) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelBind.id,
        guru_id: guruSmp.id,
        hari: "Selasa",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
        ruang: "R. Ibnu Sina",
      });
    }
    if (mapelBarab && guruAhmad) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelBarab.id,
        guru_id: guruAhmad.id,
        hari: "Selasa",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
        ruang: "R. Ibnu Sina",
      });
    }

    // RABU
    if (mapelIpa) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelIpa.id,
        guru_id: guruSmp.id,
        hari: "Rabu",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
        ruang: "Lab Sains Terpadu",
      });
    }
    if (mapelIps) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelIps.id,
        guru_id: guruSmp.id,
        hari: "Rabu",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
        ruang: "R. Ibnu Sina",
      });
    }

    // KAMIS
    if (mapelTahfidz && guruHasan) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelTahfidz.id,
        guru_id: guruHasan.id,
        hari: "Kamis",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
        ruang: "Masjid Al-Azhar",
      });
    }
    if (mapelInfor && guruRidwan) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelInfor.id,
        guru_id: guruRidwan.id,
        hari: "Kamis",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
        ruang: "Lab Komputer / iPad",
      });
    }

    // JUMAT
    if (mapelPjok && guruFaisal) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelPjok.id,
        guru_id: guruFaisal.id,
        hari: "Jumat",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
        ruang: "Lapangan Olahraga",
      });
    }
    if (mapelPai) {
      jadwalSMPList.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelPai.id,
        guru_id: guruSmp.id,
        hari: "Jumat",
        jam_mulai: "09:30",
        jam_selesai: "10:45",
        ruang: "Masjid Al-Azhar",
      });
    }

    await prisma.jadwalPelajaran.createMany({
      data: jadwalSMPList,
    });

    console.log(`✅ Berhasil membuat ${jadwalSMPList.length} sesi jadwal pelajaran untuk Kelas 7 - Ibnu Sina (Senin - Jumat)!`);
  }
}

main()
  .catch((e) => {
    console.error("Error seeding jadwal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
