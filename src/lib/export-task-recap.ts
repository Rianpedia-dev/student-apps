"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface TaskRecapStudent {
  siswaId: string;
  siswaName: string;
  siswaNis: string | null;
  siswaGender?: string | null;
  status: string;
  submittedAt: string | null;
  nilai: number | null;
  catatanGuru: string | null;
}

export interface TaskRecapInfo {
  tugasId: string;
  judul: string;
  mapelNama: string;
  kelasNama: string;
  poinMaksimal: number;
  deadlineFormatted: string;
  guruNama?: string;
}

function cleanFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "sudah_dinilai":
      return "Sudah Dinilai";
    case "menunggu_penilaian":
      return "Menunggu Koreksi";
    case "perlu_revisi":
      return "Perlu Revisi";
    case "terlambat":
      return "Terlambat";
    case "sedang_mengerjakan":
      return "Sedang Mengerjakan";
    case "belum_mengumpulkan":
    default:
      return "Belum Mengumpulkan";
  }
}

/**
 * Ekspor Rekap Nilai Tugas ke Spreadsheet Excel (.xlsx)
 */
export async function exportTaskRecapToExcel(
  taskInfo: TaskRecapInfo,
  students: TaskRecapStudent[]
) {
  const XLSX = await import("xlsx");

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Calculate Stats
  const gradedStudents = students.filter((s) => s.nilai !== null && typeof s.nilai === "number");
  const scores = gradedStudents.map((s) => s.nilai as number);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";
  const maxScore = scores.length > 0 ? Math.max(...scores).toString() : "-";
  const minScore = scores.length > 0 ? Math.min(...scores).toString() : "-";
  const tuntasCount = scores.filter((sc) => sc >= 75).length;
  const tuntasPercent = scores.length > 0 ? `${Math.round((tuntasCount / scores.length) * 100)}%` : "-";

  const rows: any[][] = [
    ["YAYASAN ASUH ASOSIASI ISLAM AL-AZHAR CAIRO PALEMBANG"],
    ["REKAPITULASI EVALUASI PENUGASAN SISWA"],
    [`Judul Tugas: ${taskInfo.judul}`],
    [`Mata Pelajaran: ${taskInfo.mapelNama} | Kelas: ${taskInfo.kelasNama} | Poin Maksimal: ${taskInfo.poinMaksimal}`],
    [`Tenggat Waktu: ${taskInfo.deadlineFormatted} | Tanggal Unduh: ${today}`],
    [],
    [
      "No",
      "NIS",
      "Nama Lengkap Siswa",
      "Gender",
      "Status Tugas",
      "Waktu Mengumpulkan",
      "Nilai",
      "Ketuntasan (KKM 75)",
      "Catatan Guru",
    ],
  ];

  students.forEach((student, idx) => {
    const isGraded = student.nilai !== null && typeof student.nilai === "number";
    const kkmStatus = isGraded ? (student.nilai! >= 75 ? "Tuntas" : "Belum Tuntas") : "-";
    const submittedTime = student.submittedAt
      ? new Date(student.submittedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    rows.push([
      idx + 1,
      student.siswaNis || "-",
      student.siswaName,
      student.siswaGender === "P" ? "Perempuan" : "Laki-laki",
      formatStatusLabel(student.status),
      submittedTime,
      isGraded ? student.nilai : "-",
      kkmStatus,
      student.catatanGuru || "-",
    ]);
  });

  // Summary footer
  rows.push([]);
  rows.push(["RINGKASAN STATISTIK KELAS"]);
  rows.push(["Total Siswa di Kelas", students.length]);
  rows.push(["Total Siswa Sudah Dinilai", gradedStudents.length]);
  rows.push(["Rata-Rata Nilai", avgScore]);
  rows.push(["Nilai Tertinggi", maxScore]);
  rows.push(["Nilai Terendah", minScore]);
  rows.push(["Persentase Ketuntasan (KKM >= 75)", tuntasPercent]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 6 },  // No
    { wch: 14 }, // NIS
    { wch: 30 }, // Nama
    { wch: 12 }, // Gender
    { wch: 22 }, // Status
    { wch: 22 }, // Waktu
    { wch: 10 }, // Nilai
    { wch: 20 }, // Ketuntasan
    { wch: 35 }, // Catatan
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = `Rekap_${cleanFilename(taskInfo.kelasNama)}`.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `Rekap_Nilai_${cleanFilename(taskInfo.kelasNama)}_${cleanFilename(taskInfo.mapelNama)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Ekspor Rekap Nilai Tugas ke Dokumen PDF Cetak Resmi (.pdf)
 */
export async function exportTaskRecapToPdf(
  taskInfo: TaskRecapInfo,
  students: TaskRecapStudent[]
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Header Background bar
  doc.setFillColor(4, 120, 87); // Emerald 700
  doc.rect(0, 0, pageWidth, 24, "F");

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SD - SMP ISLAM AL-AZHAR CAIRO PALEMBANG", 14, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sistem Informasi Akademik & Portal Pembelajaran Terpadu (Student Apps)", 14, 16);
  doc.text(`Dicetak: ${todayStr}`, pageWidth - 14, 16, { align: "right" });

  // Document Title
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("REKAPITULASI NILAI EVALUASI PENUGASAN SISWA", 14, 33);

  // Metadata Card Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  doc.text(`Judul Tugas : ${taskInfo.judul}`, 14, 40);
  doc.text(`Mata Pelajaran: ${taskInfo.mapelNama}`, 14, 45);
  doc.text(`Rombel Kelas : ${taskInfo.kelasNama}`, 14, 50);

  doc.text(`Poin Maksimal : ${taskInfo.poinMaksimal} Poin`, pageWidth / 2, 40);
  doc.text(`Batas Waktu   : ${taskInfo.deadlineFormatted}`, pageWidth / 2, 45);
  doc.text(`Guru Pengampu : ${taskInfo.guruNama || "Dewan Guru"}`, pageWidth / 2, 50);

  // Table Body Preparation
  const tableData = students.map((s, idx) => {
    const isGraded = s.nilai !== null && typeof s.nilai === "number";
    const submittedTime = s.submittedAt
      ? new Date(s.submittedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    return [
      idx + 1,
      s.siswaNis || "-",
      s.siswaName,
      s.siswaGender === "P" ? "P" : "L",
      formatStatusLabel(s.status),
      submittedTime,
      isGraded ? s.nilai : "-",
      isGraded ? (s.nilai! >= 75 ? "Tuntas" : "Belum Tuntas") : "-",
      s.catatanGuru || "-",
    ];
  });

  autoTable(doc, {
    startY: 55,
    head: [
      ["No", "NIS", "Nama Lengkap Siswa", "L/P", "Status", "Waktu Kumpul", "Nilai", "KKM", "Catatan Guru"],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      valign: "middle",
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 20 },
      2: { cellWidth: 55 },
      3: { halign: "center", cellWidth: 10 },
      4: { halign: "center", cellWidth: 32 },
      5: { halign: "center", cellWidth: 28 },
      6: { halign: "center", fontStyle: "bold", cellWidth: 16 },
      7: { halign: "center", cellWidth: 22 },
      8: { cellWidth: "auto" },
    },
    didDrawPage: () => {
      // Footer page number
      const str = `Halaman ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    },
  });

  // Summary box & Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  if (finalY < 165) {
    const gradedCount = students.filter((s) => s.nilai !== null).length;
    const scores = students.filter((s) => s.nilai !== null).map((s) => s.nilai as number);
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";

    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Ringkasan: ${students.length} Siswa | ${gradedCount} Dinilai | Rata-rata Nilai: ${avg}`, 14, finalY + 8);

    // Signature Area
    const signX = pageWidth - 60;
    doc.text("Palembang, " + todayStr, signX, finalY + 8);
    doc.text("Guru Pengampu,", signX, finalY + 13);
    doc.setFont("helvetica", "bold");
    doc.text(taskInfo.guruNama || "Dewan Guru", signX, finalY + 28);
  }

  const fileName = `Rekap_Nilai_${cleanFilename(taskInfo.kelasNama)}_${cleanFilename(taskInfo.mapelNama)}.pdf`;
  doc.save(fileName);
}
