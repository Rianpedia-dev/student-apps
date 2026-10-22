"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  Search,
  School,
  User,
  ShieldAlert,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface StudentItem {
  id: string;
  name: string;
  nis: string | null;
  gender: string | null;
  email: string;
  appleid: string | null;
  passwordappleid: string | null;
  point: string | null;
}

export interface ClassDetailData {
  id: string;
  nama_kelas: string;
  jenjang?: string | null;
  tingkat?: number | null;
  wali_kelas?: string | null;
  code_restrict?: string | null;
  jumlah_siswa?: string | null;
}

export interface WaliData {
  name: string;
  email?: string | null;
}

interface ClassDetailClientProps {
  kelas: ClassDetailData;
  wali: WaliData | null;
  students: StudentItem[];
  classId: string;
}

interface PdfColumnOption {
  id: string;
  label: string;
  defaultChecked: boolean;
  align?: "center" | "left" | "right";
  width?: number;
}

const AVAILABLE_PDF_FIELDS: PdfColumnOption[] = [
  { id: "no", label: "No (Nomor Urut)", defaultChecked: true, align: "center", width: 10 },
  { id: "nis", label: "NIS (Nomor Induk)", defaultChecked: true, align: "center", width: 22 },
  { id: "name", label: "Nama Lengkap Siswa", defaultChecked: true, align: "left" },
  { id: "gender", label: "L/P (Gender)", defaultChecked: true, align: "center", width: 12 },
  { id: "appleid", label: "Apple ID", defaultChecked: true, align: "left", width: 45 },
  { id: "passwordappleid", label: "Password Apple ID", defaultChecked: false, align: "left", width: 35 },
  { id: "email", label: "Email Akun Siswa", defaultChecked: false, align: "left", width: 45 },
  { id: "point", label: "Poin Siswa", defaultChecked: true, align: "center", width: 18 },
  { id: "paraf", label: "Kolom Tanda Tangan / Paraf", defaultChecked: false, align: "center", width: 25 },
  { id: "catatan", label: "Kolom Keterangan / Catatan", defaultChecked: false, align: "left", width: 30 },
];

export function ClassDetailClient({
  kelas,
  wali,
  students,
  classId,
}: ClassDetailClientProps) {
  const [search, setSearch] = useState("");
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // PDF Customization States
  const [docTitle, setDocTitle] = useState(`DAFTAR SISWA KELAS ${kelas.nama_kelas.toUpperCase()}`);
  const [orientationMode, setOrientationMode] = useState<"auto" | "portrait" | "landscape">("auto");
  const [includeClassInfo, setIncludeClassInfo] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "no",
    "nis",
    "name",
    "gender",
    "appleid",
    "point",
  ]);

  // Filter students based on search
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      (s.appleid && s.appleid.toLowerCase().includes(q)) ||
      s.email.toLowerCase().includes(q)
    );
  });

  // Calculate student gender stats
  const countL = students.filter((s) => s.gender === "L").length;
  const countP = students.filter((s) => s.gender === "P").length;

  // Decide effective orientation
  const effectiveOrientation: "portrait" | "landscape" =
    orientationMode === "auto"
      ? selectedFields.length > 5
        ? "landscape"
        : "portrait"
      : orientationMode;

  // Generate jsPDF instance
  const generatePdfDocument = () => {
    const doc = new jsPDF({
      orientation: effectiveOrientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let currentY = 14;

    // Document Title
    doc.setTextColor(15, 23, 42); // slate 900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(docTitle, 14, currentY);

    currentY += 7;

    if (includeClassInfo) {
      // Metadata Grid Info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const col1X = 14;
      const col2X = effectiveOrientation === "landscape" ? 110 : 80;
      const col3X = effectiveOrientation === "landscape" ? 200 : 145;

      doc.text(`Rombel Kelas : ${kelas.nama_kelas}`, col1X, currentY);
      doc.text(
        `Wali Kelas   : ${kelas.wali_kelas || "Belum Ditugaskan"}`,
        col2X,
        currentY
      );
      doc.text(
        `Total Siswa : ${students.length} Orang (${countL} L / ${countP} P)`,
        col3X,
        currentY
      );

      currentY += 5;
      doc.text(
        `Jenjang / Tingkat : ${kelas.jenjang || "SD"} (Tingkat ${kelas.tingkat || "-"})`,
        col1X,
        currentY
      );
      if (kelas.code_restrict) {
        doc.text(`Restrict iPad : ${kelas.code_restrict}`, col2X, currentY);
      }
      doc.text(`Tanggal Cetak: ${todayStr}`, col3X, currentY);

      currentY += 6;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, currentY, pageWidth - 14, currentY);

      currentY += 4;
    } else {
      currentY += 2;
    }

    // Build Table Header and Body
    const headers: string[] = [];
    const colStyles: Record<number, any> = {};

    AVAILABLE_PDF_FIELDS.filter((f) => selectedFields.includes(f.id)).forEach(
      (f, idx) => {
        headers.push(
          f.id === "gender"
            ? "L/P"
            : f.id === "point"
            ? "Poin"
            : f.id === "paraf"
            ? "Paraf Siswa"
            : f.id === "catatan"
            ? "Keterangan"
            : f.label.replace(/\s*\(.*?\)\s*/g, "")
        );

        colStyles[idx] = {
          halign: f.align || "left",
          ...(f.width ? { cellWidth: f.width } : {}),
        };
      }
    );

    const bodyData = students.map((s, idx) => {
      const row: (string | number)[] = [];
      if (selectedFields.includes("no")) row.push(idx + 1);
      if (selectedFields.includes("nis")) row.push(s.nis || "-");
      if (selectedFields.includes("name")) row.push(s.name);
      if (selectedFields.includes("gender")) row.push(s.gender || "-");
      if (selectedFields.includes("appleid")) row.push(s.appleid || "-");
      if (selectedFields.includes("passwordappleid")) row.push(s.passwordappleid || "-");
      if (selectedFields.includes("email")) row.push(s.email);
      if (selectedFields.includes("point")) row.push(`${s.point || "0"} Poin`);
      if (selectedFields.includes("paraf")) row.push(""); // empty space for signature
      if (selectedFields.includes("catatan")) row.push(""); // empty space for notes
      return row;
    });

    const isParafIncluded = selectedFields.includes("paraf");

    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: bodyData,
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
        cellPadding: isParafIncluded ? 3.5 : 2.2,
        valign: "middle",
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      columnStyles: colStyles,
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Page number footer
        const pageNumber = data.pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${pageNumber}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: "right" }
        );
        doc.text(
          `Dokumen Daftar Siswa Kelas ${kelas.nama_kelas}`,
          14,
          pageHeight - 8
        );
      },
    });

    // Signatures block if enabled
    if (includeSignatures) {
      const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
      const signatureSpaceNeeded = 38;

      let signY = finalY + 12;
      // If signature exceeds page, add page
      if (signY + signatureSpaceNeeded > pageHeight - 15) {
        doc.addPage();
        signY = 20;
      }

      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      const leftSignX = 35;
      const rightSignX = pageWidth - 45;

      doc.text("Mengetahui,", leftSignX, signY, { align: "center" });
      doc.text("Kepala Sekolah", leftSignX, signY + 5, { align: "center" });
      doc.text("( ......................................... )", leftSignX, signY + 28, {
        align: "center",
      });

      doc.text(`Palembang, ${todayStr}`, rightSignX, signY, { align: "center" });
      doc.text("Wali Kelas,", rightSignX, signY + 5, { align: "center" });
      doc.text(
        kelas.wali_kelas ? `( ${kelas.wali_kelas} )` : "( ......................................... )",
        rightSignX,
        signY + 28,
        { align: "center" }
      );
    }

    return doc;
  };

  // Handler: Direct Print Preview in Browser
  const handlePrintPdf = () => {
    if (selectedFields.length === 0) {
      toast.error("Pilih minimal satu kolom data untuk dicetak");
      return;
    }

    try {
      setIsGenerating(true);
      const doc = generatePdfDocument();
      const blobUrl = doc.output("bloburl");
      window.open(blobUrl, "_blank");
      toast.success("Membuka pratinjau cetak PDF di tab baru.");
      setOpenPdfModal(false);
    } catch (err) {
      console.error("PDF Print error:", err);
      toast.error("Gagal menyiapkan dokumen PDF untuk dicetak.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Direct Download PDF
  const handleDownloadPdf = () => {
    if (selectedFields.length === 0) {
      toast.error("Pilih minimal satu kolom data untuk diunduh");
      return;
    }

    try {
      setIsGenerating(true);
      const doc = generatePdfDocument();
      const cleanClassName = kelas.nama_kelas.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `Daftar_Siswa_${cleanClassName}_${Date.now()}.pdf`;
      doc.save(filename);
      toast.success("File PDF berhasil diunduh.");
      setOpenPdfModal(false);
    } catch (err) {
      console.error("PDF Download error:", err);
      toast.error("Gagal mengunduh dokumen PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/classes"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Kelas
        </Link>
        <Badge variant="sky" size="sm">
          ID: {classId}
        </Badge>
      </div>

      {/* Class Banner Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="emerald">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              <School className="h-6 w-6" />
            </div>
            <div className="truncate">
              <p className="text-xs text-muted-foreground font-medium">Nama Kelas</p>
              <h2 className="text-base font-bold text-foreground truncate">{kelas.nama_kelas}</h2>
              {kelas.jenjang && (
                <span className="text-[11px] text-muted-foreground">
                  {kelas.jenjang} • Tingkat {kelas.tingkat || "-"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="sky">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div className="truncate">
              <p className="text-xs text-muted-foreground font-medium">Wali Kelas</p>
              <h2 className="text-base font-bold text-foreground truncate">
                {kelas.wali_kelas && kelas.wali_kelas !== "-" ? kelas.wali_kelas : "Belum ada"}
              </h2>
              {wali?.email && (
                <p className="text-xs text-muted-foreground font-mono truncate">{wali.email}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="amber">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Code Restrict iPad</p>
              <h2 className="text-base font-bold font-mono text-foreground">
                {kelas.code_restrict || "-"}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rombongan Belajar / Siswa Table */}
      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Daftar Siswa Terdaftar</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Seluruh siswa aktif yang tercatat dalam rombongan belajar {kelas.nama_kelas}.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tombol Cetak PDF */}
              <Button
                variant="outline"
                onClick={() => setOpenPdfModal(true)}
                className="gap-1.5 text-xs sm:text-sm border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 cursor-pointer font-medium"
                title="Buka menu kustomisasi cetak dokumen PDF"
              >
                <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cetak PDF</span>
              </Button>

              <Badge variant="success" className="text-xs font-semibold px-2.5 py-1">
                Total: {students.length} Siswa
              </Badge>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-sm w-full pt-1">
            <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIS, Apple ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center font-bold">No</TableHead>
                  <TableHead className="font-bold">Nama Lengkap</TableHead>
                  <TableHead className="font-bold">NIS</TableHead>
                  <TableHead className="font-bold text-center">Gender</TableHead>
                  <TableHead className="font-bold">Apple ID</TableHead>
                  <TableHead className="font-bold text-center">Poin</TableHead>
                  <TableHead className="w-20 text-center font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      {search
                        ? "Tidak ada siswa yang cocok dengan pencarian."
                        : "Belum ada siswa yang dimasukkan ke dalam kelas ini."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="text-center font-medium text-xs sm:text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-xs sm:text-sm">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.nis || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.gender === "L" ? "blue" : "pink"} size="xs">
                          {s.gender === "L" ? "L" : "P"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.appleid || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="warning" size="sm" className="font-mono text-xs">
                          {s.point || "0"} Poin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                        >
                          Detail
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Kustomisasi Cetak PDF */}
      <Dialog open={openPdfModal} onOpenChange={setOpenPdfModal}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Kustomisasi Cetak Dokumen PDF
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pilih kolom data siswa dan pengaturan dokumen yang ingin disertakan ke dalam file PDF.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Bagian 1: Pilihan Kolom Data */}
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Kolom Data Siswa ({selectedFields.length} Dipilih)
                </Label>
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedFields(AVAILABLE_PDF_FIELDS.map((f) => f.id))}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFields(
                        AVAILABLE_PDF_FIELDS.filter((f) => f.defaultChecked).map((f) => f.id)
                      )
                    }
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Format Default
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFields(["no", "nis", "name", "gender", "paraf", "catatan"])
                    }
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                    title="Format siap cetak untuk absensi dan paraf tanda tangan"
                  >
                    Format Presensi
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFields(["no", "name", "appleid", "passwordappleid"])
                    }
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                    title="Format khusus akun perangkat iPad"
                  >
                    Format Akun iPad
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFields([])}
                    className="text-muted-foreground hover:text-foreground text-[11px] cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Grid Checkbox Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {AVAILABLE_PDF_FIELDS.map((field) => {
                  const isChecked = selectedFields.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? "border-emerald-500/40 bg-emerald-500/5 text-foreground font-medium"
                          : "border-input bg-background hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedFields((prev) =>
                            prev.includes(field.id)
                              ? prev.filter((id) => id !== field.id)
                              : [...prev, field.id]
                          );
                        }}
                        className="h-3.5 w-3.5 rounded border-input text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span className="truncate">{field.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bagian 2: Pengaturan Format Dokumen */}
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                2. Pengaturan Dokumen & Tata Letak
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Orientasi Kertas */}
                <div className="space-y-1">
                  <Label className="text-xs">Orientasi Kertas A4</Label>
                  <select
                    value={orientationMode}
                    onChange={(e) =>
                      setOrientationMode(e.target.value as "auto" | "portrait" | "landscape")
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm cursor-pointer"
                  >
                    <option value="auto">
                      Otomatis ({selectedFields.length > 5 ? "Landscape" : "Portrait"})
                    </option>
                    <option value="portrait">Portrait (Tegak / Vertikal)</option>
                    <option value="landscape">Landscape (Mendatar / Horizontal)</option>
                  </select>
                </div>

                {/* Judul Dokumen */}
                <div className="space-y-1">
                  <Label className="text-xs">Judul Dokumen</Label>
                  <Input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Contoh: DAFTAR SISWA KELAS..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Opsi Checkbox Header & Tanda Tangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeClassInfo}
                    onChange={(e) => setIncludeClassInfo(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-input text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span>Sertakan Informasi Detail Kelas</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSignatures}
                    onChange={(e) => setIncludeSignatures(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-input text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span>Sertakan Kolom Tanda Tangan Wali</span>
                </label>
              </div>
            </div>

            {/* Kotak Ringkasan Pratinjau */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-muted-foreground">
                  File PDF siap dicetak:{" "}
                  <strong className="text-foreground">{students.length} siswa</strong> dengan{" "}
                  <strong className="text-foreground">{selectedFields.length} kolom data</strong>{" "}
                  (Orientasi:{" "}
                  <span className="capitalize font-semibold text-foreground">
                    {effectiveOrientation}
                  </span>
                  ).
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPdfModal(false)}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isGenerating || selectedFields.length === 0}
              className="w-full sm:w-auto border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 font-medium cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? "Menyiapkan..." : "Unduh PDF (.pdf)"}</span>
            </Button>
            <Button
              type="button"
              onClick={handlePrintPdf}
              disabled={isGenerating || selectedFields.length === 0}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>{isGenerating ? "Membuka..." : "Pratinjau & Cetak"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
