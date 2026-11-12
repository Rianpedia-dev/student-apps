"use client";

import React from "react";
import {
  FileText,
  MessageSquare,
  Video,
} from "lucide-react";
import { isVideoFile, resolveLearningVideo } from "@/lib/video-embed";
import { LearningMaterialCard } from "./learning-material-card";
import { LearningVideoPlayer } from "./learning-video-player";

interface MeetingMaterialsSectionProps {
  judul: string;
  deskripsi?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  videoUrl?: string | null;
  showStepNumbers?: boolean;
  onPreviewFile: (file: { url: string; name: string; type?: string }) => void;
}

/**
 * Menampilkan ringkasan catatan guru, bahan modul, dan pemutar video pembelajaran
 * dalam susunan 2 kolom yang ringkas sejak ukuran tablet.
 */
export function MeetingMaterialsSection({
  judul,
  deskripsi,
  fileUrl,
  fileName,
  fileType,
  videoUrl,
  showStepNumbers = false,
  onPreviewFile,
}: MeetingMaterialsSectionProps) {
  const hasFile = !!fileUrl;
  const uploadedVideoUrl =
    hasFile && isVideoFile(fileUrl, fileType) ? fileUrl! : null;
  const effectiveVideoUrl = videoUrl || uploadedVideoUrl;
  const hasVideo = !!resolveLearningVideo(effectiveVideoUrl);

  return (
    <>
      {deskripsi && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-muted/40 border-l-2 border-emerald-500">
          <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
            {deskripsi}
          </p>
        </div>
      )}

      {(hasFile || hasVideo) && (
        <div
          className={`grid gap-4 items-stretch ${
            hasFile && hasVideo ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {hasFile && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                {showStepNumbers ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    1
                  </span>
                ) : (
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>Modul</span>
              </div>

              <LearningMaterialCard
                title={judul}
                isVideo={!!uploadedVideoUrl}
                pairedWithVideo={hasVideo}
                className={hasVideo ? "flex-1 justify-center" : "justify-start"}
                onPreview={() =>
                  onPreviewFile({
                    url: fileUrl!,
                    name: fileName || judul,
                    type: fileType || undefined,
                  })
                }
              />
            </div>
          )}

          {hasVideo && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                {showStepNumbers ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {hasFile ? 2 : 1}
                  </span>
                ) : (
                  <Video className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>Video</span>
              </div>

              <LearningVideoPlayer
                url={effectiveVideoUrl}
                title={judul}
                constrainedWidth={!hasFile}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

