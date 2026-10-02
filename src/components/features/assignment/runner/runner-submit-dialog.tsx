"use client";

import React from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface RunnerSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount: number;
  answeredCount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function RunnerSubmitDialog({
  open,
  onOpenChange,
  totalCount,
  answeredCount,
  isSubmitting,
  onConfirm,
}: RunnerSubmitDialogProps) {
  const unansweredCount = Math.max(0, totalCount - answeredCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kumpulkan Tugas?</DialogTitle>
          <DialogDescription>
            Pastikan seluruh jawaban telah kamu periksa. Tugas yang sudah dikumpulkan tidak dapat diubah kembali.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Soal:</span>
            <span className="font-semibold text-foreground">{totalCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sudah Dijawab:</span>
            <span className="font-semibold text-primary">{answeredCount}</span>
          </div>

          {unansweredCount > 0 && (
            <>
              <Separator />
              <div className="flex justify-between items-center text-destructive font-medium">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Belum Terjawab:
                </span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cek Kembali
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="text-xs font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengumpulkan...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" /> Ya, Kumpulkan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
