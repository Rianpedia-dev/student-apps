"use client";

import React from "react";
import { Eye, Pencil, Trash2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDateIndo } from "@/lib/utils";
import { VIOLATION_SEVERITY_CONFIG } from "@/lib/constants/violations";
import type { ViolationItem } from "@/types";

interface ViolationCardProps {
  violation: ViolationItem;
  onViewDetail: (v: ViolationItem) => void;
  onEdit: (v: ViolationItem) => void;
  onDelete: (v: ViolationItem) => void;
}

export function ViolationCard({
  violation,
  onViewDetail,
  onEdit,
  onDelete,
}: ViolationCardProps) {
  const severity = violation.severity || "RINGAN";
  const points = violation.points ?? 5;
  const severityConfig = VIOLATION_SEVERITY_CONFIG[severity] || VIOLATION_SEVERITY_CONFIG.RINGAN;

  // Accent border line based on severity
  const accentGradient =
    severity === "BERAT"
      ? "bg-rose-500"
      : severity === "SEDANG"
      ? "bg-amber-500"
      : "bg-teal-500";

  return (
    <Card className="group relative overflow-hidden rounded-2xl border bg-card hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Top Accent Strip */}
      <div className={`h-1 w-full ${accentGradient}`} />

      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
        {/* Top: Student Profile & Points Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              src={violation.studentImage}
              gender={violation.studentGender}
              name={violation.nama || "Siswa"}
              className="h-10 w-10 shrink-0 border border-border"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {violation.nama || "Tanpa Nama"}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {violation.kelas || "Tanpa Kelas"}
              </p>
            </div>
          </div>

          <Badge
            variant={severityConfig.badgeVariant}
            size="sm"
            className="shrink-0 text-[11px] font-semibold"
          >
            {severityConfig.label} (-{points} Poin)
          </Badge>
        </div>

        {/* Badge: Kategori */}
        <div>
          <Badge variant="outline" size="sm" className="text-xs bg-muted/40 font-normal">
            {violation.kategori || "Pelanggaran Umum"}
          </Badge>
        </div>

        {/* Deskripsi Kejadian */}
        <div className="bg-muted/30 rounded-xl p-2.5 border border-border/50 text-xs sm:text-sm text-foreground/90 leading-relaxed line-clamp-3">
          {violation.cleanKeterangan || violation.keterangan || "-"}
        </div>

        {/* Tindakan Pembinaan (jika ada) */}
        {violation.tindakan && (
          <div className="rounded-xl bg-muted/40 p-2.5 text-xs border border-border/50 space-y-0.5">
            <span className="font-semibold text-foreground text-[11px] block">
              Catatan Bimbingan:
            </span>
            <p className="text-muted-foreground leading-relaxed text-[11px] line-clamp-2">
              {violation.tindakan}
            </p>
          </div>
        )}

        {/* Footer: Tanggal + Action Buttons */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateIndo(violation.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onViewDetail(violation)}
              title="Lihat Detail"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(violation)}
              title="Edit Catatan"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={() => onDelete(violation)}
              title="Hapus Catatan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
