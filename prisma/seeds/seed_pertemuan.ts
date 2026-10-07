import prisma from "@/lib/prisma";

async function main() {
  console.log("=========================================");
  console.log("📚 Memulai Seeding Data Materi & Pertemuan KBM...");
  console.log("=========================================");

  // 1. Ambil Kelas Target (SD & SMP)
  const kelasSD = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Mehmed Al Fatih" } },
  });
  const kelasSMP = await prisma.kelas.findFirst({
    where: { nama_kelas: { contains: "Ibnu Sina" } },
  });

  if (!kelasSD) {
    console.error("❌ Kelas 4 - Mehmed Al Fatih tidak ditemukan. Jalankan seed utama terlebih dahulu.");
    return;
  }

  // 2. Ambil Data Guru
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

  // 3. Ambil Master Mata Pelajaran berdasarkan kode_mapel
  const mapelPAI = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PAI" } });
  const mapelTAHFIDZ = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "TAHFIDZ" } });
  const mapelBARAB = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BARAB" } });
  const mapelBING = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BING" } });
  const mapelBIND = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "BIND" } });
  const mapelMTK = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "MTK" } });
  const mapelIPA = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPA" } });
  const mapelIPS = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "IPS" } });
  const mapelINFOR = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "INFOR" } });
  const mapelPJOK = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: "PJOK" } });

  const rawPertemuanData: Array<{
    kelas_id: bigint;
    mapel_id?: bigint | null;
    guru_id: bigint;
    pertemuan_ke: number;
    judul: string;
    deskripsi: string;
    tanggal: Date;
    file_url?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    video_url?: string | null;
    link_eksternal?: string | null;
    is_published: boolean;
  }> = [
    // -------------------------------------------------------------
    // MAPEL 1: PAI & ADAB - Guru: Ustadzah Fatimah
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelPAI?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 1,
      judul: "Bab 1: Adab Islami Harian dan Tata Cara Thaharah Sesuai Sunnah",
      deskripsi: `Assalamu'alaikum Ananda sholeh dan sholehah Kelas 4.

Pada pertemuan perdana Pendidikan Agama Islam ini, kita mendalami:
1. Rukun wudhu dan kesempurnaan membasuh anggota thaharah.
2. Adab makan, minum, dan adab memasuki masjid sesuai teladan Rasulullah SAW.
3. Praktik doa harian sebelum dan sesudah beraktivitas.`,
      tanggal: new Date("2026-07-21"),
      file_url: "/uploads/materials/Modul_PAI_Thaharah_P1.pdf",
      file_name: "Modul_PAI_Thaharah_P1.pdf",
      file_size: 3200,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: "https://quran.com/",
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelPAI?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 2,
      judul: "Bab 2: Sholat Berjamaah & Meneladani Sifat Amanah Rasulullah SAW",
      deskripsi: `Materi pertemuan kedua PAI:
- Keutamaan sholat berjamaah di awal waktu (27 derajat pahala).
- Meneladani kejujuran dan sifat Al-Amin (dapat dipercaya) Rasulullah SAW sejak masa belia.
- Pembiasaan sholat dhuha dan dzuhur berjamaah di sekolah.`,
      tanggal: new Date("2026-07-28"),
      file_url: "/uploads/materials/Modul_PAI_Sholat_P2.pdf",
      file_name: "Modul_PAI_Sholat_P2.pdf",
      file_size: 4100,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: null,
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 2: BAHASA INDONESIA (BIND) - Guru: Ustadzah Fatimah
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelBIND?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 1,
      judul: "Bab 1: Menemukan Ide Pokok dan Gagasan Pendukung dalam Teks Deskripsi",
      deskripsi: `Assalamu'alaikum Ananda sholeh dan sholehah Kelas 4.

Pada pertemuan perdana Bahasa Indonesia pekan ini, kita mendalami:
1. Perbedaan mendasar antara gagasan pokok (kalimat utama) dan gagasan pendukung (penjelas).
2. Membaca kritis teks bacaan deskriptif tentang keindahan alam nusantara.
3. Menulis ringkasan menggunakan kosakata baku sesuai kaidah KBBI.

Silakan unduh dokumen modul KBM terlampir untuk rangkuman intisari materi dan pelajari slide PowerPoint-nya.`,
      tanggal: new Date("2026-07-21"),
      file_url: "/uploads/materials/Modul_BIndo_IdePokok_Pertemuan1.pdf",
      file_name: "Modul_BIndo_IdePokok_Pertemuan1.pdf",
      file_size: 3820,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: "https://kbbi.kemdikbud.go.id/",
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelBIND?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 2,
      judul: "Bab 1: Mengidentifikasi Paragraf Narasi dan Penggunaan Kata Hubung (Konjungsi)",
      deskripsi: `Pada pertemuan kedua, kita belajar:
- Mengenal alur narasi kronologis (awal, klimaks, penyelesaian).
- Memilih kata hubung antar kalimat (seperti: selanjutnya, kemudian, meskipun demikian).
- Praktik mandiri menyusun paragraf cerita pengalaman liburan yang inspiratif.`,
      tanggal: new Date("2026-07-28"),
      file_url: "/uploads/materials/Modul_BIndo_Konjungsi_Pertemuan2.pdf",
      file_name: "Modul_BIndo_Konjungsi_Pertemuan2.pdf",
      file_size: 4120,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: null,
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelBIND?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 3,
      judul: "Bab 2: Menyimak Cerita Rakyat & Menyampaikan Nilai-Nilai Budi Pekerti",
      deskripsi: `Materi pekan ketiga berfokus pada kemampuan literasi menyimak:
- Menganalisis tokoh, watak, dan latar cerita rakyat Malin Kundang & Danau Toba.
- Mengambil hikmah berbakti kepada orang tua (birrul walidain).
- Berani bercerita di depan kelas dengan intonasi dan artikulasi yang percaya diri.`,
      tanggal: new Date("2026-08-04"),
      file_url: null,
      file_name: null,
      file_size: null,
      file_type: null,
      video_url: "https://www.youtube.com/watch?v=77k-ugH5yF0",
      link_eksternal: null,
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 3: MATEMATIKA (MTK) - Guru: Ustadzah Maryam
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelMTK?.id,
      guru_id: guruMaryam.id,
      pertemuan_ke: 1,
      judul: "Bab 1: Konsep Pecahan Senilai & Menyederhanakan Pecahan",
      deskripsi: `Materi KBM Matematika Kelas 4:
1. Memahami pecahan senilai menggunakan model gambar visual dan garis bilangan.
2. Menyederhanakan pecahan dengan mencari FPB (Faktor Persekutuan Terbesar).
3. Latihan soal cerita terapan dalam kehidupan sehari-hari.`,
      tanggal: new Date("2026-07-22"),
      file_url: "/uploads/materials/Modul_Matematika_Pecahan_P1.pdf",
      file_name: "Modul_Matematika_Pecahan_P1.pdf",
      file_size: 4500,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: null,
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelMTK?.id,
      guru_id: guruMaryam.id,
      pertemuan_ke: 2,
      judul: "Bab 1: Operasi Penjumlahan & Pengurangan Pecahan Berpenyebut Sama dan Berbeda",
      deskripsi: `Pertemuan kedua Matematika:
- Mengoperasikan penjumlahan dan pengurangan pecahan biasa dan pecahan campuran.
- Menyamakan penyebut menggunakan KPK (Kelipatan Persekutuan Terkecil).
- Trik cepat auto-grading latihan interaktif di iPad.`,
      tanggal: new Date("2026-07-29"),
      file_url: null,
      file_name: null,
      file_size: null,
      file_type: null,
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: null,
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 4: ILMU PENGETAHUAN SOSIAL (IPS) - Guru: Ustadzah Fatimah
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelIPS?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 1,
      judul: "Bab 1: Kenampakan Alam (Daratan & Perairan) serta Pemanfaatan Sumber Daya Alam",
      deskripsi: `Assalamu'alaikum Ananda sekalian.
Pada bab pertama IPS ini, kita mempelajari:
1. Bentang alam daratan: dataran tinggi, dataran rendah, pegunungan, dan lembah.
2. Bentang alam perairan: sungai, danau, rawa, selat, dan samudra.
3. Bagaimana masyarakat memanfaatkan sumber daya alam terbarukan dan tidak terbarukan untuk kesejahteraan hidup.`,
      tanggal: new Date("2026-07-22"),
      file_url: "/uploads/materials/Modul_IPS_KenampakanAlam_P1.pdf",
      file_name: "Modul_IPS_KenampakanAlam_P1.pdf",
      file_size: 5200,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: null,
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelIPS?.id,
      guru_id: guruSD.id,
      pertemuan_ke: 2,
      judul: "Bab 1: Keragaman Budaya, Adat Istiadat, dan Kearifan Lokal di Nusantara",
      deskripsi: `Pekan ini kita mengenal kekayaan ragam budaya nusantara:
- Rumah adat, pakaian adat, dan alat musik tradisional dari Sabang sampai Merauke.
- Mengamalkan semboyan Bhinneka Tunggal Ika dalam pertemanan sehari-hari.
- Menjaga kerukunan dan saling menghormati tradisi daerah lain.`,
      tanggal: new Date("2026-07-29"),
      file_url: "/uploads/materials/Modul_IPS_BudayaNusantara_P2.pdf",
      file_name: "Modul_IPS_BudayaNusantara_P2.pdf",
      file_size: 4890,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: "https://kebudayaan.kemdikbud.go.id/",
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 5: IPA (SAINS) - Guru: Ustadz Ibrahim
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelIPA?.id,
      guru_id: guruIbrahim.id,
      pertemuan_ke: 1,
      judul: "Bab 1: Morfologi Tumbuhan: Bagian Tubuh dan Fungsinya bagi Kehidupan",
      deskripsi: `Eksplorasi sains seru pekan ini:
- Mengamati struktur akar tunggang vs akar serabut di kebun sekolah.
- Menjelaskan fungsi daun dalam proses fotosintesis dan klorofil.
- Simulasi transportasi zat hara dan air melalui pembuluh xilem dan floem.`,
      tanggal: new Date("2026-07-23"),
      file_url: "/uploads/materials/Modul_Sains_Tumbuhan_P1.pdf",
      file_name: "Modul_Sains_Tumbuhan_P1.pdf",
      file_size: 6100,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: null,
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelIPA?.id,
      guru_id: guruIbrahim.id,
      pertemuan_ke: 2,
      judul: "Bab 2: Metamorfosis Hewan: Siklus Hidup Sempurna vs Tidak Sempurna",
      deskripsi: `Materi sains pekan ini membahas tahapan hidup makhluk hidup:
- Perbedaan metamorfosis sempurna (kupu-kupu, nyamuk, katak) dan tidak sempurna (belalang, kecoa).
- Menghargai daur kehidupan dan keseimbangan ekosistem rantai makanan ciptaan Allah SWT.`,
      tanggal: new Date("2026-07-30"),
      file_url: null,
      file_name: null,
      file_size: null,
      file_type: null,
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: null,
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 6: ENGLISH CAMBRIDGE - Guru: Ustadzah Aisyah
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelBING?.id,
      guru_id: guruAisyah.id,
      pertemuan_ke: 1,
      judul: "Unit 1: Welcoming Session & Self Introduction in Cambridge English",
      deskripsi: `Hello Smart Kids of Grade 4!
In this first session of Cambridge English:
1. Practice proper greetings & respectful introductions.
2. Master Question Words: What, Where, When, and How.
3. Vocabulary drill: School supplies, hobbies, and favorite subjects.`,
      tanggal: new Date("2026-07-24"),
      file_url: "/uploads/materials/Cambridge_Grade4_Unit1.pdf",
      file_name: "Cambridge_Grade4_Unit1.pdf",
      file_size: 5400,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: "https://www.cambridgeenglish.org/",
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelBING?.id,
      guru_id: guruAisyah.id,
      pertemuan_ke: 2,
      judul: "Unit 2: My Daily Routine & Telling the Time with Simple Present Tense",
      deskripsi: `Continuing Unit 2:
- Talking about what you do in the morning, afternoon, and night.
- Using 'always', 'usually', 'sometimes', and 'never' (adverbs of frequency).
- Reading a short story about an energetic student's daily life.`,
      tanggal: new Date("2026-07-31"),
      file_url: null,
      file_name: null,
      file_size: null,
      file_type: null,
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: null,
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 7: INFORMATIKA & CODING - Guru: Ustadz Ridwan
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelINFOR?.id,
      guru_id: guruRidwan.id,
      pertemuan_ke: 1,
      judul: "Modul 1: Literasi Digital iPad & Tata Tertib Penggunaan Perangkat Pembelajaran",
      deskripsi: `Bismillahirrohmanirrohim.
Pertemuan pertama Informatika:
- Mengenal fungsi dasar iPad Al-Azhar untuk sarana belajar islami.
- Manajemen berkas digital di Files & Google Drive siswa.
- Keamanan siber dasar: menjaga kerahasiaan kata sandi dan adab berselancar internet.`,
      tanggal: new Date("2026-07-24"),
      file_url: "/uploads/materials/Modul_Informatika_iPad_P1.pdf",
      file_name: "Modul_Informatika_iPad_P1.pdf",
      file_size: 4700,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: null,
      is_published: true,
    },
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelINFOR?.id,
      guru_id: guruRidwan.id,
      pertemuan_ke: 2,
      judul: "Modul 2: Berpikir Komputasional (Algoritma & Pemrograman Visual Sederhana)",
      deskripsi: `Sesi kedua coding dasar:
- Memahami konsep algoritma: langkah-langkah terurut menyelesaikan masalah.
- Praktik menyusun puzzle logika coding berbasis blok visual (Scratch Junior / Swift Playgrounds).`,
      tanggal: new Date("2026-07-31"),
      file_url: null,
      file_name: null,
      file_size: null,
      file_type: null,
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: "https://scratch.mit.edu/",
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 8: BAHASA ARAB - Guru: Ustadz Ahmad
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelBARAB?.id,
      guru_id: guruAhmad.id,
      pertemuan_ke: 1,
      judul: "Ad-Darsul Awwal: Fil Fashli (Kosa Kata & Percakapan di Dalam Kelas)",
      deskripsi: `Ahlan wa sahlan ya tholabah!
Materi pekan pertama Bahasa Arab:
- Menghafal 10 mufrodat benda-benda di ruang kelas (qolamun, kitaabun, sabburotun, maktabun, dll).
- Penerapan kata tunjuk: Hadza (mudzakkar) dan Hadzihi (muannats).
- Percakapan singkat bertanya letak barang.`,
      tanggal: new Date("2026-07-21"),
      file_url: "/uploads/materials/Modul_BArab_FilFashli_P1.pdf",
      file_name: "Modul_BArab_FilFashli_P1.pdf",
      file_size: 3600,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: null,
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 9: TAHFIDZ & TAHSIN - Guru: Ustadz Hasan
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelTAHFIDZ?.id,
      guru_id: guruHasan.id,
      pertemuan_ke: 1,
      judul: "Tahsin Surat Al-Fajr (Ayat 1-15): Makharijul Huruf dan Penerapan Mad Thabi'i",
      deskripsi: `Assalamu'alaikum ananda penghafal Al-Qur'an.
Fokus materi KBM Tahfidz pekan ini:
1. Memperbaiki makhraj huruf tipis dan tebal pada Surat Al-Fajr.
2. Memperhatikan panjang ketukan mad thabi'i 2 harakat secara istiqomah.
3. Menyimak video murottal Syaikh Misyari Rasyid sebagai pedoman hafalan di rumah.`,
      tanggal: new Date("2026-07-22"),
      file_url: "/uploads/materials/Panduan_Tahfidz_AlFajr.pdf",
      file_name: "Panduan_Tahfidz_AlFajr.pdf",
      file_size: 2900,
      file_type: "pdf",
      video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
      link_eksternal: "https://quran.com/89",
      is_published: true,
    },

    // -------------------------------------------------------------
    // MAPEL 10: PJOK - Guru: Ustadz Faisal
    // -------------------------------------------------------------
    {
      kelas_id: kelasSD.id,
      mapel_id: mapelPJOK?.id,
      guru_id: guruFaisal.id,
      pertemuan_ke: 1,
      judul: "Unit 1: Kombinasi Gerak Dasar Lokomotor, Non-Lokomotor, dan Manipulatif",
      deskripsi: `Materi KBM PJOK:
- Pengenalan gerak lari zig-zag, melompat rintangan, dan melempar bola kecil.
- Pemanasan dinamis untuk melatih kelenturan otot dan sendi.
- Adab berolahraga dalam Islam: menjaga aurat, sportivitas, dan minum sambil duduk setelah berolahraga.`,
      tanggal: new Date("2026-07-24"),
      file_url: null,
      file_name: null,
      file_size: null,
      file_type: null,
      video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
      link_eksternal: null,
      is_published: true,
    },
  ];

  // Tambahkan materi untuk SMP jika kelas 7 ada
  if (kelasSMP) {
    if (mapelMTK) {
      rawPertemuanData.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 1,
        judul: "Bab 1: Bilangan Bulat dan Bilangan Rasional dalam Kehidupan Nyata",
        deskripsi: `KBM Matematika Kelas 7 SMP:
1. Memahami konsep bilangan bulat positif dan negatif pada garis bilangan.
2. Aturan operasi hitung campuran (tanda kurung, perkalian/pembagian, penjumlahan/pengurangan).
3. Pemodelan masalah kontekstual: perubahan suhu dan pergerakan ketinggian kapal selam.`,
        tanggal: new Date("2026-07-21"),
        file_url: "/uploads/materials/Modul_SMP_MTK_Bilangan_P1.pdf",
        file_name: "Modul_SMP_MTK_Bilangan_P1.pdf",
        file_size: 4200,
        file_type: "pdf",
        video_url: "https://www.youtube.com/watch?v=kYJqB3N_U38",
        link_eksternal: null,
        is_published: true,
      });
    }

    if (mapelBING) {
      rawPertemuanData.push({
        kelas_id: kelasSMP.id,
        mapel_id: mapelBING.id,
        guru_id: guruAisyah.id,
        pertemuan_ke: 1,
        judul: "Unit 1: Teen Life & Hobbies (Present Simple vs Continuous)",
        deskripsi: `English Grade 7 Cambridge:
- Distinguishing between regular daily routines and actions happening now.
- Paragraph writing about personal interests and extracurricular activities.`,
        tanggal: new Date("2026-07-22"),
        file_url: "/uploads/materials/Cambridge_SMP_Grade7_Unit1.pdf",
        file_name: "Cambridge_SMP_Grade7_Unit1.pdf",
        file_size: 4800,
        file_type: "pdf",
        video_url: "https://www.youtube.com/watch?v=52Zkxm21u6I",
        link_eksternal: null,
        is_published: true,
      });
    }
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of rawPertemuanData) {
    if (!item.mapel_id) continue;

    const existing = await prisma.pertemuan.findFirst({
      where: {
        kelas_id: item.kelas_id,
        mapel_id: item.mapel_id,
        pertemuan_ke: item.pertemuan_ke,
      },
    });

    if (!existing) {
      await prisma.pertemuan.create({
        data: {
          kelas_id: item.kelas_id,
          mapel_id: item.mapel_id,
          guru_id: item.guru_id,
          pertemuan_ke: item.pertemuan_ke,
          judul: item.judul,
          deskripsi: item.deskripsi,
          tanggal: item.tanggal,
          file_url: item.file_url,
          file_name: item.file_name,
          file_size: item.file_size,
          file_type: item.file_type,
          video_url: item.video_url,
          link_eksternal: item.link_eksternal,
          is_published: item.is_published,
        },
      });
      addedCount++;
      console.log(`[BARU] Pertemuan ${item.pertemuan_ke}: ${item.judul}`);
    } else {
      await prisma.pertemuan.update({
        where: { id: existing.id },
        data: {
          guru_id: item.guru_id,
          judul: item.judul,
          deskripsi: item.deskripsi,
          tanggal: item.tanggal,
          file_url: item.file_url ?? existing.file_url,
          file_name: item.file_name ?? existing.file_name,
          video_url: item.video_url ?? existing.video_url,
          link_eksternal: item.link_eksternal ?? existing.link_eksternal,
        },
      });
      updatedCount++;
      console.log(`[UPDATE] Pertemuan ${item.pertemuan_ke}: ${item.judul}`);
    }
  }

  const totalNow = await prisma.pertemuan.count();
  console.log(`\n=========================================`);
  console.log(`🎉 Seeding Materi & Pertemuan Selesai!`);
  console.log(`- Berhasil ditambahkan: ${addedCount}`);
  console.log(`- Berhasil diperbarui : ${updatedCount}`);
  console.log(`- Total materi di DB  : ${totalNow}`);
  console.log(`=========================================`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat menjalankan seed materi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
