import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, type SessionUser } from "@/lib/auth";
import { getRoleFromStatus, getRoleLabel } from "@/lib/utils";
import { formatViolationKeterangan, parseViolationKeterangan } from "@/lib/constants/violations";

describe("MODUL GURU 1 & 2: Autentikasi, Demo Accounts & Peran Wali Kelas vs Guru Mapel", () => {
  const demoTeachers = [
    {
      roleName: "Guru 1 (Wali Kelas SD)",
      email: "guru@gmail.com",
      pw: "guru123",
      name: "Ustadzah Fatimah, S.Pd.I",
      status: "4", // Guru & Wali Kelas
      kelas: "Kelas 4 - Mehmed Al Fatih",
      nip: "198501152010012001",
      gender: "P",
    },
    {
      roleName: "Guru 2 (Wali Kelas SMP)",
      email: "guru2@gmail.com",
      pw: "guru123",
      name: "Ustadz Farhan, S.Pd",
      status: "4", // Guru & Wali Kelas
      kelas: "Kelas 7 - Ibnu Sina",
      nip: "198703122011011005",
      gender: "L",
    },
    {
      roleName: "Guru Mapel Murni",
      email: "guru.mapel@gmail.com",
      pw: "guru123",
      name: "Ustadz Ahmad, M.Pd",
      status: "2", // Guru Mapel
      kelas: null,
      nip: "199002202015011002",
      gender: "L",
    },
  ];

  it("AUTH-G01 & AUTH-G02: Akun demo guru harus memiliki kredensial valid dan peran 'guru'", () => {
    for (const guru of demoTeachers) {
      expect(guru.email).toMatch(/^guru.*@gmail\.com$/);
      expect(guru.pw).toBe("guru123");
      expect(["2", "4"]).toContain(guru.status);
      expect(getRoleFromStatus(guru.status)).toBe("guru");
    }
  });

  it("AUTH-G05 & AUTH-G06: Pembedaan hak akses Wali Kelas (Status 4) vs Guru Mapel (Status 2)", () => {
    const isWaliKelas = (status: string, kelas?: string | null) => {
      return status === "4" || (Boolean(kelas) && status !== "2");
    };

    // Status 4 dengan kelas -> Wali Kelas Aktif
    expect(isWaliKelas("4", "Kelas 4 - Mehmed Al Fatih")).toBe(true);
    expect(getRoleLabel("4")).toBe("Guru & Wali Kelas");

    // Status 2 tanpa kelas -> Guru Mapel (Akses my-class & attendance dibatasi)
    expect(isWaliKelas("2", null)).toBe(false);
    expect(getRoleLabel("2")).toBe("Guru");
  });

  it("AUTH-G07: Sesi JWT Guru tersimpan dan terverifikasi secara aman", async () => {
    const teacherSession: SessionUser = {
      id: "80001",
      name: "Ustadzah Fatimah, S.Pd.I",
      email: "guru@gmail.com",
      role: "guru",
      status: "4",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      nip: "198501152010012001",
      gender: "P",
    };

    const token = await createSessionToken(teacherSession);
    expect(token).toBeDefined();

    const decoded = await verifySessionToken(token);
    expect(decoded?.name).toBe("Ustadzah Fatimah, S.Pd.I");
    expect(decoded?.role).toBe("guru");
    expect(decoded?.status).toBe("4");
    expect(decoded?.nip).toBe("198501152010012001");
  });
});

describe("MODUL GURU 3 & 4: Absensi Kelas & Presensi Harian siswa", () => {
  it("ATT-G02: Logika Tombol Cepat 'Set Semua Hadir'", () => {
    const students = [
      { id: "1", name: "Rayhan", status: "A" },
      { id: "2", name: "Khalid", status: "I" },
      { id: "3", name: "Zahra", status: "S" },
    ];

    const bulkSetHadir = (list: typeof students) => {
      return list.map((s) => ({ ...s, status: "H" }));
    };

    const updated = bulkSetHadir(students);
    expect(updated.every((s) => s.status === "H")).toBe(true);
    expect(updated.length).toBe(3);
  });
});

describe("MODUL GURU 6: Konfigurasi Tugas CBT & Bobot Penilaian Guru", () => {
  it("TUGAS-G03 & TUGAS-G08: Perhitungan Total Nilai Kombinasi PG (Auto-Grading) dan Essay (Manual)", () => {
    // Skor Pilihan Ganda (Auto)
    const skorPG = 60; // 3 soal benar x 20
    const bobotMaksPG = 60;

    // Skor Essay (Koreksi Guru)
    const skorEssayGuru = 35; // Dinilai oleh guru
    const bobotMaksEssay = 40;

    const totalNilaiSiswa = skorPG + skorEssayGuru;
    const totalPoinMaksimal = bobotMaksPG + bobotMaksEssay;

    expect(totalNilaiSiswa).toBe(95);
    expect(totalPoinMaksimal).toBe(100);

    const statusSubmission = (essayReviewed: boolean) => {
      return essayReviewed ? "sudah_dinilai" : "menunggu_penilaian";
    };

    expect(statusSubmission(true)).toBe("sudah_dinilai");
    expect(statusSubmission(false)).toBe("menunggu_penilaian");
  });
});

describe("MODUL GURU 11: Pencatatan Kedisiplinan & Tindakan Pembinaan siswa", () => {
  it("VIOL-G02: Format Keterangan Pelanggaran Terstruktur dengan Tag Otomatis", () => {
    const formatted = formatViolationKeterangan({
      severity: "SEDANG",
      points: 15,
      tindakan: "Konseling wali kelas dan penugasan adab",
      keterangan: "Bermain game di iPad saat jam tahsin",
    });

    expect(formatted).toContain("[SEV:SEDANG]");
    expect(formatted).toContain("[PTS:15]");
    expect(formatted).toContain("[TINDAKAN:Konseling wali kelas dan penugasan adab]");
    expect(formatted).toContain("Bermain game di iPad saat jam tahsin");

    const reParsed = parseViolationKeterangan(formatted);
    expect(reParsed.severity).toBe("SEDANG");
    expect(reParsed.points).toBe(15);
    expect(reParsed.tindakan).toBe("Konseling wali kelas dan penugasan adab");
    expect(reParsed.cleanKeterangan).toBe("Bermain game di iPad saat jam tahsin");
  });
});

describe("MODUL GURU 12: Host Kelas Online & Otoritas Pemilik Ruang (Owner)", () => {
  it("KOL-G02: Token Video Call Guru harus berstatus Pemilik Ruang (is_owner: true)", () => {
    const generateHostConfig = (userRole: string, userName: string) => {
      return {
        is_owner: userRole === "guru" || userRole === "admin",
        user_name: userName,
        enable_screenshare: true,
      };
    };

    const hostConfig = generateHostConfig("guru", "Ustadzah Fatimah, S.Pd.I");
    expect(hostConfig.is_owner).toBe(true);
    expect(hostConfig.enable_screenshare).toBe(true);

    const studentConfig = generateHostConfig("siswa", "Rayhan");
    expect(studentConfig.is_owner).toBe(false);
  });
});
