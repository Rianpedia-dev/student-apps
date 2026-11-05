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
  AlertTriangle,
  Trash2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { deleteScheduleBulkAction } from "@/actions/schedule";
import { toast } from "sonner";

interface BulkDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTahun: string;
  currentSemester: string;
  currentScope: string;
  classes: Array<{ id: string; nama: string; jenjang: string }>;
  initialClassId?: string;
  scheduleCount: number;
  onSuccess: () => void;
}

export function BulkDeleteModal({
  open,
  onOpenChange,
  currentTahun,
  currentSemester,
  currentScope,
  classes,
  initialClassId,
  scheduleCount,
  onSuccess,
}: BulkDeleteModalProps) {
  // Scope delete: class, sd, smp, all
  const defaultScope =
    currentScope === "CLASS"
      ? "class"
      : currentScope === "SD"
      ? "sd"
      : currentScope === "SMP"
      ? "smp"
      : "all";

  const [deleteScope, setDeleteScope] = useState<"class" | "sd" | "smp" | "all">(defaultScope);
  const [targetClassId, setTargetClassId] = useState<string>(
    initialClassId && initialClassId !== "ALL" ? initialClassId : classes[0]?.id || ""
  );
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed = confirmationInput.trim().toUpperCase() === "HAPUS";

  const handleDelete = async () => {
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);
      const res = await deleteScheduleBulkAction({
        scope: deleteScope,
        kelasId: deleteScope === "class" ? targetClassId : undefined,
        tahunPelajaran: currentTahun,
        semester: currentSemester,
      });

      if (!res.success) {
        toast.error(res.error || "Gagal menghapus jadwal.");
        return;
      }

      toast.success(res.message || `Berhasil menghapus ${res.count} jadwal!`);
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)] rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Trash2 className="h-5 w-5" />
            <span>Hapus Massal Jadwal Pelajaran</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Warning Banner */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 sm:p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Peringatan Tindakan Tidak Dapat Dibatalkan!</span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-200 leading-relaxed">
              Jadwal yang dihapus akan hilang dari kalender KBM. Namun, riwayat absensi kehadiran siswa di masa lalu tetap tersimpan aman di database sekolah.
            </p>
          </div>

          {/* Cakupan Penghapusan */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Pilih Cakupan Jadwal yang Ingin Dihapus
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="bulkDeleteScope"
                  value="class"
                  checked={deleteScope === "class"}
                  onChange={() => setDeleteScope("class")}
                />
                <span className="font-semibold text-foreground">Hanya Satu Kelas Tertentu</span>
              </label>

              {deleteScope === "class" && (
                <div className="pl-6 pt-1">
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

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="bulkDeleteScope"
                  value="sd"
                  checked={deleteScope === "sd"}
                  onChange={() => setDeleteScope("sd")}
                />
                <span className="font-semibold text-foreground">Semua Jadwal SD (Semester Ini)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="bulkDeleteScope"
                  value="smp"
                  checked={deleteScope === "smp"}
                  onChange={() => setDeleteScope("smp")}
                />
                <span className="font-semibold text-foreground">Semua Jadwal SMP (Semester Ini)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10">
                <input
                  type="radio"
                  name="bulkDeleteScope"
                  value="all"
                  checked={deleteScope === "all"}
                  onChange={() => setDeleteScope("all")}
                />
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  Seluruh Jadwal Sekolah ({currentTahun} Sem {currentSemester})
                </span>
              </label>
            </div>
          </div>

          {/* Konfirmasi Keamanan (Security Guard) */}
          <div className="pt-2 border-t border-border space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Ketik kata <span className="font-mono text-rose-600 bg-rose-500/15 px-1 py-0.5 rounded">HAPUS</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              placeholder='Ketik "HAPUS"'
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              className="w-full text-xs rounded-xl border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono tracking-wider"
              autoFocus
            />
          </div>
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
            onClick={handleDelete}
            disabled={!isConfirmed || isSubmitting}
            className="font-bold text-xs gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Hapus Sekarang</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

