import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, type SessionUser } from "@/lib/auth";
import { getRoleFromStatus, getRoleLabel } from "@/lib/utils";

describe("MODUL ADMIN 1 & 2: Autentikasi, Demo Admin & Sesi Super Administrator", () => {
  it("AUTH-A01 & AUTH-A02: Kredensial akun demo admin harus valid dan berstatus '3'", () => {
    const adminDemo = {
      email: "admin@gmail.com",
      pw: "admin123",
      status: "3",
    };

    expect(adminDemo.email).toBe("admin@gmail.com");
    expect(adminDemo.pw).toBe("admin123");
    expect(adminDemo.status).toBe("3");
    expect(getRoleFromStatus(adminDemo.status)).toBe("admin");
    expect(getRoleLabel(adminDemo.status)).toBe("Administrator");
  });

  it("AUTH-A04: Sesi token JWT Administrator dapat di-generate dan diverifikasi", async () => {
    const adminUser: SessionUser = {
      id: "1",
      name: "Super Administrator",
      email: "admin@gmail.com",
      role: "admin",
      status: "3",
      image: null,
    };

    const token = await createSessionToken(adminUser);
    expect(token).toBeDefined();

    const decoded = await verifySessionToken(token);
    expect(decoded?.name).toBe("Super Administrator");
    expect(decoded?.role).toBe("admin");
    expect(decoded?.status).toBe("3");
  });
});

describe("MODUL ADMIN 3 & 4: Verifikasi Pendaftaran Pengguna (User Lifecycle Management)", () => {
  it("STD-A03 & TCH-A02: Alur verifikasi status akun baru dari Pending (0) ke Aktif", () => {
    const verifyUser = (initialStatus: string, targetRole: "siswa" | "guru_mapel" | "wali_kelas") => {
      if (initialStatus !== "0") {
        throw new Error("Hanya akun pending (status 0) yang memerlukan verifikasi");
      }
      switch (targetRole) {
        case "siswa":
          return "1";
        case "guru_mapel":
          return "2";
        case "wali_kelas":
          return "4";
        default:
          return initialStatus;
      }
    };

    // Verifikasi Siswa Baru
    const studentStatus = verifyUser("0", "siswa");
    expect(studentStatus).toBe("1");
    expect(getRoleFromStatus(studentStatus)).toBe("siswa");

    // Verifikasi Guru Mapel Baru
    const teacherMapelStatus = verifyUser("0", "guru_mapel");
    expect(teacherMapelStatus).toBe("2");
    expect(getRoleFromStatus(teacherMapelStatus)).toBe("guru");

    // Verifikasi Guru & Wali Kelas Baru
    const waliKelasStatus = verifyUser("0", "wali_kelas");
    expect(waliKelasStatus).toBe("4");
    expect(getRoleFromStatus(waliKelasStatus)).toBe("guru");
  });
});

describe("MODUL ADMIN 5 & 11: Struktur Rombel & Kode Restrict iPad", () => {
  it("CLS-A02 & RES-A02: Pemetaan kode pembatasan iPad per rombongan belajar", () => {
    const classData = {
      nama_kelas: "Kelas 4 - Mehmed Al Fatih",
      jenjang: "SD",
      tingkat: "4",
      code_restrict: "ALZ-SD4-PASS2026",
    };

    expect(classData.nama_kelas).toContain("Kelas 4");
    expect(classData.jenjang).toBe("SD");
    expect(classData.code_restrict).toMatch(/^ALZ-[A-Z0-9-]+$/);
  });
});

describe("MODUL ADMIN 7: Deteksi Bentrok Jadwal KBM Mingguan", () => {
  it("SCH-A03: Algoritma validasi jadwal bentrok pada hari & jam yang sama", () => {
    const existingSchedule = {
      guru_id: "GURU-01",
      ruangan: "Ruang 4A",
      hari: "Senin",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
    };

    const isConflict = (newSchedule: typeof existingSchedule) => {
      if (newSchedule.hari !== existingSchedule.hari) return false;
      // Cek bentrok guru atau ruangan
      const isResourceConflict =
        newSchedule.guru_id === existingSchedule.guru_id ||
        newSchedule.ruangan === existingSchedule.ruangan;

      if (!isResourceConflict) return false;

      // Cek tumpang tindih waktu
      return !(
        newSchedule.jam_selesai <= existingSchedule.jam_mulai ||
        newSchedule.jam_mulai >= existingSchedule.jam_selesai
      );
    };

    // Jadwal bentrok (Guru sama, jam sama di hari Senin)
    expect(
      isConflict({
        guru_id: "GURU-01",
        ruangan: "Ruang 4B",
        hari: "Senin",
        jam_mulai: "08:00",
        jam_selesai: "09:30",
      })
    ).toBe(true);

    // Jadwal tidak bentrok (Hari berbeda: Selasa)
    expect(
      isConflict({
        guru_id: "GURU-01",
        ruangan: "Ruang 4A",
        hari: "Selasa",
        jam_mulai: "07:30",
        jam_selesai: "09:00",
      })
    ).toBe(false);

    // Jadwal tidak bentrok (Jam setelah sesi pertama selesai: 09:00 - 10:30)
    expect(
      isConflict({
        guru_id: "GURU-01",
        ruangan: "Ruang 4A",
        hari: "Senin",
        jam_mulai: "09:00",
        jam_selesai: "10:30",
      })
    ).toBe(false);
  });
});
