"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";
import {
  getYouTubeThumbnailUrls,
  getYouTubeVideoId,
  resolveLearningVideo,
} from "@/lib/video-embed";
import { cn } from "@/lib/utils";

interface LearningVideoPlayerProps {
  url?: string | null;
  title: string;
  constrainedWidth?: boolean;
  className?: string;
}

interface YouTubeFacadePlayerProps {
  embedUrl: string;
  videoId: string;
  title: string;
}

/**
 * Menampilkan poster thumbnail YouTube yang bersih tanpa overlay bawaan
 * dan baru memuat iframe pemutar ketika pengguna menekan tombol Putar.
 */
function YouTubeFacadePlayer({
  embedUrl,
  videoId,
  title,
}: YouTubeFacadePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbIndex, setThumbIndex] = useState(0);

  if (isPlaying) {
    const separator = embedUrl.includes("?") ? "&" : "?";
    return (
      <iframe
        src={`${embedUrl}${separator}autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="w-full h-full border-0"
      />
    );
  }

  const thumbnails = getYouTubeThumbnailUrls(videoId);
  const currentThumb = thumbnails[thumbIndex] ?? null;

  const handleFallbackThumbnail = () => {
    setThumbIndex((prev) => prev + 1);
  };

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label={`Putar video: ${title}`}
      title={`Putar video: ${title}`}
      className="relative block w-full h-full group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {currentThumb ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={currentThumb}
          alt={title}
          loading="lazy"
          onError={handleFallbackThumbnail}
          onLoad={(e) => {
            // YouTube mengembalikan placeholder 120x90 saat maxresdefault tidak tersedia
            if (
              thumbIndex === 0 &&
              e.currentTarget.naturalWidth > 0 &&
              e.currentTarget.naturalWidth <= 120
            ) {
              handleFallbackThumbnail();
            }
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] select-none"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
      )}

      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-600/95 group-hover:bg-red-600 text-white shadow-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 ring-4 ring-white/25">
          <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-0.5" />
        </span>
      </span>
    </button>
  );
}

/**
 * Merender pemutar video pembelajaran (YouTube/Google Drive/Vimeo embed, video HTML5, atau tautan fallback)
 * dengan rasio aspek 16:9 yang konsisten tanpa distorsi tinggi.
 */
export function LearningVideoPlayer({
  url,
  title,
  constrainedWidth = false,
  className,
}: LearningVideoPlayerProps) {
  const resolved = resolveLearningVideo(url);
  if (!resolved) return null;

  const sizeClass = cn(
    "aspect-video w-full rounded-xl overflow-hidden",
    constrainedWidth && "max-w-2xl",
    className
  );

  if (resolved.kind === "iframe") {
    const youtubeVideoId =
      resolved.provider === "youtube"
        ? getYouTubeVideoId(resolved.originalUrl)
        : null;

    return (
      <div className={cn(sizeClass, "border border-border shadow-2xs bg-black")}>
        {youtubeVideoId ? (
          <YouTubeFacadePlayer
            key={resolved.embedUrl}
            embedUrl={resolved.embedUrl}
            videoId={youtubeVideoId}
            title={title}
          />
        ) : (
          <iframe
            src={resolved.embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
            className="w-full h-full border-0"
          />
        )}
      </div>
    );
  }

  if (resolved.kind === "video") {
    return (
      <div className={cn(sizeClass, "border border-border shadow-2xs bg-black")}>
        <video
          src={resolved.videoSrc}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <a
      href={resolved.originalUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        sizeClass,
        "border border-border/80 bg-card hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 text-center p-4 group/vlink"
      )}
    >
      <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center group-hover/vlink:scale-110 transition-transform">
        <Play className="h-5 w-5 fill-current ml-0.5" />
      </div>
      <p className="text-xs font-bold text-foreground">Buka Tautan Video</p>
      <p className="text-[10px] text-muted-foreground truncate max-w-full px-2">
        {resolved.originalUrl}
      </p>
    </a>
  );
}

