import "dotenv/config";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("=== SEEDING CONTOH PERTEMUAN & MODUL PEMBELAJARAN AL-AZHAR ===");

  const materialsDir = path.join(process.cwd(), "public", "uploads", "materials");
  if (!fs.existsSync(materialsDir)) {
    fs.mkdirSync(materialsDir, { recursive: true });
  }

  // 1. Buat Dokumen PDF Modul Matematika
  console.log("Membuat PDF Modul Matematika...");
  const docMtk = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  docMtk.setFont("helvetica", "bold");
  docMtk.setFontSize(16);
  docMtk.setTextColor(16, 185, 129); // Emerald
  docMtk.text("SD ISLAM AL-AZHAR CAIRO PALEMBANG", 105, 20, { align: "center" });
  docMtk.setFontSize(10);
  docMtk.setFont("helvetica", "normal");
  docMtk.setTextColor(100, 100, 100);
  docMtk.text("MODUL BELAJAR SISWA - TAHUN AJARAN 2026/2027", 105, 27, { align: "center" });

  docMtk.setDrawColor(16, 185, 129);
  docMtk.setLineWidth(0.8);
  docMtk.line(20, 32, 190, 32);

  docMtk.setFontSize(14);
  docMtk.setFont("helvetica", "bold");
  docMtk.setTextColor(30, 41, 59);
  docMtk.text("Pertemuan 1: Mengenal Konsep Pecahan Senilai", 20, 45);

  docMtk.setFontSize(10);
  docMtk.setFont("helvetica", "normal");
  docMtk.setTextColor(71, 85, 105);
  docMtk.text(
    [
      "Assalamu'alaikum Warahmatullahi Wabarakatuh, Ananda sholeh dan sholehah.",
      "",
      "Tujuan Pembelajaran Hari Ini:",
      "1. Memahami pengertian pecahan sebagai bagian dari keseluruhan yang utuh.",
      "2. Mengidentifikasi pecahan senilai menggunakan gambar dan perkalian pembilang/penyebut.",
      "3. Menyelesaikan soal cerita kontekstual dengan ketelitian dan rasa syukur.",
      "",
      "A. Konsep Dasar Pecahan",
      "Pecahan terdiri dari Pembilang (bagian atas) dan Penyebut (bagian bawah).",
      "Contoh: 1/2 artinya 1 bagian dari 2 potongan yang sama besar.",
      "",
      "B. Mencari Pecahan Senilai",
      "Pecahan senilai diperoleh dengan mengalikan atau membagi pembilang dan",
      "penyebut dengan angka yang sama bukan nol.",
      "Contoh: 1/2 x (2/2) = 2/4. Maka 1/2 senilai dengan 2/4.",
      "",
      "Mari kita amalkan adab belajar dengan membaca doa sebelum belajar:",
      "'Rabbi zidni 'ilman warzuqni fahman.'",
    ],
    20,
    55
  );

  const mtkPdfPath = path.join(materialsDir, "Modul_Matematika_Pecahan_Pertemuan1.pdf");
  fs.writeFileSync(mtkPdfPath, Buffer.from(docMtk.output("arraybuffer")));
  console.log("✓ Berhasil membuat berkas modul:", mtkPdfPath);

  // 2. Ambil Kelas, Guru, Mapel
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" },
  });

  const guru = await prisma.user.findFirst({
    where: { email: "guru@gmail.com" },
  });

  const mapelMtk = await prisma.mataPelajaran.findUnique({
    where: { kode_mapel: "MTK" },
  });

  const mapelPai = await prisma.mataPelajaran.findUnique({
    where: { kode_mapel: "PAI" },
  });

  if (!kelas || !guru || !mapelMtk) {
    console.error("Data kelas/guru/mapel tidak lengkap.");
    return;
  }

  // Cari tugas matematika yang sudah ada untuk dikaitkan
  const taskMtk = await prisma.tugas.findFirst({
    where: { kelas_id: kelas.id, mapel_id: mapelMtk.id },
  });

  // Hapus pertemuan demo sebelumnya untuk kelas & mapel ini agar bersih
  await prisma.pertemuan.deleteMany({
    where: {
      kelas_id: kelas.id,
      mapel_id: mapelMtk.id,
    },
  });

  // Buat Pertemuan 1 MTK
  const p1 = await prisma.pertemuan.create({
    data: {
      kelas_id: kelas.id,
      mapel_id: mapelMtk.id,
      guru_id: guru.id,
      pertemuan_ke: 1,
      judul: "Bab 1: Konsep Dasar Pecahan & Pecahan Senilai",
      deskripsi:
        "Assalamu'alaikum ananda sholeh/sholehah Kelas 4.\n\nPada pertemuan perdana ini, kita telah mempelajari konsep pecahan senilai dengan media visual lingkaran dan balok. Silakan unduh atau baca langsung Modul Pembelajaran di bawah ini dan simak video animasinya.\n\nJangan lupa selesaikan tantangan latihan mandiri yang ada di bawah ya!",
      tanggal: new Date("2026-07-21"),
      file_url: "/uploads/materials/Modul_Matematika_Pecahan_Pertemuan1.pdf",
      file_name: "Modul_Matematika_Pecahan_Pertemuan1.pdf",
      file_size: fs.statSync(mtkPdfPath).size,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: "https://www.alazhar-cairo.sch.id",
      is_published: true,
    },
  });

  // Tautkan tugas jika ada
  if (taskMtk) {
    await prisma.tugas.update({
      where: { id: taskMtk.id },
      data: { pertemuan_id: p1.id },
    });
    console.log("✓ Berhasil menautkan tugas ke Pertemuan 1");
  }

  // Buat Pertemuan 2 MTK
  await prisma.pertemuan.create({
    data: {
      kelas_id: kelas.id,
      mapel_id: mapelMtk.id,
      guru_id: guru.id,
      pertemuan_ke: 2,
      judul: "Bab 1: Operasi Penjumlahan & Pengurangan Pecahan Biasa",
      deskripsi:
        "Pada sesi kedua ini kita belajar menyamakan penyebut pecahan menggunakan KPK sebelum melakukan operasi hitung penjumlahan dan pengurangan.\n\nPastikan ananda telah mengulang hafalan perkalian 1 s/d 10 agar semakin lancar berhitung.",
      tanggal: new Date("2026-07-28"),
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      is_published: true,
    },
  });

  // Buat Pertemuan 3 MTK (Draft Guru)
  await prisma.pertemuan.create({
    data: {
      kelas_id: kelas.id,
      mapel_id: mapelMtk.id,
      guru_id: guru.id,
      pertemuan_ke: 3,
      judul: "Bab 2: Mengenal Pecahan Campuran & Desimal",
      deskripsi: "Materi persiapan pekan depan (Status: Draft Guru sebelum jam KBM dimulai).",
      tanggal: new Date("2026-08-04"),
      is_published: false,
    },
  });

  console.log("✓ Selesai membuat sample pertemuan MTK (Pertemuan 1, 2 terbit & 3 draft)");

  // Buat Pertemuan untuk PAI jika ada
  if (mapelPai) {
    await prisma.pertemuan.deleteMany({
      where: { kelas_id: kelas.id, mapel_id: mapelPai.id },
    });

    await prisma.pertemuan.create({
      data: {
        kelas_id: kelas.id,
        mapel_id: mapelPai.id,
        guru_id: guru.id,
        pertemuan_ke: 1,
        judul: "Adab Menuntut Ilmu & Thaharah (Bersuci Sebelum Sholat)",
        deskripsi:
          "Bismillahirrohmanirrohim.\n\nPembelajaran PAI pekan ini membahas tata cara berwudhu yang sempurna sesuai sunnah Rasulullah SAW dan menghafal doa sesudah wudhu.\n\nMari kita biasakan selalu dalam keadaan suci dan menjaga adab saat berada di majelis ilmu.",
        tanggal: new Date("2026-07-20"),
        is_published: true,
      },
    });

    console.log("✓ Selesai membuat sample pertemuan PAI");
  }

  console.log("=== SEEDING PERTEMUAN BERHASIL LENGKAP ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
