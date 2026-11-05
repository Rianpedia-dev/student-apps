"use client";

import React from "react";
import {
  Calendar,
  ShieldAlert,
  UserCheck,
  GraduationCap,
  BookOpen,
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

  const severity = (violation.tingkatan || violation.severity || "RINGAN").toUpperCase() as "RINGAN" | "SEDANG" | "BERAT";
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
                Rincian Catatan Kedisiplinan Siswa
              </DialogTitle>
              <DialogDescription className="text-xs">
                Informasi lengkap catatan pelanggaran tata tertib dan riwayat bimbingan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 1. Header Profile Siswa */}
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
                {violation.jenjang && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                    Jenjang {violation.jenjang}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 2. Informasi Kategori & Tingkatan */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-muted/20 border border-border/50 rounded-xl p-3">
              <span className="text-[11px] font-medium text-muted-foreground block">Kategori Pelanggaran</span>
              <span className="text-xs font-semibold text-foreground mt-1 block truncate">
                {violation.kategori}
              </span>
            </div>

            <div className="bg-muted/20 border border-border/50 rounded-xl p-3">
              <span className="text-[11px] font-medium text-muted-foreground block">Tingkatan Pelanggaran</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant={severityConfig.badgeVariant} size="sm" className="text-[11px]">
                  {severityConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* 3. Info Semester & Guru Pembuat Catatan (Otomatis) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-muted/20 border border-border/50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium">Semester</span>
              </div>
              <p className="text-xs font-semibold text-foreground truncate">
                {violation.semester || "Semester Berjalan"}
              </p>
            </div>

            <div className="bg-muted/20 border border-border/50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">Guru Pembuat</span>
              </div>
              <p className="text-xs font-semibold text-foreground truncate">
                {violation.guru_nama || "Guru Pengampu"}
              </p>
            </div>
          </div>

          {/* 4. Deskripsi Kejadian */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Deskripsi Pelanggaran:</span>
            <div className="p-3 rounded-xl bg-card border border-border text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {violation.cleanKeterangan || violation.keterangan}
            </div>
          </div>

          {/* 5. Stempel Waktu */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/40">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Tanggal Dicatat: <strong className="text-foreground">{formatDateIndo(violation.created_at)}</strong></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
