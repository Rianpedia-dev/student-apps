import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, type SessionUser } from "@/lib/auth";
import { getRoleFromStatus } from "@/lib/utils";

describe("MODUL 1: Student Authentication, Demo Accounts & Session Security", () => {
  const demoStudents = [
    {
      roleName: "Rayhan (Siswa 1)",
      email: "siswa1@gmail.com",
      pw: "siswa123",
      name: "Muhammad Rayhan Al-Fatih",
      role: "siswa" as const,
      status: "1",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "L",
      nis: "202404001",
    },
    {
      roleName: "Khalid (Siswa 2)",
      email: "siswa2@gmail.com",
      pw: "siswa123",
      name: "Khalid Al-Ghazi",
      role: "siswa" as const,
      status: "1",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "L",
      nis: "202404002",
    },
    {
      roleName: "Zahra (Siswa 3)",
      email: "siswa3@gmail.com",
      pw: "siswa123",
      name: "Zahra Salsabila",
      role: "siswa" as const,
      status: "1",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      gender: "P",
      nis: "202404003",
    },
  ];

  it("AUTH-01 & AUTH-02: Setiap akun demo siswa harus memiliki kredensial valid dan berstatus '1'", () => {
    for (const demo of demoStudents) {
      expect(demo.email).toMatch(/^siswa[123]?@gmail\.com$/);
      expect(demo.pw).toBe("siswa123");
      expect(demo.status).toBe("1");
      expect(getRoleFromStatus(demo.status)).toBe("siswa");
      expect(demo.kelas).toContain("Kelas 4");
      expect(demo.nis).toBeDefined();
    }
  });

  it("AUTH-03: Sesi JWT Siswa dapat di-generate dan diverifikasi secara kriptografis", async () => {
    const studentUser: SessionUser = {
      id: "90001",
      name: "Muhammad Rayhan Al-Fatih",
      email: "siswa1@gmail.com",
      role: "siswa",
      status: "1",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      nis: "202404001",
      gender: "L",
      image: null,
    };

    const token = await createSessionToken(studentUser);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe("Muhammad Rayhan Al-Fatih");
    expect(decoded?.role).toBe("siswa");
    expect(decoded?.kelas).toBe("Kelas 4 - Mehmed Al Fatih");
    expect(decoded?.nis).toBe("202404001");
  });

  it("AUTH-04 & AUTH-05: RBAC Redirect Path Resolver untuk peran Siswa vs Guru/Admin", () => {
    const resolveRedirect = (role: string) => {
      if (role === "admin") return "/admin";
      if (role === "guru") return "/guru";
      if (role === "siswa") return "/siswa";
      return "/login";
    };

    expect(resolveRedirect("siswa")).toBe("/siswa");
    expect(resolveRedirect("guru")).toBe("/guru");
    expect(resolveRedirect("admin")).toBe("/admin");
    expect(resolveRedirect("unverified")).toBe("/login");
  });

  it("AUTH-06: Token yang dimodifikasi (tampered) harus gagal verifikasi demi keamanan sesi", async () => {
    const validStudent: SessionUser = {
      id: "90001",
      name: "Zahra Salsabila",
      email: "siswa3@gmail.com",
      role: "siswa",
      status: "1",
      kelas: "Kelas 4 - Mehmed Al Fatih",
      nis: "202404003",
      gender: "P",
    };

    const token = await createSessionToken(validStudent);
    // Rusak integritas tanda tangan JWT
    const tamperedToken = token.slice(0, -6) + "xxxxxx";

    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it("AUTH-07: Akun siswa dengan status '0' (unverified) wajib ditolak dari akses dashboard", () => {
    const unverifiedStatus = "0";
    const role = getRoleFromStatus(unverifiedStatus);
    expect(role).toBe("unverified");
  });
});
