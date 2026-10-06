"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface AchievementItem {
  id: string;
  id_user: string;
  nama: string;
  kelas: string;
  fotoanak: string;
  prestasi: string;
  created_at?: Date | string | null;
  studentImage?: string | null;
  studentGender?: string | null;
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

  if (!hasPhoto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-auto p-1.5 sm:p-2 bg-background/95 dark:bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl overflow-hidden focus:outline-none">
        <DialogTitle className="sr-only">
          Foto Piagam: {achievement.prestasi}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Foto piagam penghargaan siswa {achievement.nama}
        </DialogDescription>

        <div className="relative flex items-center justify-center p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={achievement.fotoanak}
            alt={achievement.prestasi}
            className="w-auto h-auto max-w-full max-h-[82vh] object-contain rounded-xl shadow-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
