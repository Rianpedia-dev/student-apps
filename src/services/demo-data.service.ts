import prisma from "@/lib/prisma";
import { SystemSettingService } from "./system-setting.service";
import bcrypt from "bcryptjs";

export const DEMO_EMAILS = {
  GURU_SD: "guru.sd@gmail.com",
  WALAS_SD: "walas.sd@gmail.com",
  GURU_SMP: "guru.smp@gmail.com",
  WALAS_SMP: "walas.smp@gmail.com",
  GURU_LINTAS: "guru.lintas@gmail.com",
  SISWA_SD: "siswa.sd@gmail.com",
  SISWA_SMP: "siswa.smp@gmail.com",
} as const;

export interface DemoStats {
  isActive: boolean;
  totalJadwal: number;
  totalPertemuan: number;
  totalTugas: number;
  totalSubmissions: number;
  totalAbsensi: number;
  totalPrestasi: number;
  totalChat: number;
}

export class DemoDataService {
  /**
   * Cek apakah status data demo sedang aktif di pengaturan sistem
   */
  static async isDemoDataActive(): Promise<boolean> {
    return await SystemSettingService.getBoolean("ENABLE_DEMO_DATA", true);
  }

  /**
   * Mengambil statistik jumlah record data contoh akun demo saat ini di database
   */
  static async getDemoDataStats(): Promise<DemoStats> {
    const emails = Object.values(DEMO_EMAILS);
    const demoUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });

    const userIds = demoUsers.map((u) => u.id);
    const teacherIds = demoUsers
      .filter((u) => u.email.includes("guru") || u.email.includes("walas"))
      .map((u) => u.id);
    const studentIds = demoUsers
      .filter((u) => u.email.includes("siswa"))
      .map((u) => u.id);
    const studentIdStrs = studentIds.map((id) => id.toString());

    if (userIds.length === 0) {
      return {
        isActive: false,
        totalJadwal: 0,
        totalPertemuan: 0,
        totalTugas: 0,
        totalSubmissions: 0,
        totalAbsensi: 0,
        totalPrestasi: 0,
        totalChat: 0,
      };
    }

    const [
      isActiveSetting,
      totalJadwal,
      totalPertemuan,
      totalTugas,
      totalSubmissions,
      totalAbsensi,
      totalPrestasi,
      totalChat,
    ] = await Promise.all([
      this.isDemoDataActive(),
      prisma.jadwalPelajaran.count({
        where: { guru_id: { in: teacherIds } },
      }),
      prisma.pertemuan.count({
        where: { guru_id: { in: teacherIds } },
      }),
      prisma.tugas.count({
        where: { guru_id: { in: teacherIds } },
      }),
      prisma.tugasSubmission.count({
        where: {
          OR: [
            { siswa_id: { in: studentIds } },
            { tugas: { guru_id: { in: teacherIds } } },
          ],
        },
      }),
      prisma.absen.count({
        where: {
          OR: [
            { guru_id: { in: teacherIds } },
            { user_id: { in: studentIds } },
          ],
        },
      }),
      prisma.prestasi.count({
        where: { id_user: { in: studentIdStrs } },
      }),
      prisma.chatMessage.count({
        where: { sender_id: { in: userIds } },
      }),
    ]);

    const hasData = totalJadwal > 0 || totalTugas > 0 || totalPertemuan > 0;

    return {
      isActive: isActiveSetting && hasData,
      totalJadwal,
      totalPertemuan,
      totalTugas,
      totalSubmissions,
      totalAbsensi,
      totalPrestasi,
      totalChat,
    };
  }

  /**
   * Menyiapkan & mengisikan seluruh data contoh (sample data) ke akun demo:
   * 1. Guru SD, Walas SD, Guru SMP, Walas SMP, Guru Lintas
   * 2. Siswa SD & Siswa SMP
   * Mencakup: Jadwal KBM, Pertemuan/Materi, Tugas Interaktif, Jawaban & Nilai, Presensi 14 Hari, Prestasi, dan Chat.
   */
  static async seedDemoDashboardData(): Promise<{ success: boolean; message: string; count: any }> {
    console.log("🚀 [DemoDataService] Memulai pengisian data contoh akun demo...");

    // 1. Bersihkan data demo lama terlebih dahulu untuk mencegah duplikasi (idempotent)
    await this.clearDemoDashboardDataInternal();

    // 2. Pastikan 7 akun demo ada dengan konfigurasi kelas dan profil yang tepat
    const hashGuru = await bcrypt.hash("guru123", 10);
    const hashSiswa = await bcrypt.hash("siswa123", 10);

    const demoUsersDefinitions = [
      {
        name: "Ustadzah Nurul, S.Pd",
        email: DEMO_EMAILS.GURU_SD,
        password: hashGuru,
        password1: null,
        status: "2", // Guru Mapel
        jenjang: "SD",
        gender: "P",
        nip: "198902142013012003",
        guru_bidang: "Tematik & IPAS SD",
        address: "Jl. Kolonel H. Barlian, Palembang",
        notes: "Akun Demo Guru Mapel SD",
      },
      {
        name: "Ustadzah Fatimah, S.Pd",
        email: DEMO_EMAILS.WALAS_SD,
        password: hashGuru,
        password1: null,
        status: "4", // Guru + Walas
        jenjang: "SD",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        gender: "P",
        nip: "198501152010012001",
        guru_bidang: "Pendidikan Agama Islam",
        address: "Jl. Kolonel H. Barlian KM 6.5, Palembang",
        notes: "Akun Demo Guru & Wali Kelas SD",
      },
      {
        name: "Ustadz Wildan, M.Pd",
        email: DEMO_EMAILS.GURU_SMP,
        password: hashGuru,
        password1: null,
        status: "2",
        jenjang: "SMP",
        gender: "L",
        nip: "198604182012011002",
        guru_bidang: "Matematika SMP",
        address: "Jl. Demang Lebar Daun, Palembang",
        notes: "Akun Demo Guru Mapel SMP",
      },
      {
        name: "Ustadz Farhan, S.Pd",
        email: DEMO_EMAILS.WALAS_SMP,
        password: hashGuru,
        password1: null,
        status: "4",
        jenjang: "SMP",
        kelas: "Kelas 7 - Khalid bin Walid",
        gender: "L",
        nip: "198703122011011005",
        guru_bidang: "Bahasa Inggris SMP",
        address: "Jl. Mayor Ruslan, Palembang",
        notes: "Akun Demo Guru & Wali Kelas SMP",
      },
      {
        name: "Ustadz Ahmad, S.Pd.I",
        email: DEMO_EMAILS.GURU_LINTAS,
        password: hashGuru,
        password1: null,
        status: "2",
        jenjang: "ALL",
        gender: "L",
        nip: "198603202011011002",
        guru_bidang: "Bahasa Arab (SD & SMP)",
        address: "Jl. Sudirman, Palembang",
        notes: "Akun Demo Guru Lintas Jenjang (SD & SMP)",
      },
      {
        name: "Muhammad Rayhan Al-Fatih",
        email: DEMO_EMAILS.SISWA_SD,
        password: hashSiswa,
        password1: null,
        status: "1",
        jenjang: "SD",
        gender: "L",
        nis: "202404001",
        kelas: "Kelas 4 - Mehmed Al Fatih",
        appleid: "rayhan.sd@icloud.com",
        passwordappleid: "AppleSiswa123!",
        point: "95",
        address: "Jl. Jenderal Sudirman No. 45, Palembang",
        skills: "Tahfidz Juz 30, Robotika, Sains",
        notes: "Akun Demo Siswa SD",
      },
      {
        name: "Haidar Ali SMP",
        email: DEMO_EMAILS.SISWA_SMP,
        password: hashSiswa,
        password1: null,
        status: "1",
        jenjang: "SMP",
        gender: "L",
        nis: "202407001",
        kelas: "Kelas 7 - Khalid bin Walid",
        appleid: "haidar.smp@icloud.com",
        passwordappleid: "AppleSiswa123!",
        point: "92",
        address: "Jl. Demang Lebar Daun, Palembang",
        skills: "Olimpiade Bahasa Inggris & Matematika",
        notes: "Akun Demo Siswa SMP",
      },
    ];

    const usersMap = new Map<string, any>();
    for (const def of demoUsersDefinitions) {
      const u = await prisma.user.upsert({
        where: { email: def.email },
        update: {
          name: def.name,
          status: def.status,
          jenjang: def.jenjang,
          kelas: def.kelas ?? null,
          gender: def.gender,
          guru_bidang: def.guru_bidang ?? null,
          nip: def.nip ?? null,
          nis: def.nis ?? null,
          point: def.point ?? null,
          notes: def.notes,
        },
        create: def,
      });
      usersMap.set(def.email, u);
    }

    const guruSD = usersMap.get(DEMO_EMAILS.GURU_SD)!;
    const walasSD = usersMap.get(DEMO_EMAILS.WALAS_SD)!;
    const guruSMP = usersMap.get(DEMO_EMAILS.GURU_SMP)!;
    const walasSMP = usersMap.get(DEMO_EMAILS.WALAS_SMP)!;
    const guruLintas = usersMap.get(DEMO_EMAILS.GURU_LINTAS)!;
    const siswaSD = usersMap.get(DEMO_EMAILS.SISWA_SD)!;
    const siswaSMP = usersMap.get(DEMO_EMAILS.SISWA_SMP)!;

    // 3. Ambil Kelas Target SD & SMP
    const kelasSD = await prisma.kelas.findFirst({
      where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" },
    });
    const kelasSMP = await prisma.kelas.findFirst({
      where: { nama_kelas: "Kelas 7 - Khalid bin Walid" },
    });

    if (!kelasSD || !kelasSMP) {
      throw new Error("Kelas target (Kelas 4 SD atau Kelas 7 SMP) tidak ditemukan di tbl_kelas.");
    }

    // 4. Ambil Master Mata Pelajaran
    const mapels = await prisma.mataPelajaran.findMany();
    const mapelByKode = new Map(mapels.map((m) => [m.kode_mapel.toUpperCase(), m]));

    const mapelPAI = mapelByKode.get("PAI") || mapels[0];
    const mapelIPAS = mapelByKode.get("IPS") || mapelByKode.get("IPA") || mapels[0];
    const mapelBIN = mapelByKode.get("BIN") || mapels[0];
    const mapelARB = mapelByKode.get("ARB") || mapels[0];
    const mapelALQ = mapelByKode.get("ALQ") || mapels[0];
    const mapelMTK = mapelByKode.get("MTK") || mapels[0];
    const mapelENG = mapelByKode.get("ENG") || mapels[0];
    const mapelIPA = mapelByKode.get("IPA") || mapels[0];

    // 5. SEED JADWAL PELAJARAN (KBM)
    console.log("📅 Menyiapkan Jadwal Pelajaran Demo...");
    const jadwalItems = [
      // --- SD: Kelas 4 - Mehmed Al Fatih ---
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        hari: "Senin",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        hari: "Senin",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        hari: "Selasa",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelBIN.id,
        guru_id: guruSD.id,
        hari: "Selasa",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelALQ.id,
        guru_id: guruLintas.id,
        hari: "Rabu",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        hari: "Kamis",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        hari: "Jumat",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },

      // --- SMP: Kelas 7 - Khalid bin Walid ---
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        hari: "Senin",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        hari: "Senin",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelIPA.id,
        guru_id: guruSMP.id,
        hari: "Selasa",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        hari: "Rabu",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        hari: "Rabu",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        hari: "Kamis",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        hari: "Kamis",
        jam_mulai: "09:30",
        jam_selesai: "11:00",
      },
    ];

    const createdJadwal = [];
    for (const j of jadwalItems) {
      const created = await prisma.jadwalPelajaran.create({ data: j });
      createdJadwal.push(created);
    }

    // 6. SEED PERTEMUAN / MODUL MATERI KBM
    console.log("📚 Menyiapkan Modul & Pertemuan KBM...");
    const now = new Date();
    const pertemuanList = [
      // IPAS SD (Guru SD)
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        pertemuan_ke: 1,
        judul: "Ekosistem & Rantai Makanan Makhluk Hidup",
        deskripsi:
          "Pembahasan mengenai interaksi antara makhluk hidup (biotik) dan lingkungannya (abiotik), serta peranan produsen, konsumen, dan pengurai.",
        tanggal: new Date(now.getTime() - 7 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Modul_IPAS_Ekosistem_Kelas4.pdf",
        file_size: 1420000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=b4wS9W10O1M",
        is_published: true,
      },
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        pertemuan_ke: 2,
        judul: "Wujud Benda & Perubahannya di Sekitar Kita",
        deskripsi:
          "Mempelajari 3 wujud benda (padat, cair, gas) serta peristiwa mencair, membeku, menguap, mengembun, menyublim, dan mengkristal.",
        tanggal: new Date(now.getTime() - 3 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Lembar_Kerja_Wujud_Benda.pdf",
        file_size: 850000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=kYI6j2e8ZzY",
        is_published: true,
      },
      // PAI SD (Walas SD)
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        pertemuan_ke: 1,
        judul: "Kisah Teladan Rasulullah SAW dan Para Sahabat",
        deskripsi:
          "Mempelajari sifat-sifat mulia Nabi Muhammad SAW: Shiddiq, Amanah, Tabligh, dan Fathonah serta keteladanan Khulafaur Rasyidin.",
        tanggal: new Date(now.getTime() - 6 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Sirah_Nabawiyyah_Ringkas.pdf",
        file_size: 1100000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=QZ0B87Q3c_0",
        is_published: true,
      },
      // Bahasa Arab SD (Guru Lintas)
      {
        kelas_id: kelasSD.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        pertemuan_ke: 1,
        judul: "At-Ta'aruf (Perkenalan & Kosa Kata Perlengkapan Kelas)",
        deskripsi:
          "Pengenalan ucapan salam, menanyakan kabar, serta mufradat seputar buku (kitabun), pena (qolamun), dan meja (maktabun).",
        tanggal: new Date(now.getTime() - 5 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Mufradat_Arab_Dasar.pdf",
        file_size: 780000,
        file_type: "application/pdf",
        is_published: true,
      },
      // Matematika SMP (Guru SMP)
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 1,
        judul: "Mengenal Aljabar: Variabel, Koefisien, dan Suku Sejenis",
        deskripsi:
          "Konsep dasar bentuk aljabar, penjumlahan dan pengurangan bentuk aljabar sederhana serta aplikasinya dalam pemecahan masalah.",
        tanggal: new Date(now.getTime() - 7 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Aljabar_Dasar_SMP_Kelas7.pdf",
        file_size: 1950000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=NybHckSEQBI",
        is_published: true,
      },
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 2,
        judul: "Persamaan Linier Satu Variabel (PLSV)",
        deskripsi:
          "Menemukan himpunan penyelesaian persamaan linear satu variabel menggunakan sifat-sifat kesetaraan aljabar.",
        tanggal: new Date(now.getTime() - 2 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Latihan_PLSV_Terbimbing.pdf",
        file_size: 920000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=NybHckSEQBI",
        is_published: true,
      },
      // Bahasa Inggris SMP (Walas SMP)
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        pertemuan_ke: 1,
        judul: "Unit 1: Self-Introduction and Greetings in Formal Context",
        deskripsi:
          "How to introduce yourself confidently, talk about hobbies, origins, and family in English with proper pronunciation.",
        tanggal: new Date(now.getTime() - 6 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "English_Grade7_Unit1.pdf",
        file_size: 1250000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=d_2XJq9p7sA",
        is_published: true,
      },
      // Bahasa Arab SMP (Guru Lintas)
      {
        kelas_id: kelasSMP.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        pertemuan_ke: 1,
        judul: "Qawa'id Al-Lughah: Pembagian Kalimat (Isim, Fi'il, Huruf)",
        deskripsi:
          "Memahami ciri-ciri isim (kata benda), tanda-tanda fi'il (kata kerja), serta penggunaan huruf jar dalam kalimat bahasa Arab.",
        tanggal: new Date(now.getTime() - 4 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Qawaid_Bahasa_Arab_Kelas7.pdf",
        file_size: 1600000,
        file_type: "application/pdf",
        is_published: true,
      },
    ];

    const createdPertemuan = [];
    for (const p of pertemuanList) {
      const item = await prisma.pertemuan.create({ data: p });
      createdPertemuan.push(item);
    }

    // Progress pertemuan untuk siswa demo
    await prisma.pertemuanProgress.createMany({
      data: [
        {
          pertemuan_id: createdPertemuan[0].id,
          siswa_id: siswaSD.id,
          is_completed: true,
          completed_at: new Date(now.getTime() - 5 * 86400000),
        },
        {
          pertemuan_id: createdPertemuan[2].id,
          siswa_id: siswaSD.id,
          is_completed: true,
          completed_at: new Date(now.getTime() - 4 * 86400000),
        },
        {
          pertemuan_id: createdPertemuan[4].id,
          siswa_id: siswaSMP.id,
          is_completed: true,
          completed_at: new Date(now.getTime() - 5 * 86400000),
        },
        {
          pertemuan_id: createdPertemuan[6].id,
          siswa_id: siswaSMP.id,
          is_completed: true,
          completed_at: new Date(now.getTime() - 4 * 86400000),
        },
      ],
    });

    // 7. SEED TUGAS INTERAKTIF DENGAN SOAL & OPSI
    console.log("📝 Menyiapkan Tugas Interaktif & Soal-Soal...");

    // --- Tugas 1: Kuis IPAS SD (Guru SD) ---
    const tugasIPAS = await prisma.tugas.create({
      data: {
        kelas_id: kelasSD.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        judul: "Kuis Interaktif IPAS: Ekosistem & Siklus Hidup",
        deskripsi:
          "Kerjakan kuis pilihan ganda dan satu pertanyaan uraian berikut dengan cermat untuk menguji pemahaman materi ekosistem.",
        deadline: new Date(now.getTime() + 5 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 30,
        tampilkan_nilai_instan: true,
        pertemuan_id: createdPertemuan[0].id,
      },
    });

    const soalIPAS1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasIPAS.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Makhluk hidup yang berperan sebagai produsen dalam ekosistem darat adalah...",
        bobot_poin: 20,
        kunci_jawaban: "A",
        pembahasan: "Tumbuhan hijau mampu menghasilkan makanannya sendiri melalui fotosintesis, sehingga disebut produsen.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalIPAS1.id, label: "A", teks_opsi: "Tumbuhan hijau / Rumput", is_benar: true, nomor_urut: 1 },
        { soal_id: soalIPAS1.id, label: "B", teks_opsi: "Kelinci padang rumput", is_benar: false, nomor_urut: 2 },
        { soal_id: soalIPAS1.id, label: "C", teks_opsi: "Burung elang pemangsa", is_benar: false, nomor_urut: 3 },
        { soal_id: soalIPAS1.id, label: "D", teks_opsi: "Jamur pengurai", is_benar: false, nomor_urut: 4 },
      ],
    });

    const soalIPAS2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasIPAS.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Hubungan simbiosis mutualisme terjadi pada interaksi antara...",
        bobot_poin: 20,
        kunci_jawaban: "B",
        pembahasan: "Lebah mendapat nektar madu dan bunga terbantu proses penyerbukannya.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalIPAS2.id, label: "A", teks_opsi: "Nyamuk dan manusia", is_benar: false, nomor_urut: 1 },
        { soal_id: soalIPAS2.id, label: "B", teks_opsi: "Kupu-kupu atau lebah dengan bunga", is_benar: true, nomor_urut: 2 },
        { soal_id: soalIPAS2.id, label: "C", teks_opsi: "Tali putri dengan tanaman inang", is_benar: false, nomor_urut: 3 },
        { soal_id: soalIPAS2.id, label: "D", teks_opsi: "Ikan remora dengan ikan hiu", is_benar: false, nomor_urut: 4 },
      ],
    });

    const soalIPAS3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasIPAS.id,
        nomor_urut: 3,
        tipe_soal: "ESAI",
        pertanyaan: "Jelaskan apa yang akan terjadi jika populasi katak di persawahan menurun drastis akibat perburuan!",
        bobot_poin: 60,
        kunci_jawaban: "Populasi serangga/belalang akan meningkat drastis merusak padi, sedangkan populasi ular akan kekurangan makanan.",
        pembahasan: "Katak adalah pemangsa serangga dan mangsa ular, keseimbangan rantai makanan terganggu.",
      },
    });

    // --- Tugas 2: Tugas PAI SD (Walas SD) ---
    const tugasPAI = await prisma.tugas.create({
      data: {
        kelas_id: kelasSD.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        judul: "Uji Pemahaman PAI: Rukun Iman & Adab Muslim",
        deskripsi: "Pilihlah satu jawaban yang paling tepat mengenai rukun iman dan adab santri Al-Azhar.",
        deadline: new Date(now.getTime() + 6 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 25,
        tampilkan_nilai_instan: true,
        pertemuan_id: createdPertemuan[2].id,
      },
    });

    const soalPAI1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasPAI.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Rukun Iman yang ketiga adalah beriman kepada...",
        bobot_poin: 50,
        kunci_jawaban: "C",
        pembahasan: "Urutan Rukun Iman: 1. Allah, 2. Malaikat, 3. Kitab-kitab Allah, 4. Rasul, 5. Hari Kiamat, 6. Qada dan Qadar.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalPAI1.id, label: "A", teks_opsi: "Malaikat-malaikat Allah", is_benar: false, nomor_urut: 1 },
        { soal_id: soalPAI1.id, label: "B", teks_opsi: "Rasul-rasul Allah", is_benar: false, nomor_urut: 2 },
        { soal_id: soalPAI1.id, label: "C", teks_opsi: "Kitab-kitab Allah", is_benar: true, nomor_urut: 3 },
        { soal_id: soalPAI1.id, label: "D", teks_opsi: "Hari Kiamat", is_benar: false, nomor_urut: 4 },
      ],
    });

    const soalPAI2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasPAI.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Adab yang benar saat berbicara kepada guru dan orang tua adalah...",
        bobot_poin: 50,
        kunci_jawaban: "A",
        pembahasan: "Islam mengajarkan santri berbicara dengan sopan, suara santun, dan menatap dengan hormat.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalPAI2.id, label: "A", teks_opsi: "Berbicara dengan suara santun, sopan, dan tidak memotong pembicaraan", is_benar: true, nomor_urut: 1 },
        { soal_id: soalPAI2.id, label: "B", teks_opsi: "Berbicara sambil memalingkan muka", is_benar: false, nomor_urut: 2 },
        { soal_id: soalPAI2.id, label: "C", teks_opsi: "Menyela sebelum orang tua selesai bicara", is_benar: false, nomor_urut: 3 },
        { soal_id: soalPAI2.id, label: "D", teks_opsi: "Berteriak agar terdengar jelas", is_benar: false, nomor_urut: 4 },
      ],
    });

    // --- Tugas 3: Tugas Bahasa Arab SD (Guru Lintas) — BELUM DIKERJAKAN SISWA SD ---
    const tugasARBSD = await prisma.tugas.create({
      data: {
        kelas_id: kelasSD.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        judul: "Latihan Mufradat Bahasa Arab Kelas 4",
        deskripsi: "Latihan hafalan kosa kata bahasa Arab peralatan belajar di sekolah.",
        deadline: new Date(now.getTime() + 4 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 20,
        pertemuan_id: createdPertemuan[3].id,
      },
    });
    const soalARB1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasARBSD.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Arti kata 'كِتَابٌ' (Kitabun) dalam bahasa Indonesia adalah...",
        bobot_poin: 50,
        kunci_jawaban: "B",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalARB1.id, label: "A", teks_opsi: "Pena", is_benar: false, nomor_urut: 1 },
        { soal_id: soalARB1.id, label: "B", teks_opsi: "Buku", is_benar: true, nomor_urut: 2 },
        { soal_id: soalARB1.id, label: "C", teks_opsi: "Meja", is_benar: false, nomor_urut: 3 },
        { soal_id: soalARB1.id, label: "D", teks_opsi: "Penghapus", is_benar: false, nomor_urut: 4 },
      ],
    });

    // --- Tugas 4: Kuis Matematika SMP (Guru SMP) ---
    const tugasMTK = await prisma.tugas.create({
      data: {
        kelas_id: kelasSMP.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        judul: "Kuis Aljabar & Persamaan Linier Satu Variabel",
        deskripsi: "Selesaikan soal hitungan aljabar dasar berikut dengan teliti.",
        deadline: new Date(now.getTime() + 5 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 45,
        tampilkan_nilai_instan: true,
        pertemuan_id: createdPertemuan[4].id,
      },
    });

    const soalMTK1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Bentuk sederhana dari 4x + 7y - 2x + 3y adalah...",
        bobot_poin: 25,
        kunci_jawaban: "A",
        pembahasan: "(4x - 2x) + (7y + 3y) = 2x + 10y.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalMTK1.id, label: "A", teks_opsi: "2x + 10y", is_benar: true, nomor_urut: 1 },
        { soal_id: soalMTK1.id, label: "B", teks_opsi: "6x + 10y", is_benar: false, nomor_urut: 2 },
        { soal_id: soalMTK1.id, label: "C", teks_opsi: "2x + 4y", is_benar: false, nomor_urut: 3 },
        { soal_id: soalMTK1.id, label: "D", teks_opsi: "6x + 4y", is_benar: false, nomor_urut: 4 },
      ],
    });

    const soalMTK2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Jika 3x + 4 = 19, berapakah nilai x yang memenuhi?",
        bobot_poin: 25,
        kunci_jawaban: "C",
        pembahasan: "3x = 19 - 4 = 15 => x = 15/3 = 5.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalMTK2.id, label: "A", teks_opsi: "x = 3", is_benar: false, nomor_urut: 1 },
        { soal_id: soalMTK2.id, label: "B", teks_opsi: "x = 4", is_benar: false, nomor_urut: 2 },
        { soal_id: soalMTK2.id, label: "C", teks_opsi: "x = 5", is_benar: true, nomor_urut: 3 },
        { soal_id: soalMTK2.id, label: "D", teks_opsi: "x = 6", is_benar: false, nomor_urut: 4 },
      ],
    });

    const soalMTK3 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasMTK.id,
        nomor_urut: 3,
        tipe_soal: "ESAI",
        pertanyaan: "Sebuah persegi panjang memiliki panjang (2x + 3) cm dan lebar (x + 1) cm. Jika kelilingnya 32 cm, tentukan panjang dan lebar persegi panjang tersebut!",
        bobot_poin: 50,
        kunci_jawaban: "Keliling = 2(p + l) => 2(3x + 4) = 32 => 6x + 8 = 32 => 6x = 24 => x = 4. Maka panjang = 11 cm dan lebar = 5 cm.",
        pembahasan: "Substitusikan x = 4 ke panjang dan lebar.",
      },
    });

    // --- Tugas 5: Tugas Bahasa Inggris SMP (Walas SMP) ---
    const tugasENG = await prisma.tugas.create({
      data: {
        kelas_id: kelasSMP.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        judul: "English Reading & Daily Routines Quiz",
        deskripsi: "Read the questions carefully and select the best answer regarding simple present tense.",
        deadline: new Date(now.getTime() + 6 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 30,
        tampilkan_nilai_instan: true,
        pertemuan_id: createdPertemuan[6].id,
      },
    });

    const soalENG1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasENG.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Haidar always ... to school by bicycle every morning.",
        bobot_poin: 50,
        kunci_jawaban: "B",
        pembahasan: "Subject He/She/Singular name uses verb-s/es in simple present tense.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalENG1.id, label: "A", teks_opsi: "go", is_benar: false, nomor_urut: 1 },
        { soal_id: soalENG1.id, label: "B", teks_opsi: "goes", is_benar: true, nomor_urut: 2 },
        { soal_id: soalENG1.id, label: "C", teks_opsi: "going", is_benar: false, nomor_urut: 3 },
        { soal_id: soalENG1.id, label: "D", teks_opsi: "went", is_benar: false, nomor_urut: 4 },
      ],
    });

    const soalENG2 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasENG.id,
        nomor_urut: 2,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "What is the correct greeting when meeting someone at 8:00 AM?",
        bobot_poin: 50,
        kunci_jawaban: "A",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalENG2.id, label: "A", teks_opsi: "Good morning", is_benar: true, nomor_urut: 1 },
        { soal_id: soalENG2.id, label: "B", teks_opsi: "Good afternoon", is_benar: false, nomor_urut: 2 },
        { soal_id: soalENG2.id, label: "C", teks_opsi: "Good evening", is_benar: false, nomor_urut: 3 },
        { soal_id: soalENG2.id, label: "D", teks_opsi: "Good night", is_benar: false, nomor_urut: 4 },
      ],
    });

    // 8. SEED SUBMISSIONS SISWA DEMO (Hasil Pengerjaan Tugas & Penilaian)
    console.log("📊 Menyiapkan Submissions & Riwayat Nilai Siswa...");

    // Submisi Siswa SD pada Tugas IPAS: Sudah dinilai (Nilai 95)
    const subSD_IPAS = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasIPAS.id,
        siswa_id: siswaSD.id,
        status: "sudah_dinilai",
        nilai: 95,
        nilai_otomatis: 40,
        nilai_manual: 55,
        catatan_guru: "MasyaAllah hebat Rayhan, jawaban esai tentang rantai makanan sangat lengkap dan runtut!",
        total_soal: 3,
        total_benar: 2,
        total_salah: 0,
        submitted_at: new Date(now.getTime() - 2 * 86400000),
        graded_at: new Date(now.getTime() - 1 * 86400000),
        graded_by: guruSD.id,
        mulai_mengerjakan_at: new Date(now.getTime() - 2 * 86400000 - 1200000),
        selesai_mengerjakan_at: new Date(now.getTime() - 2 * 86400000),
        durasi_detik: 1200,
      },
    });

    await prisma.tugasJawabanSiswa.createMany({
      data: [
        {
          submission_id: subSD_IPAS.id,
          soal_id: soalIPAS1.id,
          jawaban_siswa: "A",
          is_benar: true,
          poin_didapat: 20,
        },
        {
          submission_id: subSD_IPAS.id,
          soal_id: soalIPAS2.id,
          jawaban_siswa: "B",
          is_benar: true,
          poin_didapat: 20,
        },
        {
          submission_id: subSD_IPAS.id,
          soal_id: soalIPAS3.id,
          jawaban_siswa:
            "Jika katak berkurang, hama belalang akan bertambah banyak dan merusak tanaman padi petani. Kemudian ular sawah yang memakan katak akan kekurangan makanan.",
          is_benar: true,
          poin_didapat: 55,
          catatan_koreksi: "Analisis rantai makanan sangat tepat dan berbobot.",
        },
      ],
    });

    // Submisi Siswa SD pada Tugas PAI: Sudah dinilai (Nilai 100)
    const subSD_PAI = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasPAI.id,
        siswa_id: siswaSD.id,
        status: "sudah_dinilai",
        nilai: 100,
        nilai_otomatis: 100,
        catatan_guru: "Mumtaz! Pemahaman rukun iman dan adab sangat baik. Pertahankan terus ya santri teladan.",
        total_soal: 2,
        total_benar: 2,
        total_salah: 0,
        submitted_at: new Date(now.getTime() - 3 * 86400000),
        graded_at: new Date(now.getTime() - 2 * 86400000),
        graded_by: walasSD.id,
        durasi_detik: 650,
      },
    });
    await prisma.tugasJawabanSiswa.createMany({
      data: [
        {
          submission_id: subSD_PAI.id,
          soal_id: soalPAI1.id,
          jawaban_siswa: "C",
          is_benar: true,
          poin_didapat: 50,
        },
        {
          submission_id: subSD_PAI.id,
          soal_id: soalPAI2.id,
          jawaban_siswa: "A",
          is_benar: true,
          poin_didapat: 50,
        },
      ],
    });

    // Tambahkan 1 submisi siswa lain di Kelas 4 dengan status "dikumpulkan" (menunggu review)
    // agar Ustadzah Nurul melihat indikator "1 Menunggu Penilaian" di dashboard
    const otherSDStudent = await prisma.user.findFirst({
      where: { kelas: kelasSD.nama_kelas, status: "1", id: { not: siswaSD.id } },
    });
    if (otherSDStudent) {
      await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasIPAS.id,
          siswa_id: otherSDStudent.id,
          status: "dikumpulkan",
          nilai_otomatis: 40,
          total_soal: 3,
          total_benar: 2,
          submitted_at: new Date(now.getTime() - 1 * 86400000),
          durasi_detik: 1400,
        },
      });
    }

    // Submisi Siswa SMP pada Tugas MTK: Sudah dinilai (Nilai 92)
    const subSMP_MTK = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasMTK.id,
        siswa_id: siswaSMP.id,
        status: "sudah_dinilai",
        nilai: 92,
        nilai_otomatis: 50,
        nilai_manual: 42,
        catatan_guru: "Langkah-langkah penyelesaian aljabar dan persamaan linear rapi serta tepat. Teliti sekali!",
        total_soal: 3,
        total_benar: 2,
        submitted_at: new Date(now.getTime() - 2 * 86400000),
        graded_at: new Date(now.getTime() - 1 * 86400000),
        graded_by: guruSMP.id,
        durasi_detik: 1600,
      },
    });
    await prisma.tugasJawabanSiswa.createMany({
      data: [
        { submission_id: subSMP_MTK.id, soal_id: soalMTK1.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 25 },
        { submission_id: subSMP_MTK.id, soal_id: soalMTK2.id, jawaban_siswa: "C", is_benar: true, poin_didapat: 25 },
        {
          submission_id: subSMP_MTK.id,
          soal_id: soalMTK3.id,
          jawaban_siswa: "Keliling = 2(p + l) = 2(2x+3 + x+1) = 2(3x+4) = 6x+8 = 32 => 6x = 24 => x = 4. Maka p = 2(4)+3 = 11 cm dan l = 4+1 = 5 cm.",
          is_benar: true,
          poin_didapat: 42,
          catatan_koreksi: "Penyelesaian persamaan sangat sistematis.",
        },
      ],
    });

    // Submisi Siswa SMP pada Tugas Bahasa Inggris: Sudah dinilai (Nilai 100)
    const subSMP_ENG = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasENG.id,
        siswa_id: siswaSMP.id,
        status: "sudah_dinilai",
        nilai: 100,
        nilai_otomatis: 100,
        catatan_guru: "Excellent reading comprehension and grammar understanding. Well done Haidar!",
        total_soal: 2,
        total_benar: 2,
        submitted_at: new Date(now.getTime() - 3 * 86400000),
        graded_at: new Date(now.getTime() - 2 * 86400000),
        graded_by: walasSMP.id,
        durasi_detik: 750,
      },
    });
    await prisma.tugasJawabanSiswa.createMany({
      data: [
        { submission_id: subSMP_ENG.id, soal_id: soalENG1.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 50 },
        { submission_id: subSMP_ENG.id, soal_id: soalENG2.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 50 },
      ],
    });

    // 9. SEED PRESENSI KBM (14 Hari Efektif Termasuk Hari Ini)
    console.log("📋 Menyiapkan Rekap Presensi KBM 14 Hari...");

    // Format YYYY-MM-DD
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const formatMonth = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    // Ambil siswa kelas 4 SD dan kelas 7 SMP untuk diberi presensi
    const allStudentsSD = await prisma.user.findMany({
      where: { kelas: kelasSD.nama_kelas, status: "1" },
      select: { id: true },
    });
    const allStudentsSMP = await prisma.user.findMany({
      where: { kelas: kelasSMP.nama_kelas, status: "1" },
      select: { id: true },
    });

    const absenBatch = [];

    // Buat riwayat presensi untuk 10 hari efektif (mundur dari hari ini)
    for (let dayOffset = 0; dayOffset <= 12; dayOffset++) {
      const d = new Date(now.getTime() - dayOffset * 86400000);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Lewati Sabtu & Minggu

      const dateStr = formatDate(d);
      const monthStr = formatMonth(d);

      // --- Sesi SD: IPAS (Guru SD) ---
      for (const s of allStudentsSD) {
        let ket = "Hadir";
        let ctt: string | null = null;
        if (s.id === siswaSD.id && dayOffset === 4) {
          ket = "Izin";
          ctt = "Izin acara keluarga resmi";
        } else if (s.id === siswaSD.id && dayOffset === 9) {
          ket = "Sakit";
          ctt = "Demam dan flu (surat dokter terlampir)";
        }

        absenBatch.push({
          user_id: s.id,
          kelas: kelasSD.nama_kelas,
          kelas_id: kelasSD.id,
          mapel_id: mapelIPAS.id,
          guru_id: guruSD.id,
          keterangan: ket,
          catatan: ctt,
          date: dateStr,
          month: monthStr,
          jam_ke: "1-2",
        });
      }

      // --- Sesi SD: PAI (Walas SD) ---
      for (const s of allStudentsSD) {
        let ket = "Hadir";
        let ctt: string | null = null;
        if (s.id === siswaSD.id && (dayOffset === 4 || dayOffset === 9)) {
          ket = dayOffset === 4 ? "Izin" : "Sakit";
          ctt = "Sinkronisasi izin harian wali kelas";
        }

        absenBatch.push({
          user_id: s.id,
          kelas: kelasSD.nama_kelas,
          kelas_id: kelasSD.id,
          mapel_id: mapelPAI.id,
          guru_id: walasSD.id,
          keterangan: ket,
          catatan: ctt,
          date: dateStr,
          month: monthStr,
          jam_ke: "3-4",
        });
      }

      // --- Sesi SMP: MTK (Guru SMP) ---
      for (const s of allStudentsSMP) {
        let ket = "Hadir";
        let ctt: string | null = null;
        if (s.id === siswaSMP.id && dayOffset === 6) {
          ket = "Izin";
          ctt = "Izin persiapan seleksi lomba matematika";
        }

        absenBatch.push({
          user_id: s.id,
          kelas: kelasSMP.nama_kelas,
          kelas_id: kelasSMP.id,
          mapel_id: mapelMTK.id,
          guru_id: guruSMP.id,
          keterangan: ket,
          catatan: ctt,
          date: dateStr,
          month: monthStr,
          jam_ke: "1-2",
        });
      }

      // --- Sesi SMP: Bahasa Inggris (Walas SMP) ---
      for (const s of allStudentsSMP) {
        let ket = "Hadir";
        absenBatch.push({
          user_id: s.id,
          kelas: kelasSMP.nama_kelas,
          kelas_id: kelasSMP.id,
          mapel_id: mapelENG.id,
          guru_id: walasSMP.id,
          keterangan: ket,
          catatan: null,
          date: dateStr,
          month: monthStr,
          jam_ke: "3-4",
        });
      }
    }

    // Insert batch presensi (chunk per 100 agar aman)
    for (let i = 0; i < absenBatch.length; i += 100) {
      const chunk = absenBatch.slice(i, i + 100);
      await prisma.absen.createMany({ data: chunk, skipDuplicates: true });
    }

    // 10. SEED PRESTASI SISWA DEMO
    console.log("🏆 Menyiapkan Prestasi Siswa Demo...");
    await prisma.prestasi.createMany({
      data: [
        {
          id_user: siswaSD.id.toString(),
          nama: siswaSD.name,
          kelas: kelasSD.nama_kelas,
          prestasi: "Juara 1 Olimpiade Sains & Matematika Nasional (OSMN) 2026",
          fotoanak: "/images/best-student.avif",
        },
        {
          id_user: siswaSMP.id.toString(),
          nama: siswaSMP.name,
          kelas: kelasSMP.nama_kelas,
          prestasi: "Juara 2 National English Storytelling & Speech Competition 2026",
          fotoanak: "/images/best-point.avif",
        },
      ],
    });

    // 11. SEED CHAT ROOM & PESAN DEMO
    console.log("💬 Menyiapkan Riwayat Pesan Chat Demo...");
    // Room 1: Walas SD <-> Siswa SD
    const chatRoomSD = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        user_one_id: walasSD.id,
        user_two_id: siswaSD.id,
        last_message: "Alhamdulillah, barakallahu fiik. Sampai bertemu di kelas besok pagi ya.",
        last_message_at: new Date(now.getTime() - 3600000),
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        {
          room_id: chatRoomSD.id,
          sender_id: walasSD.id,
          message:
            "Assalamu'alaikum Rayhan, jangan lupa latihan hafalan Surah Al-Mulk ayat 1-15 untuk persiapan wisuda tahfidz ya.",
          is_read: true,
          created_at: new Date(now.getTime() - 14400000),
        },
        {
          room_id: chatRoomSD.id,
          sender_id: siswaSD.id,
          message:
            "Wa'alaikumsalam Ustadzah, baik insyaAllah siap! Saat ini sudah lancar sampai ayat 15.",
          is_read: true,
          created_at: new Date(now.getTime() - 7200000),
        },
        {
          room_id: chatRoomSD.id,
          sender_id: walasSD.id,
          message: "Alhamdulillah, barakallahu fiik. Sampai bertemu di kelas besok pagi ya.",
          is_read: true,
          created_at: new Date(now.getTime() - 3600000),
        },
      ],
    });

    // Room 2: Walas SMP <-> Siswa SMP
    const chatRoomSMP = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        user_one_id: walasSMP.id,
        user_two_id: siswaSMP.id,
        last_message: "Excellent! Looking forward to your presentation tomorrow.",
        last_message_at: new Date(now.getTime() - 1800000),
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        {
          room_id: chatRoomSMP.id,
          sender_id: walasSMP.id,
          message: "Assalamu'alaikum Haidar, how is your English group project going?",
          is_read: true,
          created_at: new Date(now.getTime() - 10800000),
        },
        {
          room_id: chatRoomSMP.id,
          sender_id: siswaSMP.id,
          message: "Wa'alaikumsalam Sir, the slides and script are all complete. We will present it smoothly.",
          is_read: true,
          created_at: new Date(now.getTime() - 5400000),
        },
        {
          room_id: chatRoomSMP.id,
          sender_id: walasSMP.id,
          message: "Excellent! Looking forward to your presentation tomorrow.",
          is_read: true,
          created_at: new Date(now.getTime() - 1800000),
        },
      ],
    });

    // 12. Simpan status di SystemSetting
    await SystemSettingService.setSetting(
      "ENABLE_DEMO_DATA",
      "true",
      "Status data contoh (sample data) aktif pada dashboard akun demo"
    );

    console.log("✅ [DemoDataService] Seluruh data contoh akun demo berhasil diisikan lengkap!");

    return {
      success: true,
      message: "Data contoh akun demo berhasil diaktifkan dan diisi lengkap di semua fitur!",
      count: {
        jadwal: createdJadwal.length,
        pertemuan: createdPertemuan.length,
        tugas: 5,
        submissions: 4,
        absensi: absenBatch.length,
      },
    };
  }

  /**
   * Menghapus dan membersihkan seluruh data contoh yang terasosiasi dengan 7 akun demo.
   * Aman 100%: Tidak menyentuh data riil sekolah, data guru asli, maupun siswa riil.
   */
  static async clearDemoDashboardData(): Promise<{ success: boolean; message: string }> {
    console.log("🧹 [DemoDataService] Membersihkan data contoh akun demo...");
    await this.clearDemoDashboardDataInternal();

    // Set setting status menjadi nonaktif
    await SystemSettingService.setSetting(
      "ENABLE_DEMO_DATA",
      "false",
      "Status data contoh (sample data) aktif pada dashboard akun demo"
    );

    return {
      success: true,
      message: "Seluruh data contoh akun demo berhasil dinonaktifkan dan dibersihkan dari sistem.",
    };
  }

  /**
   * Internal cleaner: Menghapus record yang terhubung dengan akun demo
   */
  private static async clearDemoDashboardDataInternal(): Promise<void> {
    const emails = Object.values(DEMO_EMAILS);
    const demoUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });

    if (demoUsers.length === 0) return;

    const userIds = demoUsers.map((u) => u.id);
    const teacherIds = demoUsers
      .filter((u) => u.email.includes("guru") || u.email.includes("walas"))
      .map((u) => u.id);
    const studentIds = demoUsers
      .filter((u) => u.email.includes("siswa"))
      .map((u) => u.id);
    const studentIdStrs = studentIds.map((id) => id.toString());

    // 1. Chat
    await prisma.chatMessage.deleteMany({
      where: {
        OR: [{ sender_id: { in: userIds } }, { room: { user_one_id: { in: userIds } } }],
      },
    });
    await prisma.chatRoom.deleteMany({
      where: {
        OR: [{ user_one_id: { in: userIds } }, { user_two_id: { in: userIds } }],
      },
    });

    // 2. Prestasi
    await prisma.prestasi.deleteMany({
      where: { id_user: { in: studentIdStrs } },
    });

    // 3. Absensi
    await prisma.absen.deleteMany({
      where: {
        OR: [{ guru_id: { in: teacherIds } }, { user_id: { in: studentIds } }],
      },
    });

    // 4. Submissions & Jawaban
    await prisma.tugasSubmission.deleteMany({
      where: {
        OR: [{ siswa_id: { in: studentIds } }, { tugas: { guru_id: { in: teacherIds } } }],
      },
    });

    // 5. Tugas, Soal & Opsi
    const demoTugas = await prisma.tugas.findMany({
      where: { guru_id: { in: teacherIds } },
      select: { id: true },
    });
    const tugasIds = demoTugas.map((t) => t.id);

    if (tugasIds.length > 0) {
      await prisma.tugasSoalOpsi.deleteMany({
        where: { soal: { tugas_id: { in: tugasIds } } },
      });
      await prisma.tugasSoal.deleteMany({
        where: { tugas_id: { in: tugasIds } },
      });
      await prisma.tugas.deleteMany({
        where: { id: { in: tugasIds } },
      });
    }

    // 6. Pertemuan & Progress
    await prisma.pertemuanProgress.deleteMany({
      where: {
        OR: [{ siswa_id: { in: studentIds } }, { pertemuan: { guru_id: { in: teacherIds } } }],
      },
    });
    await prisma.pertemuan.deleteMany({
      where: { guru_id: { in: teacherIds } },
    });

    // 7. Jadwal Pelajaran
    await prisma.jadwalPelajaran.deleteMany({
      where: { guru_id: { in: teacherIds } },
    });

    console.log("✅ [DemoDataService] Internal cleaner selesai.");
  }
}
