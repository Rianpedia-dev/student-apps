"use client";

import React from "react";
import {
  Calendar,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
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
  const severityConfig = VIOLATION_SEVERITY_CONFIG[severity] || VIOLATION_SEVERITY_CONFIG.RINGAN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Rincian Catatan Kedisiplinan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Informasi detail pelanggaran tata tertib dan bimbingan santri.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 1. Header Profile Santri */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-muted/40 border border-border/60">
            <UserAvatar
              src={violation.studentImage}
              gender={violation.studentGender}
              name={violation.nama || "Siswa"}
              className="h-12 w-12 border border-border"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-foreground truncate">{violation.nama}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kelas: <span className="font-medium text-foreground">{violation.kelas || "-"}</span>
              </p>
            </div>
          </div>

          {/* 2. Informasi Kategori & Tingkat */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-muted/20 border border-border/50 rounded-xl p-3">
              <span className="text-[11px] font-medium text-muted-foreground block">Kategori Pelanggaran</span>
              <span className="text-xs font-semibold text-foreground mt-1 block truncate">
                {violation.kategori}
              </span>
            </div>

            <div className="bg-muted/20 border border-border/50 rounded-xl p-3">
              <span className="text-[11px] font-medium text-muted-foreground block">Tingkat Keparahan</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant={severityConfig.badgeVariant} size="sm" className="text-[11px]">
                  {severityConfig.label}
                </Badge>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  -{points} Poin
                </span>
              </div>
            </div>
          </div>

          {/* 3. Deskripsi Kejadian */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Deskripsi Kejadian:</span>
            <div className="p-3 rounded-xl bg-card border border-border text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {violation.cleanKeterangan || violation.keterangan}
            </div>
          </div>

          {/* 4. Tindakan Pembinaan */}
          {violation.tindakan && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">
                Catatan Bimbingan Wali Kelas:
              </span>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground/90 leading-relaxed">
                {violation.tindakan}
              </div>
            </div>
          )}

          {/* 5. Stempel Waktu */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/40">
            <Calendar className="h-3.5 w-3.5" />
            <span>Waktu Kejadian / Pencatatan: <strong>{formatDateIndo(violation.created_at)}</strong></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
