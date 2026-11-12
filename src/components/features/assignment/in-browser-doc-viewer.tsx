"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isVideoFile } from "@/lib/video-embed";

export interface DocViewerFile {
  url: string;
  name: string;
  type?: string;
}

interface InBrowserDocViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  files: DocViewerFile[] | DocViewerFile | string;
  initialIndex?: number;
  allowDownload?: boolean;
  downloadPrefix?: string;
  inline?: boolean;
  className?: string;
}

export function InBrowserDocViewer({
  isOpen = true,
  onClose,
  title = "Pratinjau Dokumen",
  files,
  initialIndex = 0,
  allowDownload = true,
  downloadPrefix = "Dokumen",
  inline = false,
  className,
}: InBrowserDocViewerProps) {
  // Normalize files array
  const fileList: DocViewerFile[] = React.useMemo(() => {
    if (typeof files === "string") {
      return [{ url: files, name: title }];
    }
    if (Array.isArray(files)) {
      return files.length > 0 ? files : [{ url: "", name: title }];
    }
    return [files];
  }, [files, title]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Sync index if initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setRotation(0);
  }, [initialIndex, isOpen]);

  // Kunci scroll halaman latar belakang saat modal terbuka
  useEffect(() => {
    if (inline || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [inline, isOpen]);

  // Handle keyboard events (ESC to close, Left/Right for pagination)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % fileList.length);
        setZoom(1);
        setRotation(0);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + fileList.length) % fileList.length);
        setZoom(1);
        setRotation(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, fileList.length, onClose]);

  if (!isOpen) return null;

  const currentFile = fileList[currentIndex] || { url: "", name: "" };
  const fileExt = currentFile.url.split("?")[0].split(".").pop()?.toLowerCase() || "";
  const isPdf =
    fileExt === "pdf" ||
    currentFile.type === "pdf" ||
    currentFile.url.toLowerCase().includes(".pdf");
  const isVideo = isVideoFile(currentFile.url, currentFile.type);
  const isDoc = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileExt);

  const handleZoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const isLocalUpload = currentFile.url.startsWith("/uploads/");
  const downloadUrl = isLocalUpload
    ? `/api/download?file=${encodeURIComponent(
        currentFile.url
      )}&name=${encodeURIComponent(`${downloadPrefix}-${currentFile.name || `Lembar-${currentIndex + 1}`}`)}`
    : currentFile.url;

  const showFloatingDownload = allowDownload && Boolean(currentFile.url);
  const hasFloatingBottomControls = fileList.length > 1 || (!isPdf && !isVideo && !isDoc);

  const viewerContent = (
    <div
      ref={containerRef}
      onClick={!inline ? (e) => e.target === e.currentTarget && onClose?.() : undefined}
      className={cn(
        "flex flex-col text-foreground overflow-hidden",
        inline
          ? "bg-background rounded-2xl border border-border shadow-xs w-full h-[520px] sm:h-[600px]"
          : "fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150",
        className
      )}
    >
      <div
        className={cn(
          "relative flex flex-col w-full bg-card rounded-2xl border border-border/90 shadow-2xl overflow-hidden",
          !inline ? "max-w-5xl h-[88vh] max-h-[88vh]" : "h-full border-0 rounded-none shadow-none"
        )}
      >
        {/* Floating Top-Right Actions (Unduh & Tutup) */}
        {(showFloatingDownload || (!inline && Boolean(onClose))) && (
          <div
            className={cn(
              "absolute top-3 z-20 flex items-center gap-2",
              isPdf ? "right-5" : "right-3"
            )}
          >
            {showFloatingDownload && (
              <a
                href={downloadUrl}
                download={currentFile.name || downloadPrefix}
                target={isLocalUpload ? undefined : "_blank"}
                rel={isLocalUpload ? undefined : "noreferrer"}
                title="Unduh Materi"
                aria-label="Unduh Materi"
                className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white backdrop-blur-md border border-emerald-500/30 shadow-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>Unduh</span>
              </a>
            )}

            {!inline && onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-md border border-border/80 text-foreground shadow-lg hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Multi-page thumbnails selector bar (if multiple files) */}
        {fileList.length > 1 && (
          <div
            className={cn(
              "px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2 overflow-x-auto shrink-0",
              showFloatingDownload ? "pr-40" : "pr-14"
            )}
          >
            <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
              Pilih Lembar:
            </span>
            {fileList.map((item, idx) => (
              <button
                key={item.url + idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${currentIndex === idx
                    ? "bg-primary text-primary-foreground shadow-2xs scale-102"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
              >
                <span>Halaman {idx + 1}</span>
              </button>
            ))}
          </div>
        )}

        {/* Document Body Area */}
        <div
          className={cn(
            "flex-1 min-h-0 relative overflow-auto flex items-center justify-center select-none",
            isPdf || isVideo
              ? "p-0 bg-black/95"
              : cn("p-4 sm:p-6 bg-muted/20", hasFloatingBottomControls && "pb-16")
          )}
        >
          {isPdf ? (
            <div className="w-full h-full bg-background overflow-hidden">
              <iframe
                src={`${currentFile.url}#toolbar=0&navpanes=0&view=FitH`}
                title={currentFile.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : isVideo ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <video
                src={currentFile.url}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            </div>
          ) : isDoc ? (
            <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-xs max-w-md space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Dokumen Microsoft Office ({fileExt.toUpperCase()})
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Format dokumen Word/Excel memerlukan aplikasi pendukung atau dapat diunduh langsung.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <a
                  href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                    window.location.origin + currentFile.url
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka di Office Viewer</span>
                </a>
                {allowDownload && (
                  <a
                    href={downloadUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Berkas</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div
              className="relative transition-transform duration-200 ease-out origin-center flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentFile.url}
                alt={currentFile.name}
                className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-md border border-border bg-card pointer-events-auto select-none"
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Floating Bottom Controls (untuk multi-halaman atau zoom gambar) */}
        {hasFloatingBottomControls && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-lg">
            {fileList.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((p) => Math.max(0, p - 1));
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="h-7 w-7 rounded-full cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-semibold text-foreground px-1">
                  {currentIndex + 1}/{fileList.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={currentIndex === fileList.length - 1}
                  onClick={() => {
                    setCurrentIndex((p) => Math.min(fileList.length - 1, p + 1));
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="h-7 w-7 rounded-full cursor-pointer"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {!isPdf && !isVideo && !isDoc && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleZoomOut}
                  className="h-7 w-7 rounded-full cursor-pointer"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="hidden sm:inline text-[11px] font-mono font-medium px-1 text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleZoomIn}
                  className="h-7 w-7 rounded-full cursor-pointer"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleRotate}
                  className="h-7 w-7 rounded-full cursor-pointer"
                  title="Putar 90°"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleReset}
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Reset Tampilan"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return viewerContent;
  }

  return isClient ? createPortal(viewerContent, document.body) : null;
}
