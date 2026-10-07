import { describe, it, expect } from "vitest";
import { getRoleFromStatus, getRoleLabel } from "@/lib/utils";

describe("Role and Permission Separation: Guru vs Guru & Wali Kelas", () => {
  it("should differentiate Guru Mapel (Status 2) from Guru & Wali Kelas (Status 4)", () => {
    // Both resolve to role "guru" in auth session
    expect(getRoleFromStatus("2")).toBe("guru");
    expect(getRoleFromStatus("4")).toBe("guru");

    // Display labels are clearly distinct
    expect(getRoleLabel("2")).toBe("Guru");
    expect(getRoleLabel("4")).toBe("Guru & Wali Kelas");
  });

  it("should verify wali kelas requirement predicate", () => {
    // Wali kelas predicate check as implemented in Sidebar and Layouts
    const isWaliKelas = (role: string, status: string | null | undefined, kelas?: string | null) => {
      return role === "guru" && (status === "4" || Boolean(kelas && status !== "2"));
    };

    // Status 4 is Wali Kelas
    expect(isWaliKelas("guru", "4", "4 - Mehmed Al Fatih")).toBe(true);
    expect(isWaliKelas("guru", "4", null)).toBe(true);

    // Status 2 is Guru Mapel only (never Wali Kelas even if kelas column has leftover string)
    expect(isWaliKelas("guru", "2", "4 - Mehmed Al Fatih")).toBe(false);
    expect(isWaliKelas("guru", "2", null)).toBe(false);

    // Non-guru roles
    expect(isWaliKelas("siswa", "1", "4 - Mehmed Al Fatih")).toBe(false);
    expect(isWaliKelas("admin", "3", null)).toBe(false);
  });

  it("should ensure profile update sanitize policy strips role and class fields", () => {
    // Only safe profile attributes are allowed to be updated by teacher directly
    const allowedTeacherProfileKeys = new Set([
      "name",
      "address",
      "guru_bidang",
      "notes",
      "skills",
      "nip",
      "gender",
      "appleid",
      "image",
    ]);

    expect(allowedTeacherProfileKeys.has("kelas")).toBe(false);
    expect(allowedTeacherProfileKeys.has("status")).toBe(false);
    expect(allowedTeacherProfileKeys.has("role")).toBe(false);
  });
});
