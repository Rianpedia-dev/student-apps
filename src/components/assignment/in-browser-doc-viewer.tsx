"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync index if initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setRotation(0);
  }, [initialIndex, isOpen]);

  // Handle keyboard events (ESC to close, Left/Right for pagination)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
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
  }, [isOpen, fileList.length, isFullscreen, onClose]);

  if (!isOpen) return null;

  const currentFile = fileList[currentIndex] || { url: "", name: "" };
  const fileExt = currentFile.url.split("?")[0].split(".").pop()?.toLowerCase() || "";
  const isPdf =
    fileExt === "pdf" ||
    currentFile.type === "pdf" ||
    currentFile.url.toLowerCase().includes(".pdf");
  const isDoc = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileExt);

  const handleZoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const downloadUrl = `/api/download?file=${encodeURIComponent(
    currentFile.url
  )}&name=${encodeURIComponent(`${downloadPrefix}-${currentFile.name || `Lembar-${currentIndex + 1}`}`)}`;

  const viewerContent = (
    <div
      ref={containerRef}
      className={`flex flex-col bg-background text-foreground overflow-hidden ${
        inline
          ? "rounded-2xl border border-border shadow-xs w-full h-[520px] sm:h-[600px]"
          : "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      }`}
    >
      <div
        className={`flex flex-col w-full h-full bg-card rounded-2xl border border-border shadow-2xl overflow-hidden ${
          !inline ? "max-w-6xl max-h-[94vh]" : ""
        }`}
      >
        {/* Top Header & Toolbar */}
        <div className="h-14 px-3 sm:px-5 border-b border-border bg-card flex items-center justify-between gap-2 shrink-0">
          {/* File info */}
          <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              {isPdf ? (
                <FileText className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </div>
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {title || currentFile.name}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {fileList.length > 1
                  ? `Lembar ke-${currentIndex + 1} dari ${fileList.length} • ${currentFile.name}`
                  : currentFile.name}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Multi-page Navigation */}
            {fileList.length > 1 && (
              <div className="flex items-center gap-1 bg-muted/60 px-1.5 py-1 rounded-xl border border-border mr-1">
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
                  className="h-6 w-6 rounded-md"
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
                  className="h-6 w-6 rounded-md"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Zoom / Rotate Controls (for images) */}
            {!isPdf && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={handleZoomOut}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="hidden sm:inline text-[11px] font-mono font-medium px-1 text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={handleZoomIn}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={handleRotate}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                  title="Putar 90°"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleReset}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Reset Tampilan"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {/* Buka Tab Baru */}
            <a
              href={currentFile.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Tombol Download Fleksibel */}
            {allowDownload && (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 h-7 sm:h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all active:scale-95"
                title="Download file ke perangkat"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Download</span>
              </a>
            )}

            {/* Close Button if Modal */}
            {!inline && onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onClose}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive ml-1"
                title="Tutup (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Multi-page thumbnails selector bar (if multiple files) */}
        {fileList.length > 1 && (
          <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2 overflow-x-auto shrink-0">
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  currentIndex === idx
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
        <div className="flex-1 bg-muted/20 relative overflow-auto flex items-center justify-center p-3 sm:p-6 select-none">
          {isPdf ? (
            <div className="w-full h-full min-h-[400px] bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <iframe
                src={`${currentFile.url}#toolbar=1&navpanes=0`}
                title={currentFile.name}
                className="w-full h-full min-h-[460px] border-0"
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
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Berkas</span>
                </a>
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
      </div>
    </div>
  );

  return viewerContent;
}
