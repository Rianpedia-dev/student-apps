"use client";

import React from "react";
import {
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Info,
  BookOpen,
  UserCheck,
  GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const severity = (violation.tingkatan || violation.severity || "RINGAN").toUpperCase() as "RINGAN" | "SEDANG" | "BERAT";
  const severityConfig =
    VIOLATION_SEVERITY_CONFIG[severity] || VIOLATION_SEVERITY_CONFIG.RINGAN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-lg p-5 sm:p-6 rounded-3xl">
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                Rincian Catatan Kedisiplinan
              </DialogTitle>
            </div>
          </div>

          {/* Badges Bar: Tingkat, Kategori, Status */}
          <div className="flex flex-wrap items-center gap-2 pt-2.5">
            <Badge variant={severityConfig.badgeVariant} size="sm" className="font-semibold text-[11px]">
              Tingkat {severityConfig.label}
            </Badge>
            <Badge variant="outline" size="sm" className="text-[11px] font-medium bg-muted/40">
              {violation.kategori || "Pelanggaran Umum"}
            </Badge>
            <Badge
              variant={
                violation.status === "SELESAI"
                  ? "emerald"
                  : violation.status === "DIBINA"
                  ? "purple"
                  : "secondary"
              }
              size="sm"
              className="text-[11px] font-semibold ml-auto"
            >
              {violation.status === "SELESAI"
                ? "Selesai Dibina"
                : violation.status === "DIBINA"
                ? "Sedang Dibina"
                : "Tercatat"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 pt-2">
          {/* 1. Ringkasan Informasi Utama: Grid 2 Kolom Rapi */}
          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-muted/30 border border-border/60 text-xs">
            {/* Tanggal Kejadian */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                Tanggal Kejadian
              </span>
              <p className="font-semibold text-foreground text-xs leading-snug">
                {formatDateIndo(violation.created_at)}
              </p>
            </div>

            {/* Semester */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                Semester
              </span>
              <p className="font-semibold text-foreground text-xs leading-snug">
                {violation.semester || "Semester Berjalan"}
              </p>
            </div>

            {/* Kelas Siswa */}
            <div className="space-y-1 pt-2 border-t border-border/40">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                Kelas siswa
              </span>
              <p className="font-semibold text-foreground text-xs leading-snug">
                {violation.kelas || "-"}
              </p>
            </div>

            {/* Guru Pembuat */}
            <div className="space-y-1 pt-2 border-t border-border/40">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                Dicatat Oleh
              </span>
              <p className="font-semibold text-foreground text-xs leading-snug truncate">
                {violation.guru_nama || "Guru Pengampu"}
              </p>
            </div>
          </div>

          {/* 2. Deskripsi Pelanggaran */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              Deskripsi Pelanggaran
            </span>
            <div className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border/70 text-xs sm:text-sm text-foreground leading-relaxed shadow-xs whitespace-pre-wrap">
              {violation.cleanKeterangan || violation.keterangan || "-"}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs px-4"
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
