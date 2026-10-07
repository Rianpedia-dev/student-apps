import prisma from "@/lib/prisma";

async function main() {
  console.log("=========================================");
  console.log("🗓️ Memulai Seeding Jadwal Pelajaran (KBM)...");
  console.log("=========================================");

  // 1. Ambil Kelas Target
  const kelasSD = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Mehmed Al Fatih" } },
  });
  const kelas5 = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Al Bukhari" } },
  });
  const kelasSMP = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Ibnu Sina" } },
  });

  if (!kelasSD) {
    console.error("❌ Data Kelas tidak ditemukan. Jalankan seed utama terlebih dahulu.");
    return;
  }

  // 2. Ambil Guru Pengampu
  const guruSD = (await prisma.user.findFirst({ where: { email: "guru@gmail.com" } }))!;
  const guruSMP =
    (await prisma.user.findFirst({ where: { email: "guru2@gmail.com" } })) ||
    (await prisma.user.findFirst({ where: { email: "guru.smp@gmail.com" } })) ||
    guruSD;
  const guruAhmad = (await prisma.user.findFirst({ where: { email: "ahmad.guru@alazhar.sch.id" } })) || guruSD;
  const guruMaryam = (await prisma.user.findFirst({ where: { email: "maryam.guru@alazhar.sch.id" } })) || guruSD;
  const guruIbrahim = (await prisma.user.findFirst({ where: { email: "ibrahim.guru@alazhar.sch.id" } })) || guruSD;
  const guruAisyah = (await prisma.user.findFirst({ where: { email: "aisyah.guru@alazhar.sch.id" } })) || guruSD;
  const guruHasan = (await prisma.user.findFirst({ where: { email: "hasan.guru@alazhar.sch.id" } })) || guruSD;
  const guruRidwan = (await prisma.user.findFirst({ where: { email: "ridwan.guru@alazhar.sch.id" } })) || guruSD;
  const guruFaisal = (await prisma.user.findFirst({ where: { email: "faisal.guru@alazhar.sch.id" } })) || guruSD;

  // 3. Ambil Master Mata Pelajaran
  const mapelPai = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PAI" } });
  const mapelMtk = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "MTK" } });
  const mapelIpa = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPA" } });
  const mapelInfor = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "INFOR" } });
  const mapelBarab = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BARAB" } });
  const mapelBind = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BIND" } });
  const mapelTahfidz = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "TAHFIDZ" } });
  const mapelBing = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BING" } });
  const mapelPjok = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PJOK" } });
  const mapelIps = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPS" } });

  let totalJadwal = 0;

  // 4. Jadwal SD Kelas 4 - Mehmed Al Fatih
  if (kelasSD && guruSD) {
    await prisma.jadwalPelajaran.deleteMany({ where: { kelas_id: kelasSD.id } });
    const jadwalSDList = [];
    if (mapelPai && guruSD) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelPai.id, guru_id: guruSD.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00", ruang: null });
    if (mapelMtk && guruMaryam) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelMtk.id, guru_id: guruMaryam.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00", ruang: null });
    if (mapelBarab && guruAhmad) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelBarab.id, guru_id: guruAhmad.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00", ruang: null });
    if (mapelBind && guruSD) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelBind.id, guru_id: guruSD.id, hari: "Selasa", jam_mulai: "09:30", jam_selesai: "11:00", ruang: null });
    if (mapelTahfidz && guruHasan) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelTahfidz.id, guru_id: guruHasan.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Masjid Al-Azhar" });
    if (mapelIpa && guruIbrahim) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelIpa.id, guru_id: guruIbrahim.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "Lab Sains Terpadu" });
    if (mapelBing && guruAisyah) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelBing.id, guru_id: guruAisyah.id, hari: "Kamis", jam_mulai: "07:30", jam_selesai: "09:00", ruang: null });
    if (mapelInfor && guruRidwan) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelInfor.id, guru_id: guruRidwan.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "Lab Komputer / iPad" });
    if (mapelPjok && guruFaisal) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelPjok.id, guru_id: guruFaisal.id, hari: "Jumat", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Lapangan Olahraga" });
    if (mapelPai && guruSD) jadwalSDList.push({ kelas_id: kelasSD.id, mapel_id: mapelPai.id, guru_id: guruSD.id, hari: "Jumat", jam_mulai: "09:30", jam_selesai: "10:45", ruang: "Masjid Al-Azhar" });

    if (jadwalSDList.length > 0) {
      await prisma.jadwalPelajaran.createMany({ data: jadwalSDList });
      totalJadwal += jadwalSDList.length;
      console.log(`✅ ${jadwalSDList.length} sesi jadwal pelajaran disiapkan untuk Kelas 4 SD.`);
    }
  }

  // 5. Jadwal SD Kelas 5 - Al Bukhari
  if (kelas5 && guruHasan) {
    await prisma.jadwalPelajaran.deleteMany({ where: { kelas_id: kelas5.id } });
    const jadwalK5List = [];
    if (mapelTahfidz) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelTahfidz.id, guru_id: guruHasan.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Masjid Al-Azhar" });
    if (mapelBind && guruSD) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelBind.id, guru_id: guruSD.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00", ruang: null });
    if (mapelMtk && guruMaryam) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelMtk.id, guru_id: guruMaryam.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00", ruang: null });
    if (mapelIpa && guruIbrahim) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelIpa.id, guru_id: guruIbrahim.id, hari: "Selasa", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "Lab Sains" });
    if (mapelBarab && guruAhmad) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelBarab.id, guru_id: guruAhmad.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00", ruang: null });
    if (mapelBing && guruAisyah) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelBing.id, guru_id: guruAisyah.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00", ruang: null });
    if (mapelInfor && guruRidwan) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelInfor.id, guru_id: guruRidwan.id, hari: "Kamis", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Lab Komputer / iPad" });
    if (mapelPai && guruSD) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelPai.id, guru_id: guruSD.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00", ruang: null });
    if (mapelPjok && guruFaisal) jadwalK5List.push({ kelas_id: kelas5.id, mapel_id: mapelPjok.id, guru_id: guruFaisal.id, hari: "Jumat", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Lapangan Olahraga" });

    if (jadwalK5List.length > 0) {
      await prisma.jadwalPelajaran.createMany({ data: jadwalK5List });
      totalJadwal += jadwalK5List.length;
      console.log(`✅ ${jadwalK5List.length} sesi jadwal pelajaran disiapkan untuk Kelas 5 SD.`);
    }
  }

  // 6. Jadwal SMP Kelas 7 - Ibnu Sina
  if (kelasSMP && guruSMP) {
    await prisma.jadwalPelajaran.deleteMany({ where: { kelas_id: kelasSMP.id } });
    const jadwalSMPList = [];
    if (mapelMtk) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelMtk.id, guru_id: guruSMP.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "R. Ibnu Sina" });
    if (mapelBing && guruAisyah) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelBing.id, guru_id: guruAisyah.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "R. Ibnu Sina" });
    if (mapelBind) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelBind.id, guru_id: guruSMP.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "R. Ibnu Sina" });
    if (mapelBarab && guruAhmad) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelBarab.id, guru_id: guruAhmad.id, hari: "Selasa", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "R. Ibnu Sina" });
    if (mapelIpa) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelIpa.id, guru_id: guruSMP.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Lab Sains Terpadu" });
    if (mapelIps) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelIps.id, guru_id: guruSMP.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "R. Ibnu Sina" });
    if (mapelTahfidz && guruHasan) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelTahfidz.id, guru_id: guruHasan.id, hari: "Kamis", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Masjid Al-Azhar" });
    if (mapelInfor && guruRidwan) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelInfor.id, guru_id: guruRidwan.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00", ruang: "Lab Komputer / iPad" });
    if (mapelPjok && guruFaisal) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelPjok.id, guru_id: guruFaisal.id, hari: "Jumat", jam_mulai: "07:30", jam_selesai: "09:00", ruang: "Lapangan Olahraga" });
    if (mapelPai) jadwalSMPList.push({ kelas_id: kelasSMP.id, mapel_id: mapelPai.id, guru_id: guruSMP.id, hari: "Jumat", jam_mulai: "09:30", jam_selesai: "10:45", ruang: "Masjid Al-Azhar" });

    if (jadwalSMPList.length > 0) {
      await prisma.jadwalPelajaran.createMany({ data: jadwalSMPList });
      totalJadwal += jadwalSMPList.length;
      console.log(`✅ ${jadwalSMPList.length} sesi jadwal pelajaran disiapkan untuk Kelas 7 SMP.`);
    }
  }

  console.log("\n=========================================");
  console.log(`🎉 Seeding Jadwal Pelajaran Selesai!`);
  console.log(`- Total sesi jadwal aktif: ${totalJadwal}`);
  console.log(`=========================================`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat menjalankan seed jadwal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
