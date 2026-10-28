"use client";

import React from "react";
import {
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Info,
  Clock,
  Tag,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateIndo } from "@/lib/utils";
import { VIOLATION_SEVERITY_CONFIG } from "@/lib/constants/violations";
import type { ViolationItem } from "@/types";

interface ViolationDetailModalProps {
  violation: ViolationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViolationDetailModal({
  violation,
  open,
  onOpenChange,
}: ViolationDetailModalProps) {
  if (!violation) return null;

  const severity = violation.severity || "RINGAN";
  const points = violation.points ?? 5;
  const severityConfig =
    VIOLATION_SEVERITY_CONFIG[severity] || VIOLATION_SEVERITY_CONFIG.RINGAN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                Rincian Catatan Kedisiplinan
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                SD - SMP Islam Al-Azhar Cairo Palembang • Evaluasi Karakter Santri
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Severity & Points Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2">
              <Badge variant={severityConfig.badgeVariant} size="sm" className="font-semibold text-xs">
                Tingkat {severityConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                Kategori {violation.kategori || "Umum"}
              </span>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 px-2.5 py-1 rounded-lg">
              -{points} Poin Kedisiplinan
            </span>
          </div>

          {/* Deskripsi Kejadian */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              Deskripsi Catatan
            </label>
            <div className="rounded-2xl bg-card p-3.5 sm:p-4 border border-border/60 shadow-xs">
              <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {violation.cleanKeterangan || violation.keterangan || "-"}
              </p>
            </div>
          </div>

          {/* Catatan Pembinaan Wali Kelas (jika ada) */}
          {violation.tindakan && (
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Catatan Bimbingan & Arahan Guru / Wali Kelas
              </label>
              <div className="rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 sm:p-4 border border-emerald-500/20 space-y-1">
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                  {violation.tindakan}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 italic">
                  * Jadikan bimbingan ini sebagai motivasi untuk memperbaiki adab dan kebiasaan sehari-hari.
                </p>
              </div>
            </div>
          )}

          {/* Konsekuensi & Rekomendasi Standar */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Tindakan Sesuai Tata Tertib
            </label>
            <div className="rounded-2xl bg-muted/30 p-3 sm:p-3.5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
              {severityConfig.description}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{formatDateIndo(violation.created_at)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>Buku Kedisiplinan Siswa</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
