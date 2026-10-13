"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Maximize2,
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileCode,
  File as GenericFileIcon,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnnouncementAttachmentProps {
  fileUrl: string;
  title?: string;
  className?: string;
  defaultExpanded?: boolean;
  compact?: boolean;
}

export function getFileTypeInfo(url: string) {
  if (!url) {
    return { type: "other", ext: "", isImage: false, isPdf: false, isDoc: false };
  }

  const cleanUrl = url.split("?")[0].split("#")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase() || "";

  const imageExtensions = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg", "bmp"];
  const docExtensions = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];

  const isImage = imageExtensions.includes(ext);
  const isPdf = ext === "pdf" || cleanUrl.toLowerCase().includes(".pdf");
  const isDoc = docExtensions.includes(ext);

  let type: "image" | "pdf" | "doc" | "other" = "other";
  if (isImage) type = "image";
  else if (isPdf) type = "pdf";
  else if (isDoc) type = "doc";

  return {
    type,
    ext: ext.toUpperCase(),
    isImage,
    isPdf,
    isDoc,
  };
}

export function AnnouncementAttachment({
  fileUrl,
  title = "Lampiran Pengumuman",
  className = "",
  defaultExpanded = true,
  compact = false,
}: AnnouncementAttachmentProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!fileUrl) return null;

  const { isImage, isPdf, isDoc, ext } = getFileTypeInfo(fileUrl);

  const cleanTitle = (title || "Lampiran-Pengumuman")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  const downloadFilename = ext ? `${cleanTitle}.${ext.toLowerCase()}` : cleanTitle;

  const downloadUrl =
    fileUrl.startsWith("/uploads/") || fileUrl.startsWith("uploads/")
      ? `/api/download?file=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(downloadFilename)}`
      : fileUrl;

  const handleZoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const openModal = () => {
    setZoom(1);
    setRotation(0);
    setIsModalOpen(true);
  };

  /* ------------------------------------------------------------- */
  /* 1. GAMBAR / FOTO                                              */
  /* ------------------------------------------------------------- */
  if (isImage && !imageError) {
    return (
      <div className={`mt-2.5 overflow-hidden rounded-xl border border-border/70 bg-black/5 dark:bg-black/30 transition-all ${className}`}>
        {/* Responsive Image Container */}
        <div
          onClick={openModal}
          className={`relative w-full overflow-hidden flex items-center justify-center cursor-pointer group ${
            compact ? "h-[190px] sm:h-[200px] bg-muted/10" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={title}
            onError={() => setImageError(true)}
            className={
              compact
                ? "w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.02]"
                : "w-auto h-auto max-w-full max-h-[260px] sm:max-h-[360px] md:max-h-[420px] lg:max-h-[480px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
            }
            loading="lazy"
          />

          {/* Quick Floating Action on top-right */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                openModal();
              }}
              className="h-7 w-7 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs shadow-md"
              title="Perbesar Gambar"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <a
              href={downloadUrl}
              download={downloadFilename}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs shadow-md transition-colors"
              title="Unduh Gambar"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white pointer-events-none z-10">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs flex items-center gap-1.5 shadow-md">
              <ZoomIn className="h-3.5 w-3.5" />
              <span>Klik untuk layar penuh</span>
            </span>
          </div>
        </div>

        {/* Modal Lightbox Gambar */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[95vh] h-[92vh] p-3 sm:p-5 flex flex-col bg-card/95 backdrop-blur-md">
            <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/70 pr-8 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  {title}
                </DialogTitle>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleZoomOut}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  title="Perkecil"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-mono font-medium text-muted-foreground w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleZoomIn}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  title="Perbesar"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleRotate}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  title="Putar 90°"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleReset}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground"
                  title="Reset"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="inline-flex items-center justify-center h-7 sm:h-8 px-2.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 gap-1 ml-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Unduh</span>
                </a>
              </div>
            </DialogHeader>

            {/* Viewer area */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-auto p-2 sm:p-4 bg-black/5 dark:bg-black/40 rounded-xl relative select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={title}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-full max-h-[72vh] object-contain rounded-md shadow-md"
                draggable={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* 2. DOKUMEN PDF                                                */
  /* ------------------------------------------------------------- */
  if (isPdf) {
    if (compact) {
      return (
        <div className={`mt-2.5 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs transition-all ${className}`}>
          <div
            onClick={openModal}
            className="relative w-full h-[190px] sm:h-[200px] overflow-hidden rounded-xl bg-slate-900/5 dark:bg-slate-900/40 cursor-pointer group flex flex-col justify-between"
          >
            {/* Background PDF preview frame with fallback */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-rose-500/20 dark:text-rose-400/20">
                <FileText className="h-16 w-16" />
                <span className="text-xs font-mono font-bold mt-1 tracking-wider">PDF DOCUMENT</span>
              </div>
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={title}
                className="absolute inset-0 w-full h-[320px] -mt-1 border-0 opacity-90 group-hover:opacity-100 transition-opacity"
                tabIndex={-1}
              />
            </div>

            {/* Top Toolbar overlay */}
            <div className="relative z-10 p-2.5 flex items-center justify-between gap-1 pointer-events-none">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[11px] font-bold shadow-xs backdrop-blur-xs font-mono">
                <FileText className="h-3 w-3" />
                <span>PDF</span>
              </span>

              <div className="flex items-center gap-1 pointer-events-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }}
                  className="h-7 w-7 rounded-lg bg-black/60 hover:bg-black/85 text-white backdrop-blur-xs shadow-md transition-colors"
                  title="Buka Layar Penuh"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-black/60 hover:bg-black/85 text-white backdrop-blur-xs shadow-md transition-colors"
                  title="Unduh PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-black/60 hover:bg-black/85 text-white backdrop-blur-xs shadow-md transition-colors"
                  title="Buka di Tab Baru"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white pointer-events-none z-10">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <ZoomIn className="h-3.5 w-3.5" />
                <span>Klik untuk membaca PDF</span>
              </span>
            </div>

            {/* Bottom info bar */}
            <div className="relative z-10 pt-6 pb-2.5 px-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-between text-white pointer-events-none">
              <span className="text-xs font-medium truncate max-w-[70%] text-white/95">
                {downloadFilename}
              </span>
              <span className="text-[11px] font-semibold text-rose-300 group-hover:text-rose-200 flex items-center gap-1 shrink-0">
                <span>Buka PDF</span>
                <Maximize2 className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Modal Fullscreen PDF Reader */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-[96vw] sm:max-w-5xl md:max-w-6xl max-h-[95vh] h-[92vh] p-3 sm:p-5 flex flex-col bg-card">
              <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/70 pr-8 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-md bg-rose-500/10 text-rose-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                    {title}
                  </DialogTitle>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tab Baru</span>
                  </a>
                  <a
                    href={downloadUrl}
                    download={downloadFilename}
                    className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh PDF</span>
                  </a>
                </div>
              </DialogHeader>

              {/* Fullscreen PDF frame */}
              <div className="flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-border/60 bg-muted/10">
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  title={title}
                  className="w-full h-full border-0"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className={`mt-3.5 space-y-2 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs p-2.5 sm:p-3 transition-all ${className}`}>
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-foreground truncate">
                  Dokumen PDF
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono">
                  PDF
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openModal}
              className="h-7 px-2 text-xs gap-1 hover:bg-muted font-medium"
              title="Buka Layar Penuh"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </Button>
            <a
              href={downloadUrl}
              download={downloadFilename}
              className="inline-flex items-center justify-center h-7 px-2 text-xs gap-1 rounded-md border border-input bg-background hover:bg-muted font-medium transition-colors"
              title="Unduh PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground ml-0.5"
              title={isExpanded ? "Sembunyikan Pratinjau" : "Tampilkan Pratinjau"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Embedded PDF Viewer Container */}
        {/* Mobile: h-[320px] | Tablet: h-[460px] | Desktop: h-[540px] */}
        {isExpanded && (
          <div className="space-y-1.5 animate-in fade-in-50 duration-200">
            <div className="w-full h-[320px] sm:h-[420px] md:h-[480px] lg:h-[540px] rounded-lg overflow-hidden border border-border/60 bg-muted/10 relative">
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={title}
                className="w-full h-full border-0 rounded-lg"
              />
            </div>

            {/* Tips footer bar for touch & mobile devices */}
            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span className="truncate">
                Tip: Tekan tombol <strong className="text-foreground">Layar Penuh</strong> untuk membaca dokumen lebih leluasa.
              </span>
              <button
                type="button"
                onClick={openModal}
                className="text-primary hover:underline font-semibold shrink-0 ml-2"
              >
                Buka Layar Penuh →
              </button>
            </div>
          </div>
        )}

        {/* Modal Fullscreen PDF Reader */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[96vw] sm:max-w-5xl md:max-w-6xl max-h-[95vh] h-[92vh] p-3 sm:p-5 flex flex-col bg-card">
            <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/70 pr-8 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-md bg-rose-500/10 text-rose-600">
                  <FileText className="h-4 w-4" />
                </div>
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  {title}
                </DialogTitle>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh PDF</span>
                </a>
              </div>
            </DialogHeader>

            {/* Fullscreen PDF frame */}
            <div className="flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-border/60 bg-muted/10">
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0`}
                title={title}
                className="w-full h-full border-0"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* 3. DOKUMEN OFFICE / FILE LAINNYA                              */
  /* ------------------------------------------------------------- */
  if (compact) {
    return (
      <div className={`mt-2.5 flex flex-col justify-between h-[190px] sm:h-[200px] rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/15 p-4 text-xs text-foreground transition-all ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            {isDoc ? <FileSpreadsheet className="h-6 w-6" /> : <GenericFileIcon className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground text-sm truncate">
                {title || "Lampiran Dokumen"}
              </span>
              {ext && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  {ext}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-1">
              {fileUrl.split("/").pop()}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <a
            href={downloadUrl}
            download={downloadFilename}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh File</span>
          </a>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Buka File"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/15 p-3 text-xs text-foreground transition-all ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {isDoc ? <FileSpreadsheet className="h-4 w-4" /> : <GenericFileIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {title || "Lampiran Dokumen"}
            </span>
            {ext && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                {ext}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {fileUrl.split("/").pop()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={downloadUrl}
          download={downloadFilename}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Unduh File</span>
        </a>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Buka File"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
