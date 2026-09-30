"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, School, Check, Loader2 } from "lucide-react";
import { duplicatePertemuanToKelasAction } from "@/actions/pertemuan";

interface CopyMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePertemuan: any | null;
  availableClasses: Array<{ id: string; namaKelas: string }>;
  currentKelasId: string;
  onSuccess?: () => void;
}

export function CopyMeetingDialog({
  isOpen,
  onClose,
  sourcePertemuan,
  availableClasses,
  currentKelasId,
  onSuccess,
}: CopyMeetingDialogProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out current class
  const targetClasses = availableClasses.filter((c) => c.id !== currentKelasId);

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDuplicate = async () => {
    if (!sourcePertemuan) return;
    if (selectedClassIds.length === 0) {
      toast.error("Pilih setidaknya satu kelas tujuan.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await duplicatePertemuanToKelasAction(
        sourcePertemuan.id.toString(),
        selectedClassIds
      );

      if (res.success) {
        toast.success(res.message);
        setSelectedClassIds([]);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Gagal menyalin materi.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Copy className="h-5 w-5" />
            </span>
            <DialogTitle className="text-lg font-bold text-foreground">
              Salin Materi ke Kelas Lain
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Salin materi <strong>Pertemuan {sourcePertemuan?.pertemuanKe}: {sourcePertemuan?.judul}</strong> ke rombel paralel yang Anda ampu tanpa perlu upload ulang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <p className="text-xs font-semibold text-foreground">Pilih Rombongan Belajar Tujuan:</p>

          {targetClasses.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
              Tidak ada rombel kelas paralel lain yang tersedia untuk mata pelajaran ini.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {targetClasses.map((cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClass(cls.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <School className="h-4 w-4 shrink-0" />
                      <span>{cls.namaKelas}</span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 text-xs rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDuplicate}
            disabled={isLoading || selectedClassIds.length === 0}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyalin...</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin ke {selectedClassIds.length} Kelas</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
