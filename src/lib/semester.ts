import prisma from "@/lib/prisma";
import { getAcademicYear } from "@/lib/utils";

export interface ActiveSemesterInfo {
  semester: string;       // e.g. "Semester 1 - 2026/2027"
  tahunPelajaran: string; // e.g. "2026/2027"
  semesterNum: number;    // 1 or 2
}

/**
 * Mendapatkan semester dan tahun pelajaran yang sedang aktif / berjalan.
 * Mengutamakan data dari tabel TahunAjar jika tersedia,
 * atau fallback ke kalkulasi otomatis kalender akademik Al-Azhar (Juli - Juni).
 */
export async function getActiveSemester(dateInput: Date = new Date()): Promise<ActiveSemesterInfo> {
  try {
    const ta = await prisma.tahunAjar.findFirst({
      orderBy: { id: "desc" },
    });
    if (ta && ta.semester && ta.tahun) {
      const num = parseInt(ta.semester.replace(/\D/g, ""), 10) || 1;
      const semLabel = ta.semester.toLowerCase().includes("semester")
        ? ta.semester
        : `Semester ${ta.semester}`;
      return {
        semester: `${semLabel} - ${ta.tahun}`,
        tahunPelajaran: ta.tahun,
        semesterNum: num,
      };
    }
  } catch (err) {
    console.warn("Could not query TahunAjar, falling back to date calculation:", err);
  }

  const calc = getAcademicYear(dateInput);
  return {
    semester: `${calc.semester} - ${calc.tahunPelajaran}`,
    tahunPelajaran: calc.tahunPelajaran,
    semesterNum: calc.semesterNum,
  };
}

