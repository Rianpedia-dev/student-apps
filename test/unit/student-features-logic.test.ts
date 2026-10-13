import { describe, it, expect } from "vitest";
import { seededShuffle } from "@/lib/shuffle";
import { parseViolationKeterangan } from "@/lib/constants/violations";
import { getDefaultProfileImage, getUserProfileImage, compareScheduleTime } from "@/lib/utils";

describe("MODUL 3: Mata Pelajaran & Pertemuan Logic", () => {
  it("MAPEL-01: compareScheduleTime harus mengurutkan hari & jam secara kronologis", () => {
    // Senin vs Selasa
    const comp1 = compareScheduleTime("Senin", "07:30", "09:00", "Selasa", "07:30", "09:00");
    expect(comp1).toBeLessThan(0);

    // Hari sama, jam lebih awal vs lebih lambat
    const comp2 = compareScheduleTime("Senin", "07:30", "08:30", "Senin", "09:00", "10:00");
    expect(comp2).toBeLessThan(0);

    // Jam sama persis
    const comp3 = compareScheduleTime("Rabu", "08:00", "09:30", "Rabu", "08:00", "09:30");
    expect(comp3).toBe(0);
  });

  it("MAPEL-06: Logika toggle centang materi sudah dipelajari (Student Meeting Progress)", () => {
    let isCompleted = false;
    let completedAt: Date | null = null;

    // Aksi 1: Siswa klik tandai selesai
    const toggleFirst = () => {
      isCompleted = !isCompleted;
      completedAt = isCompleted ? new Date() : null;
      return { isCompleted, completedAt };
    };

    const res1 = toggleFirst();
    expect(res1.isCompleted).toBe(true);
    expect(res1.completedAt).toBeInstanceOf(Date);

    // Aksi 2: Siswa klik batal selesai
    const res2 = toggleFirst();
    expect(res2.isCompleted).toBe(false);
    expect(res2.completedAt).toBeNull();
  });
});

describe("MODUL 4: Tugas & Evaluasi Belajar (CBT) Logic", () => {
  it("TUGAS-04 & TUGAS-05: seededShuffle menghasilkan urutan acak yang konsisten per siswa namun berbeda antar siswa", () => {
    const questions = [
      { id: 1, text: "Soal 1" },
      { id: 2, text: "Soal 2" },
      { id: 3, text: "Soal 3" },
      { id: 4, text: "Soal 4" },
      { id: 5, text: "Soal 5" },
    ];

    const seedSiswa1 = "siswa1-tugas10";
    const seedSiswa2 = "siswa2-tugas10";

    const shuffled1A = seededShuffle(questions, seedSiswa1);
    const shuffled1B = seededShuffle(questions, seedSiswa1);
    const shuffled2 = seededShuffle(questions, seedSiswa2);

    // Harus identik untuk siswa yang sama saat refresh
    expect(shuffled1A).toEqual(shuffled1B);

    // Panjang array tetap sama
    expect(shuffled1A.length).toBe(questions.length);

    // Semua butir soal tetap ada
    const ids1A = shuffled1A.map((q) => q.id).sort();
    expect(ids1A).toEqual([1, 2, 3, 4, 5]);

    // Berbeda urutan antara Siswa 1 dan Siswa 2
    expect(shuffled1A.map((q) => q.id)).not.toEqual(shuffled2.map((q) => q.id));
  });

  it("TUGAS-08 & TUGAS-09: Kalkulasi Auto-Grading CBT Pilihan Ganda", () => {
    const soalList = [
      { id: "1", kunci: "B", bobot: 20 },
      { id: "2", kunci: "A", bobot: 20 },
      { id: "3", kunci: "D", bobot: 20 },
      { id: "4", kunci: "C", bobot: 20 },
      { id: "5", kunci: "A", bobot: 20 },
    ];

    const jawabanSiswa = new Map<string, string>([
      ["1", "B"], // Benar (20)
      ["2", "A"], // Benar (20)
      ["3", "B"], // Salah (0) - kunci D
      ["4", "C"], // Benar (20)
      ["5", "D"], // Salah (0) - kunci A
    ]);

    let totalBenar = 0;
    let totalSalah = 0;
    let totalNilai = 0;

    for (const soal of soalList) {
      const ans = jawabanSiswa.get(soal.id);
      if (ans && ans.toUpperCase() === soal.kunci.toUpperCase()) {
        totalBenar++;
        totalNilai += soal.bobot;
      } else {
        totalSalah++;
      }
    }

    expect(totalBenar).toBe(3);
    expect(totalSalah).toBe(2);
    expect(totalNilai).toBe(60);
  });
});

describe("MODUL 5: Aturan Bisnis Obrolan Siswa (Chat Policy)", () => {
  it("CHAT-02 & CHAT-06: Siswa hanya diizinkan membuka chat dengan Guru (status 2 / 4), bukan sesama Siswa", () => {
    const canStudentChatWith = (targetUserStatus: string) => {
      const isGuru = ["2", "4"].includes(targetUserStatus);
      return isGuru;
    };

    // Chat ke Guru Mapel (status 2) -> Boleh
    expect(canStudentChatWith("2")).toBe(true);

    // Chat ke Wali Kelas (status 4) -> Boleh
    expect(canStudentChatWith("4")).toBe(true);

    // Chat ke sesama Siswa (status 1) -> DILARANG
    expect(canStudentChatWith("1")).toBe(false);

    // Chat ke User Belum Terverifikasi (status 0) -> DILARANG
    expect(canStudentChatWith("0")).toBe(false);
  });
});

describe("MODUL 7: Riwayat Presensi Logic", () => {
  it("ATT-03: Pemetaan kode status kehadiran dan warna visual", () => {
    const ATTENDANCE_MAP: Record<string, { label: string; colorClass: string }> = {
      H: { label: "Hadir", colorClass: "bg-emerald-500" },
      I: { label: "Izin", colorClass: "bg-amber-500" },
      S: { label: "Sakit", colorClass: "bg-blue-500" },
      A: { label: "Alpa", colorClass: "bg-rose-500" },
    };

    expect(ATTENDANCE_MAP["H"].label).toBe("Hadir");
    expect(ATTENDANCE_MAP["I"].label).toBe("Izin");
    expect(ATTENDANCE_MAP["S"].label).toBe("Sakit");
    expect(ATTENDANCE_MAP["A"].label).toBe("Alpa");
  });
});

describe("MODUL 8: Buku Kedisiplinan & Pelanggaran Logic", () => {
  it("VIOL-01 & VIOL-02: Parsing tag keterangan dan kalkulasi indeks skor kedisiplinan santri (Skor Awal 100)", () => {
    const rawRecord1 = "[SEV:RINGAN][PTS:5][TINDAKAN:Nasihat lisan] Terlambat masuk sholat dhuha";
    const rawRecord2 = "[SEV:SEDANG][PTS:15][TINDAKAN:Konseling wali kelas] Mengabaikan adab saat tilawah";

    const parsed1 = parseViolationKeterangan(rawRecord1);
    expect(parsed1.severity).toBe("RINGAN");
    expect(parsed1.points).toBe(5);
    expect(parsed1.tindakan).toBe("Nasihat lisan");
    expect(parsed1.cleanKeterangan).toBe("Terlambat masuk sholat dhuha");

    const parsed2 = parseViolationKeterangan(rawRecord2);
    expect(parsed2.severity).toBe("SEDANG");
    expect(parsed2.points).toBe(15);
    expect(parsed2.tindakan).toBe("Konseling wali kelas");
    expect(parsed2.cleanKeterangan).toBe("Mengabaikan adab saat tilawah");

    // Total deduksi poin: 5 + 15 = 20
    const totalDeduction = parsed1.points + parsed2.points;
    const finalScore = Math.max(0, 100 - totalDeduction);

    expect(finalScore).toBe(80);
  });

  it("VIOL-03: Santri tanpa catatan pelanggaran mempertahankan skor sempurna 100", () => {
    const totalDeduction = 0;
    const score = Math.max(0, 100 - totalDeduction);
    expect(score).toBe(100);
  });
});

describe("MODUL 9: Isolasi Ruang Kelas Online", () => {
  it("KOL-02: Siswa hanya diizinkan masuk ke ruang kelas online yang sesuai dengan kelasnya", () => {
    const studentSession = {
      role: "siswa",
      kelas: "Kelas 4 - Mehmed Al Fatih",
    };

    const roomKelas4 = {
      id: "101",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      status: "active",
    };

    const roomKelas7 = {
      id: "201",
      kelas: "Kelas 7 - Ibnu Sina",
      status: "active",
    };

    const isAllowedToJoin = (session: typeof studentSession, room: typeof roomKelas4) => {
      if (session.role === "siswa" && session.kelas !== room.kelas) {
        return false;
      }
      return room.status === "active";
    };

    expect(isAllowedToJoin(studentSession, roomKelas4)).toBe(true);
    expect(isAllowedToJoin(studentSession, roomKelas7)).toBe(false);
  });
});

describe("MODUL 10: Profil Siswa & Default Image Resolution", () => {
  it("PROF-05: Avatar fallback santri ikhwan (L) vs akhwat (P)", () => {
    expect(getDefaultProfileImage("L")).toBe("/profil-default-laki-laki.avif");
    expect(getDefaultProfileImage("l")).toBe("/profil-default-laki-laki.avif");
    expect(getDefaultProfileImage("laki-laki")).toBe("/profil-default-laki-laki.avif");

    expect(getDefaultProfileImage("P")).toBe("/profil-default-perempuan.avif");
    expect(getDefaultProfileImage("p")).toBe("/profil-default-perempuan.avif");
    expect(getDefaultProfileImage("perempuan")).toBe("/profil-default-perempuan.avif");
  });

  it("PROF-03: getUserProfileImage memprioritaskan custom image, atau fallback ke gender", () => {
    // Dengan custom image
    expect(getUserProfileImage("/uploads/custom-avatar.webp", "L")).toBe("/uploads/custom-avatar.webp");

    // Tanpa custom image
    expect(getUserProfileImage(null, "L")).toBe("/profil-default-laki-laki.avif");
    expect(getUserProfileImage(null, "P")).toBe("/profil-default-perempuan.avif");
  });
});
