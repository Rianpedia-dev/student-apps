"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, Table as TableIcon, FileText, CheckCircle2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UserItem } from "@/types";
import { cn, formatClassDisplay } from "@/lib/utils";

interface RecapClientProps {
  guruClass: string;
  selectedMapelId?: string;
  selectedMapelNama?: string;
  mapelList: { id: string; nama: string; kode: string }[];
  classList: string[];
  tahunPelajaran: string;
  semester: string;
  selectedMonth: number;
  selectedYear: number;
  availableYears: number[];
  students: UserItem[];
  allAbsen: {
    user_id: string;
    date: string;
    keterangan: string;
    mapel_id?: string | null;
  }[];
  teacherName?: string;
  teacherNip?: string;
  isWaliKelas?: boolean;
  isClassWali?: boolean;
  isRombelMode?: boolean;
  initialView?: "summary" | "matrix";
  initialScope?: "month" | "semester";
}

export function RecapClient({
  guruClass,
  selectedMapelId,
  selectedMapelNama,
  mapelList,
  classList,
  tahunPelajaran,
  semester,
  selectedMonth,
  selectedYear,
  availableYears,
  students,
  allAbsen,
  teacherName = "Wali Kelas",
  teacherNip = "-",
  isWaliKelas = false,
  isClassWali = false,
  isRombelMode = false,
  initialView = "summary",
  initialScope = "month",
}: RecapClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"summary" | "matrix">(
    initialView === "matrix" ? "matrix" : "summary"
  );
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);

  const currentScope = !isRombelMode && initialScope === "semester" ? "semester" : "month";

  const monthNames = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Ambil daftar pertemuan/sesi riil KBM mapel dari tanggal kehadiran di database
  const mapelSessions = useMemo(() => {
    if (isRombelMode) return [];
    const dateSet = new Set<string>();
    allAbsen.forEach((a) => {
      if (a.date && a.date.trim()) {
        dateSet.add(a.date.trim());
      }
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((dateStr, idx) => {
      const parts = dateStr.split("-");
      const dNum = parts.length === 3 ? parseInt(parts[2], 10) : 0;
      const mNum = parts.length === 3 ? parseInt(parts[1], 10) : 0;
      const dPad = String(dNum).padStart(2, "0");
      const mPad = String(mNum).padStart(2, "0");
      const mShort = monthNames[mNum] ? monthNames[mNum].slice(0, 3) : "";

      return {
        sessionNum: idx + 1,
        dateStr,
        label: `P${idx + 1}`,
        sublabel: `${dPad}/${mPad}`,
        displayDate: `${dNum} ${mShort}`,
      };
    });
  }, [allAbsen, isRombelMode]);

  const updateFilters = (params: {
    month?: number;
    year?: number;
    mapelId?: string;
    kelas?: string;
    view?: string;
    scope?: "month" | "semester";
  }) => {
    const m = params.month !== undefined ? params.month : selectedMonth;
    const y = params.year !== undefined ? params.year : selectedYear;
    // PENTING: Jika ganti kelas, kosongkan mapelId agar tidak membawa mode 'ROMBEL' ke kelas lain
    const isChangingClass = params.kelas !== undefined && params.kelas !== guruClass;
    const mapel = isChangingClass
      ? (params.mapelId || "")
      : (params.mapelId !== undefined ? params.mapelId : selectedMapelId || "");
    const k = params.kelas !== undefined ? params.kelas : guruClass;
    const v = params.view !== undefined ? params.view : activeTab;
    const s = params.scope !== undefined ? params.scope : currentScope;

    const query = new URLSearchParams();
    query.set("month", String(m));
    query.set("year", String(y));
    if (mapel) query.set("mapelId", mapel);
    if (k) query.set("kelas", k);
    if (v && v !== "summary") query.set("view", v);
    if (s === "semester" && mapel !== "ROMBEL") {
      query.set("scope", "semester");
    }

    router.push(`${pathname}?${query.toString()}`);
  };

  const handleTabChange = (newTab: "summary" | "matrix") => {
    setActiveTab(newTab);
    const query = new URLSearchParams(window.location.search);
    if (newTab === "matrix") {
      query.set("view", "matrix");
    } else {
      query.delete("view");
    }
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const yearOptions = Array.from(new Set([...availableYears, selectedYear])).sort(
    (a, b) => b - a
  );

  // Kalkulasi statistik presensi siswa
  const studentStats = students.map((s) => {
    const studentAbsens = allAbsen.filter((a) => {
      if (a.user_id !== s.id) return false;
      // Jika mode semester penuh untuk guru mapel, data allAbsen sudah difilter per semester di server
      if (!isRombelMode && currentScope === "semester") {
        return true;
      }
      const parts = (a.date || "").split("-");
      if (parts.length !== 3) return false;
      return (
        parseInt(parts[0], 10) === selectedYear &&
        parseInt(parts[1], 10) === selectedMonth
      );
    });

    const dailyMap: Record<number, string> = {};
    const sessionMap: Record<string, string> = {};
    let h = 0, sc = 0, i = 0, a = 0;

    if (isRombelMode) {
      // MODE REKAP HARIAN ROMBEL:
      // Kelompokkan semua record siswa berdasarkan tanggal kalender (1 hari = 1 status kehadiran)
      const dayStatusMap = new Map<number, string[]>();

      studentAbsens.forEach((ab) => {
        const parts = (ab.date || "").split("-");
        if (parts.length === 3) {
          const d = parseInt(parts[2], 10);
          if (d >= 1 && d <= daysInMonth) {
            const list = dayStatusMap.get(d) || [];
            list.push(ab.keterangan || "Hadir");
            dayStatusMap.set(d, list);
          }
        }
      });

      // Aturan konsolidasi harian:
      // 1. Alpha mutlak didahulukan (jika ada bolos di salah satu jam pelajaran -> Alpha)
      // 2. Jika ada Hadir -> Hadir
      // 3. Jika Sakit -> Sakit
      // 4. Jika Izin -> Izin
      // 5. Default -> Hadir
      dayStatusMap.forEach((statuses, d) => {
        let rolledUp = "Hadir";
        if (statuses.includes("Alpha")) {
          rolledUp = "Alpha";
        } else if (statuses.includes("Hadir")) {
          rolledUp = "Hadir";
        } else if (statuses.includes("Sakit")) {
          rolledUp = "Sakit";
        } else if (statuses.includes("Izin")) {
          rolledUp = "Izin";
        } else {
          rolledUp = "Hadir";
        }

        const shortCode = rolledUp === "Hadir" ? "H" : rolledUp === "Sakit" ? "S" : rolledUp === "Izin" ? "I" : "A";
        dailyMap[d] = shortCode;

        if (rolledUp === "Hadir") h++;
        else if (rolledUp === "Sakit") sc++;
        else if (rolledUp === "Izin") i++;
        else if (rolledUp === "Alpha") a++;
      });
    } else {
      // MODE MATA PELAJARAN SPESIFIK:
      // Hitung setiap sesi KBM mapel tersebut berdasarkan tanggal unik pertemuan
      studentAbsens.forEach((ab) => {
        const ket = ab.keterangan || "Hadir";
        const shortCode = ket === "Hadir" ? "H" : ket === "Sakit" ? "S" : ket === "Izin" ? "I" : "A";
        if (ab.date && ab.date.trim()) {
          sessionMap[ab.date.trim()] = shortCode;
        }

        const parts = (ab.date || "").split("-");
        if (parts.length === 3) {
          const d = parseInt(parts[2], 10);
          if (d >= 1 && d <= daysInMonth) {
            dailyMap[d] = shortCode;
          }
        }

        if (ab.keterangan === "Hadir") h++;
        else if (ab.keterangan === "Sakit") sc++;
        else if (ab.keterangan === "Izin") i++;
        else if (ab.keterangan === "Alpha") a++;
      });
    }

    const totalRecorded = h + sc + i + a;
    const persentase = totalRecorded > 0 ? Math.round((h / totalRecorded) * 100) : 0;

    return {
      student: s,
      hadir: h,
      sakit: sc,
      izin: i,
      alpha: a,
      totalRecorded,
      persentase: `${persentase}%`,
      percentageNum: persentase,
      dailyMap,
      sessionMap,
    };
  });

  // FORMAT 1: PDF RINGKASAN RAPOR (A4 Landscape)
  const generateSummaryPdf = () => {
    setIsGeneratingSummary(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Kop Surat Sekolah Resmi
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("SD - SMP ISLAM AL-AZHAR CAIRO PALEMBANG", 148.5, 12, { align: "center" });

      // Judul Dokumen
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      const title = isRombelMode
        ? "REKAPITULASI PRESENSI KEHADIRAN SISWA (BUKU ABSEN KELAS)"
        : "REKAPITULASI PRESENSI KEHADIRAN MATA PELAJARAN";
      doc.text(title, 148.5, 17.5, { align: "center" });

      // Grid Metadata 2 Kolom Sejajar Rata Tengah (Center-Aligned Simetris)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const lLabelX = 65;
      const lColonX = 92;
      const lValX = 95;

      const rLabelX = 165;
      const rColonX = 194;
      const rValX = 197;

      const teacherRoleLabel = isRombelMode ? "Wali Kelas" : "Guru Pengampu";
      const periodSubtitle = isRombelMode || currentScope === "month"
        ? `Bulan ${monthNames[selectedMonth]} ${selectedYear}`
        : `1 Semester Penuh (${semester})`;

      const yRow1 = 22.5;
      const yRow2 = 26.5;
      const yRow3 = 30.5;

      // Baris 1: Kelas / Rombel (Kiri) & Mata Pelajaran (Kanan)
      doc.text("Kelas / Rombel", lLabelX, yRow1);
      doc.text(":", lColonX, yRow1);
      doc.setFont("helvetica", "bold");
      doc.text(formatClassDisplay(guruClass), lValX, yRow1);
      doc.setFont("helvetica", "normal");

      doc.text(isRombelMode ? "Jenis Presensi" : "Mata Pelajaran", rLabelX, yRow1);
      doc.text(":", rColonX, yRow1);
      doc.setFont("helvetica", "bold");
      doc.text(isRombelMode ? "Presensi Harian Rombel" : (selectedMapelNama || "-"), rValX, yRow1);
      doc.setFont("helvetica", "normal");

      // Baris 2: Guru Pengampu (Kiri) & Tahun Pelajaran (Kanan)
      doc.text(teacherRoleLabel, lLabelX, yRow2);
      doc.text(":", lColonX, yRow2);
      doc.text(teacherName, lValX, yRow2);

      doc.text("Tahun Pelajaran", rLabelX, yRow2);
      doc.text(":", rColonX, yRow2);
      doc.text(`${tahunPelajaran} (${semester})`, rValX, yRow2);

      // Baris 3: Periode Presensi (Kiri) & Format Berkas (Kanan)
      doc.text("Periode Presensi", lLabelX, yRow3);
      doc.text(":", lColonX, yRow3);
      doc.text(periodSubtitle, lValX, yRow3);

      doc.text("Format Dokumen", rLabelX, yRow3);
      doc.text(":", rColonX, yRow3);
      doc.text("Ringkasan Rekapitulasi Rapor", rValX, yRow3);

      // Garis Kop Ganda tepat di atas tabel (Tebal + Tipis)
      doc.setLineWidth(0.7);
      doc.line(14, 34, 283, 34);
      doc.setLineWidth(0.2);
      doc.line(14, 35.2, 283, 35.2);

      // Table Data
      const tableRows = studentStats.map((st, idx) => [
        idx + 1,
        st.student.name,
        st.student.nis || "-",
        st.student.gender || "-",
        st.hadir,
        st.sakit,
        st.izin,
        st.alpha,
        st.totalRecorded,
        st.persentase,
      ]);

      autoTable(doc, {
        startY: 38.5,
        head: [[
          "No",
          "Nama Siswa",
          "NIS",
          "L/P",
          "Hadir (H)",
          "Sakit (S)",
          "Izin (I)",
          "Alpha (A)",
          isRombelMode ? "Hari Masuk" : "Total Sesi",
          "Kehadiran %"
        ]],
        body: tableRows,
        theme: "striped",
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          font: "helvetica",
          valign: "middle",
        },
        headStyles: {
          fillColor: [13, 148, 136],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "center",
          valign: "middle",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 80, fontStyle: "bold" },
          2: { halign: "center", cellWidth: 28 },
          3: { halign: "center", cellWidth: 14 },
          4: { halign: "center", cellWidth: 22 },
          5: { halign: "center", cellWidth: 22 },
          6: { halign: "center", cellWidth: 22 },
          7: { halign: "center", cellWidth: 22 },
          8: { halign: "center", cellWidth: 24, fontStyle: "bold" },
          9: { halign: "center", cellWidth: 25, fontStyle: "bold" },
        },
        didParseCell: (data) => {
          // Redupkan angka 0 pada kolom S, I, A
          if (data.section === "body" && data.column.index >= 5 && data.column.index <= 7) {
            const val = String(data.cell.text[0] || "").trim();
            if (val === "0") {
              data.cell.styles.textColor = [180, 190, 205];
            } else {
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // Signature area (2 Kolom Resmi)
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;
      const signY = finalY + 12;
      const leftSignX = 50;
      const rightSignX = 235;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");

      // Kiri: Mengetahui Kepala Sekolah
      doc.text("Mengetahui,", leftSignX, signY, { align: "center" });
      doc.text("Kepala Sekolah,", leftSignX, signY + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("( ..................................................... )", leftSignX, signY + 24, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("NIY. -", leftSignX, signY + 28.5, { align: "center" });

      // Kanan: Wali Kelas / Guru Pengampu
      doc.text(`Palembang, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, rightSignX, signY, { align: "center" });
      const signerTitle = isRombelMode
        ? `Wali ${formatClassDisplay(guruClass)},`
        : `Guru Pengampu Mata Pelajaran,`;
      doc.text(signerTitle, rightSignX, signY + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`( ${teacherName} )`, rightSignX, signY + 24, { align: "center" });
      doc.setFont("helvetica", "normal");
      if (teacherNip && teacherNip !== "-") {
        doc.text(`NIY: ${teacherNip}`, rightSignX, signY + 28.5, { align: "center" });
      }

      const cleanClassFilename = formatClassDisplay(guruClass).replace(/\s+/g, "_");
      const filename = isRombelMode
        ? `Rekap_Kehadiran_${cleanClassFilename}_${monthNames[selectedMonth]}_${selectedYear}.pdf`
        : `Rekap_Presensi_${(selectedMapelNama || "Mapel").replace(/\s+/g, "_")}_${cleanClassFilename}_${currentScope === "semester" ? `Semester_${semester.replace(/\s+/g, "_")}` : monthNames[selectedMonth]}_${selectedYear}.pdf`;

      doc.save(filename);
      toast.success("Dokumen PDF Ringkasan berhasil diunduh.");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Gagal membuat file PDF Ringkasan");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // FORMAT 2: PDF MATRIKS (ROMBEL: TANGGAL 1 - 31 | MAPEL: SESI PERTEMUAN KBM)
  const generateMatrixPdf = () => {
    setIsGeneratingMatrix(true);
    try {
      if (!isRombelMode && mapelSessions.length === 0) {
        toast.error("Belum ada data sesi pertemuan KBM untuk diekspor pada periode ini.");
        setIsGeneratingMatrix(false);
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Kop Surat Sekolah Resmi
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("SD - SMP ISLAM AL-AZHAR CAIRO PALEMBANG", 148.5, 12, { align: "center" });

      // Judul Dokumen Resmi
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      const title = isRombelMode
        ? `LEMBAR PRESENSI BULANAN SISWA`
        : `DAFTAR HADIR SESI PERTEMUAN KBM`;
      doc.text(title, 148.5, 17.5, { align: "center" });

      // Grid Metadata 2 Kolom Sejajar Rata Tengah (Center-Aligned Simetris)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const lLabelX = 65;
      const lColonX = 92;
      const lValX = 95;

      const rLabelX = 165;
      const rColonX = 194;
      const rValX = 197;

      const teacherRoleLabel = isRombelMode ? "Wali Kelas" : "Guru Pengampu";
      const periodSubtitle = isRombelMode || currentScope === "month"
        ? `Bulan ${monthNames[selectedMonth]} ${selectedYear}`
        : `1 Semester Penuh`;
      const countInfo = isRombelMode
        ? `${daysInMonth} Hari Kalender`
        : `${mapelSessions.length} Sesi Pertemuan KBM`;

      const yRow1 = 22.5;
      const yRow2 = 26.5;
      const yRow3 = 30.5;

      // Baris 1: Kelas / Rombel (Kiri) & Mata Pelajaran (Kanan)
      doc.text("Kelas / Rombel", lLabelX, yRow1);
      doc.text(":", lColonX, yRow1);
      doc.setFont("helvetica", "bold");
      doc.text(formatClassDisplay(guruClass), lValX, yRow1);
      doc.setFont("helvetica", "normal");

      doc.text(isRombelMode ? "Jenis Presensi" : "Mata Pelajaran", rLabelX, yRow1);
      doc.text(":", rColonX, yRow1);
      doc.setFont("helvetica", "bold");
      doc.text(isRombelMode ? "Presensi Harian Rombel" : (selectedMapelNama || "-"), rValX, yRow1);
      doc.setFont("helvetica", "normal");

      // Baris 2: Guru Pengampu / Wali Kelas (Kiri) & Tahun Pelajaran (Kanan)
      doc.text(teacherRoleLabel, lLabelX, yRow2);
      doc.text(":", lColonX, yRow2);
      doc.text(teacherName, lValX, yRow2);

      doc.text("Tahun Pelajaran", rLabelX, yRow2);
      doc.text(":", rColonX, yRow2);
      doc.text(`${tahunPelajaran} (${semester})`, rValX, yRow2);

      // Baris 3: Periode KBM (Kiri) & Total Sesi / Hari (Kanan)
      doc.text("Periode Presensi", lLabelX, yRow3);
      doc.text(":", lColonX, yRow3);
      doc.text(periodSubtitle, lValX, yRow3);

      doc.text(isRombelMode ? "Total Hari Efektif" : "Total Pertemuan", rLabelX, yRow3);
      doc.text(":", rColonX, yRow3);
      doc.text(countInfo, rValX, yRow3);

      // Garis Kop Ganda tepat di atas tabel (Tebal + Tipis)
      doc.setLineWidth(0.7);
      doc.line(14, 34, 283, 34);
      doc.setLineWidth(0.2);
      doc.line(14, 35.2, 283, 35.2);

      if (isRombelMode) {
        // --- MODE WALI KELAS: MATRIKS TANGGAL 1 - 31 (FULL WIDTH 269 MM) ---
        const headColumns = [
          "No",
          "Nama Siswa",
          ...daysArray.map((d) => String(d)),
          "H",
          "S",
          "I",
          "A",
          "%"
        ];

        const tableRows = studentStats.map((st, idx) => [
          idx + 1,
          st.student.name,
          ...daysArray.map((d) => st.dailyMap[d] || "-"),
          st.hadir,
          st.sakit,
          st.izin,
          st.alpha,
          st.persentase,
        ]);

        const dateColWidth = daysInMonth === 31 ? 5.3 : daysInMonth === 30 ? 5.5 : 5.8;

        const columnStyles: Record<number, { halign: "left" | "center"; cellWidth: number; fontStyle?: "bold" | "normal" }> = {
          0: { halign: "center", cellWidth: 7.5 },
          1: { halign: "left", cellWidth: 46, fontStyle: "bold" },
        };

        daysArray.forEach((_, idx) => {
          columnStyles[idx + 2] = { halign: "center", cellWidth: dateColWidth };
        });

        const offset = daysArray.length + 2;
        columnStyles[offset] = { halign: "center", cellWidth: 8, fontStyle: "bold" };
        columnStyles[offset + 1] = { halign: "center", cellWidth: 8, fontStyle: "bold" };
        columnStyles[offset + 2] = { halign: "center", cellWidth: 8, fontStyle: "bold" };
        columnStyles[offset + 3] = { halign: "center", cellWidth: 8, fontStyle: "bold" };
        columnStyles[offset + 4] = { halign: "center", cellWidth: 11, fontStyle: "bold" };

        autoTable(doc, {
          startY: 38.5,
          head: [headColumns],
          body: tableRows,
          theme: "grid",
          styles: {
            fontSize: 6.5,
            cellPadding: 0.8,
            font: "helvetica",
            overflow: "hidden",
            valign: "middle",
          },
          headStyles: {
            fillColor: [15, 118, 110], // teal-700
            textColor: 255,
            fontStyle: "bold",
            fontSize: 6.5,
            halign: "center",
            valign: "middle",
          },
          columnStyles,
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index >= 2 && data.column.index < 2 + daysInMonth) {
              const dayNum = data.column.index - 1;
              const isSunday = new Date(selectedYear, selectedMonth - 1, dayNum).getDay() === 0;

              const val = String(data.cell.text[0] || "");
              if (val === "H") {
                data.cell.styles.textColor = [16, 185, 129];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "S") {
                data.cell.styles.textColor = [2, 132, 199];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "I") {
                data.cell.styles.textColor = [217, 119, 6];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "A") {
                data.cell.styles.textColor = [225, 29, 72];
                data.cell.styles.fontStyle = "bold";
              } else if (isSunday) {
                data.cell.styles.fillColor = [254, 226, 226];
                data.cell.styles.textColor = [225, 29, 72];
              }
            }
          },
        });
      } else {
        // --- MODE GURU MAPEL: TABEL SESI PERTEMUAN KBM (FULL WIDTH 269 MM PROPORSIONAL) ---
        const headColumns = [
          "No",
          "Nama Siswa",
          ...mapelSessions.map((s) => `${s.label}\n(${s.sublabel})`),
          "H",
          "S",
          "I",
          "A",
          "Total",
          "%"
        ];

        const tableRows = studentStats.map((st, idx) => [
          idx + 1,
          st.student.name,
          ...mapelSessions.map((s) => st.sessionMap[s.dateStr] || "-"),
          st.hadir,
          st.sakit,
          st.izin,
          st.alpha,
          st.totalRecorded,
          st.persentase,
        ]);

        const totalTableWidth = 269;
        const numSessions = Math.max(mapelSessions.length, 1);

        let noWidth = 9;
        let namaWidth = 65;
        let statWidth = 10;
        let totalWidth = 14;
        let pctWidth = 15;
        let sessColWidth = 14;

        if (numSessions <= 2) {
          noWidth = 10;
          namaWidth = 95;
          statWidth = 13;
          totalWidth = 18;
          pctWidth = 18;
          sessColWidth = Math.floor((totalTableWidth - (noWidth + namaWidth + statWidth * 4 + totalWidth + pctWidth)) / numSessions);
        } else if (numSessions <= 4) {
          noWidth = 9;
          namaWidth = 85;
          statWidth = 12;
          totalWidth = 16;
          pctWidth = 16;
          sessColWidth = Math.floor((totalTableWidth - (noWidth + namaWidth + statWidth * 4 + totalWidth + pctWidth)) / numSessions);
        } else if (numSessions <= 8) {
          noWidth = 9;
          namaWidth = 72;
          statWidth = 10.5;
          totalWidth = 15;
          pctWidth = 15;
          sessColWidth = Math.floor((totalTableWidth - (noWidth + namaWidth + statWidth * 4 + totalWidth + pctWidth)) / numSessions);
        } else if (numSessions <= 12) {
          noWidth = 8.5;
          namaWidth = 62;
          statWidth = 9;
          totalWidth = 13;
          pctWidth = 14;
          sessColWidth = Math.floor((totalTableWidth - (noWidth + namaWidth + statWidth * 4 + totalWidth + pctWidth)) / numSessions);
        } else {
          // > 12 sesi (misal 14-20 sesi KBM)
          noWidth = 8;
          namaWidth = 52;
          statWidth = 8;
          totalWidth = 11;
          pctWidth = 12;
          sessColWidth = Math.floor((totalTableWidth - (noWidth + namaWidth + statWidth * 4 + totalWidth + pctWidth)) / numSessions);
        }

        // Pastikan total lebar tepat 269 mm dengan menambahkan sisa pembulatan ke kolom Nama Siswa
        const sumCols = noWidth + namaWidth + (sessColWidth * numSessions) + (statWidth * 4) + totalWidth + pctWidth;
        if (sumCols < totalTableWidth) {
          namaWidth += (totalTableWidth - sumCols);
        }

        const columnStyles: Record<number, { halign: "left" | "center"; cellWidth: number; fontStyle?: "bold" | "normal" }> = {
          0: { halign: "center", cellWidth: noWidth },
          1: { halign: "left", cellWidth: namaWidth, fontStyle: "bold" },
        };

        mapelSessions.forEach((_, idx) => {
          columnStyles[idx + 2] = { halign: "center", cellWidth: sessColWidth };
        });

        const offset = mapelSessions.length + 2;
        columnStyles[offset] = { halign: "center", cellWidth: statWidth, fontStyle: "bold" };
        columnStyles[offset + 1] = { halign: "center", cellWidth: statWidth, fontStyle: "bold" };
        columnStyles[offset + 2] = { halign: "center", cellWidth: statWidth, fontStyle: "bold" };
        columnStyles[offset + 3] = { halign: "center", cellWidth: statWidth, fontStyle: "bold" };
        columnStyles[offset + 4] = { halign: "center", cellWidth: totalWidth, fontStyle: "bold" };
        columnStyles[offset + 5] = { halign: "center", cellWidth: pctWidth, fontStyle: "bold" };

        autoTable(doc, {
          startY: 38.5,
          head: [headColumns],
          body: tableRows,
          theme: "grid",
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          styles: {
            fontSize: numSessions <= 6 ? 8 : 7,
            cellPadding: numSessions <= 6 ? 1.4 : 1,
            font: "helvetica",
            overflow: "hidden",
            valign: "middle",
          },
          headStyles: {
            fillColor: [13, 148, 136], // teal-600
            textColor: 255,
            fontStyle: "bold",
            fontSize: numSessions <= 6 ? 8 : 7,
            halign: "center",
            valign: "middle",
          },
          columnStyles,
          didParseCell: (data) => {
            // Pewarnaan status di kolom pertemuan sesi KBM
            if (data.section === "body" && data.column.index >= 2 && data.column.index < 2 + mapelSessions.length) {
              const val = String(data.cell.text[0] || "").trim();
              if (val === "H") {
                data.cell.styles.textColor = [5, 150, 105];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "S") {
                data.cell.styles.textColor = [2, 132, 199];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "I") {
                data.cell.styles.textColor = [217, 119, 6];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "A") {
                data.cell.styles.textColor = [225, 29, 72];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "-") {
                data.cell.styles.textColor = [160, 174, 192];
              }
            }

            // Redupkan angka 0 pada kolom statistik H, S, I, A
            if (data.section === "body" && data.column.index >= 2 + mapelSessions.length && data.column.index < 2 + mapelSessions.length + 4) {
              const val = String(data.cell.text[0] || "").trim();
              if (val === "0") {
                data.cell.styles.textColor = [180, 190, 205];
              } else {
                data.cell.styles.fontStyle = "bold";
              }
            }
          },
        });
      }

      // Signature area & Legend (2 Kolom Pengesahan Resmi)
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

      // Legend Keterangan
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const legendText = isRombelMode
        ? "Keterangan: H = Hadir | S = Sakit | I = Izin | A = Alpha | ( - ) = Libur / Tidak Ada KBM"
        : "Keterangan: P1, P2... = Sesi Pertemuan KBM | H = Hadir | S = Sakit | I = Izin | A = Alpha | ( - ) = Tidak Ada KBM";
      doc.text(legendText, 14, finalY + 8);
      doc.setTextColor(0, 0, 0);

      // Tanda Tangan: 2 Kolom (Kiri: Kepala Sekolah, Kanan: Guru Pengampu / Wali Kelas)
      const signY = finalY + 14;
      const leftSignX = 50;
      const rightSignX = 235;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");

      // Kiri: Mengetahui Kepala Sekolah
      doc.text("Mengetahui,", leftSignX, signY, { align: "center" });
      doc.text("Kepala Sekolah,", leftSignX, signY + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("( ..................................................... )", leftSignX, signY + 24, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("NIY. -", leftSignX, signY + 28.5, { align: "center" });

      // Kanan: Guru Pengampu / Wali Kelas
      doc.text(`Palembang, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, rightSignX, signY, { align: "center" });
      const signerTitle = isRombelMode
        ? `Wali ${formatClassDisplay(guruClass)},`
        : `Guru Pengampu Mata Pelajaran,`;
      doc.text(signerTitle, rightSignX, signY + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`( ${teacherName} )`, rightSignX, signY + 24, { align: "center" });
      doc.setFont("helvetica", "normal");
      if (teacherNip && teacherNip !== "-") {
        doc.text(`NIY: ${teacherNip}`, rightSignX, signY + 28.5, { align: "center" });
      }

      const cleanClassFilename = formatClassDisplay(guruClass).replace(/\s+/g, "_");
      const filename = isRombelMode
        ? `Matriks_Presensi_${cleanClassFilename}_${monthNames[selectedMonth]}_${selectedYear}.pdf`
        : `Rekap_Sesi_KBM_${(selectedMapelNama || "Mapel").replace(/\s+/g, "_")}_${cleanClassFilename}_${currentScope === "semester" ? `Semester_${semester.replace(/\s+/g, "_")}` : monthNames[selectedMonth]}_${selectedYear}.pdf`;

      doc.save(filename);
      toast.success(
        isRombelMode
          ? "Dokumen PDF Matriks Tanggal 1-31 berhasil diunduh."
          : `Dokumen PDF Sesi Pertemuan KBM (${mapelSessions.length} Sesi) berhasil diunduh.`
      );
    } catch (err) {
      console.error("Matrix PDF generation error:", err);
      toast.error("Gagal membuat file PDF Matriks");
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Panel Filter Ringkas 4 Kolom */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-3.5 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Kelas */}
            {classList.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground block">
                  Kelas:
                </label>
                <select
                  value={guruClass}
                  onChange={(e) => updateFilters({ kelas: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer truncate"
                >
                  {classList.map((c) => (
                    <option key={c} value={c}>
                      {formatClassDisplay(c)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mata Pelajaran */}
            {mapelList.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground block">
                  Mata Pelajaran:
                </label>
                <select
                  value={selectedMapelId || ""}
                  onChange={(e) => updateFilters({ mapelId: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer truncate"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Periode Presensi */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground block">
                Periode / Bulan:
              </label>
              <select
                value={currentScope === "semester" ? "semester" : String(selectedMonth)}
                onChange={(e) => {
                  if (e.target.value === "semester") {
                    updateFilters({ scope: "semester" });
                  } else {
                    updateFilters({ month: parseInt(e.target.value, 10), scope: "month" });
                  }
                }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                {!isRombelMode && (
                  <option value="semester">
                    1 Semester Penuh ({semester})
                  </option>
                )}
                {monthNames.slice(1).map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>
                    Bulan {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground block">
                Tahun:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => updateFilters({ year: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Card Tabel Rekapitulasi Presensi */}
      <Card className="overflow-hidden border border-border/80 shadow-xs">
        <CardHeader className="p-3 sm:p-3.5 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab Selector Segmented Control */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/80 border border-border/70 shadow-2xs self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange("summary")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === "summary"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Ringkasan Rapor</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("matrix")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === "matrix"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TableIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>
                  {isRombelMode
                    ? `Tabel Matriks (1 - ${daysInMonth})`
                    : `Tabel Sesi KBM (${mapelSessions.length} Sesi)`}
                </span>
              </button>
            </div>

            {/* Tombol Export PDF */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Button
                onClick={generateSummaryPdf}
                disabled={isGeneratingSummary || students.length === 0}
                size="sm"
                className="flex-1 sm:flex-initial gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer h-8.5 px-3"
              >
                <Download className="h-3.5 w-3.5" />
                {isGeneratingSummary ? "Menyiapkan..." : "Unduh Rapor (PDF)"}
              </Button>

              <Button
                onClick={generateMatrixPdf}
                disabled={isGeneratingMatrix || students.length === 0 || (!isRombelMode && mapelSessions.length === 0)}
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-initial gap-1.5 border-teal-500/50 hover:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold text-xs rounded-xl cursor-pointer h-8.5 px-3"
              >
                <TableIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                {isGeneratingMatrix
                  ? "Menyiapkan..."
                  : isRombelMode
                  ? "Unduh Matriks (PDF)"
                  : "Unduh Sesi KBM (PDF)"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* TAB 1: RINGKASAN RAPOR */}
          {activeTab === "summary" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-muted/70 border-b border-border text-[11px] font-black text-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 font-extrabold text-center w-12 border-r">No</th>
                    <th className="py-3 px-4 font-extrabold border-r min-w-[160px]">Nama Siswa</th>
                    <th className="py-3 px-3 font-extrabold text-center border-r w-24">NIS</th>
                    <th className="py-3 px-3 font-extrabold text-center border-r w-14">L/P</th>
                    <th className="py-3 px-3 font-extrabold text-center border-r bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 w-24">
                      Hadir (H)
                    </th>
                    <th className="py-3 px-3 font-extrabold text-center border-r bg-sky-500/10 text-sky-800 dark:text-sky-200 w-24">
                      Sakit (S)
                    </th>
                    <th className="py-3 px-3 font-extrabold text-center border-r bg-amber-500/10 text-amber-800 dark:text-amber-200 w-24">
                      Izin (I)
                    </th>
                    <th className="py-3 px-3 font-extrabold text-center border-r bg-rose-500/10 text-rose-800 dark:text-rose-200 w-24">
                      Alpha (A)
                    </th>
                    <th className="py-3 px-3 font-extrabold text-center border-r w-24">
                      {isRombelMode ? "Hari Masuk" : "Total Sesi"}
                    </th>
                    <th className="py-3 px-3 font-extrabold text-center w-24">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {studentStats.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-muted-foreground font-medium text-xs">
                        Belum ada data siswa di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    studentStats.map((st, idx) => (
                      <tr key={st.student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold border-r text-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold border-r text-foreground">
                          {st.student.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-[11px] border-r text-foreground">
                          {st.student.nis || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium border-r text-foreground">{st.student.gender || "-"}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-emerald-600 border-r bg-emerald-500/5">
                          {st.hadir}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-sky-600 border-r bg-sky-500/5">
                          {st.sakit}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-amber-600 border-r bg-amber-500/5">
                          {st.izin}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-rose-600 border-r bg-rose-500/5">
                          {st.alpha}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono border-r text-foreground">
                          {st.totalRecorded}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono">
                          <span
                            className={cn(
                              st.percentageNum >= 85
                                ? "text-emerald-600 dark:text-emerald-400"
                                : st.percentageNum >= 75
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {st.persentase}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: TABEL MATRIKS BULANAN (ROMBEL) ATAU TABEL SESI KBM (MAPEL) */}
          {activeTab === "matrix" && (
            isRombelMode ? (
              /* --- MODE ROMBEL: TABEL MATRIKS BULANAN TANGGAL 1 - 31 --- */
              <div className="space-y-0">
                {/* Scroll Hint on Mobile */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden px-4 py-2 border-b bg-muted/30">
                  <span className="text-teal-600 dark:text-teal-400 font-semibold px-1">↔</span>
                  <span>Geser tabel ke samping untuk melihat seluruh tanggal 1 - {daysInMonth}</span>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/70 border-b">
                        <th className="p-2.5 font-bold text-center border-r w-10 sticky left-0 bg-muted/95 z-10">No</th>
                        <th className="p-2.5 font-bold border-r w-28 sm:w-44 max-w-[120px] sm:max-w-[200px] sticky left-10 bg-muted/95 z-10 truncate shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)]">
                          Nama Siswa
                        </th>
                        {daysArray.map((d) => {
                          const isSunday = new Date(selectedYear, selectedMonth - 1, d).getDay() === 0;
                          return (
                            <th
                              key={d}
                              className={cn(
                                "p-1 font-bold text-center border-r min-w-[28px] max-w-[28px]",
                                isSunday
                                  ? "text-rose-600 bg-rose-100/80 dark:bg-rose-500/15 dark:text-rose-400 font-extrabold"
                                  : "text-foreground/80"
                              )}
                              title={isSunday ? `Hari Minggu (Tgl ${d})` : `Tanggal ${d}`}
                            >
                              {d}
                            </th>
                          );
                        })}
                        <th className="p-2 font-extrabold text-center border-r bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-border w-10" title="Total Hadir">H</th>
                        <th className="p-2 font-extrabold text-center border-r bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-border w-10" title="Total Sakit">S</th>
                        <th className="p-2 font-extrabold text-center border-r bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-border w-10" title="Total Izin">I</th>
                        <th className="p-2 font-extrabold text-center border-r bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 w-10" title="Total Alpha">A</th>
                        <th className="p-2 font-extrabold text-center w-12" title="Persentase Kehadiran">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.length === 0 ? (
                        <tr>
                          <td colSpan={daysInMonth + 7} className="text-center py-10 text-muted-foreground font-medium text-xs">
                            Belum ada data siswa di kelas ini.
                          </td>
                        </tr>
                      ) : (
                        studentStats.map((st, idx) => (
                          <tr key={st.student.id} className="group border-b hover:bg-muted/40 transition-colors">
                            <td className="p-2 text-center border-r font-medium sticky left-0 bg-card group-hover:bg-muted/60 z-10 transition-colors text-foreground">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r font-semibold truncate sticky left-10 bg-card group-hover:bg-muted/60 z-10 w-28 sm:w-44 max-w-[120px] sm:max-w-[200px] shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)] transition-colors text-foreground" title={st.student.name}>
                              {st.student.name}
                            </td>
                            {daysArray.map((d) => {
                              const code = st.dailyMap[d];
                              const isSunday = new Date(selectedYear, selectedMonth - 1, d).getDay() === 0;

                              return (
                                <td
                                  key={d}
                                  className={cn(
                                    "p-0.5 text-center border-r transition-colors",
                                    !code && isSunday && "bg-rose-50/50 dark:bg-rose-500/[0.06]"
                                  )}
                                >
                                  {code ? (
                                    <Badge
                                      variant={
                                        code === "H"
                                          ? "success"
                                          : code === "S"
                                          ? "info"
                                          : code === "I"
                                          ? "warning"
                                          : "destructive"
                                      }
                                      size="xs"
                                      className="w-5 h-5 sm:w-6 sm:h-6 p-0 font-extrabold text-[10px] sm:text-[11px] justify-center mx-auto"
                                      title={`${st.student.name} - ${code === "H" ? "Hadir" : code === "S" ? "Sakit" : code === "I" ? "Izin" : "Alpha"} (Tgl ${d})`}
                                    >
                                      {code}
                                    </Badge>
                                  ) : null}
                                </td>
                              );
                            })}
                            <td className="p-1 text-center border-r font-extrabold font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-500/10">
                              {st.hadir}
                            </td>
                            <td className={cn(
                              "p-1 text-center border-r font-mono",
                              st.sakit > 0
                                ? "font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-500/10"
                                : "text-muted-foreground/35 font-medium bg-sky-50/30 dark:bg-sky-500/5"
                            )}>
                              {st.sakit}
                            </td>
                            <td className={cn(
                              "p-1 text-center border-r font-mono",
                              st.izin > 0
                                ? "font-extrabold text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-500/10"
                                : "text-muted-foreground/35 font-medium bg-amber-50/30 dark:bg-amber-500/5"
                            )}>
                              {st.izin}
                            </td>
                            <td className={cn(
                              "p-1 text-center border-r font-mono",
                              st.alpha > 0
                                ? "font-extrabold text-rose-800 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-500/10"
                                : "text-muted-foreground/35 font-medium bg-rose-50/30 dark:bg-rose-500/5"
                            )}>
                              {st.alpha}
                            </td>
                            <td className="p-1 text-center font-bold font-mono text-[11px]">
                              <span
                                className={cn(
                                  st.percentageNum >= 85
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : st.percentageNum >= 75
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                                )}
                              >
                                {st.persentase}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Legend for Rombel Matrix */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground p-3.5 border-t bg-muted/20">
                  <span className="font-semibold text-foreground">Keterangan:</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">H</Badge>
                    <span className="font-medium text-foreground/80">Hadir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="info" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">S</Badge>
                    <span className="font-medium text-foreground/80">Sakit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="warning" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">I</Badge>
                    <span className="font-medium text-foreground/80">Izin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="destructive" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">A</Badge>
                    <span className="font-medium text-foreground/80">Alpha</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-mono font-bold">(-)</span>
                    <span className="font-medium text-muted-foreground">Libur / Hari Belum Berjalan</span>
                  </div>
                </div>
              </div>
            ) : (
              /* --- MODE MAPEL: TABEL SESI PERTEMUAN KBM (P1, P2, P3...) --- */
              <div className="space-y-0">
                {mapelSessions.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                      <CalendarDays className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      Belum Ada Sesi Pertemuan KBM
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mt-1 leading-relaxed">
                      Belum ada data presensi yang diinput untuk mata pelajaran{" "}
                      <strong className="text-foreground">{selectedMapelNama}</strong> pada{" "}
                      {currentScope === "semester" ? `semester ini (${semester})` : `bulan ${monthNames[selectedMonth]} ${selectedYear}`}.
                      Setiap kali presensi KBM disimpan, nomor sesi (P1, P2, dst) beserta tanggal pelaksanaannya akan otomatis terdata di sini.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Scroll Hint on Mobile */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden px-4 py-2 border-b bg-muted/30">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold px-1">↔</span>
                      <span>Geser tabel ke samping untuk melihat seluruh pertemuan KBM</span>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/70 border-b">
                            <th className="p-2.5 font-bold text-center border-r w-10 sticky left-0 bg-muted/95 z-10">No</th>
                            <th className="p-2.5 font-bold border-r w-36 sm:w-48 max-w-[150px] sm:max-w-[220px] sticky left-10 bg-muted/95 z-10 truncate shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)]">
                              Nama Siswa
                            </th>
                            {mapelSessions.map((sess) => (
                              <th
                                key={sess.dateStr}
                                className="p-2 font-extrabold text-center border-r min-w-[56px] text-foreground bg-muted/50"
                                title={`Pertemuan ${sess.sessionNum}: ${sess.displayDate}`}
                              >
                                <span className="text-teal-700 dark:text-teal-300 font-black block text-xs">
                                  {sess.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono block font-semibold">
                                  {sess.sublabel}
                                </span>
                              </th>
                            ))}
                            <th className="p-2 font-extrabold text-center border-r bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-border w-12" title="Total Hadir">H</th>
                            <th className="p-2 font-extrabold text-center border-r bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-border w-12" title="Total Sakit">S</th>
                            <th className="p-2 font-extrabold text-center border-r bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-border w-12" title="Total Izin">I</th>
                            <th className="p-2 font-extrabold text-center border-r bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 w-12" title="Total Alpha">A</th>
                            <th className="p-2 font-extrabold text-center border-r w-16" title="Total Pertemuan Diikuti">Total</th>
                            <th className="p-2 font-extrabold text-center w-14" title="Persentase Kehadiran Sesi">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentStats.length === 0 ? (
                            <tr>
                              <td colSpan={mapelSessions.length + 8} className="text-center py-10 text-muted-foreground font-medium text-xs">
                                Belum ada data siswa di kelas ini.
                              </td>
                            </tr>
                          ) : (
                            studentStats.map((st, idx) => (
                              <tr key={st.student.id} className="group border-b hover:bg-muted/40 transition-colors">
                                <td className="p-2 text-center border-r font-medium sticky left-0 bg-card group-hover:bg-muted/60 z-10 transition-colors text-foreground">
                                  {idx + 1}
                                </td>
                                <td className="p-2 border-r font-semibold truncate sticky left-10 bg-card group-hover:bg-muted/60 z-10 w-36 sm:w-48 max-w-[150px] sm:max-w-[220px] shadow-[3px_0_5px_-2px_rgba(0,0,0,0.15)] transition-colors text-foreground" title={st.student.name}>
                                  {st.student.name}
                                </td>
                                {mapelSessions.map((sess) => {
                                  const code = st.sessionMap[sess.dateStr];
                                  return (
                                    <td key={sess.dateStr} className="p-1.5 text-center border-r transition-colors">
                                      {code ? (
                                        <Badge
                                          variant={
                                            code === "H"
                                              ? "success"
                                              : code === "S"
                                              ? "info"
                                              : code === "I"
                                              ? "warning"
                                              : "destructive"
                                          }
                                          size="xs"
                                          className="w-6 h-6 p-0 font-extrabold text-[11px] justify-center mx-auto"
                                          title={`${st.student.name} - ${code === "H" ? "Hadir" : code === "S" ? "Sakit" : code === "I" ? "Izin" : "Alpha"} (${sess.label}: ${sess.displayDate})`}
                                        >
                                          {code}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground/30 font-mono text-xs">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="p-1.5 text-center border-r font-extrabold font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-500/10">
                                  {st.hadir}
                                </td>
                                <td className={cn(
                                  "p-1.5 text-center border-r font-mono",
                                  st.sakit > 0
                                    ? "font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-500/10"
                                    : "text-muted-foreground/35 font-medium bg-sky-50/30 dark:bg-sky-500/5"
                                )}>
                                  {st.sakit}
                                </td>
                                <td className={cn(
                                  "p-1.5 text-center border-r font-mono",
                                  st.izin > 0
                                    ? "font-extrabold text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-500/10"
                                    : "text-muted-foreground/35 font-medium bg-amber-50/30 dark:bg-amber-500/5"
                                )}>
                                  {st.izin}
                                </td>
                                <td className={cn(
                                  "p-1.5 text-center border-r font-mono",
                                  st.alpha > 0
                                    ? "font-extrabold text-rose-800 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-500/10"
                                    : "text-muted-foreground/35 font-medium bg-rose-50/30 dark:bg-rose-500/5"
                                )}>
                                  {st.alpha}
                                </td>
                                <td className="p-1.5 text-center border-r font-bold font-mono text-foreground">
                                  {st.totalRecorded}
                                </td>
                                <td className="p-1.5 text-center font-bold font-mono text-[11px]">
                                  <span
                                    className={cn(
                                      st.percentageNum >= 85
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : st.percentageNum >= 75
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-rose-600 dark:text-rose-400"
                                    )}
                                  >
                                    {st.persentase}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Legend for Mapel Session Matrix */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground p-3.5 border-t bg-muted/20">
                      <span className="font-semibold text-foreground">Keterangan:</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="success" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">H</Badge>
                        <span className="font-medium text-foreground/80">Hadir</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">S</Badge>
                        <span className="font-medium text-foreground/80">Sakit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="warning" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">I</Badge>
                        <span className="font-medium text-foreground/80">Izin</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="destructive" size="xs" className="w-5 h-5 p-0 justify-center font-extrabold">A</Badge>
                        <span className="font-medium text-foreground/80">Alpha</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-mono font-bold">(-)</span>
                        <span className="font-medium text-muted-foreground">Tidak Tercatat</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                        <span>P1, P2... = Sesi Pertemuan KBM</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
