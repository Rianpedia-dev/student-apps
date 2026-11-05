"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Eye, Pencil, Trash2, ZoomIn, Building, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDateIndo } from "@/lib/utils";
import { getTingkatBadgeProps, getPeringkatBadgeProps } from "@/lib/achievement-points";
import type { AchievementItem } from "./achievement-detail-modal";

interface AchievementCardProps {
  achievement: AchievementItem;
  canManage?: boolean;
  isHistoricalArchive?: boolean;
  onViewDetail: (ach: AchievementItem) => void;
  onEdit: (ach: AchievementItem) => void;
  onDelete: (ach: AchievementItem) => void;
}

export function AchievementCard({
  achievement,
  canManage = true,
  isHistoricalArchive = false,
  onViewDetail,
  onEdit,
  onDelete,
}: AchievementCardProps) {
  const tingkatProps = getTingkatBadgeProps(achievement.tingkat || "Dalam Sekolah");
  const peringkatProps = getPeringkatBadgeProps(achievement.peringkat || "Juara 1");

  const hasPhoto =
    achievement.fotoanak &&
    !achievement.fotoanak.includes("trophy") &&
    !achievement.fotoanak.includes("best-student") &&
    !achievement.fotoanak.includes("best-point");

  const poin = achievement.poin || 1;

  return (
    <Card className="group relative overflow-hidden rounded-3xl border border-border/70 card-elevation hover:shadow-2xl transition-all duration-200 flex flex-col justify-between">
      {/* Decorative top accent line with tier gradient */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${
          achievement.peringkat === "Juara 1"
            ? "from-amber-400 via-yellow-400 to-amber-500"
            : achievement.peringkat === "Juara 2"
            ? "from-slate-300 via-zinc-400 to-slate-400"
            : achievement.peringkat === "Juara 3"
            ? "from-amber-700 via-orange-600 to-amber-800"
            : "from-teal-600 to-emerald-600"
        }`}
      />

      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3.5">
        {/* Header: Student Info + Points Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              src={achievement.studentImage}
              gender={achievement.studentGender}
              name={achievement.nama}
              className="h-11 w-11 rounded-xl object-cover border border-border shadow-xs shrink-0"
              previewable={true}
            />
            <div className="min-w-0">
              <h4
                className="font-bold text-sm text-foreground leading-tight truncate"
                title={achievement.nama}
              >
                {achievement.nama}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                {achievement.kelas || "Semua Kelas"}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30">
              +{poin} Poin
            </span>
          </div>
        </div>

        {/* Main Body: Achievement Description & Tier Badges */}
        <div
          onClick={() => {
            if (hasPhoto) onViewDetail(achievement);
          }}
          className={`rounded-2xl border p-3.5 transition-all bg-card/60 dark:bg-card/40 ${
            hasPhoto ? "cursor-pointer hover:border-amber-500/40" : ""
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tingkatProps.colorClass}`}
            >
              {tingkatProps.icon} {achievement.tingkat || "Dalam Sekolah"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${peringkatProps.colorClass}`}
            >
              {peringkatProps.icon} {achievement.peringkat || "Juara 1"}
            </span>
          </div>

          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
            {achievement.prestasi}
          </p>

          {/* Histori Kelas Waktu Diperoleh */}
          {achievement.kelas_saat_prestasi && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-medium">
              <Building className="h-3 w-3 text-muted-foreground/70" />
              <span>Saat di {achievement.kelas_saat_prestasi}</span>
              {achievement.tahun_ajaran && <span>• TA {achievement.tahun_ajaran}</span>}
            </p>
          )}
        </div>

        {/* Certificate / Photo Thumbnail if available */}
        {hasPhoto && (
          <div
            onClick={() => onViewDetail(achievement)}
            className="relative h-28 w-full rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/20 cursor-pointer group/photo"
          >
            <Image
              src={achievement.fotoanak}
              alt={achievement.prestasi}
              fill
              className="object-cover transition-transform duration-300 group-hover/photo:scale-105"
              sizes="(max-width: 768px) 100vw, 300px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
              <ZoomIn className="h-4 w-4" /> Lihat Piagam
            </div>
          </div>
        )}

        {/* Footer: Date & Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px] font-medium">{formatDateIndo(achievement.created_at)}</span>
          </div>

          {/* Action Icons & Security Status */}
          <div className="flex items-center gap-1.5">
            {/* Badge Arsip Historis jika diraih di kelas sebelumnya */}
            {isHistoricalArchive && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 flex items-center gap-1"
                title="Prestasi ini diraih siswa di kelas sebelumnya sehingga bersifat arsip permanen (read-only)."
              >
                <Lock className="h-3 w-3 text-slate-500" />
                <span>Arsip Historis</span>
              </span>
            )}

            {hasPhoto && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onViewDetail(achievement)}
                className="h-7 w-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-colors"
                title="Lihat Foto Piagam"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}

            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onEdit(achievement)}
                  className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-lg cursor-pointer transition-colors"
                  title="Edit Prestasi"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(achievement)}
                  className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                  title="Hapus Prestasi"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
