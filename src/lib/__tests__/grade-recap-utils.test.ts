import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  buildMapelGradeRecapMatrix,
  normalizeScoreTo100,
  sortTasksChronologically,
  type MapelGradeRecapMeta,
} from "@/lib/grade-recap-utils";
import { buildMapelGradesWorkbook } from "@/lib/export-mapel-grades";

const baseMeta: MapelGradeRecapMeta = {
  mapelId: "27",
  mapelNama: "Bahasa Inggris",
  mapelKode: "BING",
  kelasId: "90",
  kelasNama: "Kelas 7 - Ibnu Sina",
  jenjang: "SMP",
  guruNama: "Ustadz Farhan, S.Pd",
  generatedAt: "2026-11-12T07:00:00.000Z",
};

describe("grade-recap-utils", () => {
  it("normalizes scores with non-100 poinMaksimal accurately", () => {
    expect(normalizeScoreTo100(40, 50)).toBe(80);
    expect(normalizeScoreTo100(85, 100)).toBe(85);
    expect(normalizeScoreTo100(18, 20)).toBe(90);
  });

  it("sorts tasks chronologically by pertemuanKe (null last) then createdAt", () => {
    const sorted = sortTasksChronologically([
      { id: "3", pertemuanKe: null, createdAt: "2026-10-01T00:00:00.000Z" },
      { id: "2", pertemuanKe: 2, createdAt: "2026-10-05T00:00:00.000Z" },
      { id: "1", pertemuanKe: 1, createdAt: "2026-10-03T00:00:00.000Z" },
      { id: "4", pertemuanKe: 2, createdAt: "2026-10-02T00:00:00.000Z" },
    ]);

    expect(sorted.map((t) => t.id)).toEqual(["1", "4", "2", "3"]);
  });

  it("builds student x task matrix, ignores ungraded statuses in average, and computes KKM summary", () => {
    const result = buildMapelGradeRecapMatrix({
      meta: baseMeta,
      students: [
        { id: "s2", name: "Zaid", nis: "002", gender: "L" },
        { id: "s1", name: "Aisyah", nis: "001", gender: "P" },
        { id: "s3", name: "Bilal", nis: "003", gender: "L" },
      ],
      tasks: [
        {
          id: "t2",
          judul: "Writing",
          tipePengerjaan: "LEMBAR_KERJA",
          pertemuanKe: 2,
          pertemuanJudul: "Unit 2",
          deadline: "2026-10-10T00:00:00.000Z",
          createdAt: "2026-10-05T00:00:00.000Z",
          poinMaksimal: 50,
          submissions: [
            { siswaId: "s1", status: "sudah_dinilai", nilai: 40, submittedAt: "2026-10-08T00:00:00.000Z" }, // 80/100
            { siswaId: "s2", status: "menunggu_penilaian", nilai: null, submittedAt: "2026-10-09T00:00:00.000Z" },
          ],
        },
        {
          id: "t1",
          judul: "Quiz 1",
          tipePengerjaan: "INTERAKTIF",
          pertemuanKe: 1,
          pertemuanJudul: "Unit 1",
          deadline: "2026-10-04T00:00:00.000Z",
          createdAt: "2026-10-01T00:00:00.000Z",
          poinMaksimal: 100,
          submissions: [
            { siswaId: "s1", status: "sudah_dinilai", nilai: 90, submittedAt: "2026-10-02T00:00:00.000Z" },
            { siswaId: "s2", status: "sudah_dinilai", nilai: 65, submittedAt: "2026-10-03T00:00:00.000Z" },
          ],
        },
      ],
    });

    // Tasks should be ordered T1 (pertemuan 1), T2 (pertemuan 2)
    expect(result.tasks.map((t) => `${t.code}:${t.id}`)).toEqual(["T1:t1", "T2:t2"]);
    expect(result.tasks[0].totalSubmitted).toBe(2);
    expect(result.tasks[0].totalGraded).toBe(2);
    expect(result.tasks[0].avgScore).toBe(77.5);
    expect(result.tasks[1].totalSubmitted).toBe(2);
    expect(result.tasks[1].totalGraded).toBe(1);
    expect(result.tasks[1].avgScore).toBe(40);

    // Students sorted alphabetically: Aisyah, Bilal, Zaid
    expect(result.students.map((s) => s.name)).toEqual(["Aisyah", "Bilal", "Zaid"]);

    // Aisyah: T1=90 (100 max), T2=40/50 => normalized 80 => avg 85
    const aisyah = result.students[0];
    expect(aisyah.gradedCount).toBe(2);
    expect(aisyah.averageScore).toBe(85);
    expect(aisyah.kkmStatus).toBe("tuntas");
    expect(aisyah.scoresByTaskId["t2"].rawScore).toBe(40);
    expect(aisyah.scoresByTaskId["t2"].normalizedScore).toBe(80);

    // Bilal: no submissions
    const bilal = result.students[1];
    expect(bilal.gradedCount).toBe(0);
    expect(bilal.averageScore).toBeNull();
    expect(bilal.kkmStatus).toBe("belum_ada_nilai");
    expect(bilal.scoresByTaskId["t1"].status).toBe("belum_mengumpulkan");

    // Zaid: T1=65, T2=menunggu_penilaian -> only 1 graded, avg 65, belum_tuntas
    const zaid = result.students[2];
    expect(zaid.gradedCount).toBe(1);
    expect(zaid.averageScore).toBe(65);
    expect(zaid.kkmStatus).toBe("belum_tuntas");

    // Summary: 2 students with grades (Aisyah=85, Zaid=65) => classAvg=75, passed=1/2 (50%)
    expect(result.summary.totalStudents).toBe(3);
    expect(result.summary.studentsWithGrades).toBe(2);
    expect(result.summary.classAverage).toBe(75);
    expect(result.summary.highestAverage).toBe(85);
    expect(result.summary.lowestAverage).toBe(65);
    expect(result.summary.passedCount).toBe(1);
    expect(result.summary.passRatePercent).toBe(50);
  });

  it("builds a styled 3-sheet ExcelJS workbook without NIS column", async () => {
    const recap = buildMapelGradeRecapMatrix({
      meta: baseMeta,
      students: [
        { id: "s1", name: "Aisyah", nis: "001", gender: "P" },
        { id: "s2", name: "Zaid", nis: "002", gender: "L" },
      ],
      tasks: [
        {
          id: "t1",
          judul: "Quiz 1",
          tipePengerjaan: "INTERAKTIF",
          pertemuanKe: 1,
          pertemuanJudul: "Unit 1",
          deadline: "2026-10-04T00:00:00.000Z",
          createdAt: "2026-10-01T00:00:00.000Z",
          poinMaksimal: 100,
          submissions: [
            { siswaId: "s1", status: "sudah_dinilai", nilai: 90, submittedAt: "2026-10-02T00:00:00.000Z" },
            { siswaId: "s2", status: "perlu_revisi", nilai: null, submittedAt: "2026-10-03T00:00:00.000Z" },
          ],
        },
      ],
    });

    const wb = buildMapelGradesWorkbook(ExcelJS, recap);
    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      "Matriks Nilai",
      "Daftar Tugas",
      "Status Pengerjaan",
    ]);

    const wsMatrix = wb.getWorksheet("Matriks Nilai")!;
    const headerRow = wsMatrix.getRow(5);
    const headerValues = (headerRow.values as Array<unknown>).slice(1).map((v) => String(v ?? ""));
    expect(headerValues).not.toContain("NIS");
    expect(headerValues.some((h) => h.includes("KKM"))).toBe(false);
    expect(headerValues[0]).toBe("No");
    expect(headerValues[1]).toBe("Nama Lengkap Siswa");
    expect(headerValues[3]).toContain("T1");
    expect(headerValues[4]).toBe("Dinilai");
    expect(headerValues[5]).toBe("Rata-rata");
    expect(headerValues).toHaveLength(6);

    // Verifikasi pewarnaan header seragam emerald dark
    expect((headerRow.getCell(1).fill as ExcelJS.FillPattern).fgColor?.argb).toBe("FF047857");
    expect((headerRow.getCell(4).fill as ExcelJS.FillPattern).fgColor?.argb).toBe("FF047857");

    const aisyahRow = wsMatrix.getRow(6);
    expect(aisyahRow.getCell(2).value).toBe("Aisyah");
    expect(aisyahRow.getCell(4).value).toBe(90);
    expect(aisyahRow.getCell(5).value).toBe("1/1");
    expect(aisyahRow.getCell(6).value).toBe(90);
    expect((aisyahRow.getCell(6).fill as ExcelJS.FillPattern).fgColor?.argb).toBe("FFECFDF5");

    // Verifikasi lebar kolom sudah diatur rapi
    expect(wsMatrix.getColumn(2).width).toBeGreaterThanOrEqual(30);

    // Verifikasi bahwa tabel ringkasan statistik kelas di bawah matriks sudah tidak ada
    const allMatrixText = (wsMatrix.getRows(1, wsMatrix.rowCount) || []).flatMap((r) =>
      ((r.values as Array<unknown>) || []).map((v) => String(v ?? ""))
    );
    expect(allMatrixText).not.toContain("RINGKASAN STATISTIK KELAS");
    expect(allMatrixText).not.toContain("Siswa Memiliki Nilai");
    expect(allMatrixText).not.toContain("Rata-rata Nilai Kelas");

    const wsStatus = wb.getWorksheet("Status Pengerjaan")!;
    const statusHeader = (wsStatus.getRow(5).values as Array<unknown>).slice(1).map((v) => String(v ?? ""));
    expect(statusHeader).not.toContain("NIS");
    const zaidStatusRow = wsStatus.getRow(7);
    expect(zaidStatusRow.getCell(2).value).toBe("Zaid");
    expect(zaidStatusRow.getCell(4).value).toBe("Perlu Revisi");
    expect((zaidStatusRow.getCell(4).fill as ExcelJS.FillPattern).fgColor?.argb).toBe("FFFFE4E6");

    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(2000);
  });
});
