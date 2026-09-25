import "dotenv/config";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("=== MEMBUAT ASET TUGAS ASLI & DATA SAMPLE AL-AZHAR ===");

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "tugas");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Copy generated images into public/uploads/tugas/
  const artifactDir = "C:\\Users\\jemia\\.gemini\\antigravity-ide\\brain\\9113f984-a1c9-4f3b-abc4-666e71730b81";
  const studentImgSource = path.join(artifactDir, "jawaban_matematika_siswa_1790307971767.jpg");
  const diagramImgSource = path.join(artifactDir, "soal_diagram_pecahan_1790308230033.jpg");

  const studentImgDest = path.join(uploadsDir, "jawaban-tugas-matematika-rayhan.jpg");
  const diagramImgDest = path.join(uploadsDir, "soal-diagram-pecahan-kelas4.jpg");

  if (fs.existsSync(studentImgSource)) {
    fs.copyFileSync(studentImgSource, studentImgDest);
    console.log("✓ Berhasil menyalin foto jawaban siswa ke:", studentImgDest);
  } else {
    console.warn("Source student image not found:", studentImgSource);
  }

  if (fs.existsSync(diagramImgSource)) {
    fs.copyFileSync(diagramImgSource, diagramImgDest);
    console.log("✓ Berhasil menyalin gambar soal diagram ke:", diagramImgDest);
  }

  // 2. Generate Authentic School Question PDF (LKPD)
  console.log("Sedang membuat Lembar Soal PDF resmi...");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header / Kop Surat Sekolah
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("YAYASAN PESANTREN ISLAM AL-AZHAR", 105, 18, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(20, 83, 45); // Emerald dark
  doc.text("SD ISLAM AL-AZHAR CAIRO PALEMBANG", 105, 25, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Jl. Kolonel H. Barlian No. 6.5, Karya Baru, Alang-Alang Lebar, Palembang", 105, 30, { align: "center" });
  doc.text("Website: www.alazhar-cairo.sch.id | Email: sdia.cairo@alazhar.sch.id", 105, 34, { align: "center" });

  // Divider Line
  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(0.8);
  doc.line(15, 37, 195, 37);
  doc.setLineWidth(0.2);
  doc.line(15, 38.2, 195, 38.2);

  // Judul Lembar Kerja
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("LEMBAR KERJA PESERTA DIDIK (LKPD) - TUGAS MANDIRI", 105, 45, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("TOPIK: OPERASI PENJUMLAHAN & PENGURANGAN PECAHAN BIASA DAN CAMPURAN", 105, 50, { align: "center" });

  // Tabel Identitas Siswa
  autoTable(doc, {
    startY: 55,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [30, 41, 59] },
    body: [
      [
        "Mata Pelajaran",
        ": Matematika",
        "Kelas / Semester",
        ": Kelas 4 / Genap",
      ],
      [
        "Guru Pengampu",
        ": Ustadzah Fatimah, S.Pd",
        "Hari / Tanggal",
        ": Senin, 28 September 2026",
      ],
      [
        "Nama Siswa",
        ": .....................................................",
        "Nomor Induk Siswa (NIS)",
        ": .........................................",
      ],
    ],
  });

  // Petunjuk Umum
  const startYPetunjuk = (doc as any).lastAutoTable.finalY + 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, startYPetunjuk, 180, 19, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PETUNJUK UMUM PENGERJAAN:", 18, startYPetunjuk + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("1. Awali dengan membaca Basmalah (Bismillahirrahmanirrahim).", 18, startYPetunjuk + 8.5);
  doc.text("2. Tuliskan langkah-langkah penyelesaian/cara hitung secara runtut dan jelas.", 18, startYPetunjuk + 12.5);
  doc.text("3. Kerjakan secara mandiri dan teliti, lalu unggah foto lembar jawaban ke Student App.", 18, startYPetunjuk + 16.5);

  // SOAL-SOAL
  const startYSoal = startYPetunjuk + 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 83, 45);
  doc.text("A. SOAL HITUNGAN OPERASI PECAHAN (BOBOT: 60 POIN)", 15, startYSoal);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  let curY = startYSoal + 6;

  // Soal 1
  doc.setFont("helvetica", "bold");
  doc.text("1. Hitunglah hasil penjumlahan dan pengurangan pecahan berikut (sederhanakan bila perlu):", 15, curY);
  doc.setFont("helvetica", "normal");
  curY += 5;
  doc.text("a)  1/3  +  2/5  =  ...", 20, curY);
  doc.text("b)  3/4  +  1/6  =  ...", 80, curY);
  doc.text("c)  5/6  -  1/4  =  ...", 140, curY);
  curY += 7;

  // Soal 2
  doc.setFont("helvetica", "bold");
  doc.text("2. Ubah dan sederhanakan bentuk pecahan campuran berikut ini:", 15, curY);
  doc.setFont("helvetica", "normal");
  curY += 5;
  doc.text("a)  2 1/3  +  1 1/2  =  ...", 20, curY);
  doc.text("b)  3 3/5  -  1 1/4  =  ...", 80, curY);
  doc.text("c)  6/8  disederhanakan  =  ...", 140, curY);
  curY += 9;

  // Soal 3
  doc.setFont("helvetica", "bold");
  doc.text("3. Perkalian dan Pembagian Pecahan:", 15, curY);
  doc.setFont("helvetica", "normal");
  curY += 5;
  doc.text("a)  2/5  x  4/3  =  ...", 20, curY);
  doc.text("b)  1/2  x  4/7  =  ...", 80, curY);
  doc.text("c)  2/3  :  4/9  =  ...", 140, curY);
  curY += 12;

  // Bagian B: Soal Cerita
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 83, 45);
  doc.text("B. SOAL CERITA PENERAPAN KEHIDUPAN ISLAMI (BOBOT: 40 POIN)", 15, curY);
  curY += 6;

  // Soal 4
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("4. Pembagian Kurma Buka Puasa (Nilai: 20 Poin)", 15, curY);
  doc.setFont("helvetica", "normal");
  curY += 4.5;
  const teksSoal4 = "Rayhan memiliki 3/4 kg kurma ajwa untuk sedekah buka puasa bersama di masjid sekolah. Ustadzah kemudian menambahkan lagi 1/2 kg kurma ajwa. Jika kurma tersebut kemudian dibagikan kepada teman-temannya sebanyak 5/6 kg, berapa kilogram sisa kurma yang masih ada? Tuliskan cara penyelesaianmu!";
  const lines4 = doc.splitTextToSize(teksSoal4, 180);
  doc.text(lines4, 15, curY);
  curY += (lines4.length * 4.5) + 4;

  // Soal 5
  doc.setFont("helvetica", "bold");
  doc.text("5. Zakat Hasil Kebun Buah (Nilai: 20 Poin)", 15, curY);
  doc.setFont("helvetica", "normal");
  curY += 4.5;
  const teksSoal5 = "Keluarga Khalid memanen buah madu dari kebunnya. Sebanyak 1/5 bagian disedekahkan kepada tetangga terdekat, dan 2/3 bagian dibagikan ke panti asuhan. Berapa bagian hasil panen yang masih tersisa untuk keluarga Khalid? Sertakan langkah perhitungannya!";
  const lines5 = doc.splitTextToSize(teksSoal5, 180);
  doc.text(lines5, 15, curY);
  curY += (lines5.length * 4.5) + 8;

  // Rubrik Penilaian Table
  autoTable(doc, {
    startY: curY,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: { fillColor: [20, 83, 45], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    head: [["No Soal", "Aspek Penilaian", "Kriteria Keberhasilan", "Bobot Poin"]],
    body: [
      ["1", "Operasi Pecahan Dasar", "Menyamakan penyebut dengan benar dan menyederhanakan", "20 Poin"],
      ["2", "Pecahan Campuran", "Mengubah ke pecahan biasa dan melakukan operasi hitung", "20 Poin"],
      ["3", "Perkalian & Pembagian", "Melakukan perkalian silang / pembagian terbalik dengan tepat", "20 Poin"],
      ["4", "Soal Cerita Kurma", "Langkah runtut (diketahui, ditanya, penyelesaian, kesimpulan)", "20 Poin"],
      ["5", "Soal Cerita Zakat", "Konsep pecahan menyeluruh (1 utuh dikurangi bagian sedekah)", "20 Poin"],
    ],
    foot: [["Total", "", "Nilai Maksimal Sempurna", "100 Poin"]],
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8.5 },
  });

  const pdfPath = path.join(uploadsDir, "lembar-soal-matematika-kelas4.pdf");
  fs.writeFileSync(pdfPath, Buffer.from(doc.output("arraybuffer")));
  console.log("✓ Lembar Soal PDF berhasil dibuat:", pdfPath);

  // 3. Generate Sample Student Submission PDF (Khalid)
  console.log("Sedang membuat PDF Jawaban Siswa (Khalid)...");
  const subDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  subDoc.setFont("helvetica", "bold");
  subDoc.setFontSize(14);
  subDoc.text("LEMBAR JAWABAN TUGAS MATEMATIKA", 105, 20, { align: "center" });
  subDoc.setFontSize(10);
  subDoc.text("Nama: Khalid Al-Ghazi | NIS: 202404002 | Kelas: 4 - Mehmed Al Fatih", 105, 27, { align: "center" });

  subDoc.setLineWidth(0.5);
  subDoc.line(15, 32, 195, 32);

  subDoc.setFont("helvetica", "normal");
  subDoc.setFontSize(9);
  subDoc.text("Assalamu'alaikum Warahmatullahi Wabarakatuh, Ustadzah Fatimah.", 15, 40);
  subDoc.text("Berikut adalah langkah pengerjaan tugas Matematika saya:", 15, 46);

  const jawabanText = [
    "Nomor 1: Operasi Pecahan Biasa",
    "a) 1/3 + 2/5 = (1x5)/(3x5) + (2x3)/(5x3) = 5/15 + 6/15 = 11/15",
    "b) 3/4 + 1/6 = (3x3)/(4x3) + (1x2)/(6x2) = 9/12 + 2/12 = 11/12",
    "c) 5/6 - 1/4 = (5x2)/(6x2) - (1x3)/(4x3) = 10/12 - 3/12 = 7/12",
    "",
    "Nomor 2: Pecahan Campuran",
    "a) 2 1/3 + 1 1/2 = 7/3 + 3/2 = 14/6 + 9/6 = 23/6 = 3 5/6",
    "b) 3 3/5 - 1 1/4 = 18/5 - 5/4 = 72/20 - 25/20 = 47/20 = 2 7/20",
    "c) 6/8 = (6:2) / (8:2) = 3/4 (Paling sederhana)",
    "",
    "Nomor 3: Perkalian dan Pembagian Pecahan",
    "a) 2/5 x 4/3 = (2x4)/(5x3) = 8/15",
    "b) 1/2 x 4/7 = (1x4)/(2x7) = 4/14 = 2/7",
    "c) 2/3 : 4/9 = 2/3 x 9/4 = 18/12 = 3/2 = 1 1/2",
    "",
    "Nomor 4: Soal Cerita Kurma Sedekah",
    "Diketahui: Awal = 3/4 kg, Tambahan = 1/2 kg, Dibagikan = 5/6 kg",
    "Penyelesaian: 3/4 + 1/2 - 5/6",
    "KPK dari 4, 2, dan 6 adalah 12",
    "= 9/12 + 6/12 - 10/12 = (9 + 6 - 10)/12 = 5/12 kg",
    "Kesimpulan: Sisa kurma yang masih ada adalah 5/12 kg.",
    "",
    "Nomor 5: Soal Cerita Zakat Kebun",
    "Diketahui: Hasil panen utuh = 1 bagian",
    "Disedekahkan ke tetangga = 1/5 bagian, Panti asuhan = 2/3 bagian",
    "Total dibagikan = 1/5 + 2/3 = 3/15 + 10/15 = 13/15 bagian",
    "Sisa untuk keluarga = 1 - 13/15 = 15/15 - 13/15 = 2/15 bagian",
    "Kesimpulan: Bagian yang tersisa untuk keluarga Khalid adalah 2/15 bagian.",
  ];

  let lineY = 54;
  for (const line of jawabanText) {
    if (line.startsWith("Nomor")) {
      subDoc.setFont("helvetica", "bold");
      lineY += 2;
    } else {
      subDoc.setFont("helvetica", "normal");
    }
    subDoc.text(line, 18, lineY);
    lineY += 5.5;
  }

  const subPdfPath = path.join(uploadsDir, "jawaban-tugas-matematika-khalid.pdf");
  fs.writeFileSync(subPdfPath, Buffer.from(subDoc.output("arraybuffer")));
  console.log("✓ Lembar Jawaban Siswa (PDF) berhasil dibuat:", subPdfPath);

  // 4. Update / Insert Database records
  console.log("\nMenyimpan data tugas & pengumpulan ke Database...");

  const targetClass = await prisma.kelas.findFirst({
    where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" },
  });

  const mathSubject = await prisma.mataPelajaran.findFirst({
    where: {
      OR: [
        { kode_mapel: "MTK" },
        { nama_mapel: { contains: "Matematika" } },
      ],
    },
  });

  const teacher = await prisma.user.findFirst({
    where: { email: "guru@gmail.com" },
  });

  const studentRayhan = await prisma.user.findFirst({
    where: { email: "siswa1@gmail.com" },
  });

  const studentKhalid = await prisma.user.findFirst({
    where: { email: "siswa2@gmail.com" },
  });

  if (!targetClass || !mathSubject || !teacher || !studentRayhan) {
    console.error("Data pendukung tidak lengkap:", {
      targetClass: !!targetClass,
      mathSubject: !!mathSubject,
      teacher: !!teacher,
      studentRayhan: !!studentRayhan,
    });
    return;
  }

  // Buat atau perbarui Tugas
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 4);
  deadlineDate.setHours(23, 59, 0, 0);

  const existingTugas = await prisma.tugas.findFirst({
    where: {
      kelas_id: targetClass.id,
      mapel_id: mathSubject.id,
      judul: { contains: "Latihan Operasi Hitung Pecahan" },
    },
  });

  const deskripsiLengkap = `
<p>Assalamu'alaikum Warahmatullahi Wabarakatuh anak-anak sholih & sholihah Kelas 4.</p>
<p>Pada pembelajaran pekan ini, silakan unduh dan pelajari <strong>Lembar Kerja Peserta Didik (LKPD)</strong> pada lampiran di bawah. Kerjakan latihan soal matematika mengenai <em>Penjumlahan, Pengurangan, Perkalian, dan Soal Cerita Pecahan</em>.</p>
<p><strong>Petunjuk Pengerjaan & Pengumpulan:</strong></p>
<ol>
  <li>Buka dan baca lampiran lembar soal PDF di bawah secara seksama.</li>
  <li>Kerjakan pada buku catatan bergaris Matematika atau cetak lembar kerja tersebut. Tuliskan langkah pengerjaan dengan rapi dan jelas.</li>
  <li>Foto lembar jawaban Anda (format PNG/JPG) atau simpan dalam format PDF. Pastikan tulisan terbaca jelas dan tidak buram.</li>
  <li>Kumpulkan tepat waktu sebelum tenggat. Jika ada pertanyaan, silakan tulis di kolom catatan siswa.</li>
</ol>
<p>Barakallahu fiikum. Selamat belajar dengan gembira dan jujur!</p>
`.trim();

  let tugasId: bigint;

  if (existingTugas) {
    const updated = await prisma.tugas.update({
      where: { id: existingTugas.id },
      data: {
        judul: "Tugas 01: Latihan Operasi Hitung Pecahan & Penerapannya",
        deskripsi: deskripsiLengkap,
        file_petunjuk: "/uploads/tugas/lembar-soal-matematika-kelas4.pdf",
        deadline: deadlineDate,
        poin_maksimal: 100,
        status: "aktif",
      },
    });
    tugasId = updated.id;
    console.log("✓ Tugas yang sudah ada berhasil diperbarui (ID:", tugasId.toString(), ")");
  } else {
    const created = await prisma.tugas.create({
      data: {
        kelas_id: targetClass.id,
        mapel_id: mathSubject.id,
        guru_id: teacher.id,
        judul: "Tugas 01: Latihan Operasi Hitung Pecahan & Penerapannya",
        deskripsi: deskripsiLengkap,
        file_petunjuk: "/uploads/tugas/lembar-soal-matematika-kelas4.pdf",
        deadline: deadlineDate,
        poin_maksimal: 100,
        status: "aktif",
      },
    });
    tugasId = created.id;
    console.log("✓ Tugas baru berhasil dibuat (ID:", tugasId.toString(), ")");
  }

  // Submission 1: Muhammad Rayhan (Foto Lembar Jawaban Realistis - Menunggu Penilaian)
  await prisma.tugasSubmission.upsert({
    where: {
      tugas_id_siswa_id: {
        tugas_id: tugasId,
        siswa_id: studentRayhan.id,
      },
    },
    create: {
      tugas_id: tugasId,
      siswa_id: studentRayhan.id,
      file_url: "/uploads/tugas/jawaban-tugas-matematika-rayhan.jpg",
      file_name: "Foto_Tugas_Matematika_Rayhan_No1-5.jpg",
      file_type: "image",
      file_size: 450000,
      catatan_siswa: "Assalamu'alaikum Ustadzah Fatimah, ini foto lembar pengerjaan tugas Rayhan dari buku tulis. Soal nomor 1 sampai 5 sudah dijawab dengan caranya. Mohon koreksinya ustadzah, terima kasih!",
      status: "menunggu_penilaian",
      submitted_at: new Date(),
    },
    update: {
      file_url: "/uploads/tugas/jawaban-tugas-matematika-rayhan.jpg",
      file_name: "Foto_Tugas_Matematika_Rayhan_No1-5.jpg",
      file_type: "image",
      file_size: 450000,
      catatan_siswa: "Assalamu'alaikum Ustadzah Fatimah, ini foto lembar pengerjaan tugas Rayhan dari buku tulis. Soal nomor 1 sampai 5 sudah dijawab dengan caranya. Mohon koreksinya ustadzah, terima kasih!",
      status: "menunggu_penilaian",
      nilai: null,
      catatan_guru: null,
      submitted_at: new Date(),
    },
  });
  console.log("✓ Submisi Siswa 1 (Rayhan - Foto Lembar Tugas) berhasil dibuat!");

  // Submission 2: Khalid Al-Ghazi (File PDF - Sudah Dinilai 95)
  if (studentKhalid) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.tugasSubmission.upsert({
      where: {
        tugas_id_siswa_id: {
          tugas_id: tugasId,
          siswa_id: studentKhalid.id,
        },
      },
      create: {
        tugas_id: tugasId,
        siswa_id: studentKhalid.id,
        file_url: "/uploads/tugas/jawaban-tugas-matematika-khalid.pdf",
        file_name: "Jawaban_Matematika_Khalid.pdf",
        file_type: "pdf",
        file_size: 320000,
        catatan_siswa: "Ustadzah, untuk nomor 4 dan 5 Khalid menyamakan penyebut menggunakan KPK sesuai materi kemarin.",
        status: "sudah_dinilai",
        nilai: 95,
        catatan_guru: "MasyaAllah tabarakallah Khalid, pengerjaan langkah nomor 1-5 sangat rapi, runtut, dan benar. Penarikan kesimpulan pada soal cerita kurma sangat tepat. Pertahankan prestasimu Ananda!",
        submitted_at: yesterday,
        graded_at: new Date(),
        graded_by: teacher.id,
      },
      update: {
        file_url: "/uploads/tugas/jawaban-tugas-matematika-khalid.pdf",
        file_name: "Jawaban_Matematika_Khalid.pdf",
        file_type: "pdf",
        file_size: 320000,
        catatan_siswa: "Ustadzah, untuk nomor 4 dan 5 Khalid menyamakan penyebut menggunakan KPK sesuai materi kemarin.",
        status: "sudah_dinilai",
        nilai: 95,
        catatan_guru: "MasyaAllah tabarakallah Khalid, pengerjaan langkah nomor 1-5 sangat rapi, runtut, dan benar. Penarikan kesimpulan pada soal cerita kurma sangat tepat. Pertahankan prestasimu Ananda!",
        submitted_at: yesterday,
        graded_at: new Date(),
        graded_by: teacher.id,
      },
    });
    console.log("✓ Submisi Siswa 2 (Khalid - Dokumen PDF Sudah Dinilai 95) berhasil dibuat!");
  }

  console.log("\n=========================================");
  console.log("🎉 SEMUA CONTOH TUGAS ASLI BERHASIL DIBUAT!");
  console.log("=========================================");
}

main()
  .catch((err) => {
    console.error("Gagal membuat data contoh tugas:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
