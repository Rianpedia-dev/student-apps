"use client";

import type ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable, { type Styles } from "jspdf-autotable";
import {
  formatGradeStatusLabel,
  type MapelGradeRecapPayload,
  type MapelGradeRecapTask,
} from "@/lib/grade-recap-utils";

function cleanFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

function cleanHeaderTitle(text: string, maxLen = 30): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const cut = trimmed.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 14) {
    return `${cut.slice(0, lastSpace)}...`;
  }
  return `${cut.trimEnd()}...`;
}

function formatTaskColumnHeader(t: MapelGradeRecapTask): string {
  const title = cleanHeaderTitle(t.judul, 30);
  if (t.poinMaksimal !== 100) {
    return `${t.code} (Maks ${t.poinMaksimal})\n${title}`;
  }
  return `${t.code}\n${title}`;
}

function formatTaskType(tipe: string): string {
  return tipe === "LEMBAR_KERJA" ? "Berkas" : "Kuis";
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatGenderShort(gender: string | null): string {
  if (gender === "P") return "P";
  if (gender === "L") return "L";
  return "-";
}

const EXCEL_COLORS = {
  emeraldDark: "FF047857",
  emeraldMid: "FF059669",
  emeraldDeep: "FF065F46",
  emeraldSoft: "FFD1FAE5",
  emeraldTint: "FFECFDF5",
  white: "FFFFFFFF",
  slate50: "FFF8FAFC",
  slate100: "FFF1F5F9",
  slate200: "FFE2E8F0",
  slate300: "FFCBD5E1",
  slate400: "FF94A3B8",
  slate500: "FF64748B",
  slate600: "FF475569",
  slate700: "FF334155",
  slate800: "FF1E293B",
  skySoft: "FFE0F2FE",
  skyText: "FF0369A1",
  blueSoft: "FFDBEAFE",
  blueText: "FF1E40AF",
  greenSoft: "FFDCFCE7",
  greenText: "FF166534",
  amberSoft: "FFFEF3C7",
  amberText: "FF92400E",
  roseSoft: "FFFFE4E6",
  roseText: "FFBE123C",
  purpleSoft: "FFF3E8FF",
  purpleText: "FF6B21A8",
} as const;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: EXCEL_COLORS.slate300 } },
  left: { style: "thin", color: { argb: EXCEL_COLORS.slate300 } },
  bottom: { style: "thin", color: { argb: EXCEL_COLORS.slate300 } },
  right: { style: "thin", color: { argb: EXCEL_COLORS.slate300 } },
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: EXCEL_COLORS.emeraldDeep } },
  left: { style: "thin", color: { argb: EXCEL_COLORS.emeraldDeep } },
  bottom: { style: "medium", color: { argb: EXCEL_COLORS.emeraldDeep } },
  right: { style: "thin", color: { argb: EXCEL_COLORS.emeraldDeep } },
};

function solidFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function applyBannerRows(
  ws: ExcelJS.Worksheet,
  totalCols: number,
  sheetTitle: string,
  metaInfo: string
) {
  const lastColLetter = ws.getColumn(Math.max(totalCols, 1)).letter;

  // Baris 1: Kop Sekolah
  const row1 = ws.addRow(["Sekolah Islam Al Azhar Cairo Palembang"]);
  row1.height = 28;
  ws.mergeCells(`A1:${lastColLetter}1`);
  for (let c = 1; c <= totalCols; c++) {
    const cell = row1.getCell(c);
    cell.fill = solidFill(EXCEL_COLORS.emeraldDark);
    cell.font = { name: "Calibri", size: 13, bold: true, color: { argb: EXCEL_COLORS.white } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  }

  // Baris 2: Subjudul Dokumen
  const row2 = ws.addRow([sheetTitle]);
  row2.height = 22;
  ws.mergeCells(`A2:${lastColLetter}2`);
  for (let c = 1; c <= totalCols; c++) {
    const cell = row2.getCell(c);
    cell.fill = solidFill(EXCEL_COLORS.emeraldMid);
    cell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: EXCEL_COLORS.white } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  }

  // Baris 3: Info Ringkas (Mata Pelajaran, Kelas, Guru, Tanggal)
  const row3 = ws.addRow([metaInfo]);
  row3.height = 20;
  ws.mergeCells(`A3:${lastColLetter}3`);
  for (let c = 1; c <= totalCols; c++) {
    const cell = row3.getCell(c);
    cell.fill = solidFill(EXCEL_COLORS.slate50);
    cell.font = { name: "Calibri", size: 9.5, color: { argb: EXCEL_COLORS.slate600 } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin", color: { argb: EXCEL_COLORS.slate200 } } };
  }

  // Baris 4: Baris Pemisah
  const spacer = ws.addRow([]);
  spacer.height = 8;
}

function getStatusCellPalette(
  status: string,
  baseRowBg: string
): { bg: string; text: string; bold: boolean } {
  switch (status) {
    case "sudah_dinilai":
      return { bg: EXCEL_COLORS.emeraldTint, text: EXCEL_COLORS.emeraldDeep, bold: true };
    case "menunggu_penilaian":
      return { bg: EXCEL_COLORS.skySoft, text: EXCEL_COLORS.skyText, bold: true };
    case "terlambat":
      return { bg: EXCEL_COLORS.amberSoft, text: EXCEL_COLORS.amberText, bold: true };
    case "perlu_revisi":
      return { bg: EXCEL_COLORS.roseSoft, text: EXCEL_COLORS.roseText, bold: true };
    case "sedang_mengerjakan":
      return { bg: EXCEL_COLORS.purpleSoft, text: EXCEL_COLORS.purpleText, bold: true };
    case "belum_mengumpulkan":
    default:
      return { bg: baseRowBg, text: EXCEL_COLORS.slate400, bold: false };
  }
}

/**
 * Menyusun workbook Excel (.xlsx) dengan styling warna, border, auto-width, dan freeze panes
 * untuk rekap semua nilai tugas dalam 1 mata pelajaran & kelas.
 */
export function buildMapelGradesWorkbook(
  ExcelJSModule: typeof ExcelJS,
  recap: MapelGradeRecapPayload
): ExcelJS.Workbook {
  const { meta, tasks, students } = recap;
  const today = new Date(meta.generatedAt || Date.now()).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const wb = new ExcelJSModule.Workbook();
  wb.creator = "Student Apps - Al-Azhar Cairo Palembang";
  wb.created = new Date(meta.generatedAt || Date.now());

  // ---------------------------------------------------------------------------
  // SHEET 1: MATRIKS NILAI SISWA X TUGAS
  // ---------------------------------------------------------------------------
  const wsMatrix = wb.addWorksheet("Matriks Nilai", {
    properties: { tabColor: { argb: EXCEL_COLORS.emeraldDark } },
  });

  const matrixHeaders = [
    "No",
    "Nama Lengkap Siswa",
    "L/P",
    ...tasks.map((t) => formatTaskColumnHeader(t)),
    "Dinilai",
    "Rata-rata",
  ];

  const totalMatrixCols = matrixHeaders.length;
  applyBannerRows(
    wsMatrix,
    totalMatrixCols,
    "REKAPITULASI NILAI SEMUA TUGAS SISWA",
    `Mata Pelajaran: ${meta.mapelNama} (${meta.mapelKode})   •   Kelas: ${meta.kelasNama} (${meta.jenjang})   •   Guru: ${meta.guruNama}   •   Tanggal: ${today}`
  );

  // Header Tabel (Baris 5)
  const headerRowNumber = wsMatrix.rowCount + 1;
  const matrixHeaderRow = wsMatrix.addRow(matrixHeaders);
  matrixHeaderRow.height = 36;
  matrixHeaderRow.eachCell((cell) => {
    cell.fill = solidFill(EXCEL_COLORS.emeraldDark);
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = HEADER_BORDER;
  });

  // Baris Data Siswa
  students.forEach((student, idx) => {
    const isEven = idx % 2 === 1;
    const baseRowBg = isEven ? EXCEL_COLORS.slate50 : EXCEL_COLORS.white;

    const taskScores = tasks.map((task) => {
      const cell = student.scoresByTaskId[task.id];
      return cell && cell.rawScore !== null ? cell.rawScore : "-";
    });

    const dataRow = wsMatrix.addRow([
      idx + 1,
      student.name,
      formatGenderShort(student.gender),
      ...taskScores,
      `${student.gradedCount}/${student.totalTasks}`,
      student.averageScore !== null ? student.averageScore : "-",
    ]);
    dataRow.height = 22;

    // Styling kolom identitas
    const noCell = dataRow.getCell(1);
    noCell.fill = solidFill(isEven ? EXCEL_COLORS.slate100 : EXCEL_COLORS.slate50);
    noCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.slate600 } };
    noCell.alignment = { vertical: "middle", horizontal: "center" };
    noCell.border = THIN_BORDER;

    const nameCell = dataRow.getCell(2);
    nameCell.fill = solidFill(baseRowBg);
    nameCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.slate800 } };
    nameCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    nameCell.border = THIN_BORDER;

    const genderCell = dataRow.getCell(3);
    genderCell.fill = solidFill(baseRowBg);
    genderCell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate600 } };
    genderCell.alignment = { vertical: "middle", horizontal: "center" };
    genderCell.border = THIN_BORDER;

    // Styling sel nilai per tugas
    tasks.forEach((task, tIdx) => {
      const colCell = dataRow.getCell(4 + tIdx);
      const cellData = student.scoresByTaskId[task.id];
      const hasScore = cellData && cellData.rawScore !== null;

      colCell.fill = solidFill(baseRowBg);
      if (hasScore) {
        colCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.slate800 } };
      } else {
        colCell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate400 } };
      }
      colCell.alignment = { vertical: "middle", horizontal: "center" };
      colCell.border = THIN_BORDER;
    });

    // Kolom Dinilai (Subtle, rapi, tidak silau)
    const gradedColIdx = 4 + tasks.length;
    const gradedCell = dataRow.getCell(gradedColIdx);
    gradedCell.fill = solidFill(baseRowBg);
    gradedCell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate600 } };
    gradedCell.alignment = { vertical: "middle", horizontal: "center" };
    gradedCell.border = THIN_BORDER;

    // Kolom Rata-rata
    const avgCell = dataRow.getCell(gradedColIdx + 1);
    if (student.averageScore !== null) {
      avgCell.fill = solidFill(EXCEL_COLORS.emeraldTint);
      avgCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: EXCEL_COLORS.emeraldDeep } };
      avgCell.numFmt = "0.0";
    } else {
      avgCell.fill = solidFill(baseRowBg);
      avgCell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate400 } };
    }
    avgCell.alignment = { vertical: "middle", horizontal: "center" };
    avgCell.border = THIN_BORDER;
  });

  // Lebar kolom otomatis & proporsional pada Sheet 1
  const longestNameLen = students.reduce((max, s) => Math.max(max, s.name.length), 20);
  wsMatrix.getColumn(1).width = 6;
  wsMatrix.getColumn(2).width = Math.min(Math.max(longestNameLen + 4, 30), 42);
  wsMatrix.getColumn(3).width = 7;
  tasks.forEach((t, idx) => {
    wsMatrix.getColumn(4 + idx).width = Math.max(22, Math.min(t.judul.length + 2, 28));
  });
  wsMatrix.getColumn(4 + tasks.length).width = 12;
  wsMatrix.getColumn(5 + tasks.length).width = 14;

  wsMatrix.views = [{ state: "frozen", xSplit: 2, ySplit: headerRowNumber }];
  wsMatrix.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber + students.length, column: totalMatrixCols },
  };

  // ---------------------------------------------------------------------------
  // SHEET 2: DAFTAR & STATISTIK TUGAS
  // ---------------------------------------------------------------------------
  const wsTasks = wb.addWorksheet("Daftar Tugas", {
    properties: { tabColor: { argb: EXCEL_COLORS.emeraldMid } },
  });

  applyBannerRows(
    wsTasks,
    9,
    "DAFTAR RINCIAN & STATISTIK TUGAS",
    `Mata Pelajaran: ${meta.mapelNama} (${meta.mapelKode})   •   Kelas: ${meta.kelasNama} (${meta.jenjang})   •   Total: ${tasks.length} Tugas`
  );

  const taskHeaderRowNum = wsTasks.rowCount + 1;
  const taskHeaderRow = wsTasks.addRow([
    "Kode",
    "Judul Tugas",
    "Tipe",
    "Pertemuan",
    "Batas Waktu",
    "Poin Maks",
    "Mengumpulkan",
    "Sudah Dinilai",
    "Rata-rata Tugas",
  ]);
  taskHeaderRow.height = 32;
  taskHeaderRow.eachCell((cell) => {
    cell.fill = solidFill(EXCEL_COLORS.emeraldDark);
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = HEADER_BORDER;
  });

  tasks.forEach((t, idx) => {
    const isEven = idx % 2 === 1;
    const bg = isEven ? EXCEL_COLORS.slate50 : EXCEL_COLORS.white;
    const meetingLabel =
      t.pertemuanKe !== null
        ? `Pertemuan ${t.pertemuanKe}${t.pertemuanJudul ? ` - ${t.pertemuanJudul}` : ""}`
        : "-";
    const tipeLabel = formatTaskType(t.tipePengerjaan);

    const row = wsTasks.addRow([
      t.code,
      t.judul,
      tipeLabel,
      meetingLabel,
      formatShortDate(t.deadline),
      t.poinMaksimal,
      `${t.totalSubmitted} dari ${students.length}`,
      `${t.totalGraded} dari ${students.length}`,
      t.avgScore !== null ? t.avgScore : "-",
    ]);
    row.height = meetingLabel.length > 30 || t.judul.length > 30 ? 30 : 24;

    row.eachCell((cell, colNum) => {
      cell.fill = solidFill(bg);
      cell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate800 } };
      cell.border = THIN_BORDER;

      if (colNum === 1) {
        cell.fill = solidFill(EXCEL_COLORS.emeraldTint);
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.emeraldDeep } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNum === 2 || colNum === 4) {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
        if (colNum === 2) {
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.slate800 } };
        }
      } else if (colNum === 3) {
        const isDoc = t.tipePengerjaan === "LEMBAR_KERJA";
        cell.fill = solidFill(isDoc ? EXCEL_COLORS.slate100 : EXCEL_COLORS.blueSoft);
        cell.font = {
          name: "Calibri",
          size: 9.5,
          bold: true,
          color: { argb: isDoc ? EXCEL_COLORS.slate600 : EXCEL_COLORS.blueText },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNum === 7 || colNum === 8) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: "Calibri", size: 9.5, color: { argb: EXCEL_COLORS.slate600 } };
      } else if (colNum === 9) {
        if (t.avgScore !== null) {
          cell.fill = solidFill(EXCEL_COLORS.emeraldTint);
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.emeraldDeep } };
          cell.numFmt = "0.0";
        } else {
          cell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate400 } };
        }
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  });

  const longestJudulLen = tasks.reduce((max, t) => Math.max(max, t.judul.length), 24);
  wsTasks.getColumn(1).width = 9;
  wsTasks.getColumn(2).width = Math.min(Math.max(longestJudulLen + 4, 34), 50);
  wsTasks.getColumn(3).width = 12;
  wsTasks.getColumn(4).width = 36;
  wsTasks.getColumn(5).width = 16;
  wsTasks.getColumn(6).width = 12;
  wsTasks.getColumn(7).width = 16;
  wsTasks.getColumn(8).width = 16;
  wsTasks.getColumn(9).width = 16;
  wsTasks.views = [{ state: "frozen", ySplit: taskHeaderRowNum }];

  // ---------------------------------------------------------------------------
  // SHEET 3: STATUS PENGERJAAN PER TUGAS
  // ---------------------------------------------------------------------------
  const wsStatus = wb.addWorksheet("Status Pengerjaan", {
    properties: { tabColor: { argb: EXCEL_COLORS.skyText } },
  });

  const statusHeaders = [
    "No",
    "Nama Lengkap Siswa",
    "L/P",
    ...tasks.map((t) => formatTaskColumnHeader(t)),
  ];

  applyBannerRows(
    wsStatus,
    statusHeaders.length,
    "STATUS PENGERJAAN & KOREKSI SISWA PER TUGAS",
    `Mata Pelajaran: ${meta.mapelNama} (${meta.mapelKode})   •   Kelas: ${meta.kelasNama} (${meta.jenjang})   •   Total: ${students.length} Siswa`
  );

  const statusHeaderRowNum = wsStatus.rowCount + 1;
  const statusHeaderRow = wsStatus.addRow(statusHeaders);
  statusHeaderRow.height = 36;
  statusHeaderRow.eachCell((cell) => {
    cell.fill = solidFill(EXCEL_COLORS.emeraldDark);
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = HEADER_BORDER;
  });

  students.forEach((student, idx) => {
    const isEven = idx % 2 === 1;
    const bg = isEven ? EXCEL_COLORS.slate50 : EXCEL_COLORS.white;
    const statuses = tasks.map((t) => {
      const cell = student.scoresByTaskId[t.id];
      return cell?.status || "belum_mengumpulkan";
    });

    const row = wsStatus.addRow([
      idx + 1,
      student.name,
      formatGenderShort(student.gender),
      ...statuses.map((st) => formatGradeStatusLabel(st)),
    ]);
    row.height = 22;

    const noCell = row.getCell(1);
    noCell.fill = solidFill(isEven ? EXCEL_COLORS.slate100 : EXCEL_COLORS.slate50);
    noCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.slate600 } };
    noCell.alignment = { vertical: "middle", horizontal: "center" };
    noCell.border = THIN_BORDER;

    const nameCell = row.getCell(2);
    nameCell.fill = solidFill(bg);
    nameCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: EXCEL_COLORS.slate800 } };
    nameCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    nameCell.border = THIN_BORDER;

    const genderCell = row.getCell(3);
    genderCell.fill = solidFill(bg);
    genderCell.font = { name: "Calibri", size: 10, color: { argb: EXCEL_COLORS.slate600 } };
    genderCell.alignment = { vertical: "middle", horizontal: "center" };
    genderCell.border = THIN_BORDER;

    statuses.forEach((st, tIdx) => {
      const stCell = row.getCell(4 + tIdx);
      const palette = getStatusCellPalette(st, bg);
      stCell.fill = solidFill(palette.bg);
      stCell.font = {
        name: "Calibri",
        size: 9.5,
        bold: palette.bold,
        color: { argb: palette.text },
      };
      stCell.alignment = { vertical: "middle", horizontal: "center" };
      stCell.border = THIN_BORDER;
    });
  });

  wsStatus.getColumn(1).width = 6;
  wsStatus.getColumn(2).width = Math.min(Math.max(longestNameLen + 4, 30), 42);
  wsStatus.getColumn(3).width = 7;
  tasks.forEach((t, idx) => {
    wsStatus.getColumn(4 + idx).width = Math.max(22, Math.min(t.judul.length + 2, 28));
  });
  wsStatus.views = [{ state: "frozen", xSplit: 2, ySplit: statusHeaderRowNum }];
  wsStatus.autoFilter = {
    from: { row: statusHeaderRowNum, column: 1 },
    to: { row: statusHeaderRowNum + students.length, column: statusHeaders.length },
  };

  return wb;
}

/**
 * Ekspor Rekap Semua Nilai Tugas ke Spreadsheet Excel (.xlsx)
 */
export async function exportMapelGradesToExcel(recap: MapelGradeRecapPayload) {
  const excelJsModule = await import("exceljs");
  const ExcelJS = (excelJsModule.default ?? excelJsModule) as typeof import("exceljs");
  const wb = buildMapelGradesWorkbook(ExcelJS, recap);
  const buffer = await wb.xlsx.writeBuffer();

  const fileName = `Rekap_Semua_Nilai_${cleanFilename(recap.meta.kelasNama)}_${cleanFilename(
    recap.meta.mapelNama
  )}.xlsx`;

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function drawPdfHeader(doc: jsPDF, recap: MapelGradeRecapPayload, todayStr: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { meta, tasks, students } = recap;

  // Emerald header bar
  doc.setFillColor(4, 120, 87);
  doc.rect(0, 0, pageWidth, 23, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text("Sekolah Islam Al Azhar Cairo Palembang", 12, 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Sistem Informasi Akademik & Portal Pembelajaran Terpadu (Student Apps)", 12, 15.5);
  doc.text(`Dicetak: ${todayStr}`, pageWidth - 12, 15.5, { align: "right" });

  // Title
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("REKAPITULASI NILAI SEMUA TUGAS SISWA", 12, 31);

  // Metadata 2 kolom
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  doc.text(`Mata Pelajaran : ${meta.mapelNama} (${meta.mapelKode})`, 12, 37.5);
  doc.text(`Rombel Kelas   : ${meta.kelasNama} (${meta.jenjang})`, 12, 42.5);

  doc.text(`Guru Pengampu  : ${meta.guruNama}`, pageWidth / 2, 37.5);
  doc.text(`Cakupan Data   : ${students.length} Siswa | ${tasks.length} Tugas`, pageWidth / 2, 42.5);

  return 47;
}

function chunkTasks(tasks: MapelGradeRecapTask[], chunkSize: number): MapelGradeRecapTask[][] {
  if (tasks.length === 0) return [[]];
  const chunks: MapelGradeRecapTask[][] = [];
  for (let i = 0; i < tasks.length; i += chunkSize) {
    chunks.push(tasks.slice(i, i + chunkSize));
  }
  return chunks;
}

function getLastAutoTableFinalY(doc: jsPDF, fallback: number): number {
  const docWithTable = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
  return docWithTable.lastAutoTable?.finalY ?? fallback;
}

/**
 * Ekspor Rekap Semua Nilai Tugas ke Dokumen PDF Cetak Resmi (.pdf)
 */
export async function exportMapelGradesToPdf(recap: MapelGradeRecapPayload) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date(recap.meta.generatedAt || Date.now()).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let currentY = drawPdfHeader(doc, recap, todayStr);

  // 1. Tabel Matriks Nilai (chunk otomatis per 10 tugas agar kolom selalu terbaca rapi)
  const taskBlocks = chunkTasks(recap.tasks, 10);

  taskBlocks.forEach((taskChunk, blockIdx) => {
    const isFirstBlock = blockIdx === 0;
    const isLastBlock = blockIdx === taskBlocks.length - 1;

    if (!isFirstBlock) {
      doc.addPage();
      currentY = 14;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 30, 30);
      doc.text(
        `Lanjutan Matriks Nilai (${taskChunk[0].code} - ${taskChunk[taskChunk.length - 1].code}) — ${recap.meta.mapelNama} (${recap.meta.kelasNama})`,
        12,
        currentY
      );
      currentY += 4;
    }

    const printableWidth = pageWidth - 24; // 297 - 12 - 12 = 273 mm
    const numTasks = taskChunk.length;

    const colWidthNo = 10;
    const colWidthGender = 10;
    const colWidthGraded = isLastBlock ? 18 : 0;
    const colWidthAvg = isLastBlock ? 20 : 0;

    const totalFixed = colWidthNo + colWidthGender + colWidthGraded + colWidthAvg;
    const remainingWidth = printableWidth - totalFixed;

    let colWidthName: number;
    let colWidthTask: number;

    if (numTasks <= 3) {
      colWidthName = 75;
      colWidthTask = (remainingWidth - colWidthName) / numTasks;
    } else if (numTasks <= 5) {
      colWidthName = 68;
      colWidthTask = (remainingWidth - colWidthName) / numTasks;
    } else if (numTasks <= 8) {
      colWidthName = 60;
      colWidthTask = (remainingWidth - colWidthName) / numTasks;
    } else {
      colWidthName = 53;
      colWidthTask = (remainingWidth - colWidthName) / numTasks;
    }

    const headRow = [
      "No",
      "Nama Lengkap Siswa",
      "L/P",
      ...taskChunk.map((t) => {
        if (colWidthTask >= 26) {
          const shortTitle = cleanHeaderTitle(t.judul, 22);
          const maxPts = t.poinMaksimal !== 100 ? ` (${t.poinMaksimal})` : "";
          return `${t.code}\n${shortTitle}${maxPts}`;
        }
        return t.poinMaksimal !== 100 ? `${t.code}\n(/${t.poinMaksimal})` : t.code;
      }),
      ...(isLastBlock ? ["Dinilai", "Rata-rata"] : []),
    ];

    const bodyRows = recap.students.map((student, sIdx) => {
      const cells = taskChunk.map((t) => {
        const cell = student.scoresByTaskId[t.id];
        return cell && cell.rawScore !== null ? cell.rawScore : "-";
      });

      const summaryCells = isLastBlock
        ? [
            `${student.gradedCount}/${student.totalTasks}`,
            student.averageScore !== null ? student.averageScore : "-",
          ]
        : [];

      return [
        sIdx + 1,
        student.name,
        formatGenderShort(student.gender),
        ...cells,
        ...summaryCells,
      ];
    });

    const columnStyles: Record<number, Partial<Styles>> = {
      0: { halign: "center", cellWidth: colWidthNo },
      1: { halign: "left", cellWidth: colWidthName },
      2: { halign: "center", cellWidth: colWidthGender },
    };

    taskChunk.forEach((_, idx) => {
      columnStyles[3 + idx] = { halign: "center", cellWidth: colWidthTask };
    });

    if (isLastBlock) {
      const summaryStartIdx = 3 + taskChunk.length;
      columnStyles[summaryStartIdx] = { halign: "center", cellWidth: colWidthGraded };
      columnStyles[summaryStartIdx + 1] = {
        halign: "center",
        fontStyle: "bold",
        cellWidth: colWidthAvg,
      };
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: 12, right: 12, bottom: 14 },
      tableWidth: printableWidth,
      head: [headRow],
      body: bodyRows,
      theme: "grid",
      headStyles: {
        fillColor: [4, 120, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
        lineColor: [4, 120, 87],
        lineWidth: 0.2,
      },
      styles: {
        fontSize: 7.8,
        cellPadding: 2,
        valign: "middle",
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
      didParseCell: (data) => {
        if (data.section === "body") {
          // Kolom rata-rata di blok terakhir diberi highlight hijau lembut
          if (isLastBlock && data.column.index === 3 + taskChunk.length + 1) {
            if (data.cell.raw !== "-") {
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.textColor = [6, 95, 70];
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [148, 163, 184];
            }
          }
          // Nilai tugas
          if (data.column.index >= 3 && data.column.index < 3 + taskChunk.length) {
            if (data.cell.raw === "-") {
              data.cell.styles.textColor = [148, 163, 184];
            } else {
              data.cell.styles.textColor = [15, 23, 42];
              data.cell.styles.fontStyle = "bold";
            }
          }
          // No dan L/P
          if (data.column.index === 0 || data.column.index === 2) {
            data.cell.styles.textColor = [71, 85, 105];
          }
          // Kolom Dinilai
          if (isLastBlock && data.column.index === 3 + taskChunk.length) {
            data.cell.styles.textColor = [71, 85, 105];
          }
        }
      },
      didDrawPage: () => {
        const str = `Halaman ${doc.getNumberOfPages()}`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(str, pageWidth - 12, pageHeight - 7, { align: "right" });
      },
    });

    currentY = getLastAutoTableFinalY(doc, currentY + 30) + 6;
  });

  // 2. Tabel Keterangan / Legenda Kode Tugas
  if (recap.tasks.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 14;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Keterangan Rincian Tugas", 12, currentY);

    const printableWidth = pageWidth - 24;

    autoTable(doc, {
      startY: currentY + 2.5,
      margin: { left: 12, right: 12, bottom: 14 },
      tableWidth: printableWidth,
      head: [
        [
          "Kode",
          "Judul Tugas",
          "Tipe",
          "Pertemuan",
          "Batas Waktu",
          "Maks",
          "Mengumpulkan",
          "Sudah Dinilai",
          "Rata-rata",
        ],
      ],
      body: recap.tasks.map((t) => [
        t.code,
        t.judul,
        formatTaskType(t.tipePengerjaan),
        t.pertemuanKe !== null ? `Pertemuan ${t.pertemuanKe}` : "-",
        formatShortDate(t.deadline),
        t.poinMaksimal,
        `${t.totalSubmitted} dari ${recap.students.length}`,
        `${t.totalGraded} dari ${recap.students.length}`,
        t.avgScore !== null ? t.avgScore : "-",
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "center",
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      styles: {
        fontSize: 7.3,
        cellPadding: 2,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 14 },
        1: { cellWidth: 79 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 44 },
        4: { halign: "center", cellWidth: 28 },
        5: { halign: "center", cellWidth: 18 },
        6: { halign: "center", cellWidth: 23 },
        7: { halign: "center", cellWidth: 23 },
        8: { halign: "center", fontStyle: "bold", cellWidth: 24 },
      },
      didDrawPage: () => {
        const str = `Halaman ${doc.getNumberOfPages()}`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text(str, pageWidth - 12, pageHeight - 7, { align: "right" });
      },
    });

    currentY = getLastAutoTableFinalY(doc, currentY + 20) + 8;
  }

  // 3. Ringkasan Catatan & Area Tanda Tangan Guru Pengampu
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Catatan Dokumen:", 12, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "• Tanda '-' menunjukkan tugas belum dikoreksi atau siswa belum mengumpulkan tugas.",
    12,
    currentY + 4.5
  );
  doc.text(
    "• Rata-rata dihitung dari total nilai tugas yang sudah dinilai dibagi jumlah tugas yang telah dinilai.",
    12,
    currentY + 9
  );

  const signX = pageWidth - 65;
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Palembang, ${todayStr}`, signX, currentY);
  doc.text("Guru Pengampu Mata Pelajaran,", signX, currentY + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(recap.meta.guruNama || "Dewan Guru", signX, currentY + 20);

  const fileName = `Rekap_Semua_Nilai_${cleanFilename(recap.meta.kelasNama)}_${cleanFilename(
    recap.meta.mapelNama
  )}.pdf`;
  doc.save(fileName);
}

