"use client";

import React from "react";
import { CheckCircle2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatShortDate } from "@/lib/utils";
import type { ViolationItem } from "@/types";

interface StudentViolationsClientProps {
  violations: ViolationItem[];
}

export function StudentViolationsClient({ violations }: StudentViolationsClientProps) {
  if (violations.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-white/50 dark:border-white/10 glass-card p-8 text-center space-y-2 shadow-2xl">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Rekam Jejak Bersih
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Alhamdulillah, tidak ada catatan pelanggaran tata tertib atas nama Anda. Pertahankan kedisiplinan dan adab mulia.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Riwayat Catatan ({violations.length})
        </h3>
      </div>

      {violations.map((v) => {
        return (
          <Card
            key={v.id}
            className="rounded-3xl card-elevation p-4 space-y-2.5 shadow-2xl hover:border-primary/40 transition-all duration-200"
          >
            {/* Baris 1: Kategori & Poin Pengurang */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground tracking-tight">
                {v.kategori || "Pelanggaran Umum"}
              </span>
              {typeof v.points === "number" && v.points > 0 && (
                <span className="shrink-0 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                  -{v.points} Poin
                </span>
              )}
            </div>

            {/* Baris 2: Deskripsi Keterangan */}
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
              {v.cleanKeterangan || v.keterangan}
            </p>

            {/* Baris 3: Catatan Pembinaan Wali Kelas (jika ada) */}
            {v.tindakan && (
              <div className="rounded-xl bg-muted/40 p-2.5 sm:p-3 text-xs border border-border/50 space-y-0.5">
                <span className="font-semibold text-foreground text-[11px] sm:text-xs block">
                  Catatan Pembinaan:
                </span>
                <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                  {v.tindakan}
                </p>
              </div>
            )}

            {/* Baris 4: Footer - Tanggal Kejadian / Pencatatan */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-end text-xs">
              <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatShortDate(v.created_at)}</span>
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
