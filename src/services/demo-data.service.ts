import prisma from "@/lib/prisma";
import { SystemSettingService } from "./system-setting.service";
import bcrypt from "bcryptjs";
import { calculateAchievementPoints } from "@/lib/achievement-points";

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
      prisma.prestasi.count(),
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
   * Mencakup: Jadwal KBM Multi-Kelas, Modul/Pertemuan KBM, Tugas Interaktif & Berkas,
   * Submisi & Nilai Beragam Kondisi, Presensi Lengkap 14 Hari, Prestasi di Semua Kelas,
   * Catatan Kedisiplinan/Pelanggaran, Pengumuman Resmi, dan Chat Realistis.
   */
  static async seedDemoDashboardData(): Promise<{ success: boolean; message: string; count: any }> {
    console.log("🚀 [DemoDataService] Memulai pengisian data contoh akun demo lengkap...");

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
        guru_bidang: "Matematika & IPA SMP",
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
        guru_bidang: "Bahasa Arab & Al-Qur'an (SD & SMP)",
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

    // 3. Ambil Kelas-Kelas Kunci SD & SMP
    const [
      kelasSDMehmed,
      kelasSDSayfuddin,
      kelasSDSholahuddin,
      kelasSDIbnuBatutah,
      kelasSDAlBukhari,
      kelasSMPKhalid,
      kelasSMPHamzah,
      kelasSMPZaid,
      kelasSMPSyafii,
    ] = await Promise.all([
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 4 - Sayfuddin Al Quthuz" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 4 - Sholahuddin Al Ayubi" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 3 - Ibnu Batutah" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 5 - Al Bukhari" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 7 - Khalid bin Walid" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 7 - Hamzah bin Abdul Muthalib" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 7 - Zaid bin Haritsah" } }),
      prisma.kelas.findFirst({ where: { nama_kelas: "Kelas 8 - Imam Syafi'i" } }),
    ]);

    const kSD1 = kelasSDMehmed || { id: BigInt(60), nama_kelas: "Kelas 4 - Mehmed Al Fatih" };
    const kSD2 = kelasSDSayfuddin || kSD1;
    const kSD3 = kelasSDSholahuddin || kSD1;
    const kSD_Batutah = kelasSDIbnuBatutah || kSD1;
    const kSD_Bukhari = kelasSDAlBukhari || kSD1;

    const kSMP1 = kelasSMPKhalid || { id: BigInt(83), nama_kelas: "Kelas 7 - Khalid bin Walid" };
    const kSMP2 = kelasSMPHamzah || kSMP1;
    const kSMP3 = kelasSMPZaid || kSMP1;
    const kSMP_Syafii = kelasSMPSyafii || kSMP1;

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

    // 5. SEED JADWAL PELAJARAN (Lengkap Multi-Kelas & Multi-Hari)
    console.log("📅 Menyiapkan Jadwal Pelajaran Demo Lengkap (Senin - Jumat)...");
    const jadwalItems = [
      // === GURU SD: Ustadzah Nurul (IPAS & Tematik) ===
      { kelas_id: kSD1.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD2.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD_Batutah.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD1.id, mapel_id: mapelBIN.id, guru_id: guruSD.id, hari: "Selasa", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD2.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD_Bukhari.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD1.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Kamis", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD_Batutah.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD_Bukhari.id, mapel_id: mapelIPAS.id, guru_id: guruSD.id, hari: "Jumat", jam_mulai: "07:30", jam_selesai: "09:00" },

      // === WALAS SD: Ustadzah Fatimah (PAI & Budi Pekerti) ===
      { kelas_id: kSD1.id, mapel_id: mapelPAI.id, guru_id: walasSD.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD2.id, mapel_id: mapelPAI.id, guru_id: walasSD.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD3.id, mapel_id: mapelPAI.id, guru_id: walasSD.id, hari: "Selasa", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD3.id, mapel_id: mapelPAI.id, guru_id: walasSD.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD2.id, mapel_id: mapelPAI.id, guru_id: walasSD.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD1.id, mapel_id: mapelPAI.id, guru_id: walasSD.id, hari: "Jumat", jam_mulai: "07:30", jam_selesai: "09:00" },

      // === GURU SMP: Ustadz Wildan (Matematika & IPA) ===
      { kelas_id: kSMP1.id, mapel_id: mapelMTK.id, guru_id: guruSMP.id, hari: "Senin", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP2.id, mapel_id: mapelMTK.id, guru_id: guruSMP.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelIPA.id, guru_id: guruSMP.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP_Syafii.id, mapel_id: mapelMTK.id, guru_id: guruSMP.id, hari: "Selasa", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelMTK.id, guru_id: guruSMP.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP2.id, mapel_id: mapelMTK.id, guru_id: guruSMP.id, hari: "Kamis", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP_Syafii.id, mapel_id: mapelMTK.id, guru_id: guruSMP.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelIPA.id, guru_id: guruSMP.id, hari: "Jumat", jam_mulai: "07:30", jam_selesai: "09:00" },

      // === WALAS SMP: Ustadz Farhan (Bahasa Inggris) ===
      { kelas_id: kSMP1.id, mapel_id: mapelENG.id, guru_id: walasSMP.id, hari: "Senin", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP3.id, mapel_id: mapelENG.id, guru_id: walasSMP.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP3.id, mapel_id: mapelENG.id, guru_id: walasSMP.id, hari: "Rabu", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelENG.id, guru_id: walasSMP.id, hari: "Kamis", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP_Syafii.id, mapel_id: mapelENG.id, guru_id: walasSMP.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelENG.id, guru_id: walasSMP.id, hari: "Jumat", jam_mulai: "09:30", jam_selesai: "11:00" },

      // === GURU LINTAS: Ustadz Ahmad (Bahasa Arab & Al-Qur'an) ===
      { kelas_id: kSD1.id, mapel_id: mapelARB.id, guru_id: guruLintas.id, hari: "Selasa", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSD1.id, mapel_id: mapelALQ.id, guru_id: guruLintas.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelARB.id, guru_id: guruLintas.id, hari: "Rabu", jam_mulai: "07:30", jam_selesai: "09:00" },
      { kelas_id: kSMP1.id, mapel_id: mapelARB.id, guru_id: guruLintas.id, hari: "Kamis", jam_mulai: "09:30", jam_selesai: "11:00" },
      { kelas_id: kSD1.id, mapel_id: mapelALQ.id, guru_id: guruLintas.id, hari: "Jumat", jam_mulai: "09:30", jam_selesai: "11:00" },
    ];

    const createdJadwal = [];
    for (const j of jadwalItems) {
      const created = await prisma.jadwalPelajaran.create({ data: j });
      createdJadwal.push(created);
    }

    // 6. SEED PERTEMUAN / MODUL KBM (Lengkap: Lampau, Hari Ini Aktif, dan Mendatang)
    console.log("📚 Menyiapkan Modul & Pertemuan KBM Beragam Kondisi...");
    const now = new Date();
    const pertemuanList = [
      // === IPAS SD (Ustadzah Nurul) ===
      {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        pertemuan_ke: 1,
        judul: "Ekosistem & Rantai Makanan Makhluk Hidup",
        deskripsi: "Interaksi antara makhluk hidup (biotik) dan lingkungannya (abiotik), serta peranan produsen, konsumen, dan pengurai.",
        tanggal: new Date(now.getTime() - 8 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Modul_IPAS_Ekosistem_Kelas4.pdf",
        file_size: 1420000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=b4wS9W10O1M",
        is_published: true,
      },
      {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        pertemuan_ke: 2,
        judul: "Wujud Benda & Perubahannya di Sekitar Kita",
        deskripsi: "Mempelajari 3 wujud benda (padat, cair, gas) serta peristiwa mencair, membeku, menguap, mengembun, dan menyublim.",
        tanggal: new Date(now.getTime() - 4 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Lembar_Kerja_Wujud_Benda.pdf",
        file_size: 850000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=kYI6j2e8ZzY",
        is_published: true,
      },
      {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        pertemuan_ke: 3,
        judul: "Siklus Air & Pelestarian Lingkungan Hidup",
        deskripsi: "Proses evaporasi, kondensasi, presipitasi, dan infiltrasi dalam siklus hidrologi serta upaya konservasi air bersih.",
        tanggal: new Date(now.getTime() - 1 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "PPT_Siklus_Air_AlAzhar.pdf",
        file_size: 1200000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        pertemuan_ke: 4,
        judul: "Energi Terbarukan & Pemanfaatannya Sehari-hari",
        deskripsi: "Sesi tatap maya interaktif: Pembahasan panel surya, kincir angin, dan energi biogas yang ramah lingkungan.",
        tanggal: new Date(now.getTime()),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Panduan_Praktikum_Energi.pdf",
        file_size: 960000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=1kUE0BZtTRc",
        is_published: true,
      },

      // === PAI SD (Ustadzah Fatimah) ===
      {
        kelas_id: kSD1.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        pertemuan_ke: 1,
        judul: "Kisah Teladan Rasulullah SAW dan Para Sahabat",
        deskripsi: "Mempelajari sifat-sifat mulia Nabi Muhammad SAW: Shiddiq, Amanah, Tabligh, dan Fathonah serta keteladanan Khulafaur Rasyidin.",
        tanggal: new Date(now.getTime() - 7 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Sirah_Nabawiyyah_Ringkas.pdf",
        file_size: 1100000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=QZ0B87Q3c_0",
        is_published: true,
      },
      {
        kelas_id: kSD1.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        pertemuan_ke: 2,
        judul: "Indahnya Saling Menghormati & Toleransi dalam Islam",
        deskripsi: "Kajian surah Al-Hujurat ayat 13 mengenai persaudaraan dan pentingnya berakhlak terpuji kepada sesama teman.",
        tanggal: new Date(now.getTime() - 3 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Akhlak_Terpuji_Kelas4.pdf",
        file_size: 920000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSD1.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        pertemuan_ke: 3,
        judul: "Mengenal Asmaul Husna: Al-Malik, Al-Quddus, As-Salam",
        deskripsi: "Menghayati makna nama-nama agung Allah SWT serta implementasinya dalam doa dan perilaku kehidupan sehari-hari.",
        tanggal: new Date(now.getTime()),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Asmaul_Husna_Lengkap.pdf",
        file_size: 1350000,
        file_type: "application/pdf",
        is_published: true,
      },

      // === Bahasa Arab SD (Ustadz Ahmad) ===
      {
        kelas_id: kSD1.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        pertemuan_ke: 1,
        judul: "At-Ta'aruf (Perkenalan & Kosa Kata Perlengkapan Kelas)",
        deskripsi: "Pengenalan ucapan salam, menanyakan kabar, serta mufradat seputar buku (kitabun), pena (qolamun), dan meja (maktabun).",
        tanggal: new Date(now.getTime() - 6 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Mufradat_Arab_Dasar.pdf",
        file_size: 780000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSD1.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        pertemuan_ke: 2,
        judul: "Al-Usrah wal Bait (Keluarga dan Rumah)",
        deskripsi: "Menghafal kosakata anggota keluarga (Abun, Ummun, Akhun, Ukhtun) dan ruangan di dalam rumah.",
        tanggal: new Date(now.getTime() - 2 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "AlUsrah_wal_Bait.pdf",
        file_size: 890000,
        file_type: "application/pdf",
        is_published: true,
      },

      // === Matematika SMP (Ustadz Wildan) ===
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 1,
        judul: "Mengenal Aljabar: Variabel, Koefisien, dan Suku Sejenis",
        deskripsi: "Konsep dasar bentuk aljabar, penjumlahan dan pengurangan bentuk aljabar sederhana serta aplikasinya.",
        tanggal: new Date(now.getTime() - 8 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Aljabar_Dasar_SMP_Kelas7.pdf",
        file_size: 1950000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=NybHckSEQBI",
        is_published: true,
      },
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 2,
        judul: "Persamaan Linier Satu Variabel (PLSV)",
        deskripsi: "Menemukan himpunan penyelesaian persamaan linear satu variabel menggunakan sifat kesetaraan matematika.",
        tanggal: new Date(now.getTime() - 5 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Latihan_PLSV_Terbimbing.pdf",
        file_size: 920000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 3,
        judul: "Pertidaksamaan Linier Satu Variabel (PtLSV)",
        deskripsi: "Menyelesaikan pertidaksamaan linear, garis bilangan penyelesaian, dan membedakan tanda pertidaksamaan.",
        tanggal: new Date(now.getTime() - 2 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "PtLSV_Modul_Kelas7.pdf",
        file_size: 1100000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelMTK.id,
        guru_id: guruSMP.id,
        pertemuan_ke: 4,
        judul: "Perbandingan Senilai & Berbalik Nilai dalam Masalah Nyata",
        deskripsi: "Sesi tatap maya: Perhitungan rasio skala peta, konsumsi bahan bakar, dan waktu tempuh perjalanan.",
        tanggal: new Date(now.getTime()),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Rasio_dan_Perbandingan.pdf",
        file_size: 1300000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=NybHckSEQBI",
        is_published: true,
      },

      // === Bahasa Inggris SMP (Ustadz Farhan) ===
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        pertemuan_ke: 1,
        judul: "Unit 1: Self-Introduction and Greetings in Formal Context",
        deskripsi: "How to introduce yourself confidently, talk about hobbies, origins, and family in English.",
        tanggal: new Date(now.getTime() - 7 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "English_Grade7_Unit1.pdf",
        file_size: 1250000,
        file_type: "application/pdf",
        video_url: "https://www.youtube.com/watch?v=d_2XJq9p7sA",
        is_published: true,
      },
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        pertemuan_ke: 2,
        judul: "Unit 2: Daily Routines & Simple Present Tense",
        deskripsi: "Using adverbs of frequency (always, usually, sometimes, never) and third-person singular verb forms.",
        tanggal: new Date(now.getTime() - 3 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Daily_Routines_Grammar.pdf",
        file_size: 980000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        pertemuan_ke: 3,
        judul: "Unit 3: Describing Heroes & Muslim Figures",
        deskripsi: "Descriptive text structure: Identification and description of exemplary historical Muslim leaders.",
        tanggal: new Date(now.getTime()),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Descriptive_Text_Unit3.pdf",
        file_size: 1400000,
        file_type: "application/pdf",
        is_published: true,
      },

      // === Bahasa Arab SMP (Ustadz Ahmad) ===
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        pertemuan_ke: 1,
        judul: "Qawa'id Al-Lughah: Pembagian Kalimat (Isim, Fi'il, Huruf)",
        deskripsi: "Memahami ciri-ciri isim (kata benda), tanda-tanda fi'il (kata kerja), serta penggunaan huruf jar dalam kalimat.",
        tanggal: new Date(now.getTime() - 6 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Qawaid_Bahasa_Arab_Kelas7.pdf",
        file_size: 1600000,
        file_type: "application/pdf",
        is_published: true,
      },
      {
        kelas_id: kSMP1.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        pertemuan_ke: 2,
        judul: "Tarkib Jumlah Fi'liyyah dan Jumlah Ismiyyah",
        deskripsi: "Penyusunan kalimat sempurna dalam bahasa Arab dengan subjek (Fa'il/Mubtada') dan predikat (Fi'il/Khabar).",
        tanggal: new Date(now.getTime() - 2 * 86400000),
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Tarkib_Jumlah_Fi'liyyah.pdf",
        file_size: 1150000,
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
        { pertemuan_id: createdPertemuan[0].id, siswa_id: siswaSD.id, is_completed: true, completed_at: new Date(now.getTime() - 7 * 86400000) },
        { pertemuan_id: createdPertemuan[1].id, siswa_id: siswaSD.id, is_completed: true, completed_at: new Date(now.getTime() - 3 * 86400000) },
        { pertemuan_id: createdPertemuan[4].id, siswa_id: siswaSD.id, is_completed: true, completed_at: new Date(now.getTime() - 6 * 86400000) },
        { pertemuan_id: createdPertemuan[7].id, siswa_id: siswaSD.id, is_completed: true, completed_at: new Date(now.getTime() - 5 * 86400000) },
        { pertemuan_id: createdPertemuan[9].id, siswa_id: siswaSMP.id, is_completed: true, completed_at: new Date(now.getTime() - 7 * 86400000) },
        { pertemuan_id: createdPertemuan[10].id, siswa_id: siswaSMP.id, is_completed: true, completed_at: new Date(now.getTime() - 4 * 86400000) },
        { pertemuan_id: createdPertemuan[13].id, siswa_id: siswaSMP.id, is_completed: true, completed_at: new Date(now.getTime() - 6 * 86400000) },
        { pertemuan_id: createdPertemuan[16].id, siswa_id: siswaSMP.id, is_completed: true, completed_at: new Date(now.getTime() - 5 * 86400000) },
      ],
    });

    // 7. SEED TUGAS INTERAKTIF & BERKAS BERAGAM KONDISI
    console.log("📝 Menyiapkan Tugas & Kuis Interaktif dengan Berbagai Status...");

    // Ambil teman-teman sekelas lainnya untuk diberi submisi realistis
    const peersSD = await prisma.user.findMany({
      where: { kelas: kSD1.nama_kelas, status: "1", id: { not: siswaSD.id } },
      take: 8,
      select: { id: true, name: true },
    });
    const peersSMP = await prisma.user.findMany({
      where: { kelas: kSMP1.nama_kelas, status: "1", id: { not: siswaSMP.id } },
      take: 8,
      select: { id: true, name: true },
    });

    // --- Tugas 1: Kuis IPAS SD (Sudah Dinilai) ---
    const tugasIPAS = await prisma.tugas.create({
      data: {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        judul: "Kuis Interaktif IPAS: Ekosistem & Rantai Makanan",
        deskripsi: "Kerjakan kuis pilihan ganda dan satu pertanyaan uraian berikut dengan cermat untuk menguji pemahaman materi ekosistem.",
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

    // --- Tugas 2: Tugas Proyek Mandiri IPAS SD (Upload File - Menunggu Review) ---
    const tugasKlipingSD = await prisma.tugas.create({
      data: {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        judul: "Proyek Portofolio: Kliping Siklus Air & Daur Hidup Hewan",
        deskripsi: "Susun kliping ringkas berupa foto pengamatan atau diagram daur hidup kupu-kupu/katak, lalu unggah dokumen PDF hasil karya ananda.",
        deadline: new Date(now.getTime() + 7 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "UPLOAD_FILE",
        pertemuan_id: createdPertemuan[2].id,
      },
    });

    // --- Tugas 3: Tugas PAI SD (Sudah Dinilai) ---
    const tugasPAI = await prisma.tugas.create({
      data: {
        kelas_id: kSD1.id,
        mapel_id: mapelPAI.id,
        guru_id: walasSD.id,
        judul: "Uji Pemahaman PAI: Rukun Iman & Adab Muslim",
        deskripsi: "Pilihlah satu jawaban yang paling tepat mengenai rukun iman dan adab siswa Al-Azhar.",
        deadline: new Date(now.getTime() + 6 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 25,
        tampilkan_nilai_instan: true,
        pertemuan_id: createdPertemuan[4].id,
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
        pembahasan: "Islam mengajarkan siswa berbicara dengan suara santun, sopan, dan menatap dengan hormat.",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalPAI2.id, label: "A", teks_opsi: "Berbicara dengan santun, sopan, dan tidak memotong pembicaraan", is_benar: true, nomor_urut: 1 },
        { soal_id: soalPAI2.id, label: "B", teks_opsi: "Berbicara sambil memalingkan muka", is_benar: false, nomor_urut: 2 },
        { soal_id: soalPAI2.id, label: "C", teks_opsi: "Menyela sebelum orang tua selesai bicara", is_benar: false, nomor_urut: 3 },
        { soal_id: soalPAI2.id, label: "D", teks_opsi: "Berteriak agar terdengar jelas", is_benar: false, nomor_urut: 4 },
      ],
    });

    // --- Tugas 4: Tugas Bahasa Arab SD (Aktif - Belum Dikerjakan Siswa Demo) ---
    const tugasARBSD = await prisma.tugas.create({
      data: {
        kelas_id: kSD1.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        judul: "Latihan Mufradat Bahasa Arab Kelas 4",
        deskripsi: "Latihan hafalan kosakata bahasa Arab peralatan belajar di sekolah.",
        deadline: new Date(now.getTime() + 4 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 20,
        pertemuan_id: createdPertemuan[7].id,
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

    // --- Tugas 5: Kuis Matematika SMP (Sudah Dinilai) ---
    const tugasMTK = await prisma.tugas.create({
      data: {
        kelas_id: kSMP1.id,
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
        pertemuan_id: createdPertemuan[9].id,
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

    // --- Tugas 6: Tugas Menulis Bahasa Inggris SMP (Upload Berkas - Descriptive Text) ---
    const tugasDescriptiveSMP = await prisma.tugas.create({
      data: {
        kelas_id: kSMP1.id,
        mapel_id: mapelENG.id,
        guru_id: walasSMP.id,
        judul: "Descriptive Writing: My Favorite Muslim Hero",
        deskripsi: "Write a short 3-paragraph essay describing an inspiring Muslim scientist or leader in English. Upload your document in PDF format.",
        deadline: new Date(now.getTime() + 6 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "UPLOAD_FILE",
        pertemuan_id: createdPertemuan[15].id,
      },
    });

    // --- Tugas 7: Kuis Reading Bahasa Inggris SMP (Sudah Dinilai) ---
    const tugasENG = await prisma.tugas.create({
      data: {
        kelas_id: kSMP1.id,
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
        pertemuan_id: createdPertemuan[14].id,
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

    // --- Tugas 8: Latihan Qawa'id Bahasa Arab SMP (Aktif - Belum Dikerjakan Siswa SMP) ---
    const tugasARBSMP = await prisma.tugas.create({
      data: {
        kelas_id: kSMP1.id,
        mapel_id: mapelARB.id,
        guru_id: guruLintas.id,
        judul: "Latihan Qawa'id Al-Lughah: Pembagian Kalimat",
        deskripsi: "Klasifikasikan kalimat-kalimat berikut ke dalam isim, fi'il, atau huruf.",
        deadline: new Date(now.getTime() + 5 * 86400000),
        poin_maksimal: 100,
        status: "aktif",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 25,
        pertemuan_id: createdPertemuan[16].id,
      },
    });
    const soalARBSMP1 = await prisma.tugasSoal.create({
      data: {
        tugas_id: tugasARBSMP.id,
        nomor_urut: 1,
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Kata 'يَكْتُبُ' (Yaktubu) termasuk dalam kategori...",
        bobot_poin: 100,
        kunci_jawaban: "B",
        pembahasan: "Yaktubu adalah Fi'il Mudhari' (kata kerja yang menunjukkan perbuatan sekarang/akan datang).",
      },
    });
    await prisma.tugasSoalOpsi.createMany({
      data: [
        { soal_id: soalARBSMP1.id, label: "A", teks_opsi: "Isim (Kata Benda)", is_benar: false, nomor_urut: 1 },
        { soal_id: soalARBSMP1.id, label: "B", teks_opsi: "Fi'il (Kata Kerja)", is_benar: true, nomor_urut: 2 },
        { soal_id: soalARBSMP1.id, label: "C", teks_opsi: "Huruf Jar", is_benar: false, nomor_urut: 3 },
        { soal_id: soalARBSMP1.id, label: "D", teks_opsi: "Zharaf Makan", is_benar: false, nomor_urut: 4 },
      ],
    });

    // --- Tugas 9: Pre-Test Awal Semester (Tugas Selesai / Ditutup / Lampau) ---
    await prisma.tugas.create({
      data: {
        kelas_id: kSD1.id,
        mapel_id: mapelIPAS.id,
        guru_id: guruSD.id,
        judul: "Penjajakan Awal: Diagnostic Assessment IPAS",
        deskripsi: "Tugas pemetaan awal kompetensi IPA kelas 4.",
        deadline: new Date(now.getTime() - 10 * 86400000),
        poin_maksimal: 100,
        status: "selesai",
        tipe_pengerjaan: "INTERAKTIF",
        durasi_menit: 20,
      },
    });

    // 8. SEED SUBMISSIONS SISWA REALISTIS & MULTI-KONDISI
    console.log("📊 Menyiapkan Submisi Siswa & Penilaian Beragam...");

    // Submisi Rayhan pada Tugas IPAS (Nilai 95)
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
        durasi_detik: 1200,
      },
    });
    await prisma.tugasJawabanSiswa.createMany({
      data: [
        { submission_id: subSD_IPAS.id, soal_id: soalIPAS1.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 20 },
        { submission_id: subSD_IPAS.id, soal_id: soalIPAS2.id, jawaban_siswa: "B", is_benar: true, poin_didapat: 20 },
        {
          submission_id: subSD_IPAS.id,
          soal_id: soalIPAS3.id,
          jawaban_siswa: "Jika katak berkurang drastis, hama belalang akan bertambah banyak dan merusak tanaman padi. Ular sawah juga akan kekurangan makanan.",
          is_benar: true,
          poin_didapat: 55,
        },
      ],
    });

    // Submisi Rayhan pada Kliping (Upload Berkas - Sudah Dinilai 94)
    await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasKlipingSD.id,
        siswa_id: siswaSD.id,
        status: "sudah_dinilai",
        nilai: 94,
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Kliping_Siklus_Air_Rayhan.pdf",
        file_type: "application/pdf",
        catatan_guru: "Kliping sangat rapi dengan foto dokumentasi metamorfosis yang jelas. Sangat baik!",
        submitted_at: new Date(now.getTime() - 1 * 86400000),
        graded_at: new Date(now.getTime() - 12 * 3600000),
        graded_by: guruSD.id,
      },
    });

    // Submisi Rayhan pada PAI (Nilai 100)
    const subSD_PAI = await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasPAI.id,
        siswa_id: siswaSD.id,
        status: "sudah_dinilai",
        nilai: 100,
        nilai_otomatis: 100,
        catatan_guru: "Mumtaz! Pemahaman rukun iman dan adab sangat baik. Pertahankan terus ya siswa teladan.",
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
        { submission_id: subSD_PAI.id, soal_id: soalPAI1.id, jawaban_siswa: "C", is_benar: true, poin_didapat: 50 },
        { submission_id: subSD_PAI.id, soal_id: soalPAI2.id, jawaban_siswa: "A", is_benar: true, poin_didapat: 50 },
      ],
    });

    // Submisi Haidar SMP pada MTK (Nilai 92)
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
          jawaban_siswa: "Keliling = 2(3x + 4) = 32 => 6x + 8 = 32 => 6x = 24 => x = 4. Maka panjang = 11 cm dan lebar = 5 cm.",
          is_benar: true,
          poin_didapat: 42,
        },
      ],
    });

    // Submisi Haidar SMP pada English Descriptive Essay (Nilai 96)
    await prisma.tugasSubmission.create({
      data: {
        tugas_id: tugasDescriptiveSMP.id,
        siswa_id: siswaSMP.id,
        status: "sudah_dinilai",
        nilai: 96,
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Kliping_Siklus_Air_Rayhan.pdf",
        file_type: "application/pdf",
        catatan_guru: "Splendid vocabulary and grammatical accuracy. Your portrayal of Salahuddin Al-Ayyubi is very touching.",
        submitted_at: new Date(now.getTime() - 1 * 86400000),
        graded_at: new Date(now.getTime() - 18 * 3600000),
        graded_by: walasSMP.id,
      },
    });

    // Submisi Haidar SMP pada English Quiz (Nilai 100)
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

    // Submisi Siswa Lain di Kelas 4 (SD) & Kelas 7 (SMP)
    // Menghasilkan situasi riil: sebagian sudah dinilai, sebagian menunggu penilaian guru!
    const sampleScores = [98, 90, 85, 88, 92, 80, 78];
    for (let i = 0; i < peersSD.length; i++) {
      const peer = peersSD[i];
      const isPending = i === 0 || i === 1; // 2 siswa berstatus "dikumpulkan" (menunggu dinilai)
      await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasIPAS.id,
          siswa_id: peer.id,
          status: isPending ? "dikumpulkan" : "sudah_dinilai",
          nilai: isPending ? null : sampleScores[i % sampleScores.length],
          nilai_otomatis: 40,
          nilai_manual: isPending ? null : sampleScores[i % sampleScores.length] - 40,
          catatan_guru: isPending ? null : "Jawaban baik dan telah diverifikasi oleh ustadzah.",
          total_soal: 3,
          total_benar: 2,
          submitted_at: new Date(now.getTime() - (i + 1) * 3600000 * 6),
          graded_at: isPending ? null : new Date(now.getTime() - (i + 1) * 3600000 * 3),
          graded_by: isPending ? null : guruSD.id,
        },
      });

      // Submisi kliping untuk 3 siswa lainnya
      if (i < 3) {
        await prisma.tugasSubmission.create({
          data: {
            tugas_id: tugasKlipingSD.id,
            siswa_id: peer.id,
            status: i === 0 ? "dikumpulkan" : "sudah_dinilai",
            nilai: i === 0 ? null : 90 + i * 2,
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Kliping_Siklus_Air_Rayhan.pdf",
        file_type: "application/pdf",
            submitted_at: new Date(now.getTime() - 20 * 3600000),
          },
        });
      }
    }

    for (let i = 0; i < peersSMP.length; i++) {
      const peer = peersSMP[i];
      const isPending = i === 0;
      await prisma.tugasSubmission.create({
        data: {
          tugas_id: tugasMTK.id,
          siswa_id: peer.id,
          status: isPending ? "dikumpulkan" : "sudah_dinilai",
          nilai: isPending ? null : sampleScores[i % sampleScores.length],
          nilai_otomatis: 50,
          catatan_guru: isPending ? null : "Perhitungan rapi, pertahankan ketelitian.",
          total_soal: 3,
          total_benar: 2,
          submitted_at: new Date(now.getTime() - (i + 1) * 3600000 * 8),
          graded_at: isPending ? null : new Date(now.getTime() - (i + 1) * 3600000 * 4),
          graded_by: isPending ? null : guruSMP.id,
        },
      });

      if (i < 3) {
        await prisma.tugasSubmission.create({
          data: {
            tugas_id: tugasDescriptiveSMP.id,
            siswa_id: peer.id,
            status: i === 0 ? "dikumpulkan" : "sudah_dinilai",
            nilai: i === 0 ? null : 88 + i * 3,
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        file_name: "Kliping_Siklus_Air_Rayhan.pdf",
        file_type: "application/pdf",
            submitted_at: new Date(now.getTime() - 15 * 3600000),
          },
        });
      }
    }

    // 9. SEED PRESENSI LENGKAP 14 HARI (Multi-Kondisi: Hadir, Sakit, Izin, Alpa)
    console.log("📋 Menyiapkan Rekap Presensi KBM 14 Hari...");

    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const formatMonth = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const allStudentsSD = await prisma.user.findMany({
      where: { kelas: kSD1.nama_kelas, status: "1" },
      select: { id: true },
    });
    const allStudentsSMP = await prisma.user.findMany({
      where: { kelas: kSMP1.nama_kelas, status: "1" },
      select: { id: true },
    });

    const absenBatch = [];

    // Buat riwayat presensi 10 hari sekolah efektif
    for (let dayOffset = 0; dayOffset <= 13; dayOffset++) {
      const d = new Date(now.getTime() - dayOffset * 86400000);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Lewati Sabtu & Minggu

      const dateStr = formatDate(d);
      const monthStr = formatMonth(d);

      // Sesi SD 1: IPAS
      for (const s of allStudentsSD) {
        let ket = "Hadir";
        let ctt: string | null = null;
        if (s.id === siswaSD.id && dayOffset === 4) {
          ket = "Izin";
          ctt = "Izin acara keluarga resmi";
        } else if (s.id === siswaSD.id && dayOffset === 9) {
          ket = "Sakit";
          ctt = "Demam dan flu (surat dokter terlampir)";
        } else if (dayOffset === 2 && s.id === allStudentsSD[2]?.id) {
          ket = "Sakit";
          ctt = "Sakit surat izin orang tua";
        } else if (dayOffset === 6 && s.id === allStudentsSD[3]?.id) {
          ket = "Izin";
          ctt = "Izin pembinaan lomba";
        }

        absenBatch.push({
          user_id: s.id,
          kelas: kSD1.nama_kelas,
          kelas_id: kSD1.id,
          mapel_id: mapelIPAS.id,
          guru_id: guruSD.id,
          keterangan: ket,
          catatan: ctt,
          date: dateStr,
          month: monthStr,
          jam_ke: "1-2",
        });
      }

      // Sesi SD 2: PAI
      for (const s of allStudentsSD) {
        let ket = "Hadir";
        let ctt: string | null = null;
        if (s.id === siswaSD.id && (dayOffset === 4 || dayOffset === 9)) {
          ket = dayOffset === 4 ? "Izin" : "Sakit";
          ctt = dayOffset === 4 ? "Izin acara keluarga resmi" : "Demam dan flu (surat dokter)";
        }

        absenBatch.push({
          user_id: s.id,
          kelas: kSD1.nama_kelas,
          kelas_id: kSD1.id,
          mapel_id: mapelPAI.id,
          guru_id: walasSD.id,
          keterangan: ket,
          catatan: ctt,
          date: dateStr,
          month: monthStr,
          jam_ke: "3-4",
        });
      }

      // Sesi SMP 1: MTK
      for (const s of allStudentsSMP) {
        let ket = "Hadir";
        let ctt: string | null = null;
        if (s.id === siswaSMP.id && dayOffset === 6) {
          ket = "Izin";
          ctt = "Izin persiapan seleksi lomba matematika";
        } else if (dayOffset === 3 && s.id === allStudentsSMP[2]?.id) {
          ket = "Sakit";
          ctt = "Sakit demam";
        }

        absenBatch.push({
          user_id: s.id,
          kelas: kSMP1.nama_kelas,
          kelas_id: kSMP1.id,
          mapel_id: mapelMTK.id,
          guru_id: guruSMP.id,
          keterangan: ket,
          catatan: ctt,
          date: dateStr,
          month: monthStr,
          jam_ke: "1-2",
        });
      }

      // Sesi SMP 2: Bahasa Inggris
      for (const s of allStudentsSMP) {
        let ket = "Hadir";
        absenBatch.push({
          user_id: s.id,
          kelas: kSMP1.nama_kelas,
          kelas_id: kSMP1.id,
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

    // 10. SEED PRESTASI SISWA LENGKAP DI SEMUA KELAS (SD & SMP)
    console.log("🏆 Menyiapkan Prestasi Siswa Lengkap di Semua Kelas...");

    // Daftar template prestasi kaya & variatif
    const templateCatalog = [
      { prestasi: "Medali Emas Islamic Science Olympiad Tingkat Internasional", tingkat: "Internasional", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Musabaqah Hifdzil Qur'an (MHQ) 3 Juz Tingkat Nasional", tingkat: "Nasional", peringkat: "Juara 1" },
      { prestasi: "Gold Medalist International Youth English Debate & Storytelling", tingkat: "Internasional", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Olimpiade Sains & Matematika Nasional (OSMN) 2026", tingkat: "Nasional", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Turnamen Panahan Tradisional Pelajar Se-Sumbagsel", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Olimpiade Bahasa Arab (OBA) Tingkat Provinsi Sumatera Selatan", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 2 Lomba Kaligrafi Kontemporer Pelajar Se-Kota Palembang", tingkat: "Daerah/Kota", peringkat: "Juara 2" },
      { prestasi: "Juara 1 English Speech & Story Telling Contest Al-Azhar Cup 2026", tingkat: "Dalam Sekolah", peringkat: "Juara 1" },
      { prestasi: "Juara 1 MHQ 5 Juz Festival Anak Sholeh Indonesia (FASI) Sumsel", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Kejuaraan Taekwondo Pelajar Antar Dojang Se-Sumatera", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 2 Lomba Cerdas Cermat PAI Pelajar Se-Kota Palembang", tingkat: "Daerah/Kota", peringkat: "Juara 2" },
      { prestasi: "Juara 1 Lomba Da'i Cilik PAI Tingkat Pelajar se-Sumatera Selatan", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Medali Perak International Kangaroo Mathematics Contest (IKMC)", tingkat: "Internasional", peringkat: "Juara 2" },
      { prestasi: "Juara 1 Lomba Robotik Line Follower Pelajar Nasional", tingkat: "Nasional", peringkat: "Juara 1" },
      { prestasi: "Juara 3 Olimpiade Sains Kuark (OSK) Tingkat Nasional", tingkat: "Nasional", peringkat: "Juara 3" },
      { prestasi: "Juara 1 Lomba Cipta & Baca Puisi Islami Kota Palembang", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Lomba Tartil Qur'an Pekan Keterampilan & Seni PAI", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 2 Festival Seni Nasyid & Hadroh Ramadhan 1447 H", tingkat: "Daerah/Kota", peringkat: "Juara 2" },
      { prestasi: "Juara 1 Turnamen Futsal Pelajar Antar Sekolah Islam Se-Palembang", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara Harapan 1 National English Spelling Bee Championship", tingkat: "Nasional", peringkat: "Harapan" },
      { prestasi: "Medali Perunggu Asian Science & Mathematics Olympiad (ASMO)", tingkat: "Internasional", peringkat: "Juara 3" },
      { prestasi: "Juara 1 Musabaqah Khaththil Qur'an (MKQ) Hiasan Mushaf", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
      { prestasi: "Juara 1 Lomba Menulis Cerpen Islami Tingkat Pelajar", tingkat: "Dalam Sekolah", peringkat: "Juara 1" },
      { prestasi: "Juara 2 Olimpiade Astronomi & Sains Dasar Pelajar", tingkat: "Daerah/Kota", peringkat: "Juara 2" },
      { prestasi: "Juara 1 Pencak Silat Tapak Suci Pelajar Tingkat Daerah", tingkat: "Daerah/Kota", peringkat: "Juara 1" },
    ];

    const prestasiToInsert: any[] = [];

    // --- A. Prestasi Zahra Salsabila (TOP 1 SD - Akumulasi 36 Poin) ---
    const zahra = await prisma.user.findFirst({
      where: { name: { contains: "Zahra" }, kelas: kSD1.nama_kelas },
    });
    const zahraId = zahra ? zahra.id.toString() : "21";
    const zahraName = zahra ? zahra.name : "Zahra Salsabila";

    prestasiToInsert.push(
      {
        id_user: zahraId,
        nama: zahraName,
        kelas: kSD1.nama_kelas,
        kelas_saat_prestasi: "Kelas 4",
        tahun_ajaran: "2025/2026",
        tingkat: "Internasional",
        peringkat: "Juara 1",
        poin: 16,
        jenjang: "SD",
        fotoanak: "/images/best-point.avif",
        prestasi: "Medali Emas International Islamic Science & Quranic Olympiad",
        tanggal_prestasi: new Date(now.getTime() - 10 * 86400000),
        created_at: new Date(now.getTime() - 10 * 86400000),
      },
      {
        id_user: zahraId,
        nama: zahraName,
        kelas: kSD1.nama_kelas,
        kelas_saat_prestasi: "Kelas 4",
        tahun_ajaran: "2025/2026",
        tingkat: "Nasional",
        peringkat: "Juara 1",
        poin: 12,
        jenjang: "SD",
        fotoanak: "/images/best-point.avif",
        prestasi: "Juara 1 Musabaqah Hifdzil Qur'an (MHQ) 3 Juz Tingkat Nasional",
        tanggal_prestasi: new Date(now.getTime() - 25 * 86400000),
        created_at: new Date(now.getTime() - 25 * 86400000),
      },
      {
        id_user: zahraId,
        nama: zahraName,
        kelas: kSD1.nama_kelas,
        kelas_saat_prestasi: "Kelas 4",
        tahun_ajaran: "2025/2026",
        tingkat: "Daerah/Kota",
        peringkat: "Juara 1",
        poin: 8,
        jenjang: "SD",
        fotoanak: "/images/best-point.avif",
        prestasi: "Juara 1 Olimpiade Matematika Pelajar SD Se-Sumatera Selatan",
        tanggal_prestasi: new Date(now.getTime() - 40 * 86400000),
        created_at: new Date(now.getTime() - 40 * 86400000),
      }
    );

    // --- B. Prestasi Siswa SD Demo (Muhammad Rayhan Al-Fatih - Akumulasi 20 Poin) ---
    prestasiToInsert.push(
      {
        id_user: siswaSD.id.toString(),
        nama: siswaSD.name,
        kelas: kSD1.nama_kelas,
        kelas_saat_prestasi: "Kelas 4",
        tahun_ajaran: "2025/2026",
        tingkat: "Nasional",
        peringkat: "Juara 1",
        poin: 12,
        jenjang: "SD",
        fotoanak: "/images/best-student.avif",
        prestasi: "Juara 1 Olimpiade Sains & Matematika Nasional (OSMN) 2026",
        tanggal_prestasi: new Date(now.getTime() - 5 * 86400000),
        created_at: new Date(now.getTime() - 5 * 86400000),
      },
      {
        id_user: siswaSD.id.toString(),
        nama: siswaSD.name,
        kelas: kSD1.nama_kelas,
        kelas_saat_prestasi: "Kelas 4",
        tahun_ajaran: "2025/2026",
        tingkat: "Daerah/Kota",
        peringkat: "Juara 1",
        poin: 8,
        jenjang: "SD",
        fotoanak: "/images/best-student.avif",
        prestasi: "Juara 1 Turnamen Panahan Tradisional Pelajar Al-Azhar Se-Sumbagsel",
        tanggal_prestasi: new Date(now.getTime() - 20 * 86400000),
        created_at: new Date(now.getTime() - 20 * 86400000),
      }
    );

    // --- C. Prestasi Siswa SMP Demo (Haidar Ali SMP - TOP 1 SMP - Akumulasi 36 Poin) ---
    prestasiToInsert.push(
      {
        id_user: siswaSMP.id.toString(),
        nama: siswaSMP.name,
        kelas: kSMP1.nama_kelas,
        kelas_saat_prestasi: "Kelas 7",
        tahun_ajaran: "2025/2026",
        tingkat: "Internasional",
        peringkat: "Juara 1",
        poin: 16,
        jenjang: "SMP",
        fotoanak: "/images/best-student.avif",
        prestasi: "Gold Medalist International Youth English Debate & Storytelling",
        tanggal_prestasi: new Date(now.getTime() - 8 * 86400000),
        created_at: new Date(now.getTime() - 8 * 86400000),
      },
      {
        id_user: siswaSMP.id.toString(),
        nama: siswaSMP.name,
        kelas: kSMP1.nama_kelas,
        kelas_saat_prestasi: "Kelas 7",
        tahun_ajaran: "2025/2026",
        tingkat: "Nasional",
        peringkat: "Juara 1",
        poin: 12,
        jenjang: "SMP",
        fotoanak: "/images/best-student.avif",
        prestasi: "Juara 1 Olimpiade Sains & Matematika Pelajar SMP Nasional",
        tanggal_prestasi: new Date(now.getTime() - 22 * 86400000),
        created_at: new Date(now.getTime() - 22 * 86400000),
      },
      {
        id_user: siswaSMP.id.toString(),
        nama: siswaSMP.name,
        kelas: kSMP1.nama_kelas,
        kelas_saat_prestasi: "Kelas 7",
        tahun_ajaran: "2025/2026",
        tingkat: "Daerah/Kota",
        peringkat: "Juara 1",
        poin: 8,
        jenjang: "SMP",
        fotoanak: "/images/best-student.avif",
        prestasi: "Juara 1 Musabaqah Tilawatil Qur'an (MTQ) Pelajar SMP Se-Sumsel",
        tanggal_prestasi: new Date(now.getTime() - 35 * 86400000),
        created_at: new Date(now.getTime() - 35 * 86400000),
      }
    );

    // --- D. Prestasi Merata di Seluruh Kelas Lainnya ---
    const allClasses = await prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    });

    let catIdx = 4;
    for (const c of allClasses) {
      // Lewati kelas utama jika sudah terisi Zahra & Haidar
      const isMainSD = c.nama_kelas === kSD1.nama_kelas;
      const isMainSMP = c.nama_kelas === kSMP1.nama_kelas;

      const studentInClass = await prisma.user.findFirst({
        where: { kelas: c.nama_kelas, status: { in: ["0", "1"] } },
        select: { id: true, name: true, kelas: true, jenjang: true },
      });

      if (studentInClass && !isMainSD && !isMainSMP) {
        const tpl = templateCatalog[catIdx % templateCatalog.length];
        const poin = calculateAchievementPoints(tpl.tingkat as any, tpl.peringkat as any);
        const daysAgo = 10 + (catIdx * 3) % 90;

        prestasiToInsert.push({
          id_user: studentInClass.id.toString(),
          nama: studentInClass.name,
          kelas: c.nama_kelas,
          kelas_saat_prestasi: c.nama_kelas.split("-")[0].trim(),
          tahun_ajaran: "2025/2026",
          tingkat: tpl.tingkat,
          peringkat: tpl.peringkat,
          poin: poin,
          jenjang: c.jenjang || "SD",
          fotoanak: catIdx % 2 === 0 ? "/images/best-student.avif" : "/images/best-point.avif",
          prestasi: tpl.prestasi,
          tanggal_prestasi: new Date(now.getTime() - daysAgo * 86400000),
          created_at: new Date(now.getTime() - daysAgo * 86400000),
        });
        catIdx++;
      }
    }

    // Insert semua prestasi secara bertahap
    for (const p of prestasiToInsert) {
      await prisma.prestasi.create({ data: p });
    }

    // 11. SEED CATATAN KEDISIPLINAN & PEMBINAAN (tbl_pelanggaran)
    console.log("🛡️ Menyiapkan Catatan Kedisiplinan & Pelanggaran Demo...");
    const pelanggaranList = [
      {
        user_id: siswaSMP.id.toString(),
        nama: siswaSMP.name,
        kelas: kSMP1.nama_kelas,
        kategori: "Apresiasi Kedisiplinan & Adab",
        keterangan: "Apresiasi kedisiplinan: Siswa proaktif membantu ustadz merapikan shaf musholla dan menjadi muadzin sholat dhuha berjamaah.",
        tingkatan: "Positif",
        semester: "Semester 1",
        tahun_pelajaran: "2026/2027",
        jenjang: "SMP",
        guru_id: walasSMP.id,
        guru_nama: walasSMP.name,
        created_at: new Date(now.getTime() - 2 * 86400000),
      },
      {
        user_id: siswaSD.id.toString(),
        nama: siswaSD.name,
        kelas: kSD1.nama_kelas,
        kategori: "Kedisiplinan Waktu",
        keterangan: "Terlambat 7 menit masuk kelas pada jam ke-1 dikarenakan kendala hujan lebat di perjalanan. Siswa telah melapor dan selesai dibina.",
        tingkatan: "Ringan",
        semester: "Semester 1",
        tahun_pelajaran: "2026/2027",
        jenjang: "SD",
        guru_id: walasSD.id,
        guru_nama: walasSD.name,
        created_at: new Date(now.getTime() - 5 * 86400000),
      },
      {
        user_id: peersSD[0]?.id.toString() || siswaSD.id.toString(),
        nama: peersSD[0]?.name || "Siswa Kelas 4",
        kelas: kSD1.nama_kelas,
        kategori: "Kerapian Seragam",
        keterangan: "Lupa mengenakan kopiah seragam saat upacara bendera hari Senin. Telah diingatkan oleh wali kelas.",
        tingkatan: "Ringan",
        semester: "Semester 1",
        tahun_pelajaran: "2026/2027",
        jenjang: "SD",
        guru_id: walasSD.id,
        guru_nama: walasSD.name,
        created_at: new Date(now.getTime() - 7 * 86400000),
      },
      {
        user_id: peersSMP[0]?.id.toString() || siswaSMP.id.toString(),
        nama: peersSMP[0]?.name || "Siswa Kelas 7",
        kelas: kSMP1.nama_kelas,
        kategori: "Kedisiplinan Belajar",
        keterangan: "Lupa membawa buku panduan praktikum IPA. Sudah meminjam buku cadangan perpustakaan.",
        tingkatan: "Ringan",
        semester: "Semester 1",
        tahun_pelajaran: "2026/2027",
        jenjang: "SMP",
        guru_id: guruSMP.id,
        guru_nama: guruSMP.name,
        created_at: new Date(now.getTime() - 4 * 86400000),
      },
    ];

    for (const pel of pelanggaranList) {
      await prisma.pelanggaran.create({ data: pel });
    }

    // 12. SEED PENGUMUMAN RESMI SEKOLAH (tbl_pengumuman)
    console.log("📢 Menyiapkan Pengumuman Resmi Sekolah...");
    const pengumumanList = [
      {
        from: "Kesiswaan Al-Azhar Cairo",
        title: "Pekan Penilaian Tengah Semester (PTS) Semester Ganjil T.A 2026/2027",
        file: null,
        pengumuman: "Diberitahukan kepada seluruh ustadz/ustadzah, siswa, dan orang tua murid bahwa Pekan Penilaian Tengah Semester (PTS) akan diselenggarakan secara serentak. Siswa diimbau menjaga kesehatan dan mempersiapkan diri dengan baik.",
        like: "42",
        jenjang: "ALL",
        target_role: "ALL",
        target_kelas: null,
        created_at: new Date(now.getTime() - 3 * 86400000),
      },
      {
        from: "Kurikulum Al-Azhar Cairo",
        title: "Semarak Ramadhan 1447 H & Pesantren Kilat Siswa Al-Azhar Cairo",
        file: null,
        pengumuman: "Menyambut bulan suci Ramadhan 1447 H, sekolah akan mengadakan rangkaian Pesantren Kilat, Khotmil Qur'an, dan Lomba Keagamaan Islami untuk seluruh jenjang SD dan SMP.",
        like: "68",
        jenjang: "ALL",
        target_role: "ALL",
        target_kelas: null,
        created_at: new Date(now.getTime() - 6 * 86400000),
      },
      {
        from: "Ustadzah Fatimah, S.Pd",
        title: "Outing Class Edukatif ke Museum Balaputradeva & Rumah Limas",
        file: null,
        pengumuman: "Assalamu'alaikum wr wb. Khusus untuk ananda siswa Kelas 4 - Mehmed Al Fatih, kegiatan Outing Class bertema Pengenalan Sejarah & Budaya Lokal akan dilaksanakan hari Kamis depan. Harap membawa perlengkapan sholat dan buku catatan.",
        like: "28",
        jenjang: "SD",
        target_role: "siswa",
        target_kelas: kSD1.nama_kelas,
        created_at: new Date(now.getTime() - 1 * 86400000),
      },
      {
        from: "Ustadz Farhan, S.Pd",
        title: "Sosialisasi Lomba National English Storytelling & Science Competition",
        file: null,
        pengumuman: "Pendaftaran delegasi lomba Bahasa Inggris dan Sains tingkat Nasional telah dibuka. Bagi ananda siswa SMP yang berminat mengikuti seleksi internal sekolah, silakan menghubungi Ustadz Farhan di ruang guru.",
        like: "35",
        jenjang: "SMP",
        target_role: "siswa",
        target_kelas: null,
        created_at: new Date(now.getTime() - 4 * 86400000),
      },
      {
        from: "Kurikulum Al-Azhar Cairo",
        title: "Panduan Pembelajaran Tatap Maya & Etika Digital Kelas Online",
        file: null,
        pengumuman: "Seluruh siswa diharapkan mengaktifkan kamera video (on-cam), mengenakan seragam rapi, dan menggunakan mikrofon secara tertib saat sesi tatap maya berlangsung pada portal kelas online.",
        like: "51",
        jenjang: "ALL",
        target_role: "ALL",
        target_kelas: null,
        created_at: new Date(now.getTime() - 8 * 86400000),
      },
    ];

    for (const peng of pengumumanList) {
      await prisma.pengumuman.create({ data: peng });
    }

    // 13. SEED CHAT ROOM & PESAN DEMO LENGKAP (5 Room Aktif)
    console.log("💬 Menyiapkan Riwayat Pesan Chat Realistis (5 Room)...");

    // Room 1: Walas SD <-> Siswa SD (Rayhan)
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
          message: "Assalamu'alaikum Rayhan, jangan lupa latihan hafalan Surah Al-Mulk ayat 1-15 untuk persiapan wisuda tahfidz ya.",
          is_read: true,
          created_at: new Date(now.getTime() - 14400000),
        },
        {
          room_id: chatRoomSD.id,
          sender_id: siswaSD.id,
          message: "Wa'alaikumsalam Ustadzah, baik insyaAllah siap! Saat ini sudah lancar sampai ayat 15.",
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

    // Room 2: Guru SD (Nurul) <-> Siswa SD (Rayhan)
    const chatRoomGuruSD = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        user_one_id: guruSD.id,
        user_two_id: siswaSD.id,
        last_message: "Sangat bagus Rayhan! Jawaban kliping metamorfosis kupu-kupumu sudah ustadzah periksa dan nilainya memuaskan.",
        last_message_at: new Date(now.getTime() - 1800000),
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        {
          room_id: chatRoomGuruSD.id,
          sender_id: siswaSD.id,
          message: "Ustadzah Nurul, apakah tugas kliping rantai makanan boleh ditambahkan foto hewan dari majalah sains?",
          is_read: true,
          created_at: new Date(now.getTime() - 86400000),
        },
        {
          room_id: chatRoomGuruSD.id,
          sender_id: guruSD.id,
          message: "Tentu sangat boleh Rayhan, justru itu akan menambah nilai kerapian dan kreativitas portofoliomu.",
          is_read: true,
          created_at: new Date(now.getTime() - 43200000),
        },
        {
          room_id: chatRoomGuruSD.id,
          sender_id: guruSD.id,
          message: "Sangat bagus Rayhan! Jawaban kliping metamorfosis kupu-kupumu sudah ustadzah periksa dan nilainya memuaskan.",
          is_read: false, // Unread message untuk demo notifikasi
          created_at: new Date(now.getTime() - 1800000),
        },
      ],
    });

    // Room 3: Walas SMP (Farhan) <-> Siswa SMP (Haidar)
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

    // Room 4: Guru SMP (Wildan) <-> Siswa SMP (Haidar)
    const chatRoomGuruSMP = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        user_one_id: guruSMP.id,
        user_two_id: siswaSMP.id,
        last_message: "Benar sekali Haidar, sifat pindah ruas pada aljabar selalu berlawanan tanda. Pertahankan ketelitianmu!",
        last_message_at: new Date(now.getTime() - 900000),
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        {
          room_id: chatRoomGuruSMP.id,
          sender_id: siswaSMP.id,
          message: "Ustadz Wildan, untuk soal PLSV nomor 3 apakah tanda minus berubah menjadi positif jika dipindah ke ruas kanan?",
          is_read: true,
          created_at: new Date(now.getTime() - 7200000),
        },
        {
          room_id: chatRoomGuruSMP.id,
          sender_id: guruSMP.id,
          message: "Benar sekali Haidar, sifat pindah ruas pada aljabar selalu berlawanan tanda. Pertahankan ketelitianmu!",
          is_read: false,
          created_at: new Date(now.getTime() - 900000),
        },
      ],
    });

    // Room 5: Walas SD (Fatimah) <-> Guru SD (Nurul)
    const chatRoomGuruInternal = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        user_one_id: walasSD.id,
        user_two_id: guruSD.id,
        last_message: "Baik Ustadzah Nurul, jadwal bimbingan belajar tambahan untuk kelas 4 sudah saya koordinasikan dengan wali murid.",
        last_message_at: new Date(now.getTime() - 600000),
      },
    });
    await prisma.chatMessage.createMany({
      data: [
        {
          room_id: chatRoomGuruInternal.id,
          sender_id: guruSD.id,
          message: "Ustadzah Fatimah, bagaimana kesiapan anak-anak kelas 4 untuk asesmen formatif pekan ini?",
          is_read: true,
          created_at: new Date(now.getTime() - 3600000),
        },
        {
          room_id: chatRoomGuruInternal.id,
          sender_id: walasSD.id,
          message: "Baik Ustadzah Nurul, jadwal bimbingan belajar tambahan untuk kelas 4 sudah saya koordinasikan dengan wali murid.",
          is_read: true,
          created_at: new Date(now.getTime() - 600000),
        },
      ],
    });

    // 14. Simpan status di SystemSetting
    await SystemSettingService.setSetting(
      "ENABLE_DEMO_DATA",
      "true",
      "Status data contoh (sample data) aktif pada dashboard akun demo"
    );

    console.log("✅ [DemoDataService] Seluruh data contoh akun demo berhasil diisikan lengkap di semua fitur!");

    return {
      success: true,
      message: "Data contoh akun demo berhasil diaktifkan dan diisi lengkap di semua fitur!",
      count: {
        jadwal: createdJadwal.length,
        pertemuan: createdPertemuan.length,
        tugas: 9,
        submissions: 6 + peersSD.length + peersSMP.length,
        absensi: absenBatch.length,
        prestasi: prestasiToInsert.length,
        pelanggaran: pelanggaranList.length,
        pengumuman: pengumumanList.length,
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
      where: {
        OR: [
          { id_user: { in: studentIdStrs } },
          { fotoanak: { in: ["/images/best-student.avif", "/images/best-point.avif"] } },
        ],
      },
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

    // 8. Pelanggaran demo
    await prisma.pelanggaran.deleteMany({
      where: {
        OR: [
          { user_id: { in: studentIdStrs } },
          { guru_id: { in: teacherIds } },
        ],
      },
    });

    // 9. Pengumuman demo
    await prisma.pengumuman.deleteMany({
      where: {
        from: {
          in: [
            "Ustadzah Fatimah, S.Pd",
            "Ustadz Farhan, S.Pd",
            "Kurikulum Al-Azhar Cairo",
            "Kesiswaan Al-Azhar Cairo",
          ],
        },
      },
    });

    console.log("✅ [DemoDataService] Internal cleaner selesai.");
  }
}
