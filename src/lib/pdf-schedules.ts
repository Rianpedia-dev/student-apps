import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface SchedulePdfItem {
  id: string;
  kelasNama: string;
  jenjang: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mapelKode: string;
  mapelNama: string;
  guruNama: string;
  guruNiy?: string;
  tahunPelajaran?: string;
  semester?: string;
}

const DAY_ORDER: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
  ahad: 7,
  minggu: 7,
};

/**
 * Urutkan jadwal berdasarkan hari (Senin -> Sabtu), lalu waktu mulai
 */
function sortSchedulesByDayAndTime(items: SchedulePdfItem[]): SchedulePdfItem[] {
  return [...items].sort((a, b) => {
    const dayA = DAY_ORDER[a.hari.trim().toLowerCase()] || 99;
    const dayB = DAY_ORDER[b.hari.trim().toLowerCase()] || 99;
    if (dayA !== dayB) return dayA - dayB;
    const timeComp = a.jamMulai.localeCompare(b.jamMulai);
    if (timeComp !== 0) return timeComp;
    return a.jamSelesai.localeCompare(b.jamSelesai);
  });
}

/**
 * Format 1: Cetak Jadwal Pelajaran Resmi per Kelas
 * Susunan Kolom: No | Hari | Waktu Mulai | Waktu Selesai | Mata Pelajaran | Nama Guru
 */
export function generateScheduleClassGridPdf(params: {
  kelasNama: string;
  jenjang?: string;
  tahunPelajaran: string;
  semester: string;
  schedules: SchedulePdfItem[];
  orientation?: "portrait" | "landscape";
}) {
  const { kelasNama, tahunPelajaran, semester, schedules, orientation = "portrait" } = params;

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const isPortrait = orientation === "portrait";
  const pageWidth = isPortrait ? 210 : 297;
  const pageCenter = pageWidth / 2;
  const rightMargin = pageWidth - 14;

  // Header Kop Sekolah
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SD - SMP ISLAM AL-AZHAR CAIRO PALEMBANG", pageCenter, 14, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`JADWAL PELAJARAN KBM • ${kelasNama.toUpperCase()}`, pageCenter, 20, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tahun Pelajaran: ${tahunPelajaran}  |  Semester: ${semester === "2" ? "2 (Genap)" : "1 (Ganjil)"}`,
    pageCenter,
    26,
    { align: "center" }
  );

  // Garis batas kop
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.6);
  doc.line(14, 29, rightMargin, 29);

  // Urutkan jadwal per hari dan waktu mulai
  const sorted = sortSchedulesByDayAndTime(schedules);

  const tableRows = sorted.map((s, idx) => [
    idx + 1,
    s.hari,
    s.jamMulai,
    s.jamSelesai,
    s.mapelNama,
    s.guruNama,
  ]);

  // Lebar kolom sesuai orientasi kertas
  const colStyles: Record<number, { halign: "center" | "left"; cellWidth: number }> = isPortrait
    ? {
        0: { halign: "center", cellWidth: 12 },  // No
        1: { halign: "center", cellWidth: 24 },  // Hari
        2: { halign: "center", cellWidth: 24 },  // Waktu Mulai
        3: { halign: "center", cellWidth: 24 },  // Waktu Selesai
        4: { halign: "left", cellWidth: 50 },    // Mata Pelajaran
        5: { halign: "left", cellWidth: 48 },    // Nama Guru
      }
    : {
        0: { halign: "center", cellWidth: 15 },  // No
        1: { halign: "center", cellWidth: 32 },  // Hari
        2: { halign: "center", cellWidth: 32 },  // Waktu Mulai
        3: { halign: "center", cellWidth: 32 },  // Waktu Selesai
        4: { halign: "left", cellWidth: 80 },    // Mata Pelajaran
        5: { halign: "left", cellWidth: 78 },    // Nama Guru
      };

  autoTable(doc, {
    startY: 33,
    head: [["No", "Hari", "Waktu Mulai", "Waktu Selesai", "Mata Pelajaran", "Nama Guru"]],
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      font: "helvetica",
      valign: "middle",
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 118, 110], // Teal-700 Resmi Al-Azhar
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: colStyles,
  });

  // Area Tanda Tangan
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 160;
  const pageHeight = isPortrait ? 297 : 210;
  let signY = finalY + 12;

  // Jika terlalu dekat dengan batas bawah kertas, pindah ke halaman berikutnya
  if (signY + 35 > pageHeight - 15) {
    doc.addPage();
    signY = 25;
  }

  const signX = isPortrait ? 155 : 235;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Palembang, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    signX,
    signY,
    { align: "center" }
  );
  doc.text("Waka Kurikulum / Kepala Sekolah,", signX, signY + 5, { align: "center" });
  doc.text("( ......................................... )", signX, signY + 23, { align: "center" });
  doc.text("NIY: .......................................", signX, signY + 28, { align: "center" });

  const filename = `Jadwal_KBM_${kelasNama.replace(/\s+/g, "_")}_${tahunPelajaran.replace(/\//g, "-")}_Sem${semester}.pdf`;
  doc.save(filename);
}

/**
 * Format 2: Cetak Rekapitulasi Seluruh Jadwal Sekolah (Tabular View resmi ber-kop)
 * Jika mencakup banyak kelas, kolom Rombel Kelas otomatis disertakan.
 */
export function generateScheduleTabularPdf(params: {
  scopeTitle: string;
  tahunPelajaran: string;
  semester: string;
  schedules: SchedulePdfItem[];
  orientation?: "portrait" | "landscape";
}) {
  const { scopeTitle, tahunPelajaran, semester, schedules, orientation = "landscape" } = params;

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const isPortrait = orientation === "portrait";
  const pageWidth = isPortrait ? 210 : 297;
  const pageCenter = pageWidth / 2;
  const rightMargin = pageWidth - 14;

  // Header Sekolah
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SD - SMP ISLAM AL-AZHAR CAIRO PALEMBANG", pageCenter, 13, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`REKAPITULASI JADWAL PELAJARAN KBM • ${scopeTitle.toUpperCase()}`, pageCenter, 19, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tahun Pelajaran: ${tahunPelajaran}  |  Semester: ${semester === "2" ? "2 (Genap)" : "1 (Ganjil)"}  |  Total Sesi: ${schedules.length} Sesi`,
    pageCenter,
    25,
    { align: "center" }
  );

  // Garis batas kop
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.6);
  doc.line(14, 28, rightMargin, 28);

  // Urutkan jadwal: Hari -> Jam Mulai -> Kelas
  const sorted = sortSchedulesByDayAndTime(schedules);

  // Cek apakah jadwal memiliki lebih dari 1 kelas
  const uniqueClasses = new Set(schedules.map((s) => s.kelasNama));
  const isMultiClass = uniqueClasses.size > 1;

  const tableRows = sorted.map((s, idx) => {
    if (isMultiClass) {
      return [
        idx + 1,
        s.hari,
        s.jamMulai,
        s.jamSelesai,
        s.kelasNama,
        s.mapelNama,
        s.guruNama,
      ];
    } else {
      return [
        idx + 1,
        s.hari,
        s.jamMulai,
        s.jamSelesai,
        s.mapelNama,
        s.guruNama,
      ];
    }
  });

  const tableHead = isMultiClass
    ? [["No", "Hari", "Waktu Mulai", "Waktu Selesai", "Rombel Kelas", "Mata Pelajaran", "Nama Guru"]]
    : [["No", "Hari", "Waktu Mulai", "Waktu Selesai", "Mata Pelajaran", "Nama Guru"]];

  const colStyles: Record<number, { halign: "center" | "left"; cellWidth?: number }> = isMultiClass
    ? {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 26 },
        2: { halign: "center", cellWidth: 26 },
        3: { halign: "center", cellWidth: 26 },
        4: { halign: "left", cellWidth: 48 },
        5: { halign: "left", cellWidth: 65 },
        6: { halign: "left", cellWidth: 66 },
      }
    : {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "center", cellWidth: 32 },
        2: { halign: "center", cellWidth: 32 },
        3: { halign: "center", cellWidth: 32 },
        4: { halign: "left", cellWidth: 80 },
        5: { halign: "left", cellWidth: 78 },
      };

  autoTable(doc, {
    startY: 32,
    head: tableHead,
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: "helvetica",
      valign: "middle",
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 118, 110], // Teal-700
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: colStyles,
  });

  // Area Tanda Tangan
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150;
  const pageHeight = isPortrait ? 297 : 210;
  let signY = finalY + 12;

  if (signY + 35 > pageHeight - 15) {
    doc.addPage();
    signY = 25;
  }

  const signX = isPortrait ? 155 : 235;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Palembang, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    signX,
    signY,
    { align: "center" }
  );
  doc.text("Waka Kurikulum / Kepala Sekolah,", signX, signY + 5, { align: "center" });
  doc.text("( ......................................... )", signX, signY + 23, { align: "center" });
  doc.text("NIY: .......................................", signX, signY + 28, { align: "center" });

  const filename = `Rekap_Jadwal_${scopeTitle.replace(/\s+/g, "_")}_${tahunPelajaran.replace(/\//g, "-")}_Sem${semester}.pdf`;
  doc.save(filename);
}
