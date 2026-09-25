"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getUserProfileImage } from "@/lib/utils";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  gender?: string | null;
  name?: string;
  subtitle?: string;
  badge?: string | null;
  email?: string | null;
  alt?: string;
  fallbackSrc?: string;
  previewable?: boolean;
}

export function UserAvatar({
  src,
  gender,
  name,
  subtitle,
  badge,
  email,
  alt,
  fallbackSrc,
  className,
  previewable = true,
  onClick,
  ...props
}: UserAvatarProps) {
  const defaultSrc = fallbackSrc || getUserProfileImage(src, gender, name);
  const [imgSrc, setImgSrc] = useState<string>(src || defaultSrc);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImgSrc(src || defaultSrc);
  }, [src, defaultSrc]);

  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen]);

  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPreviewOpen]);

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (previewable) {
      e.stopPropagation();
      e.preventDefault();
      setIsPreviewOpen(true);
    }
  };

  const finalSrc = imgSrc || defaultSrc;
  const displayName = name || alt || "Foto Profil";

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={displayName}
        className={cn(
          className,
          previewable && "cursor-pointer transition-transform hover:scale-105 active:scale-95"
        )}
        title={previewable ? `Klik untuk melihat foto ${displayName}` : undefined}
        onClick={handleClick}
        onError={() => {
          if (imgSrc !== defaultSrc) {
            setImgSrc(defaultSrc);
          }
        }}
        {...props}
      />

      {mounted &&
        isPreviewOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200 select-none"
            onClick={() => setIsPreviewOpen(false)}
          >
            <div
              className="relative flex flex-col items-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-12 right-0 rounded-full bg-white/20 hover:bg-white/30 text-white p-2 backdrop-blur-md transition-all cursor-pointer shadow-lg outline-none"
                title="Tutup (Esc)"
                aria-label="Tutup foto profil"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Enlarged Photo Container */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border-2 border-white/20 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalSrc}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
