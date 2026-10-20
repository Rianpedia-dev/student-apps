"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, BookOpen } from "lucide-react";
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
  }[];
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
}: RecapClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);

  const monthNames = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const updateFilters = (params: {
    month?: number;
    year?: number;
    mapelId?: string;
    kelas?: string;
  }) => {
    const m = params.month !== undefined ? params.month : selectedMonth;
    const y = params.year !== undefined ? params.year : selectedYear;
    const mapel = params.mapelId !== undefined ? params.mapelId : selectedMapelId || "";
    const k = params.kelas !== undefined ? params.kelas : guruClass;

    const query = new URLSearchParams();
    query.set("month", String(m));
    query.set("year", String(y));
    if (mapel) query.set("mapelId", mapel);
    if (k) query.set("kelas", k);

    router.push(`${pathname}?${query.toString()}`);
  };

  const yearOptions = Array.from(new Set([...availableYears, selectedYear])).sort(
    (a, b) => b - a
  );

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
      percentageNum: persentase,
    };
  });

  const generatePdf = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Header Sekolah
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("SD - SMP ISLAM AL-AZHAR CAIRO PALEMBANG", 148.5, 14, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const title = selectedMapelNama
        ? `REKAPITULASI PRESENSI MATA PELAJARAN: ${selectedMapelNama.toUpperCase()}`
        : "REKAPITULASI PRESENSI KEHADIRAN SISWA";
      doc.text(title, 148.5, 20, { align: "center" });

      doc.setFontSize(9);
      doc.text(
        `Kelas: ${guruClass}  |  Tahun Pelajaran: ${tahunPelajaran}  |  Semester: ${semester}  |  Bulan: ${monthNames[selectedMonth]} ${selectedYear}`,
        148.5,
        26,
        { align: "center" }
      );
      doc.line(14, 29, 283, 29);

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
        startY: 33,
        head: [["No", "Nama Siswa", "NIS", "L/P", "Hadir (H)", "Sakit (S)", "Izin (I)", "Alpha (A)", "Kehadiran %"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [13, 148, 136],
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
      doc.text(selectedMapelNama ? "Guru Pengampu," : "Wali Kelas,", 235, finalY + 20, { align: "center" });
      doc.text("( ......................................... )", 235, finalY + 38, { align: "center" });

      const filename = selectedMapelNama
        ? `Rekap_Presensi_${selectedMapelNama.replace(/\s+/g, "_")}_${guruClass.replace(/\s+/g, "_")}_${monthNames[selectedMonth]}_${selectedYear}.pdf`
        : `Rekap_Presensi_${guruClass.replace(/\s+/g, "_")}_${monthNames[selectedMonth]}_${selectedYear}.pdf`;

      doc.save(filename);
      toast.success("Dokumen PDF berhasil di-download.");
    } catch {
      toast.error("Gagal membuat file PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {/* Mapel Filter */}
            {mapelList.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground block">Mata Pelajaran:</span>
                <select
                  value={selectedMapelId || ""}
                  onChange={(e) => updateFilters({ mapelId: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Kelas Filter */}
            {classList.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground block">Rombel Kelas:</span>
                <select
                  value={guruClass}
                  onChange={(e) => updateFilters({ kelas: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
                >
                  {classList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Filter */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground block">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => updateFilters({ month: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
              >
                {monthNames.slice(1).map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground block">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => updateFilters({ year: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
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
            disabled={isGenerating || students.length === 0}
            className="w-full lg:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Menyiapkan PDF..." : "Export PDF Resmi (A4 Landscape)"}
          </Button>
        </CardContent>
      </Card>

      {/* Recap Table Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-black text-foreground">
                Rekapitulasi: {selectedMapelNama ? `${selectedMapelNama} • ` : ""}Kelas {guruClass}
              </CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                Periode: {monthNames[selectedMonth]} {selectedYear} • {tahunPelajaran} ({semester})
              </CardDescription>
            </div>
            {selectedMapelNama && (
              <Badge variant="outline" className="text-xs font-mono font-bold border-teal-500/40 text-teal-700 dark:text-teal-300">
                {selectedMapelNama}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/70 border-y border-border text-[11px] font-black text-foreground uppercase tracking-wider">
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
                  <th className="py-3 px-3 font-extrabold text-center w-24">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-muted-foreground font-medium text-xs">
                      Belum ada data santri di kelas ini.
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
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        <span
                          className={cn(
                            st.percentageNum >= 85
                              ? "text-emerald-600"
                              : st.percentageNum >= 75
                              ? "text-amber-600"
                              : "text-rose-600"
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
        </CardContent>
      </Card>
    </div>
  );
}
