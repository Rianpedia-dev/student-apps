"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Eye, Pencil, Trash2, ZoomIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDateIndo } from "@/lib/utils";
import { detectAchievementTier } from "./achievement-utils";
import type { AchievementItem } from "./achievement-detail-modal";

interface AchievementCardProps {
  achievement: AchievementItem;
  onViewDetail: (ach: AchievementItem) => void;
  onEdit: (ach: AchievementItem) => void;
  onDelete: (ach: AchievementItem) => void;
}

export function AchievementCard({
  achievement,
  onViewDetail,
  onEdit,
  onDelete,
}: AchievementCardProps) {
  const tier = detectAchievementTier(achievement.prestasi);

  const hasPhoto =
    achievement.fotoanak &&
    !achievement.fotoanak.includes("trophy") &&
    !achievement.fotoanak.includes("best-student") &&
    !achievement.fotoanak.includes("best-point");

  return (
    <Card
      className={`group relative overflow-hidden rounded-2xl border ${tier.borderClass} bg-card hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      {/* Decorative top accent line with tier color */}
      <div
        className={`h-1 w-full ${
          tier.tier === "gold"
            ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"
            : tier.tier === "silver"
            ? "bg-gradient-to-r from-slate-400 via-zinc-300 to-slate-400"
            : tier.tier === "bronze"
            ? "bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800"
            : tier.tier === "special"
            ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
            : "bg-amber-500/50"
        }`}
      />

      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3.5">
        {/* Header: Student Info + Tier Badge */}
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
              <h4 className="font-bold text-sm text-foreground leading-tight truncate" title={achievement.nama}>
                {achievement.nama}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                {achievement.kelas || "Semua Kelas"}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${tier.badgeClass}`}
          >
            {tier.label}
          </span>
        </div>

        {/* Main Body: Achievement Description */}
        <div
          onClick={() => {
            if (hasPhoto) onViewDetail(achievement);
          }}
          className={`rounded-xl border p-3.5 transition-all group-hover:border-opacity-100 ${tier.bgLightClass} ${
            hasPhoto ? "cursor-pointer" : ""
          }`}
        >
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
            {achievement.prestasi}
          </p>
        </div>

        {/* Certificate / Photo Thumbnail if available */}
        {hasPhoto && (
          <div
            onClick={() => onViewDetail(achievement)}
            className="relative h-28 w-full rounded-xl overflow-hidden border border-border bg-black/5 dark:bg-black/20 cursor-pointer group/photo"
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

          {/* Action Icons */}
          <div className="flex items-center gap-1">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
