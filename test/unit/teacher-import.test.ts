import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { UserService } from "@/services/user.service";
import prisma from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_pwd_123"),
  },
}));

describe("UserService.importTeachersFromBase64", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully import teachers even when optional columns are empty", async () => {
    const data = [
      ["NIP", "Nama Lengkap", "Email", "Password", "Jenis Kelamin", "Bidang Studi", "Peran", "Kelas Wali", "Apple ID", "Password Apple ID"],
      ["", "Ustadz Budi", "budi@alazhar.sch.id", "", "", "", "", "", "", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const base64 = Buffer.from(buffer).toString("base64");

    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: BigInt(101), name: "Ustadz Budi" });

    const count = await UserService.importTeachersFromBase64(base64);

    expect(count).toBe(1);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Ustadz Budi",
        email: "budi@alazhar.sch.id",
        nip: null,
        guru_bidang: null,
        kelas: null,
        gender: "L", // default
        status: "2", // default guru
        password1: "123456", // default password
        appleid: null,
        passwordappleid: null,
      }),
    });
  });

  it("should generate a fallback email when email column is empty but name is provided", async () => {
    const data = [
      ["NIP", "Nama Lengkap", "Email"],
      ["19850115", "Ustadzah Aisyah", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const base64 = Buffer.from(buffer).toString("base64");

    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: BigInt(102), name: "Ustadzah Aisyah" });

    const count = await UserService.importTeachersFromBase64(base64);

    expect(count).toBe(1);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Ustadzah Aisyah",
        email: "ustadzah.aisyah@alazhar.sch.id",
        nip: "19850115",
      }),
    });
  });
});
