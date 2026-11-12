"use client";

import React from "react";
import { BookOpen, Video } from "lucide-react";
import { PerspectiveBook } from "@/components/ui/perspective-book";
import { cn } from "@/lib/utils";

interface LearningMaterialCardProps {
  title?: string | null;
  isVideo?: boolean;
  pairedWithVideo?: boolean;
  className?: string;
  onPreview: () => void;
}

/**
 * Menampilkan bahan bacaan/modul dalam tampilan buku 3D interaktif yang dapat diklik untuk membuka dialog pratinjau.
 */
export function LearningMaterialCard({
  title,
  isVideo = false,
  pairedWithVideo = false,
  className,
  onPreview,
}: LearningMaterialCardProps) {
  const coverTitle = title?.trim() || (isVideo ? "Video Belajar" : "Modul Belajar");
  const bookWidthClass = pairedWithVideo
    ? "w-[176px] sm:w-[196px] md:w-[176px] lg:w-[204px] xl:w-[224px]"
    : "w-[176px] sm:w-[196px]";

  return (
    <div className={cn("flex items-center justify-center py-0.5", className)}>
      <button
        type="button"
        onClick={onPreview}
        aria-label={isVideo ? "Putar Video" : "Baca Materi"}
        title={isVideo ? "Klik untuk memutar video" : "Klik untuk membuka modul"}
        className="shrink-0 text-left rounded-md transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 cursor-pointer"
      >
        <PerspectiveBook
          bookClassName={bookWidthClass}
          textured
          className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white"
        >
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                {isVideo ? "Video" : "Modul"}
              </span>
              {isVideo ? (
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-100 shrink-0" />
              ) : (
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-100 shrink-0" />
              )}
            </div>

            <p className="text-[13px] sm:text-sm xl:text-[15px] font-bold leading-snug tracking-tight text-white line-clamp-4">
              {coverTitle}
            </p>

            <div className="h-0.5 w-8 rounded-full bg-white/45" />
          </div>
        </PerspectiveBook>
      </button>
    </div>
  );
}

