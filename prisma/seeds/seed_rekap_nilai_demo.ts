import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

interface DemoTeacherSpec {
  email: string;
  name: string;
  status: string;
  jenjang: "SD" | "SMP" | "ALL";
  gender: "L" | "P";
  nip: string;
  guru_bidang: string;
  kelas?: string;
}

interface DemoStudentSpec {
  email: string;
  name: string;
  nis: string;
  gender: "L" | "P";
  jenjang: "SD" | "SMP";
  kelas: string;
}

interface DemoTaskSpec {
  pertemuanKe: number;
  pertemuanJudul: string;
  judul: string;
  deskripsi: string;
  tipePengerjaan: "INTERAKTIF" | "LEMBAR_KERJA";
  poinMaksimal: number;
  daysOffset: number; // negatif = sudah lewat deadline, positif = masih berjalan
}

type SubmissionScenario =
  | { kind: "graded"; score: number; catatan: string; late?: boolean }
  | { kind: "waiting"; late?: boolean }
  | { kind: "revision"; catatan: string }
  | { kind: "missing" };

async function ensureDemoTeachers(hashGuru: string) {
  const specs: DemoTeacherSpec[] = [
    {
      email: "guru.sd@gmail.com",
      name: "Ustadzah Nurul, S.Pd",
      status: "2",
      jenjang: "SD",
      gender: "P",
      nip: "198902142013012003",
      guru_bidang: "Tematik & IPAS",
    },
    {
      email: "walas.sd@gmail.com",
      name: "Ustadzah Fatimah, S.Pd",
      status: "4",
      jenjang: "SD",
      gender: "P",
      nip: "198501152010012001",
      guru_bidang: "Pendidikan Agama Islam",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },
    {
      email: "guru.smp@gmail.com",
      name: "Ustadz Wildan, M.Pd",
      status: "2",
      jenjang: "SMP",
      gender: "L",
      nip: "198604182012011002",
      guru_bidang: "Matematika SMP",
    },
    {
      email: "walas.smp@gmail.com",
      name: "Ustadz Farhan, S.Pd",
      status: "4",
      jenjang: "SMP",
      gender: "L",
      nip: "198703122011011005",
      guru_bidang: "Bahasa Inggris SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "guru.lintas@gmail.com",
      name: "Ustadz Ahmad, S.Pd.I",
      status: "2",
      jenjang: "ALL",
      gender: "L",
      nip: "198603202011011002",
      guru_bidang: "Bahasa Arab (SD & SMP)",
    },
  ];

  const teacherMap = new Map<string, bigint>();

  for (const spec of specs) {
    const existing = await prisma.user.findUnique({ where: { email: spec.email } });
    if (existing) {
      teacherMap.set(spec.email, existing.id);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        name: spec.name,
        email: spec.email,
        password: hashGuru,
        password1: "guru123",
        status: spec.status,
        jenjang: spec.jenjang,
        gender: spec.gender,
        nip: spec.nip,
        guru_bidang: spec.guru_bidang,
        kelas: spec.kelas ?? null,
        notes: `Akun Demo (${spec.guru_bidang})`,
      },
    });
    teacherMap.set(spec.email, created.id);
  }

  return teacherMap;
}

async function ensureDemoStudents(hashSiswa: string) {
  const specs: DemoStudentSpec[] = [
    // Siswa SD - Kelas 4 - Mehmed Al Fatih
    {
      email: "siswa.sd@gmail.com",
      name: "Muhammad Rayhan Al-Fatih",
      nis: "202404001",
      gender: "L",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },
    {
      email: "khalid.ghazi@siswa.alazhar.sch.id",
      name: "Khalid bin Walid Al-Ghazi",
      nis: "202404002",
      gender: "L",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },
    {
      email: "zahra.salsabila@siswa.alazhar.sch.id",
      name: "Zahra Amira Salsabila",
      nis: "202404003",
      gender: "P",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },
    {
      email: "umar.pratama@siswa.alazhar.sch.id",
      name: "Umar Al-Faruq Pratama",
      nis: "202404004",
      gender: "L",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },
    {
      email: "aisyah.humaira@siswa.alazhar.sch.id",
      name: "Aisyah Humaira Azzahra",
      nis: "202404005",
      gender: "P",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },
    {
      email: "bilal.hafizh@siswa.alazhar.sch.id",
      name: "Bilal Hafizh Ramadhan",
      nis: "202404006",
      gender: "L",
      jenjang: "SD",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    },

    // Siswa SMP - Kelas 7 - Ibnu Sina (memastikan rombel SMP berisi banyak siswa untuk matriks nilai)
    {
      email: "siswa.smp@gmail.com",
      name: "Haidar Ali SMP",
      nis: "202407001",
      gender: "L",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "nadia.azzahra.smp@siswa.alazhar.sch.id",
      name: "Nadia Azzahra Putri",
      nis: "202407002",
      gender: "P",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "fathan.ghazali.smp@siswa.alazhar.sch.id",
      name: "Fathan Al-Ghazali Hakim",
      nis: "202407003",
      gender: "L",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "salma.karimah.smp@siswa.alazhar.sch.id",
      name: "Salma Karimah Rahma",
      nis: "202407004",
      gender: "P",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "zaid.muhammad.smp@siswa.alazhar.sch.id",
      name: "Zaid Muhammad Rizky",
      nis: "202407005",
      gender: "L",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "hana.maryam.smp@siswa.alazhar.sch.id",
      name: "Hana Maryam Syifa",
      nis: "202407006",
      gender: "P",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "rafi.akbar.smp@siswa.alazhar.sch.id",
      name: "Rafi Akbar Wijaya",
      nis: "202407007",
      gender: "L",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
    {
      email: "yasmin.nabila.smp@siswa.alazhar.sch.id",
      name: "Yasmin Nabila Safira",
      nis: "202407008",
      gender: "P",
      jenjang: "SMP",
      kelas: "Kelas 7 - Ibnu Sina",
    },
  ];

  for (const spec of specs) {
    const existing = await prisma.user.findUnique({ where: { email: spec.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: spec.name,
          email: spec.email,
          password: hashSiswa,
          password1: "siswa123",
          status: "1",
          jenjang: spec.jenjang,
          gender: spec.gender,
          nis: spec.nis,
          kelas: spec.kelas,
          notes: `Siswa Demo Rekap Nilai (${spec.kelas})`,
        },
      });
    }
  }
}

async function ensureSchedule(params: {
  kelasId: bigint;
  mapelId: bigint;
  guruId: bigint;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
}) {
  const existing = await prisma.jadwalPelajaran.findFirst({
    where: {
      kelas_id: params.kelasId,
      mapel_id: params.mapelId,
      guru_id: params.guruId,
    },
  });

  if (!existing) {
    await prisma.jadwalPelajaran.create({
      data: {
        kelas_id: params.kelasId,
        mapel_id: params.mapelId,
        guru_id: params.guruId,
        hari: params.hari,
        jam_mulai: params.jamMulai,
        jam_selesai: params.jamSelesai,
      },
    });
  }
}

async function seedTrackForTeacher(params: {
  guruId: bigint;
  kelasId: bigint;
  kelasNama: string;
  mapelId: bigint;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  tasks: DemoTaskSpec[];
  scenarioMatrix: (studentIdx: number, taskIdx: number) => SubmissionScenario;
}) {
  const now = new Date();
  const shiftDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await ensureSchedule({
    kelasId: params.kelasId,
    mapelId: params.mapelId,
    guruId: params.guruId,
    hari: params.hari,
    jamMulai: params.jamMulai,
    jamSelesai: params.jamSelesai,
  });

  const students = await prisma.user.findMany({
    where: {
      kelas: params.kelasNama,
      status: "1",
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  let createdTasks = 0;
  let createdSubmissions = 0;

  for (let tIdx = 0; tIdx < params.tasks.length; tIdx++) {
    const taskSpec = params.tasks[tIdx];

    // Pastikan pertemuan tersedia
    let pertemuan = await prisma.pertemuan.findFirst({
      where: {
        kelas_id: params.kelasId,
        mapel_id: params.mapelId,
        pertemuan_ke: taskSpec.pertemuanKe,
      },
    });

    if (!pertemuan) {
      pertemuan = await prisma.pertemuan.create({
        data: {
          kelas_id: params.kelasId,
          mapel_id: params.mapelId,
          guru_id: params.guruId,
          pertemuan_ke: taskSpec.pertemuanKe,
          judul: taskSpec.pertemuanJudul,
          deskripsi: `Materi pembelajaran ${taskSpec.pertemuanJudul}.`,
          tanggal: shiftDays(taskSpec.daysOffset - 3),
          is_published: true,
        },
      });
    }

    // Idempoten berdasarkan (kelas_id, mapel_id, judul)
    let tugas = await prisma.tugas.findFirst({
      where: {
        kelas_id: params.kelasId,
        mapel_id: params.mapelId,
        judul: taskSpec.judul,
      },
    });

    if (!tugas) {
      tugas = await prisma.tugas.create({
        data: {
          kelas_id: params.kelasId,
          mapel_id: params.mapelId,
          guru_id: params.guruId,
          pertemuan_id: pertemuan.id,
          judul: taskSpec.judul,
          deskripsi: taskSpec.deskripsi,
          deadline: shiftDays(taskSpec.daysOffset),
          poin_maksimal: taskSpec.poinMaksimal,
          tipe_pengerjaan: taskSpec.tipePengerjaan,
          durasi_menit: taskSpec.tipePengerjaan === "INTERAKTIF" ? 30 : null,
          status: "aktif",
          tampilkan_nilai_instan: taskSpec.tipePengerjaan === "INTERAKTIF",
          file_petunjuk:
            taskSpec.tipePengerjaan === "LEMBAR_KERJA"
              ? "/images/SISFO-SD.png"
              : null,
        },
      });
      createdTasks++;

      if (taskSpec.tipePengerjaan === "INTERAKTIF") {
        const soal = await prisma.tugasSoal.create({
          data: {
            tugas_id: tugas.id,
            nomor_urut: 1,
            tipe_soal: "PILIHAN_GANDA",
            pertanyaan: `Soal evaluasi utama untuk: ${taskSpec.judul}`,
            bobot_poin: taskSpec.poinMaksimal,
            kunci_jawaban: "A",
            pembahasan: "Pembahasan evaluasi demo.",
          },
        });
        await prisma.tugasSoalOpsi.createMany({
          data: [
            { soal_id: soal.id, label: "A", teks_opsi: "Jawaban benar sesuai materi", is_benar: true, nomor_urut: 1 },
            { soal_id: soal.id, label: "B", teks_opsi: "Pilihan pengecoh 1", is_benar: false, nomor_urut: 2 },
            { soal_id: soal.id, label: "C", teks_opsi: "Pilihan pengecoh 2", is_benar: false, nomor_urut: 3 },
            { soal_id: soal.id, label: "D", teks_opsi: "Pilihan pengecoh 3", is_benar: false, nomor_urut: 4 },
          ],
        });
      }
    }

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const student = students[sIdx];
      const existingSub = await prisma.tugasSubmission.findUnique({
        where: {
          tugas_id_siswa_id: {
            tugas_id: tugas.id,
            siswa_id: student.id,
          },
        },
      });
      if (existingSub) continue;

      const scenario = params.scenarioMatrix(sIdx, tIdx);
      if (scenario.kind === "missing") continue;

      const submittedAt = shiftDays(taskSpec.daysOffset - (scenario.kind === "graded" && scenario.late ? -1 : 1));
      const isInteractive = taskSpec.tipePengerjaan === "INTERAKTIF";

      if (scenario.kind === "graded") {
        await prisma.tugasSubmission.create({
          data: {
            tugas_id: tugas.id,
            siswa_id: student.id,
            status: "sudah_dinilai",
            nilai: scenario.score,
            nilai_otomatis: isInteractive ? scenario.score : null,
            nilai_manual: isInteractive ? null : scenario.score,
            catatan_guru: scenario.catatan,
            submitted_at: submittedAt,
            graded_at: shiftDays(taskSpec.daysOffset),
            graded_by: params.guruId,
            file_url: isInteractive ? "interactive_cbt" : "/images/SISFO-SD.png",
            file_name: isInteractive
              ? "Pengerjaan Interaktif In-App"
              : `Lembar_Kerja_${student.name.replace(/\s+/g, "_")}.png`,
            file_type: isInteractive ? "interactive" : "png",
          },
        });
      } else if (scenario.kind === "waiting") {
        await prisma.tugasSubmission.create({
          data: {
            tugas_id: tugas.id,
            siswa_id: student.id,
            status: scenario.late ? "terlambat" : "menunggu_penilaian",
            nilai: null,
            submitted_at: submittedAt,
            file_url: isInteractive ? "interactive_cbt" : "/images/SISFO-SD.png",
            file_name: isInteractive
              ? "Pengerjaan Interaktif In-App"
              : `Tugas_${student.name.replace(/\s+/g, "_")}.png`,
            file_type: isInteractive ? "interactive" : "png",
          },
        });
      } else if (scenario.kind === "revision") {
        await prisma.tugasSubmission.create({
          data: {
            tugas_id: tugas.id,
            siswa_id: student.id,
            status: "perlu_revisi",
            nilai: null,
            catatan_guru: scenario.catatan,
            submitted_at: submittedAt,
            graded_at: shiftDays(taskSpec.daysOffset),
            graded_by: params.guruId,
            file_url: "/images/SISFO-SD.png",
            file_name: `Revisi_${student.name.replace(/\s+/g, "_")}.png`,
            file_type: "png",
          },
        });
      }
      createdSubmissions++;
    }
  }

  return {
    studentCount: students.length,
    createdTasks,
    createdSubmissions,
  };
}

function buildScenario(studentIdx: number, taskIdx: number): SubmissionScenario {
  // Pola variasi nilai agar semua edge-case matriks nilai muncul saat demo:
  // - Sebagian besar siswa punya nilai tuntas (>= 75) & beberapa < 75
  // - Ada 1-2 sel menunggu penilaian, terlambat, perlu revisi, dan belum mengumpulkan
  const scoreBank = [
    [95, 90, 92, 88, 96], // Siswa 0: Konsisten tinggi
    [85, 82, 88, 79, 84], // Siswa 1: Stabil tuntas
    [72, 68, 76, 70, 74], // Siswa 2: Perbatasan / di bawah KKM (< 75)
    [90, 86, 0, 84, 88],  // Siswa 3: 1 tugas belum dikoreksi / terlambat
    [78, 80, 75, 0, 82],  // Siswa 4: 1 tugas perlu revisi
    [60, 65, 70, 58, 0],  // Siswa 5: Belum tuntas + 1 tugas belum mengumpulkan
    [88, 91, 85, 89, 92], // Siswa 6: Tuntas
    [76, 74, 80, 78, 75], // Siswa 7: Tuntas tipis
  ];

  const row = scoreBank[studentIdx % scoreBank.length];
  const val = row[taskIdx % row.length];

  if (val === 0) {
    if (studentIdx % 3 === 0) return { kind: "waiting", late: taskIdx % 2 === 1 };
    if (studentIdx % 3 === 1) {
      return {
        kind: "revision",
        catatan: "Mohon lengkapi langkah pengerjaan nomor 2 sebelum dinilai ulang.",
      };
    }
    return { kind: "missing" };
  }

  return {
    kind: "graded",
    score: val,
    late: studentIdx === 2 && taskIdx === 1,
    catatan:
      val >= 85
        ? "Masya Allah, hasil sangat memuaskan!"
        : val >= 75
        ? "Bagus, sudah mencapai ketuntasan (KKM 75)."
        : "Perlu pendampingan dan latihan tambahan agar mencapai KKM 75.",
  };
}

async function main() {
  console.log("=====================================================");
  console.log("📊 Seeding Data Rekap Nilai Tugas untuk Akun Demo...");
  console.log("=====================================================");

  const hashGuru = await bcrypt.hash("guru123", 10);
  const hashSiswa = await bcrypt.hash("siswa123", 10);

  // 1. Pastikan kelas target tersedia
  let kelasSD = await prisma.kelas.findFirst({
    where: { nama_kelas: "Kelas 4 - Mehmed Al Fatih" },
  });
  if (!kelasSD) {
    kelasSD = await prisma.kelas.create({
      data: {
        nama_kelas: "Kelas 4 - Mehmed Al Fatih",
        jenjang: "SD",
        tingkat: 4,
        jumlah_siswa: "28",
      },
    });
  }

  let kelasSMP = await prisma.kelas.findFirst({
    where: { nama_kelas: "Kelas 7 - Ibnu Sina" },
  });
  if (!kelasSMP) {
    kelasSMP = await prisma.kelas.create({
      data: {
        nama_kelas: "Kelas 7 - Ibnu Sina",
        jenjang: "SMP",
        tingkat: 7,
        wali_kelas: "Ustadz Farhan, S.Pd",
        jumlah_siswa: "28",
      },
    });
  }

  // 2. Pastikan akun guru demo & siswa demo tersedia
  const teachers = await ensureDemoTeachers(hashGuru);
  await ensureDemoStudents(hashSiswa);

  // 3. Pastikan mata pelajaran target tersedia
  const mapelCodes = ["PAI", "IPA", "MTK", "BING", "BARAB"] as const;
  const mapelMap = new Map<string, bigint>();
  for (const code of mapelCodes) {
    const m = await prisma.mataPelajaran.findUnique({ where: { kode_mapel: code } });
    if (m) mapelMap.set(code, m.id);
  }

  // 4. Seed masing-masing akun demo guru
  const tracks: Array<{
    label: string;
    email: string;
    kelasId: bigint;
    kelasNama: string;
    mapelCode: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    tasks: DemoTaskSpec[];
  }> = [
    {
      label: "Demo Walas SD (walas.sd@gmail.com) - PAI Kelas 4",
      email: "walas.sd@gmail.com",
      kelasId: kelasSD.id,
      kelasNama: kelasSD.nama_kelas,
      mapelCode: "PAI",
      hari: "Senin",
      jamMulai: "07:30",
      jamSelesai: "09:00",
      tasks: [
        {
          pertemuanKe: 1,
          pertemuanJudul: "Adab Menuntut Ilmu & Berdoa",
          judul: "Demo Rekap T1: Kuis Adab Menuntut Ilmu",
          deskripsi: "Evaluasi pemahaman adab harian pelajar muslim.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -14,
        },
        {
          pertemuanKe: 2,
          pertemuanJudul: "Tata Cara Thaharah & Wudhu",
          judul: "Demo Rekap T2: Lembar Kerja Rukun Wudhu",
          deskripsi: "Unggah foto/lembar urutan rukun wudhu sesuai sunnah.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: -10,
        },
        {
          pertemuanKe: 3,
          pertemuanJudul: "Rukun Sholat & Bacaannya",
          judul: "Demo Rekap T3: Evaluasi Bacaan Sholat",
          deskripsi: "Kuis interaktif bacaan rukun dan sunnah sholat.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -5,
        },
        {
          pertemuanKe: 4,
          pertemuanJudul: "Kisah Keteladanan Nabi Muhammad SAW",
          judul: "Demo Rekap T4: Ringkasan Sirah Nabawiyah",
          deskripsi: "Buat rangkuman sifat mulia Rasulullah SAW.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: 2,
        },
      ],
    },
    {
      label: "Demo Guru SD (guru.sd@gmail.com) - IPA Kelas 4",
      email: "guru.sd@gmail.com",
      kelasId: kelasSD.id,
      kelasNama: kelasSD.nama_kelas,
      mapelCode: "IPA",
      hari: "Rabu",
      jamMulai: "09:30",
      jamSelesai: "11:00",
      tasks: [
        {
          pertemuanKe: 1,
          pertemuanJudul: "Bagian Tubuh Tumbuhan & Fungsinya",
          judul: "Demo Rekap T1: Kuis Struktur Tumbuhan",
          deskripsi: "Identifikasi akar, batang, daun, dan bunga.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -12,
        },
        {
          pertemuanKe: 2,
          pertemuanJudul: "Proses Fotosintesis",
          judul: "Demo Rekap T2: Laporan Pengamatan Fotosintesis",
          deskripsi: "Catat hasil percobaan daun terkena sinar matahari.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: -7,
        },
        {
          pertemuanKe: 3,
          pertemuanJudul: "Perubahan Wujud Zat",
          judul: "Demo Rekap T3: Evaluasi Sifat & Wujud Benda",
          deskripsi: "Kuis mencair, membeku, menguap, dan menyublim.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -2,
        },
        {
          pertemuanKe: 4,
          pertemuanJudul: "Gaya dan Gerak di Sekitar Kita",
          judul: "Demo Rekap T4: Proyek Mini Gaya Gesek & Gravitasi",
          deskripsi: "Foto eksperimen sederhana gaya gesek di rumah.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: 4,
        },
      ],
    },
    {
      label: "Demo Walas SMP (walas.smp@gmail.com) - Bahasa Inggris Kelas 7",
      email: "walas.smp@gmail.com",
      kelasId: kelasSMP.id,
      kelasNama: kelasSMP.nama_kelas,
      mapelCode: "BING",
      hari: "Senin",
      jamMulai: "09:30",
      jamSelesai: "11:00",
      tasks: [
        {
          pertemuanKe: 1,
          pertemuanJudul: "Unit 1: Greeting, Leave-Taking & Introduction",
          judul: "Demo Rekap T1: Self-Introduction Dialogue Quiz",
          deskripsi: "Grammar and expressions for introducing yourself.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -18,
        },
        {
          pertemuanKe: 2,
          pertemuanJudul: "Unit 2: Daily Routines & Simple Present Tense",
          judul: "Demo Rekap T2: English Reading & Daily Routines Quiz",
          deskripsi: "Reading comprehension and simple present verbs.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -12,
        },
        {
          pertemuanKe: 3,
          pertemuanJudul: "Unit 3: Describing Heroes & Muslim Figures",
          judul: "Demo Rekap T3: Descriptive Writing - My Favorite Muslim Hero",
          deskripsi: "Write a 2-paragraph descriptive text about a Muslim figure.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: -6,
        },
        {
          pertemuanKe: 4,
          pertemuanJudul: "Unit 4: Telling Time, Days & School Schedule",
          judul: "Demo Rekap T4: My Weekly School Timetable Worksheet",
          deskripsi: "Create and describe your weekly schedule in English.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: -1,
        },
        {
          pertemuanKe: 5,
          pertemuanJudul: "Unit 5: Mid-Term Review & Vocabulary",
          judul: "Demo Rekap T5: Mid-Semester Cambridge Practice",
          deskripsi: "Comprehensive review covering Units 1-4.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: 5,
        },
      ],
    },
    {
      label: "Demo Guru SMP (guru.smp@gmail.com) - Matematika Kelas 7",
      email: "guru.smp@gmail.com",
      kelasId: kelasSMP.id,
      kelasNama: kelasSMP.nama_kelas,
      mapelCode: "MTK",
      hari: "Selasa",
      jamMulai: "07:30",
      jamSelesai: "09:00",
      tasks: [
        {
          pertemuanKe: 1,
          pertemuanJudul: "Bilangan Bulat & Operasinya",
          judul: "Demo Rekap T1: Kuis Operasi Bilangan Bulat",
          deskripsi: "Penjumlahan, pengurangan, perkalian, dan pembagian.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -15,
        },
        {
          pertemuanKe: 2,
          pertemuanJudul: "Bilangan Rasional & Pecahan",
          judul: "Demo Rekap T2: Latihan Soal Pecahan Campuran",
          deskripsi: "Kerjakan soal uraian pecahan pada lembar kerja.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: -9,
        },
        {
          pertemuanKe: 3,
          pertemuanJudul: "Bentuk Aljabar Dasar",
          judul: "Demo Rekap T3: Evaluasi Penyederhanaan Aljabar",
          deskripsi: "Menentukan suku sejenis dan menyederhanakan bentuk aljabar.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -3,
        },
        {
          pertemuanKe: 4,
          pertemuanJudul: "Persamaan Linear Satu Variabel (PLSV)",
          judul: "Demo Rekap T4: Lembar Pemecahan Masalah PLSV",
          deskripsi: "Selesaikan soal cerita PLSV secara sistematis.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: 3,
        },
      ],
    },
    {
      label: "Demo Guru Lintas (guru.lintas@gmail.com) - Bahasa Arab Kelas 4 SD & 7 SMP",
      email: "guru.lintas@gmail.com",
      kelasId: kelasSD.id,
      kelasNama: kelasSD.nama_kelas,
      mapelCode: "BARAB",
      hari: "Kamis",
      jamMulai: "07:30",
      jamSelesai: "09:00",
      tasks: [
        {
          pertemuanKe: 1,
          pertemuanJudul: "Al-Adawatul Madrasiyyah (Peralatan Sekolah)",
          judul: "Demo Rekap T1: Kuis Mufrodat Peralatan Sekolah",
          deskripsi: "Pasangkan kosakata Bahasa Arab dan artinya.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: -10,
        },
        {
          pertemuanKe: 2,
          pertemuanJudul: "At-Ta'aruf (Perkenalan Dasar)",
          judul: "Demo Rekap T2: Lembar Latihan Hiwar Perkenalan",
          deskripsi: "Tulis kembali dialog perkenalan dengan harakat lengkap.",
          tipePengerjaan: "LEMBAR_KERJA",
          poinMaksimal: 100,
          daysOffset: -4,
        },
        {
          pertemuanKe: 3,
          pertemuanJudul: "Al-Alwan (Warna-warna)",
          judul: "Demo Rekap T3: Evaluasi Kosakata Warna",
          deskripsi: "Kuis interaktif mudzakkar dan muannats nama warna.",
          tipePengerjaan: "INTERAKTIF",
          poinMaksimal: 100,
          daysOffset: 2,
        },
      ],
    },
  ];

  // Tambahkan 1 track SMP juga untuk guru.lintas@gmail.com agar terlihat lintas jenjangnya
  tracks.push({
    label: "Demo Guru Lintas (guru.lintas@gmail.com) - Bahasa Arab Kelas 7 SMP",
    email: "guru.lintas@gmail.com",
    kelasId: kelasSMP.id,
    kelasNama: kelasSMP.nama_kelas,
    mapelCode: "BARAB",
    hari: "Jumat",
    jamMulai: "07:30",
    jamSelesai: "09:00",
    tasks: [
      {
        pertemuanKe: 1,
        pertemuanJudul: "At-Ta'aruf & Dhomir Munfashil",
        judul: "Demo Rekap T1: Kuis Penggunaan Dhomir",
        deskripsi: "Penggunaan Ana, Anta, Anti, Huwa, Hiya dalam kalimat.",
        tipePengerjaan: "INTERAKTIF",
        poinMaksimal: 100,
        daysOffset: -11,
      },
      {
        pertemuanKe: 2,
        pertemuanJudul: "Al-Marafiqul Madrasiyyah",
        judul: "Demo Rekap T2: Insya' Deskripsi Fasilitas Sekolah",
        deskripsi: "Buat 5 kalimat sederhana tentang fasilitas sekolah.",
        tipePengerjaan: "LEMBAR_KERJA",
        poinMaksimal: 100,
        daysOffset: -5,
      },
      {
        pertemuanKe: 3,
        pertemuanJudul: "Al-Adad (Angka 1-100)",
        judul: "Demo Rekap T3: Evaluasi Bilangan Bahasa Arab",
        deskripsi: "Konversi angka Arab dan penggunaannya.",
        tipePengerjaan: "INTERAKTIF",
        poinMaksimal: 100,
        daysOffset: 4,
      },
    ],
  });

  for (const track of tracks) {
    const guruId = teachers.get(track.email);
    const mapelId = mapelMap.get(track.mapelCode);
    if (!guruId || !mapelId) {
      console.warn(`⚠️ Lewati ${track.label} karena guru/mapel tidak ditemukan.`);
      continue;
    }

    const res = await seedTrackForTeacher({
      guruId,
      kelasId: track.kelasId,
      kelasNama: track.kelasNama,
      mapelId,
      hari: track.hari,
      jamMulai: track.jamMulai,
      jamSelesai: track.jamSelesai,
      tasks: track.tasks,
      scenarioMatrix: buildScenario,
    });

    console.log(
      `✅ ${track.label} -> ${res.studentCount} siswa, +${res.createdTasks} tugas baru, +${res.createdSubmissions} submission baru`
    );
  }

  console.log("\n=====================================================");
  console.log("🎉 Seeding Data Rekap Nilai Akun Demo Selesai!");
  console.log("Akun siap uji:");
  console.log("- walas.sd@gmail.com    / guru123 (PAI - Kelas 4 Mehmed Al Fatih)");
  console.log("- guru.sd@gmail.com     / guru123 (IPA - Kelas 4 Mehmed Al Fatih)");
  console.log("- walas.smp@gmail.com   / guru123 (B. Inggris - Kelas 7 Ibnu Sina)");
  console.log("- guru.smp@gmail.com    / guru123 (Matematika - Kelas 7 Ibnu Sina)");
  console.log("- guru.lintas@gmail.com / guru123 (B. Arab - Kelas 4 SD & 7 SMP)");
  console.log("=====================================================");
}

main()
  .catch((err) => {
    console.error("❌ Error saat seeding rekap nilai demo:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

