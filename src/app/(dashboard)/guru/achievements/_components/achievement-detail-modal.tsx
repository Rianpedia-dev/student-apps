"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getTingkatBadgeProps, getPeringkatBadgeProps } from "@/lib/achievement-points";
import { formatDateIndo } from "@/lib/utils";
import { Calendar, Award, Building, User, ExternalLink } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";

export interface AchievementItem {
  id: string;
  id_user: string;
  nama: string;
  kelas: string;
  kelas_saat_prestasi?: string;
  tahun_ajaran?: string;
  tingkat?: string;
  peringkat?: string;
  poin?: number;
  fotoanak: string;
  prestasi: string;
  created_at?: Date | string | null;
  studentImage?: string | null;
  studentGender?: string | null;
  studentNis?: string | null;
  jenjang?: string | null;
}

interface AchievementDetailModalProps {
  achievement: AchievementItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (ach: AchievementItem) => void;
}

export function AchievementDetailModal({
  achievement,
  open,
  onOpenChange,
}: AchievementDetailModalProps) {
  if (!achievement) return null;

  const hasPhoto =
    achievement.fotoanak &&
    !achievement.fotoanak.includes("trophy") &&
    !achievement.fotoanak.includes("best-student") &&
    !achievement.fotoanak.includes("best-point");

  const tingkatProps = getTingkatBadgeProps(achievement.tingkat || "Dalam Sekolah");
  const peringkatProps = getPeringkatBadgeProps(achievement.peringkat || "Juara 1");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] p-4 sm:p-6 bg-background dark:bg-card border border-border shadow-2xl rounded-3xl overflow-hidden focus:outline-none max-h-[92vh] overflow-y-auto">
        <DialogDescription className="sr-only">
          Detail piagam penghargaan dan kejuaraan siswa {achievement.nama}
        </DialogDescription>

        {/* 1. Header: Badges & Judul Kejuaraan (Diberi ruang pr-10 agar tidak tertabrak tombol Close X) */}
        <div className="border-b border-border/50 pb-3 pr-8 sm:pr-10 space-y-2">
          {/* Baris Badges Kategori & Poin */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg border ${tingkatProps.colorClass}`}
            >
              <span>{tingkatProps.icon}</span> Tingkat {achievement.tingkat || "Dalam Sekolah"}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg border ${peringkatProps.colorClass}`}
            >
              <span>{peringkatProps.icon}</span> {achievement.peringkat || "Juara 1"}
            </span>
            <span className="text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg ml-auto">
              +{achievement.poin || 1} Poin
            </span>
          </div>

          {/* Judul Lengkap Kejuaraan (Tidak terpotong ...) */}
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
            {achievement.prestasi}
          </DialogTitle>
        </div>

        <div className="space-y-4 pt-1">
          {/* 2. Piagam / Sertifikat / Piala Showcase */}
          {hasPhoto ? (
            <div className="relative flex flex-col items-center justify-center bg-muted/20 dark:bg-black/30 rounded-2xl p-2.5 sm:p-3 border border-border/70 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={achievement.fotoanak}
                alt={achievement.prestasi}
                className="w-auto h-auto max-w-full max-h-[48vh] object-contain rounded-xl shadow-md border border-border/40"
              />
              <div className="mt-2.5 flex items-center justify-between w-full px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <Award className="h-3.5 w-3.5 text-amber-500" /> Piagam / Sertifikat Resmi
                </span>
                <a
                  href={achievement.fotoanak}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline flex items-center gap-1 text-primary font-semibold"
                >
                  <ExternalLink className="h-3 w-3" /> Buka Ukuran Asli
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border/70 text-center space-y-1.5">
              <Award className="h-8 w-8 text-amber-500/60 mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">
                Belum ada berkas foto piagam yang dilampirkan.
              </p>
            </div>
          )}

          {/* 3. Kartu Metadata: Siswa & Waktu Perolehan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Kartu 1: Siswa Berprestasi */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border/60 space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                Siswa Berprestasi
              </span>
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar
                  src={achievement.studentImage}
                  gender={achievement.studentGender}
                  name={achievement.nama}
                  className="h-9 w-9 rounded-xl shrink-0 border border-border/60"
                  previewable={false}
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {achievement.nama}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {achievement.studentNis ? `NIS: ${achievement.studentNis} • ` : ""}
                    {achievement.kelas}
                  </p>
                </div>
              </div>
            </div>

            {/* Kartu 2: Waktu Perolehan */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border/60 space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                Waktu Perolehan
              </span>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 truncate">
                  <Building className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Saat di {achievement.kelas_saat_prestasi || achievement.kelas}</span>
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Tahun Ajaran {achievement.tahun_ajaran || "2025/2026"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 4. Footer: Tanggal Pencatatan */}
          {achievement.created_at && (
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Waktu Pencatatan:</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDateIndo(achievement.created_at)}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
