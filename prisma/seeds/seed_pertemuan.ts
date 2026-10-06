import prisma from "@/lib/prisma";

async function main() {
  console.log("=== SEEDING PERTEMUAN & MATERI KBM ===");

  const kelas4 = BigInt(1); // Kelas 4 - Mehmed Al Fatih
  const guruFatimah = BigInt(2); // Ustadzah Fatimah, S.Pd
  const guruMaryam = BigInt(4); // Ustadzah Maryam
  const guruIbrahim = BigInt(5); // Ustadz Ibrahim
  const guruAisyah = BigInt(6); // Ustadzah Aisyah
  const guruHasan = BigInt(7); // Ustadz Hasan
  const guruRidwan = BigInt(9); // Ustadz Ridwan
  const guruFaisal = BigInt(11); // Ustadz Faisal
  const guruAhmad = BigInt(3); // Ustadz Ahmad

  const newPertemuanData = [
    // -------------------------------------------------------------
    // MAPEL 5: BAHASA INDONESIA (BIND) - Guru: Ustadzah Fatimah (ID 2)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(5),
      guru_id: guruFatimah,
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
      kelas_id: kelas4,
      mapel_id: BigInt(5),
      guru_id: guruFatimah,
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
      kelas_id: kelas4,
      mapel_id: BigInt(5),
      guru_id: guruFatimah,
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
    // MAPEL 8: ILMU PENGETAHUAN SOSIAL (IPS) - Guru: Ustadzah Fatimah (ID 2)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(8),
      guru_id: guruFatimah,
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
      kelas_id: kelas4,
      mapel_id: BigInt(8),
      guru_id: guruFatimah,
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
    // MAPEL 7: IPA (SAINS) - Guru: Ustadz Ibrahim (ID 5)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(7),
      guru_id: guruIbrahim,
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
      kelas_id: kelas4,
      mapel_id: BigInt(7),
      guru_id: guruIbrahim,
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
    // MAPEL 4: ENGLISH BILINGUAL / CAMBRIDGE - Guru: Ustadzah Aisyah (ID 6)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(4),
      guru_id: guruAisyah,
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
      kelas_id: kelas4,
      mapel_id: BigInt(4),
      guru_id: guruAisyah,
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
    // MAPEL 9: INFORMATIKA & CODING - Guru: Ustadz Ridwan (ID 9)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(9),
      guru_id: guruRidwan,
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
      kelas_id: kelas4,
      mapel_id: BigInt(9),
      guru_id: guruRidwan,
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
    // MAPEL 3: BAHASA ARAB - Guru: Ustadz Ahmad (ID 3)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(3),
      guru_id: guruAhmad,
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
    // MAPEL 2: TAHFIDZ & TAHSIN - Guru: Ustadz Hasan (ID 7)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(2),
      guru_id: guruHasan,
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
    // MAPEL 10: PJOK - Guru: Ustadz Faisal (ID 11)
    // -------------------------------------------------------------
    {
      kelas_id: kelas4,
      mapel_id: BigInt(10),
      guru_id: guruFaisal,
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

  let addedCount = 0;
  for (const item of newPertemuanData) {
    // Periksa apakah pertemuan untuk kelas, mapel, dan pertemuan_ke ini sudah ada
    const existing = await (prisma as any).pertemuan.findFirst({
      where: {
        kelas_id: item.kelas_id,
        mapel_id: item.mapel_id,
        pertemuan_ke: item.pertemuan_ke,
      },
    });

    if (!existing) {
      await (prisma as any).pertemuan.create({
        data: item,
      });
      addedCount++;
      console.log(`[SUCCESS] Dibuat: Mapel ID ${item.mapel_id} - Pertemuan ${item.pertemuan_ke}: ${item.judul}`);
    } else {
      console.log(`[SKIP] Sudah ada: Mapel ID ${item.mapel_id} - Pertemuan ${item.pertemuan_ke}`);
    }
  }

  const totalNow = await (prisma as any).pertemuan.count();
  console.log(`\n=== SEED SELESAI ===`);
  console.log(`Berhasil menambahkan ${addedCount} pertemuan baru.`);
  console.log(`Total pertemuan di DB sekarang: ${totalNow}`);
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect());
