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
  CalendarPlus,
  Copy,
  PlusCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { copyScheduleSemesterAction } from "@/actions/schedule";
import { toast } from "sonner";

interface NewSemesterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTahun: string;
  currentSemester: string;
  availableYears: string[];
  onSuccess: (targetTahun: string, targetSemester: string) => void;
}

export function NewSemesterModal({
  open,
  onOpenChange,
  currentTahun,
  currentSemester,
  availableYears,
  onSuccess,
}: NewSemesterModalProps) {
  const [mode, setMode] = useState<"copy" | "empty">("copy");

  // Asal (Source)
  const [fromTahun, setFromTahun] = useState(currentTahun);
  const [fromSemester, setFromSemester] = useState(currentSemester);

  // Tujuan (Target)
  // Default target is next semester or next year
  const nextSemester = currentSemester === "1" ? "2" : "1";
  const [toTahun, setToTahun] = useState(
    currentSemester === "2"
      ? `${parseInt(currentTahun.split("/")[0]) + 1}/${parseInt(currentTahun.split("/")[1]) + 1}`
      : currentTahun
  );
  const [toSemester, setToSemester] = useState(nextSemester);
  const [customToTahun, setCustomToTahun] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toTahun.trim()) {
      toast.error("Tahun pelajaran tujuan wajib diisi.");
      return;
    }

    if (mode === "copy") {
      if (fromTahun === toTahun && fromSemester === toSemester) {
        toast.error("Semester asal dan semester tujuan tidak boleh sama.");
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await copyScheduleSemesterAction({
          fromTahun,
          fromSemester,
          toTahun,
          toSemester,
          overwrite,
        });

        if (!res.success) {
          toast.error(res.error || "Gagal menyalin jadwal.");
          return;
        }

        toast.success(res.message || "Jadwal semester berhasil disalin!");
        onOpenChange(false);
        onSuccess(toTahun, toSemester);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Buka semester kosong baru: cukup pindah navigasi ke semester tersebut
      toast.success(`Beralih ke Semester ${toSemester === "2" ? "2 (Genap)" : "1 (Ganjil)"} Tahun ${toTahun}.`);
      onOpenChange(false);
      onSuccess(toTahun, toSemester);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => !isSubmitting && onOpenChange(openState)}>
      <DialogContent className="sm:max-w-xl max-w-[calc(100%-2rem)] rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            <span>Kelola Semester Baru & Salin Jadwal</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Pilihan Metode */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Pilihan Pembuatan Semester Baru
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === "copy"
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="semesterMode"
                  value="copy"
                  checked={mode === "copy"}
                  onChange={() => setMode("copy")}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Copy className="h-3.5 w-3.5 text-primary" />
                    <span>Salin dari Semester Lalu</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Duplikasi susunan jadwal dari semester sebelumnya ke semester baru secara instan.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === "empty"
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="semesterMode"
                  value="empty"
                  checked={mode === "empty"}
                  onChange={() => setMode("empty")}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <PlusCircle className="h-3.5 w-3.5 text-primary" />
                    <span>Mulai Semester Kosong</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Buka lembar jadwal baru kosong untuk diinput manual atau diimport dari Excel.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Jika Mode Copy: Pilih Semester Asal */}
          {mode === "copy" && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4 space-y-2">
              <p className="text-xs font-bold text-foreground">Semester Asal (Sumber Jadwal)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Tahun Pelajaran Asal
                  </label>
                  <select
                    value={fromTahun}
                    onChange={(e) => setFromTahun(e.target.value)}
                    className="w-full text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Semester Asal
                  </label>
                  <select
                    value={fromSemester}
                    onChange={(e) => setFromSemester(e.target.value)}
                    className="w-full text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="1">Semester 1 (Ganjil)</option>
                    <option value="2">Semester 2 (Genap)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Target Semester Baru */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-3">
            <p className="text-xs font-bold text-primary">Semester Baru (Tujuan)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    Tahun Pelajaran Baru
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomToTahun(!customToTahun)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {customToTahun ? "Pilih dari list" : "+ Ketik manual"}
                  </button>
                </div>

                {customToTahun ? (
                  <input
                    type="text"
                    placeholder="Contoh: 2027/2028"
                    value={toTahun}
                    onChange={(e) => setToTahun(e.target.value)}
                    className="w-full text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                ) : (
                  <select
                    value={toTahun}
                    onChange={(e) => setToTahun(e.target.value)}
                    className="w-full text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                    {!availableYears.includes(toTahun) && (
                      <option value={toTahun}>{toTahun}</option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  Semester Baru
                </label>
                <select
                  value={toSemester}
                  onChange={(e) => setToSemester(e.target.value)}
                  className="w-full text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
            </div>

            {mode === "copy" && (
              <div className="pt-2 border-t border-primary/10 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="overwrite_target"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <label
                  htmlFor="overwrite_target"
                  className="text-[11px] text-foreground cursor-pointer select-none leading-tight"
                >
                  Timpa seluruh jadwal yang ada di semester tujuan jika sudah pernah ada data sebelumnya.
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="font-bold text-xs gap-1.5 rounded-xl"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : mode === "copy" ? (
                <Copy className="h-3.5 w-3.5" />
              ) : (
                <CalendarPlus className="h-3.5 w-3.5" />
              )}
              <span>{mode === "copy" ? "Salin Seluruh Jadwal" : "Buka Semester Baru"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

