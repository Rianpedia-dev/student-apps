import prisma from "@/lib/prisma";

async function main() {
  console.log("=== SEEDING TUGAS INTERAKTIF IN-APP ===");

  const kelas4 = BigInt(1); // Kelas 4
  const guruFatimah = BigInt(2); // Ustadzah Fatimah
  const mapelMTK = BigInt(6); // Matematika

  // Bersihkan tugas lama pada mapel ini jika ada untuk testing bersih
  const existing = await prisma.tugas.findFirst({
    where: {
      judul: "Kuis Interaktif 01: Pecahan & Operasi Hitung Dasar",
    },
  });

  if (existing) {
    await prisma.tugas.delete({ where: { id: existing.id } });
    console.log("Menghapus tugas interaktif sebelumnya untuk di-reseed.");
  }

  const tugas = await prisma.tugas.create({
    data: {
      kelas_id: kelas4,
      mapel_id: mapelMTK,
      guru_id: guruFatimah,
      judul: "Kuis Interaktif 01: Pecahan & Operasi Hitung Dasar",
      deskripsi: `Assalamu'alaikum Ananda shalih & shalihah Kelas 4!
Silakan kerjakan kuis interaktif berikut secara mandiri langsung di sistem.
Periksa setiap jawaban dengan teliti sebelum menekan tombol Selesai. Selamat berjuang!`,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      durasi_menit: 30,
      acak_soal: false,
      acak_opsi: false,
      tampilkan_nilai_instan: true,
      poin_maksimal: 100,
      status: "aktif",
      tipe_pengerjaan: "INTERAKTIF",
      soal: {
        create: [
          {
            nomor_urut: 1,
            tipe_soal: "PILIHAN_GANDA",
            pertanyaan: "Bentuk pecahan yang senilai dengan 2/4 adalah ...",
            bobot_poin: 20,
            kunci_jawaban: "B",
            pembahasan: "2/4 jika disederhanakan dengan membagi pembilang dan penyebut dengan angka 2 menghasilkan 1/2.",
            opsi: {
              create: [
                { label: "A", teks_opsi: "1/3", is_benar: false, nomor_urut: 1 },
                { label: "B", teks_opsi: "1/2", is_benar: true, nomor_urut: 2 },
                { label: "C", teks_opsi: "3/4", is_benar: false, nomor_urut: 3 },
                { label: "D", teks_opsi: "2/3", is_benar: false, nomor_urut: 4 },
              ],
            },
          },
          {
            nomor_urut: 2,
            tipe_soal: "PILIHAN_GANDA",
            pertanyaan: "Hasil penjumlahan dari 1/5 + 2/5 adalah ...",
            bobot_poin: 20,
            kunci_jawaban: "C",
            pembahasan: "Karena penyebutnya sudah sama (5), kita langsung menjumlahkan pembilangnya: 1 + 2 = 3. Maka hasilnya 3/5.",
            opsi: {
              create: [
                { label: "A", teks_opsi: "3/10", is_benar: false, nomor_urut: 1 },
                { label: "B", teks_opsi: "2/5", is_benar: false, nomor_urut: 2 },
                { label: "C", teks_opsi: "3/5", is_benar: true, nomor_urut: 3 },
                { label: "D", teks_opsi: "1/5", is_benar: false, nomor_urut: 4 },
              ],
            },
          },
          {
            nomor_urut: 3,
            tipe_soal: "PILIHAN_GANDA",
            pertanyaan: "Sebuah kue dipotong menjadi 8 bagian sama besar. Zaid memakan 3 bagian. Berapakah bagian kue yang tersisa?",
            bobot_poin: 20,
            kunci_jawaban: "D",
            pembahasan: "Kue utuh adalah 8/8. Dimakan 3/8, maka sisanya adalah 8/8 - 3/8 = 5/8 bagian.",
            opsi: {
              create: [
                { label: "A", teks_opsi: "2/8 bagian", is_benar: false, nomor_urut: 1 },
                { label: "B", teks_opsi: "3/8 bagian", is_benar: false, nomor_urut: 2 },
                { label: "C", teks_opsi: "4/8 bagian", is_benar: false, nomor_urut: 3 },
                { label: "D", teks_opsi: "5/8 bagian", is_benar: true, nomor_urut: 4 },
              ],
            },
          },
          {
            nomor_urut: 4,
            tipe_soal: "ISIAN_SINGKAT",
            pertanyaan: "Berapakah hasil dari 1/2 dikalikan dengan 4? (Tuliskan berupa angka bulat)",
            bobot_poin: 20,
            kunci_jawaban: "2",
            pembahasan: "1/2 x 4 = 4/2 = 2.",
          },
          {
            nomor_urut: 5,
            tipe_soal: "ESAI",
            pertanyaan: "Ibu membeli 3/4 kg tepung terigu. Kemudian Ibu menggunakan 1/4 kg untuk membuat kue apem. Berapa kg sisa tepung terigu Ibu? Tuliskan cara pengerjaannya!",
            bobot_poin: 20,
            kunci_jawaban: "2/4 kg atau 1/2 kg",
            pembahasan: "Sisa = 3/4 kg - 1/4 kg = 2/4 kg = 1/2 kg.",
          },
        ],
      },
    },
  });

  console.log(`[SUCCESS] Tugas Interaktif berhasil dibuat dengan ID: ${tugas.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
