"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UserItem } from "@/types";
import { cn } from "@/lib/utils";

interface RecapClientProps {
  guruClass: string;
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
  }[];
}

export function RecapClient({
  guruClass,
  tahunPelajaran,
  semester,
  selectedMonth,
  selectedYear,
  availableYears,
  students,
  allAbsen,
}: RecapClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);

  const monthNames = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Perpindahan bulan/tahun dikodekan ke URL supaya server hanya mengambil
  // data pada periode terpilih (bukan seluruh riwayat absensi kelas).
  const goToPeriod = (month: number, year: number) => {
    router.push(`${pathname}?month=${month}&year=${year}`);
  };

  // Pastikan tahun terpilih selalu ada dalam daftar opsi, termasuk ketika halaman
  // dibuka manual lewat URL dengan tahun di luar rentang bawaan.
  const yearOptions = Array.from(new Set([...availableYears, selectedYear])).sort(
    (a, b) => b - a
  );

  // Hitung rekap per siswa. Server sudah mempersempit data ke periode terpilih;
  // pencocokan tahun DAN bulan di bawah menjadi penjaga agar data lintas tahun
  // tidak pernah tercampur ke dalam satu bulan yang sama.
  const studentStats = students.map((s) => {
    const studentAbsens = allAbsen.filter((a) => {
      if (a.user_id !== s.id) return false;
      const parts = (a.date || "").split("-");
      if (parts.length !== 3) return false;
      return (
        parseInt(parts[0], 10) === selectedYear &&
        parseInt(parts[1], 10) === selectedMonth
      );
    });

    let h = 0, sc = 0, i = 0, a = 0;
    studentAbsens.forEach((ab) => {
      if (ab.keterangan === "Hadir") h++;
      else if (ab.keterangan === "Sakit") sc++;
      else if (ab.keterangan === "Izin") i++;
      else if (ab.keterangan === "Alpha") a++;
    });

    const totalDays = h + sc + i + a;
    const persentase = totalDays > 0 ? Math.round((h / totalDays) * 100) : 0;

    return {
      student: s,
      hadir: h,
      sakit: sc,
      izin: i,
      alpha: a,
      persentase: `${persentase}%`,
    };
  });

  // Generate PDF per PRD Section 14
  const generatePdf = () => {
    setIsGenerating(true);
    try {
      // Landscape A4
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Header Sekolah
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SEKOLAH ISLAM AL-AZHAR CAIRO PALEMBANG", 148.5, 15, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("REKAPITULASI PRESENSI KEHADIRAN SISWA", 148.5, 22, { align: "center" });

      doc.setFontSize(9);
      doc.text(`Kelas: ${guruClass}  |  Tahun Pelajaran: ${tahunPelajaran}  |  Semester: ${semester}  |  Bulan: ${monthNames[selectedMonth]} ${selectedYear}`, 148.5, 28, { align: "center" });
      doc.line(14, 31, 283, 31);

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
        st.persentase,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [["No", "Nama Siswa", "NIS", "L/P", "Hadir (H)", "Sakit (S)", "Izin (I)", "Alpha (A)", "Kehadiran %"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [13, 148, 136], // Emerald/Teal
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { cellWidth: 90 },
          2: { halign: "center", cellWidth: 30 },
          3: { halign: "center", cellWidth: 15 },
          4: { halign: "center", cellWidth: 25 },
          5: { halign: "center", cellWidth: 25 },
          6: { halign: "center", cellWidth: 25 },
          7: { halign: "center", cellWidth: 25 },
          8: { halign: "center", cellWidth: 22 },
        },
      });

      // Signature area
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;
      doc.setFontSize(9);
      doc.text(`Palembang, ${new Date().toLocaleDateString("id-ID")}`, 235, finalY + 15, { align: "center" });
      doc.text("Wali Kelas,", 235, finalY + 20, { align: "center" });
      doc.text("( ......................................... )", 235, finalY + 38, { align: "center" });

      // Save PDF
      doc.save(`Rekap_Presensi_${guruClass.replace(/\s+/g, "_")}_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
      toast.success("Dokumen PDF berhasil di-download.");
    } catch {
      toast.error("Gagal membuat file PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Picker & Action Bar */}
      <Card className="border-emerald-500/20 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Pilih Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => goToPeriod(parseInt(e.target.value, 10), selectedYear)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
              >
                {monthNames.slice(1).map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => goToPeriod(selectedMonth, parseInt(e.target.value, 10))}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={generatePdf}
            disabled={isGenerating}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Menyiapkan PDF..." : "Download PDF Rekap (A4 Landscape)"}
          </Button>
        </CardContent>
      </Card>

      {/* Recap Table Preview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Rekapitulasi Bulan {monthNames[selectedMonth]} {selectedYear}
          </CardTitle>
          <CardDescription>
            Ringkasan kehadiran siswa kelas {guruClass}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/60 border-b">
                <tr>
                  <th className="p-3 font-bold text-center w-12 border-r">No</th>
                  <th className="p-3 font-bold border-r">Nama Siswa</th>
                  <th className="p-3 font-bold text-center border-r">NIS</th>
                  <th className="p-3 font-bold text-center border-r">L/P</th>
                  <th className="p-3 font-extrabold text-center border-r bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-border">
                    Hadir (H)
                  </th>
                  <th className="p-3 font-extrabold text-center border-r bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-border">
                    Sakit (S)
                  </th>
                  <th className="p-3 font-extrabold text-center border-r bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-border">
                    Izin (I)
                  </th>
                  <th className="p-3 font-extrabold text-center border-r bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300">
                    Alpha (A)
                  </th>
                  <th className="p-3 font-bold text-center">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      Belum ada data siswa di kelas ini.
                    </td>
                  </tr>
                ) : (
                  studentStats.map((st, idx) => (
                    <tr key={st.student.id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="p-2.5 text-center font-medium border-r">{idx + 1}</td>
                      <td className="p-2.5 font-semibold border-r">{st.student.name}</td>
                      <td className="p-2.5 text-center font-mono text-xs border-r">{st.student.nis || "-"}</td>
                      <td className="p-2.5 text-center border-r">{st.student.gender || "-"}</td>
                      <td className="p-2.5 text-center font-extrabold text-emerald-800 dark:text-emerald-300 border-r bg-emerald-50/80 dark:bg-emerald-500/10">
                        {st.hadir}
                      </td>
                      <td className={cn(
                        "p-2.5 text-center border-r font-mono",
                        st.sakit > 0
                          ? "font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-500/10"
                          : "text-muted-foreground/35 font-medium bg-sky-50/30 dark:bg-sky-500/5"
                      )}>
                        {st.sakit}
                      </td>
                      <td className={cn(
                        "p-2.5 text-center border-r font-mono",
                        st.izin > 0
                          ? "font-extrabold text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-500/10"
                          : "text-muted-foreground/35 font-medium bg-amber-50/30 dark:bg-amber-500/5"
                      )}>
                        {st.izin}
                      </td>
                      <td className={cn(
                        "p-2.5 text-center border-r font-mono",
                        st.alpha > 0
                          ? "font-extrabold text-rose-800 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-500/10"
                          : "text-muted-foreground/35 font-medium bg-rose-50/30 dark:bg-rose-500/5"
                      )}>
                        {st.alpha}
                      </td>
                      <td className="p-2.5 text-center font-bold font-mono">
                        {st.persentase}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
