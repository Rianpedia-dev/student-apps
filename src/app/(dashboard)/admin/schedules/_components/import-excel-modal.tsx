"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import {
  downloadScheduleTemplateAction,
  importScheduleExcelAction,
} from "@/actions/schedule";
import { toast } from "sonner";

interface ImportExcelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTahun: string;
  currentSemester: string;
  availableYears: string[];
  onSuccess: () => void;
}

export function ImportExcelModal({
  open,
  onOpenChange,
  currentTahun,
  currentSemester,
  availableYears,
  onSuccess,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [tahunPelajaran, setTahunPelajaran] = useState(currentTahun);
  const [semester, setSemester] = useState(currentSemester);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset state when opening/closing
  const handleClose = () => {
    if (isSubmitting) return;
    setFile(null);
    setErrors([]);
    onOpenChange(false);
  };

  // Unduh Template Excel Resmi
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const res = await downloadScheduleTemplateAction();
      if (!res.success || !res.base64) {
        toast.error(res.error || "Gagal mengunduh template.");
        return;
      }

      // Convert base64 to binary and trigger download
      const byteCharacters = atob(res.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename || "Template_Import_Jadwal_AlAzhar.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Template Excel berhasil diunduh. Silakan isi data jadwal.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
        toast.error("Hanya file Excel (.xlsx / .xls) yang diperbolehkan.");
        return;
      }
      setFile(selected);
      setErrors([]);
    }
  };

  // Submit Import
  const handleImport = async () => {
    if (!file) {
      toast.error("Silakan pilih file Excel terlebih dahulu.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors([]);

      // Read file to base64
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const resStr = reader.result as string;
          const base64 = resStr.split(",")[1];
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const res = await importScheduleExcelAction({
        base64File,
        mode,
        tahunPelajaran,
        semester,
      });

      if (!res.success) {
        setErrors(res.errors || ["Gagal mengimpor jadwal."]);
        toast.error("Terdapat kesalahan format atau data pada file Excel.");
        return;
      }

      toast.success(res.message || `Berhasil mengimpor ${res.insertedCount} jadwal!`);
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengimpor jadwal.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-w-[calc(100%-2rem)] rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <span>Import Jadwal Pelajaran (Excel)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Langkah 1: Download Template */}
          <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  1. Unduh Template Excel Resmi
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Gunakan format standar Al-Azhar yang telah dilengkapi daftar kelas, mata pelajaran, dan NIY guru valid.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="text-xs font-semibold rounded-xl gap-1.5 shrink-0 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                {isDownloadingTemplate ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Unduh Template</span>
              </Button>
            </div>
          </div>

          {/* Langkah 2: Pilih Target Tahun & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Tahun Pelajaran Target
              </label>
              <select
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Semester Target
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          {/* Langkah 3: Mode Import */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Metode Import Data
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === "append"
                    ? "border-primary bg-primary/5 text-foreground shadow-xs font-medium"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={mode === "append"}
                  onChange={() => setMode("append")}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-bold text-foreground">Tambah Jadwal (Append)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Menambahkan jadwal dari Excel tanpa menghapus data yang sudah ada.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === "replace"
                    ? "border-amber-600 bg-amber-500/10 text-foreground shadow-xs font-medium"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-bold text-foreground">Timpa Seluruh Jadwal (Replace)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Hapus seluruh jadwal pada semester target lalu isi dengan data file.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Langkah 4: Upload File */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              File Excel Jadwal (.xlsx)
            </label>
            {!file ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/60 hover:bg-muted/20 cursor-pointer transition-all">
                <Upload className="h-7 w-7 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-foreground">
                  Klik untuk memilih file Excel atau seret file ke sini
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Format .xlsx atau .xls (Maks. 5 MB)
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-foreground truncate max-w-[240px] sm:max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Error List Alert */}
          {errors.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Ditemukan {errors.length} Kesalahan pada File:</span>
              </div>
              <ul className="max-h-36 overflow-y-auto space-y-1 pl-4 text-[11px] text-rose-800 dark:text-rose-300 list-disc">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={!file || isSubmitting}
            className="font-bold text-xs gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>Proses Import Jadwal</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

