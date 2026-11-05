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
  FileText,
  Download,
  Calendar,
  Table as TableIcon,
  Loader2,
} from "lucide-react";
import {
  generateScheduleClassGridPdf,
  generateScheduleTabularPdf,
  SchedulePdfItem,
} from "@/lib/pdf-schedules";
import { toast } from "sonner";

interface ExportPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Array<{ id: string; nama: string; jenjang: string }>;
  currentTahun: string;
  currentSemester: string;
  currentScope: string;
  currentKelasId?: string;
  schedules: SchedulePdfItem[];
}

export function ExportPdfModal({
  open,
  onOpenChange,
  classes,
  currentTahun,
  currentSemester,
  currentScope,
  currentKelasId,
  schedules,
}: ExportPdfModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"grid" | "tabular">("grid");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [targetClassId, setTargetClassId] = useState<string>(
    currentKelasId && currentKelasId !== "ALL" ? currentKelasId : classes[0]?.id || ""
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      if (selectedFormat === "grid") {
        const cls = classes.find((c) => c.id === targetClassId);
        if (!cls) {
          toast.error("Silakan pilih kelas terlebih dahulu.");
          return;
        }

        const classSchedules = schedules.filter((s) => s.kelasNama === cls.nama);
        if (classSchedules.length === 0) {
          toast.warning(`Tidak ada jadwal untuk kelas ${cls.nama}.`);
          return;
        }

        generateScheduleClassGridPdf({
          kelasNama: cls.nama,
          jenjang: cls.jenjang,
          tahunPelajaran: currentTahun,
          semester: currentSemester,
          schedules: classSchedules,
          orientation,
        });

        toast.success(`Jadwal kelas ${cls.nama} berhasil dicetak.`);
      } else {
        // Tabular Report
        if (schedules.length === 0) {
          toast.warning("Tidak ada jadwal untuk dicetak pada rekap tabular.");
          return;
        }

        const scopeTitle =
          currentScope === "CLASS"
            ? classes.find((c) => c.id === currentKelasId)?.nama || "Per Kelas"
            : currentScope === "SD"
            ? "Jenjang SD"
            : currentScope === "SMP"
            ? "Jenjang SMP"
            : "Seluruh Sekolah";

        generateScheduleTabularPdf({
          scopeTitle,
          tahunPelajaran: currentTahun,
          semester: currentSemester,
          schedules,
          orientation,
        });

        toast.success("Rekapitulasi jadwal tabular resmi berhasil dicetak.");
      }

      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengekspor PDF.";
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[calc(100%-2rem)] rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-600" />
            <span>Cetak Jadwal Pelajaran (PDF)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-xs text-muted-foreground">
            Pilih tata letak PDF resmi sesuai kebutuhan cetak Anda:
          </p>

          <div className="space-y-2.5">
            {/* Format 1: Format Standar Jadwal Kelas (No | Hari | Waktu Mulai | Waktu Selesai | Mapel | Guru) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedFormat === "grid"
                  ? "border-primary bg-primary/5 text-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <input
                type="radio"
                name="pdfFormat"
                value="grid"
                checked={selectedFormat === "grid"}
                onChange={() => setSelectedFormat("grid")}
                className="mt-1"
              />
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-bold text-xs text-foreground">
                    Jadwal Resmi Kelas (Tabel Standar)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Susunan tabel terurut: <strong>No • Hari • Waktu Mulai • Waktu Selesai • Mata Pelajaran • Nama Guru</strong>.
                  Dilengkapi Kop Resmi Al-Azhar Cairo dan tanda tangan.
                </p>

                {selectedFormat === "grid" && (
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-foreground block mb-1">
                      Pilih Kelas yang Ingin Dicetak:
                    </label>
                    <select
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      className="w-full text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama} ({c.jenjang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </label>

            {/* Format 2: Rekapitulasi Seluruh Jadwal */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedFormat === "tabular"
                  ? "border-primary bg-primary/5 text-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <input
                type="radio"
                name="pdfFormat"
                value="tabular"
                checked={selectedFormat === "tabular"}
                onChange={() => setSelectedFormat("tabular")}
                className="mt-1"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <TableIcon className="h-4 w-4 text-teal-600" />
                  <span className="font-bold text-xs text-foreground">
                    Rekapitulasi Seluruh Jadwal (Kurikulum / Arsip)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Daftar rekapitulasi seluruh jadwal terurut dengan kolom kelas, mata pelajaran, dan nama guru untuk arsip tata usaha / yayasan.
                </p>
                {selectedFormat === "tabular" && (
                  <p className="text-[11px] font-semibold text-primary pt-1">
                    • Mencakup: {schedules.length} jadwal pelajaran pada tampilan saat ini.
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Pilihan Orientasi Kertas */}
          <div className="pt-2 border-t border-border">
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Orientasi Kertas:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer font-semibold transition-all ${
                  orientation === "portrait"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="orientation"
                  value="portrait"
                  checked={orientation === "portrait"}
                  onChange={() => setOrientation("portrait")}
                  className="hidden"
                />
                <span>📄 Portrait (Tegak - Disarankan)</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer font-semibold transition-all ${
                  orientation === "landscape"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="orientation"
                  value="landscape"
                  checked={orientation === "landscape"}
                  onChange={() => setOrientation("landscape")}
                  className="hidden"
                />
                <span>📑 Landscape (Mendatar)</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="font-bold text-xs gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Unduh File PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
