import prisma from "./src/lib/prisma";

async function main() {
  console.log("=== SEEDING TUGAS & PENILAIAN ===");

  const kelas4 = BigInt(1); // Kelas 4 - Mehmed Al Fatih
  const guruFatimah = BigInt(2); // Ustadzah Fatimah, S.Pd
  const guruIbrahim = BigInt(5); // Ustadz Ibrahim
  const guruAisyah = BigInt(6); // Ustadzah Aisyah

  const siswaRayhan = BigInt(19); // Muhammad Rayhan Al-Fatih
  const siswaRayhan2 = BigInt(49); // Muhammad Rayhan
  const siswaKhalid = BigInt(50); // Khalid Al-Ghazi

  // Cek apakah tugas Bahasa Indonesia sudah ada
  const existingBIndo = await prisma.tugas.findFirst({
    where: { kelas_id: kelas4, mapel_id: BigInt(5) },
  });

  if (!existingBIndo) {
    const tugas1 = await prisma.tugas.create({
      data: {
        kelas_id: kelas4,
        mapel_id: BigInt(5),
        guru_id: guruFatimah,
        judul: "Tugas 01: Menulis Paragraf Deskripsi Keindahan Alam Nusantara",
        deskripsi: `<p>Assalamu'alaikum Ananda Kelas 4 yang berbahagia.</p>
<p>Setelah mempelajari materi teks deskripsi pada Modul Pembelajaran pekan ini, silakan buat sebuah paragraf deskripsi singkat (minimal 5 kalimat) tentang tempat wisata alam atau pemandangan indah yang pernah kalian kunjungi.</p>
<p><strong>Kriteria Penilaian:</strong></p>
<ul>
  <li>Terdapat ide pokok yang jelas pada kalimat utama.</li>
  <li>Memiliki minimal 3 kalimat penjelas (gagasan pendukung).</li>
  <li>Menggunakan kata baku dan tanda baca (titik & koma) yang tepat.</li>
</ul>
<p>Tulis di buku catatan Bahasa Indonesia dengan rapi, lalu foto atau scan dokumen dan unggah sebelum batas waktu ya.</p>`,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 hari ke depan
        poin_maksimal: 100,
        status: "aktif",
        submissions: {
          create: [
            {
              siswa_id: siswaRayhan,
              file_url: "/uploads/submissions/deskripsi_rayhan.pdf",
              file_name: "Tugas_BIndo_Rayhan.pdf",
              file_type: "pdf",
              file_size: 2450,
              catatan_siswa: "Ustadzah, ini tugas deskripsi tentang Pantai Pasir Putih di Lampung. Mohon bimbingannya.",
              status: "menunggu_penilaian",
              submitted_at: new Date(Date.now() - 3 * 3600 * 1000),
            },
            {
              siswa_id: siswaRayhan2,
              file_url: "/uploads/submissions/deskripsi_rayhan2.jpg",
              file_name: "Tugas_BIndo_Deskripsi_Pemandangan.jpg",
              file_type: "jpg",
              file_size: 1820,
              catatan_siswa: "Alhamdulillah sudah selesai Ustadzah.",
              status: "menunggu_penilaian",
              submitted_at: new Date(Date.now() - 5 * 3600 * 1000),
            },
            {
              siswa_id: siswaKhalid,
              file_url: "/uploads/submissions/deskripsi_khalid.pdf",
              file_name: "Deskripsi_KebunTeh_Khalid.pdf",
              file_type: "pdf",
              file_size: 3100,
              catatan_siswa: "Sudah dikerjakan lengkap dengan ide pokok dan kalimat penjelas.",
              nilai: 92,
              catatan_guru: "Masya Allah tulisan dan struktur paragraf sangat rapi dan deskriptif. Pertahankan ya Khalid!",
              status: "sudah_dinilai",
              submitted_at: new Date(Date.now() - 24 * 3600 * 1000),
              graded_at: new Date(Date.now() - 12 * 3600 * 1000),
              graded_by: guruFatimah,
            },
          ],
        },
      },
    });
    console.log("[SUCCESS] Dibuat Tugas Bahasa Indonesia ID:", tugas1.id.toString());
  } else {
    console.log("[SKIP] Tugas Bahasa Indonesia sudah ada.");
  }

  // Cek apakah tugas PAI sudah ada
  const existingPAI = await prisma.tugas.findFirst({
    where: { kelas_id: kelas4, mapel_id: BigInt(1) },
  });

  if (!existingPAI) {
    const tugasPAI = await prisma.tugas.create({
      data: {
        kelas_id: kelas4,
        mapel_id: BigInt(1),
        guru_id: guruFatimah,
        judul: "Penugasan Adab: Praktik Mandiri Thaharah & Doa Sesudah Wudhu",
        deskripsi: `<p>Bismillahirrohmanirrohim.</p>
<p>Sebagai pengamalan materi Adab dan Thaharah, ananda diminta mempraktikkan tata cara wudhu yang tertib dan sempurna di rumah dengan pendampingan orang tua.</p>
<p><strong>Tugas yang Dikumpulkan:</strong></p>
<ol>
  <li>Tuliskan lafadz doa sesudah wudhu beserta artinya di buku tulis adab.</li>
  <li>Minta paraf orang tua/wali pada buku catatan sebagai bukti telah menyimak hafalan doa ananda.</li>
  <li>Foto lembar buku catatan tersebut dan kirimkan ke lembar tugas ini.</li>
</ol>`,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        poin_maksimal: 100,
        status: "aktif",
        submissions: {
          create: [
            {
              siswa_id: siswaRayhan,
              file_url: "/uploads/submissions/adab_wudhu_rayhan.jpg",
              file_name: "Doa_Wudhu_Rayhan.jpg",
              file_type: "jpg",
              file_size: 1980,
              catatan_siswa: "Alhamdulillah sudah hafal dan disimak Bunda Ustadzah.",
              status: "menunggu_penilaian",
              submitted_at: new Date(Date.now() - 2 * 3600 * 1000),
            },
            {
              siswa_id: siswaKhalid,
              file_url: "/uploads/submissions/adab_wudhu_khalid.pdf",
              file_name: "Doa_Wudhu_Khalid.pdf",
              file_type: "pdf",
              file_size: 2200,
              catatan_siswa: "Hafalan doa wudhu lengkap beserta terjemah.",
              nilai: 95,
              catatan_guru: "Alhamdulillah mumtaz! Tulisan arab dan harakatnya sangat rapi.",
              status: "sudah_dinilai",
              submitted_at: new Date(Date.now() - 20 * 3600 * 1000),
              graded_at: new Date(Date.now() - 10 * 3600 * 1000),
              graded_by: guruFatimah,
            },
          ],
        },
      },
    });
    console.log("[SUCCESS] Dibuat Tugas PAI ID:", tugasPAI.id.toString());
  } else {
    console.log("[SKIP] Tugas PAI sudah ada.");
  }

  // Cek apakah tugas IPA sudah ada
  const existingIPA = await prisma.tugas.findFirst({
    where: { kelas_id: kelas4, mapel_id: BigInt(7) },
  });

  if (!existingIPA) {
    const tugasIPA = await prisma.tugas.create({
      data: {
        kelas_id: kelas4,
        mapel_id: BigInt(7),
        guru_id: guruIbrahim,
        judul: "Lembar Kerja Sains: Pengamatan Bagian Tumbuhan & Fotosintesis",
        deskripsi: `<p>Amati 1 jenis tanaman bunga atau sayur di halaman rumahmu.</p>
<p>Tuliskan nama tanaman, bentuk daun, jenis akar, dan jelaskan fungsi bagian tubuh tumbuhan tersebut berdasarkan materi yang telah dipelajari.</p>`,
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        poin_maksimal: 100,
        status: "aktif",
        submissions: {
          create: [
            {
              siswa_id: siswaRayhan,
              file_url: "/uploads/submissions/laporan_tumbuhan_rayhan.pdf",
              file_name: "Pengamatan_Tanaman_Rayhan.pdf",
              file_type: "pdf",
              file_size: 3400,
              catatan_siswa: "Saya mengamati tanaman cabai di kebun belakang rumah.",
              status: "menunggu_penilaian",
              submitted_at: new Date(Date.now() - 4 * 3600 * 1000),
            },
          ],
        },
      },
    });
    console.log("[SUCCESS] Dibuat Tugas IPA ID:", tugasIPA.id.toString());
  }

  // Cek apakah tugas English sudah ada
  const existingEnglish = await prisma.tugas.findFirst({
    where: { kelas_id: kelas4, mapel_id: BigInt(4) },
  });

  if (!existingEnglish) {
    const tugasEng = await prisma.tugas.create({
      data: {
        kelas_id: kelas4,
        mapel_id: BigInt(4),
        guru_id: guruAisyah,
        judul: "Writing Task: My Daily Routine & Favorite Subjects",
        deskripsi: `<p>Write a short paragraph (5-7 sentences) about your typical daily routine at school and at home.</p>
<p>Use adverbs of frequency: <em>always, usually, sometimes, never</em>.</p>`,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        poin_maksimal: 100,
        status: "aktif",
        submissions: {
          create: [
            {
              siswa_id: siswaRayhan2,
              file_url: "/uploads/submissions/english_daily_routine.pdf",
              file_name: "Daily_Routine_Rayhan.pdf",
              file_type: "pdf",
              file_size: 2150,
              catatan_siswa: "Here is my English homework, thank you Ustadzah.",
              nilai: 88,
              catatan_guru: "Well done! Good grammar and clear sentences.",
              status: "sudah_dinilai",
              submitted_at: new Date(Date.now() - 15 * 3600 * 1000),
              graded_at: new Date(Date.now() - 8 * 3600 * 1000),
              graded_by: guruAisyah,
            },
          ],
        },
      },
    });
    console.log("[SUCCESS] Dibuat Tugas English ID:", tugasEng.id.toString());
  }

  const totalTasks = await prisma.tugas.count();
  console.log(`\n=== SEED TUGAS SELESAI ===`);
  console.log(`Total tugas di DB sekarang: ${totalTasks}`);
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect());
