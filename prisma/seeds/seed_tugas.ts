import prisma from "@/lib/prisma";

async function main() {
  console.log("=========================================");
  console.log("📝 Memulai Seeding Data Tugas Interaktif...");
  console.log("=========================================");

  // 1. Ambil data Kelas utama (Kelas 4 - Mehmed Al Fatih & Kelas 5 - Al Bukhari)
  const kelas4 = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Mehmed Al Fatih" } },
  });
  const kelas5 = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Al Bukhari" } },
  });

  if (!kelas4) {
    console.error("❌ Kelas 4 - Mehmed Al Fatih tidak ditemukan. Jalankan seed utama terlebih dahulu.");
    return;
  }

  // 2. Ambil data Guru (Ustadzah Fatimah & Ustadz Ahmad)
  const guruFatimah = await prisma.user.findFirst({
    where: { email: "guru@gmail.com" },
  });
  const guruAhmad = await prisma.user.findFirst({
    where: { email: "ahmad.guru@alazhar.sch.id" },
  });

  const defaultGuruId = guruFatimah?.id || (await prisma.user.findFirst({ where: { status: "4" } }))?.id;

  if (!defaultGuruId) {
    console.error("❌ Data Guru tidak ditemukan. Jalankan seed user terlebih dahulu.");
    return;
  }

  // 3. Ambil data Siswa aktif di Kelas 4
  const siswaRayhan = await prisma.user.findFirst({ where: { email: "siswa@gmail.com" } });
  const siswaKhalid = await prisma.user.findFirst({ where: { email: "khalid.ghazi@siswa.alazhar.sch.id" } });
  const siswaZahra = await prisma.user.findFirst({ where: { email: "zahra.salsabila@siswa.alazhar.sch.id" } });
  const siswaUmar = await prisma.user.findFirst({ where: { email: "umar.pratama@siswa.alazhar.sch.id" } });

  // 4. Ambil data Mata Pelajaran
  const mapelPAI = await prisma.mataPelajaran.findFirst({ where: { kode_mapel: "PAI" } });
  const mapelMTK = await prisma.mataPelajaran.findFirst({ where: { kode_mapel: "MTK" } });
  const mapelBARAB = await prisma.mataPelajaran.findFirst({ where: { kode_mapel: "BARAB" } });
  const mapelBING = await prisma.mataPelajaran.findFirst({ where: { kode_mapel: "BING" } });
  const mapelTAHFIDZ = await prisma.mataPelajaran.findFirst({ where: { kode_mapel: "TAHFIDZ" } });
  const mapelIPA = await prisma.mataPelajaran.findFirst({ where: { kode_mapel: "IPA" } });

  // 5. Ambil materi/pertemuan yang ada (jika ada)
  const pertemuanPAI = await prisma.pertemuan.findFirst({ where: { mapel_id: mapelPAI?.id, kelas_id: kelas4.id } });
  const pertemuanMTK = await prisma.pertemuan.findFirst({ where: { mapel_id: mapelMTK?.id, kelas_id: kelas4.id } });

  console.log("🧹 Membersihkan data tugas interaktif lama untuk Kelas 4...");
  // Hapus submission dan tugas di kelas 4 untuk re-seeding bersih
  const existingTugas = await prisma.tugas.findMany({
    where: { kelas_id: kelas4.id },
    select: { id: true },
  });
  if (existingTugas.length > 0) {
    await prisma.tugas.deleteMany({
      where: { id: { in: existingTugas.map((t) => t.id) } },
    });
    console.log(`🗑️ Berhasil membersihkan ${existingTugas.length} tugas lama.`);
  }

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const subDays = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // -------------------------------------------------------------------------------------------------
  // TUGAS 1: PAI & ADAB (Kombinasi PG, Isian Singkat, dan Esai)
  // -------------------------------------------------------------------------------------------------
  console.log("\n📖 Membuat Tugas 1: PAI & Adab Islam (Interaktif & Variatif)...");
  if (mapelPAI) {
    const tugasPAI = await prisma.tugas.create({
      data: {
        kelas_id: kelas4.id,
        mapel_id: mapelPAI.id,
        guru_id: defaultGuruId,
        pertemuan_id: pertemuanPAI?.id || null,
        judul: "Kuis Interaktif: Adab Harian & Tata Cara Thaharah Sesuai Sunnah",
        deskripsi:
          "Assalamu'alaikum ananda sholeh & sholehah. Selesaikan evaluasi pemahaman adab harian islami dan rukun thaharah (bersuci/wudhu) berikut dengan cermat dan jujur.",
        deadline: addDays(5),
        poin_maksimal: 100,
        durasi_menit: 30,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    // Butir Soal 1: PG
    const s1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasPAI.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Manakah di bawah ini yang merupakan adab makan dan minum yang dicontohkan oleh Rasulullah SAW?",
        bobot_poin: 20,
        kunci_jawaban: "B",
        pembahasan:
          "Rasulullah SAW bersabda: 'Sebutlah nama Allah (membaca Bismillah), makanlah dengan tangan kananmu dan makanlah makanan yang paling dekat denganmu.' (HR. Bukhari & Muslim).",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: s1.id, label: "A", teks_opsi: "Makan sambil berdiri tergesa-gesa dan meniup makanan panas", is_benar: false, nomor_urut: 1 },
        { soal_id: s1.id, label: "B", teks_opsi: "Membaca basmalah, makan dengan tangan kanan, dan duduk tenang", is_benar: true, nomor_urut: 2 },
        { soal_id: s1.id, label: "C", teks_opsi: "Menggunakan tangan kiri dan mencela makanan yang kurang enak", is_benar: false, nomor_urut: 3 },
        { soal_id: s1.id, label: "D", teks_opsi: "Menyisakan makanan di piring tanpa dihabiskan", is_benar: false, nomor_urut: 4 },
      ],
    });

    // Butir Soal 2: PG
    const s2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasPAI.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Dalam rukun wudhu, niat berwudhu wajib dihadirkan dalam hati bersamaan saat kita...",
        bobot_poin: 20,
        kunci_jawaban: "B",
        pembahasan: "Niat wudhu wajib bersamaan dengan saat pertama kali air membasuh bagian muka/wajah.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: s2.id, label: "A", teks_opsi: "Berkumur-kumur dan membersihkan hidung", is_benar: false, nomor_urut: 1 },
        { soal_id: s2.id, label: "B", teks_opsi: "Pertama kali membasuh seluruh permukaan wajah", is_benar: true, nomor_urut: 2 },
        { soal_id: s2.id, label: "C", teks_opsi: "Membasuh kedua telinga kanan dan kiri", is_benar: false, nomor_urut: 3 },
        { soal_id: s2.id, label: "D", teks_opsi: "Membasuh kedua kaki hingga mata kaki", is_benar: false, nomor_urut: 4 },
      ],
    });

    // Butir Soal 3: ISIAN_SINGKAT
    const s3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasPAI.id,
        nomor_urut: 3,
        tipe_soal: "ISIAN_SINGKAT",
        pertanyaan: "Lengkapilah lanjutan doa masuk kamar mandi berikut: 'Allahumma inni a'udzubika minal ...'",
        bobot_poin: 25,
        kunci_jawaban: "khubutsi wal khabaits",
        pembahasan: "Lafadz lengkap: 'Allahumma inni a'uudzubika minal khubutsi wal khobaa'its' (Ya Allah, aku berlindung kepada-Mu dari godaan setan laki-laki dan perempuan).",
      },
    });

    // Butir Soal 4: ESAI
    const s4 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasPAI.id,
        nomor_urut: 4,
        tipe_soal: "ESAI",
        pertanyaan: "Jelaskan 3 (tiga) keutamaan selalu menjaga wudhu dan mendahulukan anggota tubuh sebelah kanan (tayamun) dalam kehidupan sehari-hari!",
        bobot_poin: 35,
        pembahasan:
          "Keutamaan: 1. Menjaga kesucian jasmani dan ruhani sepanjang hari. 2. Meneladani sunnah mulia Rasulullah SAW. 3. Memperoleh cahaya berkilau di wajah dan tangan pada yaumul kiyamah.",
      },
    });

    // Seed Submissions untuk Tugas 1
    if (siswaRayhan) {
      // Rayhan sedang mengerjakan (Draft in progress)
      const subRayhan = await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasPAI.id,
          siswa_id: siswaRayhan.id,
          status: "sedang_mengerjakan",
          mulai_mengerjakan_at: new Date(now.getTime() - 15 * 60 * 1000),
          total_soal: 4,
          file_url: "interactive_cbt",
          file_name: "Pengerjaan Interaktif In-App",
          file_type: "interactive",
        },
      });
      // Draft jawaban soal 1 & 2
      await prisma.tugasJawabanSiswa.createMany({
        data: [
          { submission_id: subRayhan.id, soal_id: s1.id, jawaban_siswa: "B", is_ragu: false },
          { submission_id: subRayhan.id, soal_id: s2.id, jawaban_siswa: "B", is_ragu: false },
        ],
      });
    }

    if (siswaKhalid) {
      // Khalid sudah submit, status menunggu_penilaian guru (karena ada soal esai)
      const subKhalid = await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasPAI.id,
          siswa_id: siswaKhalid.id,
          status: "menunggu_penilaian",
          mulai_mengerjakan_at: subDays(1),
          selesai_mengerjakan_at: new Date(subDays(1).getTime() + 20 * 60 * 1000),
          durasi_detik: 1200,
          total_soal: 4,
          total_benar: 3,
          total_salah: 0,
          nilai_otomatis: 65,
          nilai: 65,
          submitted_at: new Date(subDays(1).getTime() + 20 * 60 * 1000),
          file_url: "interactive_cbt",
          file_name: "Pengerjaan Interaktif In-App",
          file_type: "interactive",
        },
      });
      await prisma.tugasJawabanSiswa.createMany({
        data: [
          { submission_id: subKhalid.id, soal_id: s1.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 20 },
          { submission_id: subKhalid.id, soal_id: s2.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 20 },
          { submission_id: subKhalid.id, soal_id: s3.id, jawaban_siswa: "khubutsi wal khabaits", is_benar: true, poin_didapat: 25 },
          {
            submission_id: subKhalid.id,
            soal_id: s4.id,
            jawaban_siswa: "1. Tubuh selalu bersih dan terhindar dari kotoran. 2. Mengikuti sunnah Rasulullah SAW agar mendapat pahala. 3. Selalu siap saat waktu sholat tiba.",
            is_benar: null,
            poin_didapat: 0,
          },
        ],
      });
    }

    if (siswaZahra) {
      // Zahra sudah dinilai lengkap oleh guru
      const subZahra = await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasPAI.id,
          siswa_id: siswaZahra.id,
          status: "sudah_dinilai",
          mulai_mengerjakan_at: subDays(2),
          selesai_mengerjakan_at: new Date(subDays(2).getTime() + 18 * 60 * 1000),
          durasi_detik: 1080,
          total_soal: 4,
          total_benar: 4,
          total_salah: 0,
          nilai_otomatis: 65,
          nilai_manual: 35,
          nilai: 100,
          catatan_guru: "Mumtaz! Jawaban esai sangat terstruktur dan menunjukkan pemahaman adab yang luar biasa.",
          graded_at: subDays(1),
          graded_by: defaultGuruId,
          submitted_at: new Date(subDays(2).getTime() + 18 * 60 * 1000),
          file_url: "interactive_cbt",
          file_name: "Pengerjaan Interaktif In-App",
          file_type: "interactive",
        },
      });
      await prisma.tugasJawabanSiswa.createMany({
        data: [
          { submission_id: subZahra.id, soal_id: s1.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 20 },
          { submission_id: subZahra.id, soal_id: s2.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 20 },
          { submission_id: subZahra.id, soal_id: s3.id, jawaban_siswa: "khubutsi wal khabaits", is_benar: true, poin_didapat: 25 },
          {
            submission_id: subZahra.id,
            soal_id: s4.id,
            jawaban_siswa: "Keutamaan menjaga wudhu dan tayamun adalah mendatangkan kecintaan Allah Ta'ala, menjaga diri dari was-was setan, dan wajah berseri-seri penuh cahaya di akhirat.",
            is_benar: true,
            poin_didapat: 35,
            catatan_koreksi: "Penjelasan tepat dan menyertakan dalil keutamaan wudhu.",
          },
        ],
      });
    }

    console.log("✅ Tugas 1 PAI & Submissions berhasil dibuat.");
  }

  // -------------------------------------------------------------------------------------------------
  // TUGAS 2: MATEMATIKA (CBT Auto-Grading Instan Nilai Sempurna 100)
  // -------------------------------------------------------------------------------------------------
  console.log("\n📐 Membuat Tugas 2: Matematika Pecahan (Auto-Grading CBT)...");
  if (mapelMTK) {
    const tugasMTK = await prisma.tugas.create({
      data: {
        kelas_id: kelas4.id,
        mapel_id: mapelMTK.id,
        guru_id: defaultGuruId,
        pertemuan_id: pertemuanMTK?.id || null,
        judul: "Tantangan Matematika: Pecahan Senilai & Operasi Hitung Campuran",
        deskripsi:
          "Selesaikan soal-soal latihan pecahan di bawah ini. Hasil skor dan pembahasan akan langsung ditampilkan seketika setelah kamu mengumpulkan jawaban.",
        deadline: addDays(7),
        poin_maksimal: 100,
        durasi_menit: 45,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    // Soal 1 (PG)
    const m1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Bentuk pecahan paling sederhana dari 12/16 adalah...",
        bobot_poin: 25,
        kunci_jawaban: "B",
        pembahasan: "Bagi pembilang dan penyebut dengan FPB(12, 16) = 4. Maka 12/4 = 3 dan 16/4 = 4. Hasilnya 3/4.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: m1.id, label: "A", teks_opsi: "2/3", is_benar: false, nomor_urut: 1 },
        { soal_id: m1.id, label: "B", teks_opsi: "3/4", is_benar: true, nomor_urut: 2 },
        { soal_id: m1.id, label: "C", teks_opsi: "4/5", is_benar: false, nomor_urut: 3 },
        { soal_id: m1.id, label: "D", teks_opsi: "6/8", is_benar: false, nomor_urut: 4 },
      ],
    });

    // Soal 2 (PG)
    const m2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Hasil penjumlahan dari pecahan 2/5 + 1/5 adalah...",
        bobot_poin: 25,
        kunci_jawaban: "A",
        pembahasan: "Karena penyebutnya sudah sama (5), cukup jumlahkan pembilangnya: 2 + 1 = 3. Jadi jawabannya 3/5.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: m2.id, label: "A", teks_opsi: "3/5", is_benar: true, nomor_urut: 1 },
        { soal_id: m2.id, label: "B", teks_opsi: "3/10", is_benar: false, nomor_urut: 2 },
        { soal_id: m2.id, label: "C", teks_opsi: "2/25", is_benar: false, nomor_urut: 3 },
        { soal_id: m2.id, label: "D", teks_opsi: "1/5", is_benar: false, nomor_urut: 4 },
      ],
    });

    // Soal 3 (ISIAN_SINGKAT)
    const m3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 3,
        tipe_soal: "ISIAN_SINGKAT",
        pertanyaan: "Ibu membeli sebuah kue tart dan memotongnya menjadi 8 bagian sama besar. Rayhan memakan 3 bagian. Berapakah sisa bagian kue yang belum dimakan dalam bentuk pecahan? (Tulis format: pembilang/penyebut, contoh: 5/8)",
        bobot_poin: 25,
        kunci_jawaban: "5/8",
        pembahasan: "Total kue = 8/8. Dimakan = 3/8. Sisa kue = 8/8 - 3/8 = 5/8 bagian.",
      },
    });

    // Soal 4 (PG)
    const m4 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 4,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Manakah pasangan pecahan di bawah ini yang senilai dengan pecahan 1/2?",
        bobot_poin: 25,
        kunci_jawaban: "A",
        pembahasan: "1/2 dikalikan 2/2 menghasilkan 2/4. Maka 1/2 senilai dengan 2/4.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: m4.id, label: "A", teks_opsi: "2/4 dan 4/8", is_benar: true, nomor_urut: 1 },
        { soal_id: m4.id, label: "B", teks_opsi: "3/5 dan 5/10", is_benar: false, nomor_urut: 2 },
        { soal_id: m4.id, label: "C", teks_opsi: "2/6 dan 3/9", is_benar: false, nomor_urut: 3 },
        { soal_id: m4.id, label: "D", teks_opsi: "1/4 dan 2/8", is_benar: false, nomor_urut: 4 },
      ],
    });

    // Seed Submission Rayhan (Nilai 100 Selesai!)
    if (siswaRayhan) {
      const subRayhanMTK = await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasMTK.id,
          siswa_id: siswaRayhan.id,
          status: "sudah_dinilai",
          mulai_mengerjakan_at: subDays(1),
          selesai_mengerjakan_at: new Date(subDays(1).getTime() + 12 * 60 * 1000),
          durasi_detik: 720,
          total_soal: 4,
          total_benar: 4,
          total_salah: 0,
          nilai_otomatis: 100,
          nilai: 100,
          submitted_at: new Date(subDays(1).getTime() + 12 * 60 * 1000),
          file_url: "interactive_cbt",
          file_name: "Pengerjaan Interaktif In-App",
          file_type: "interactive",
        },
      });
      await prisma.tugasJawabanSiswa.createMany({
        data: [
          { submission_id: subRayhanMTK.id, soal_id: m1.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 25 },
          { submission_id: subRayhanMTK.id, soal_id: m2.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 25 },
          { submission_id: subRayhanMTK.id, soal_id: m3.id, jawaban_siswa: "5/8", is_benar: true, poin_didapat: 25 },
          { submission_id: subRayhanMTK.id, soal_id: m4.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 25 },
        ],
      });
    }

    console.log("✅ Tugas 2 Matematika & Submission berhasil dibuat.");
  }

  // -------------------------------------------------------------------------------------------------
  // TUGAS 3: BAHASA ARAB
  // -------------------------------------------------------------------------------------------------
  console.log("\n🌴 Membuat Tugas 3: Bahasa Arab (Mufrodat Peralatan Belajar)...");
  if (mapelBARAB) {
    const tugasArab = await prisma.tugas.create({
      data: {
        kelas_id: kelas4.id,
        mapel_id: mapelBARAB.id,
        guru_id: guruAhmad?.id || defaultGuruId,
        judul: "Latihan Mandiri: Mufrodat Adawatul Kitabiyah (Peralatan Belajar)",
        deskripsi:
          "Kerjakan latihan kosakata (mufrodat) bahasa Arab seputar peralatan sekolah dan benda-benda di dalam kelas dengan teliti.",
        deadline: addDays(4),
        poin_maksimal: 100,
        durasi_menit: 25,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    const a1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasArab.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Arti dari kosakata bahasa Arab 'قَلَمٌ' (Qolamun) adalah...",
        bobot_poin: 30,
        kunci_jawaban: "B",
        pembahasan: "Qolamun artinya pena / pulpen. Sedangkan buku tulis adalah kurrosatun.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: a1.id, label: "A", teks_opsi: "Buku Tulis", is_benar: false, nomor_urut: 1 },
        { soal_id: a1.id, label: "B", teks_opsi: "Pena / Pulpen", is_benar: true, nomor_urut: 2 },
        { soal_id: a1.id, label: "C", teks_opsi: "Penghapus", is_benar: false, nomor_urut: 3 },
        { soal_id: a1.id, label: "D", teks_opsi: "Penggaris", is_benar: false, nomor_urut: 4 },
      ],
    });

    const a2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasArab.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Kata 'مَحْفَظَةٌ' (Mahfazhotun) dalam bahasa Indonesia memiliki arti...",
        bobot_poin: 30,
        kunci_jawaban: "A",
        pembahasan: "Mahfazhotun artinya tas sekolah atau tempat penyimpanan buku.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: a2.id, label: "A", teks_opsi: "Tas Sekolah", is_benar: true, nomor_urut: 1 },
        { soal_id: a2.id, label: "B", teks_opsi: "Meja Belajar", is_benar: false, nomor_urut: 2 },
        { soal_id: a2.id, label: "C", teks_opsi: "Papan Tulis", is_benar: false, nomor_urut: 3 },
        { soal_id: a2.id, label: "D", teks_opsi: "Kursi", is_benar: false, nomor_urut: 4 },
      ],
    });

    const a3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasArab.id,
        nomor_urut: 3,
        tipe_soal: "ESAI",
        pertanyaan: "Terjemahkan kalimat pendek ini ke dalam bahasa Indonesia: 'هَذَا قَلَمٌ جَدِيْدٌ، وَهَذِهِ مِمْسَحَةٌ'!",
        bobot_poin: 40,
        pembahasan: "Terjemahan: 'Ini adalah pena baru, dan ini adalah penghapus.'",
      },
    });

    console.log("✅ Tugas 3 Bahasa Arab berhasil dibuat.");
  }

  // -------------------------------------------------------------------------------------------------
  // TUGAS 4: ENGLISH CAMBRIDGE
  // -------------------------------------------------------------------------------------------------
  console.log("\n🇬🇧 Membuat Tugas 4: English Cambridge Explorer...");
  if (mapelBING) {
    const tugasBING = await prisma.tugas.create({
      data: {
        kelas_id: kelas4.id,
        mapel_id: mapelBING.id,
        guru_id: defaultGuruId,
        judul: "English Explorer: Animal Habitats & Simple Past Tense",
        deskripsi: "Read the questions carefully and pick the most appropriate vocabulary or grammar choices.",
        deadline: addDays(10),
        poin_maksimal: 100,
        durasi_menit: 30,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    const b1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasBING.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Where does a camel typically live in nature?",
        bobot_poin: 30,
        kunci_jawaban: "B",
        pembahasan: "Camels are well-adapted to survive in dry, hot desert environments.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: b1.id, label: "A", teks_opsi: "In deep rainforests", is_benar: false, nomor_urut: 1 },
        { soal_id: b1.id, label: "B", teks_opsi: "In hot, arid deserts", is_benar: true, nomor_urut: 2 },
        { soal_id: b1.id, label: "C", teks_opsi: "In icy glaciers", is_benar: false, nomor_urut: 3 },
        { soal_id: b1.id, label: "D", teks_opsi: "In high mountain peaks", is_benar: false, nomor_urut: 4 },
      ],
    });

    const b2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasBING.id,
        nomor_urut: 2,
        tipe_soal: "ISIAN_SINGKAT",
        pertanyaan: "Complete with the correct past tense verb: 'Yesterday, our class _____ (go) to the library.' (Type only the verb)",
        bobot_poin: 40,
        kunci_jawaban: "went",
        pembahasan: "The past tense form of 'go' is 'went'.",
      },
    });

    const b3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasBING.id,
        nomor_urut: 3,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Which animal is known as the fastest land runner on Earth?",
        bobot_poin: 30,
        kunci_jawaban: "C",
        pembahasan: "The cheetah can run up to 100–120 km/h.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: b3.id, label: "A", teks_opsi: "Lion", is_benar: false, nomor_urut: 1 },
        { soal_id: b3.id, label: "B", teks_opsi: "Horse", is_benar: false, nomor_urut: 2 },
        { soal_id: b3.id, label: "C", teks_opsi: "Cheetah", is_benar: true, nomor_urut: 3 },
        { soal_id: b3.id, label: "D", teks_opsi: "Eagle", is_benar: false, nomor_urut: 4 },
      ],
    });

    console.log("✅ Tugas 4 English Cambridge berhasil dibuat.");
  }

  // -------------------------------------------------------------------------------------------------
  // TUGAS 5: TAHFIDZ & TAJWID
  // -------------------------------------------------------------------------------------------------
  console.log("\n✨ Membuat Tugas 5: Tahfidz & Tajwid Al-Qur'an...");
  if (mapelTAHFIDZ) {
    const tugasTahfidz = await prisma.tugas.create({
      data: {
        kelas_id: kelas4.id,
        mapel_id: mapelTAHFIDZ.id,
        guru_id: guruAhmad?.id || defaultGuruId,
        judul: "Ujian Teori Tajwid: Hukum Nun Mati dan Tanwin (نْ / ً ٍ ٌ)",
        deskripsi: "Evaluasi teori hukum bacaan tajwid tartil metode Al-Azhar.",
        deadline: addDays(12),
        poin_maksimal: 100,
        durasi_menit: 35,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    const t1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasTahfidz.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Apabila nun mati (نْ) bertemu dengan huruf Ba' (ب), maka hukum bacaannya adalah...",
        bobot_poin: 30,
        kunci_jawaban: "B",
        pembahasan: "Iqlab terjadi ketika nun sukun atau tanwin bertemu huruf Ba', bunyinya diganti menjadi bunyi mim disertai dengung (ghunnah).",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: t1.id, label: "A", teks_opsi: "Izhhar Halqi", is_benar: false, nomor_urut: 1 },
        { soal_id: t1.id, label: "B", teks_opsi: "Iqlab", is_benar: true, nomor_urut: 2 },
        { soal_id: t1.id, label: "C", teks_opsi: "Idgham Bighunnah", is_benar: false, nomor_urut: 3 },
        { soal_id: t1.id, label: "D", teks_opsi: "Ikhfa' Haqiqi", is_benar: false, nomor_urut: 4 },
      ],
    });

    const t2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasTahfidz.id,
        nomor_urut: 2,
        tipe_soal: "ISIAN_SINGKAT",
        pertanyaan: "Berapakah jumlah total huruf Ikhfa' Haqiqi dalam hukum nun mati dan tanwin? (Tulis angka, contoh: 15)",
        bobot_poin: 40,
        kunci_jawaban: "15",
        pembahasan: "Huruf Ikhfa' berjumlah 15 huruf: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك.",
      },
    });

    const t3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasTahfidz.id,
        nomor_urut: 3,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Berikut adalah huruf-huruf Idgham Bighunnah yang terkumpul dalam kata...",
        bobot_poin: 30,
        kunci_jawaban: "A",
        pembahasan: "Huruf Idgham Bighunnah ada 4 yang terkumpul dalam lafadz YANMU (ي - ن - م - و).",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: t3.id, label: "A", teks_opsi: "YANMU (ي - ن - م - و)", is_benar: true, nomor_urut: 1 },
        { soal_id: t3.id, label: "B", teks_opsi: "LARA (ل - ر)", is_benar: false, nomor_urut: 2 },
        { soal_id: t3.id, label: "C", teks_opsi: "QUTHBU JADIN (ق - ط - ب - ج - د)", is_benar: false, nomor_urut: 3 },
        { soal_id: t3.id, label: "D", teks_opsi: "AHI (ء - هـ - ع - ح)", is_benar: false, nomor_urut: 4 },
      ],
    });

    console.log("✅ Tugas 5 Tahfidz & Tajwid berhasil dibuat.");
  }

  // -------------------------------------------------------------------------------------------------
  // TUGAS 6: SAINS / IPAS (Tugas Pekan Lalu / Sudah Selesai Dinilai)
  // -------------------------------------------------------------------------------------------------
  console.log("\n🔬 Membuat Tugas 6: IPAS Sains (Riwayat Evaluasi Selesai)...");
  if (mapelIPA) {
    const tugasIPA = await prisma.tugas.create({
      data: {
        kelas_id: kelas4.id,
        mapel_id: mapelIPA.id,
        guru_id: defaultGuruId,
        judul: "Evaluasi Bab 1: Bagian Tubuh Tumbuhan & Proses Fotosintesis",
        deskripsi: "Tugas review pemahaman sains mengenai fungsi akar, batang, daun, dan fotosintesis.",
        deadline: subDays(3),
        poin_maksimal: 100,
        durasi_menit: 30,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    const i1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasIPA.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Bagian tumbuhan yang berfungsi menyerap air dan zat hara dari dalam tanah adalah...",
        bobot_poin: 50,
        kunci_jawaban: "A",
        pembahasan: "Akar berfungsi menyerap air, mineral, serta memperkokoh berdirinya tumbuhan di tanah.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: i1.id, label: "A", teks_opsi: "Akar", is_benar: true, nomor_urut: 1 },
        { soal_id: i1.id, label: "B", teks_opsi: "Batang", is_benar: false, nomor_urut: 2 },
        { soal_id: i1.id, label: "C", teks_opsi: "Daun", is_benar: false, nomor_urut: 3 },
        { soal_id: i1.id, label: "D", teks_opsi: "Bunga", is_benar: false, nomor_urut: 4 },
      ],
    });

    const i2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasIPA.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Zat hijau daun yang berperan penting dalam proses fotosintesis disebut...",
        bobot_poin: 50,
        kunci_jawaban: "C",
        pembahasan: "Klorofil adalah zat pigmen hijau pada daun yang menyerap energi cahaya matahari.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: i2.id, label: "A", teks_opsi: "Stomata", is_benar: false, nomor_urut: 1 },
        { soal_id: i2.id, label: "B", teks_opsi: "Floem", is_benar: false, nomor_urut: 2 },
        { soal_id: i2.id, label: "C", teks_opsi: "Klorofil", is_benar: true, nomor_urut: 3 },
        { soal_id: i2.id, label: "D", teks_opsi: "Xilem", is_benar: false, nomor_urut: 4 },
      ],
    });

    // Submissions untuk IPAS
    if (siswaRayhan) {
      const subRayhanIPA = await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasIPA.id,
          siswa_id: siswaRayhan.id,
          status: "sudah_dinilai",
          mulai_mengerjakan_at: subDays(4),
          selesai_mengerjakan_at: new Date(subDays(4).getTime() + 10 * 60 * 1000),
          durasi_detik: 600,
          total_soal: 2,
          total_benar: 2,
          total_salah: 0,
          nilai_otomatis: 100,
          nilai: 100,
          catatan_guru: "Masya Allah ananda Rayhan, pemahaman konsep sains dasar sangat baik dan memuaskan!",
          graded_at: subDays(3),
          graded_by: defaultGuruId,
          submitted_at: new Date(subDays(4).getTime() + 10 * 60 * 1000),
          file_url: "interactive_cbt",
          file_name: "Pengerjaan Interaktif In-App",
          file_type: "interactive",
        },
      });
      await prisma.tugasJawabanSiswa.createMany({
        data: [
          { submission_id: subRayhanIPA.id, soal_id: i1.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 50 },
          { submission_id: subRayhanIPA.id, soal_id: i2.id, jawaban_siswa: "C", is_benar: true, poin_didapat: 50 },
        ],
      });
    }

    if (siswaUmar) {
      const subUmarIPA = await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasIPA.id,
          siswa_id: siswaUmar.id,
          status: "sudah_dinilai",
          mulai_mengerjakan_at: subDays(4),
          selesai_mengerjakan_at: new Date(subDays(4).getTime() + 15 * 60 * 1000),
          durasi_detik: 900,
          total_soal: 2,
          total_benar: 1,
          total_salah: 1,
          nilai_otomatis: 50,
          nilai: 50,
          catatan_guru: "Tetap semangat ananda Umar, pelajari kembali materi pigmen klorofil ya.",
          graded_at: subDays(3),
          graded_by: defaultGuruId,
          submitted_at: new Date(subDays(4).getTime() + 15 * 60 * 1000),
          file_url: "interactive_cbt",
          file_name: "Pengerjaan Interaktif In-App",
          file_type: "interactive",
        },
      });
      await prisma.tugasJawabanSiswa.createMany({
        data: [
          { submission_id: subUmarIPA.id, soal_id: i1.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 50 },
          { submission_id: subUmarIPA.id, soal_id: i2.id, jawaban_siswa: "A", is_benar: false, poin_didapat: 0 },
        ],
      });
    }

    console.log("✅ Tugas 6 IPAS Sains & Submissions berhasil dibuat.");
  }

  // -------------------------------------------------------------------------------------------------
  // TUGAS KELAS 5 (Sebagai tambahan demonstrasi multi-kelas)
  // -------------------------------------------------------------------------------------------------
  if (kelas5 && mapelMTK) {
    console.log("\n🎒 Menambahkan Tugas untuk Kelas 5 - Al Bukhari...");
    const tugasK5 = await prisma.tugas.create({
      data: {
        kelas_id: kelas5.id,
        mapel_id: mapelMTK.id,
        guru_id: defaultGuruId,
        judul: "Latihan Mandiri Kelas 5: Skala dan Denah Lokasi",
        deskripsi: "Menghitung jarak sebenarnya berdasarkan skala peta dengan benar.",
        deadline: addDays(8),
        poin_maksimal: 100,
        durasi_menit: 40,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        acak_soal: false,
        acak_opsi: false,
        tampilkan_nilai_instan: true,
      },
    });

    const k5_s1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasK5.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Jika skala sebuah peta adalah 1 : 100.000, maka jarak 1 cm pada peta mewakili jarak sebenarnya sejauh...",
        bobot_poin: 50,
        kunci_jawaban: "B",
        pembahasan: "100.000 cm = 1.000 m = 1 km.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: k5_s1.id, label: "A", teks_opsi: "100 meter", is_benar: false, nomor_urut: 1 },
        { soal_id: k5_s1.id, label: "B", teks_opsi: "1 kilometer", is_benar: true, nomor_urut: 2 },
        { soal_id: k5_s1.id, label: "C", teks_opsi: "10 kilometer", is_benar: false, nomor_urut: 3 },
        { soal_id: k5_s1.id, label: "D", teks_opsi: "100 kilometer", is_benar: false, nomor_urut: 4 },
      ],
    });

    const k5_s2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasK5.id,
        nomor_urut: 2,
        tipe_soal: "ISIAN_SINGKAT",
        pertanyaan: "Jarak kota A ke kota B pada peta adalah 5 cm dengan skala 1 : 200.000. Berapakah jarak sebenarnya dalam kilometer? (Tulis angka saja, contoh: 10)",
        bobot_poin: 50,
        kunci_jawaban: "10",
        pembahasan: "Jarak sebenarnya = 5 cm × 200.000 = 1.000.000 cm = 10 km.",
      },
    });

    console.log("✅ Tugas Kelas 5 berhasil dibuat.");
  }

  console.log("\n=========================================");
  console.log("🎉 Seeding Data Tugas Interaktif Selesai!");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Error saat menjalankan seed tugas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
