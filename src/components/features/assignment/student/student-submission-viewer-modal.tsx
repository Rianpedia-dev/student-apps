"use client";

import React, { useEffect, useRef } from "react";
import {
  Award,
  AlertTriangle,
  FileText,
  Download,
  X,
  Check,
  Star,
  MessageSquareQuote,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DocumentCanvasEditor,
  DocumentCanvasEditorHandle,
} from "../canvas/document-canvas-editor";
import { InBrowserDocViewer } from "../in-browser-doc-viewer";
import {
  hasCanvasAnnotations,
  resolveAnnotationBaseDocumentUrl,
  summarizeCanvasAnnotations,
} from "@/lib/document-task-helpers";

export interface StudentSubmissionViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  judul: string;
  fileSoalUrl: string;
  poinMaksimal: number;
  submission: {
    status: string;
    nilai: number | null;
    catatanGuru: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileType: string | null;
    annotatedFileUrl?: string | null;
    annotatedData?: string | null;
  };
}

export function StudentSubmissionViewerModal({
  isOpen,
  onClose,
  judul,
  fileSoalUrl,
  poinMaksimal,
  submission,
}: StudentSubmissionViewerModalProps) {
  const canvasRef = useRef<DocumentCanvasEditorHandle>(null);

  const isSudahDinilai = submission.status === "sudah_dinilai";
  const isPerluRevisi = submission.status === "perlu_revisi";
  const hasAnnotations = hasCanvasAnnotations(submission.annotatedData);
  const summary = summarizeCanvasAnnotations(submission.annotatedData);

  const baseDocumentUrl = resolveAnnotationBaseDocumentUrl({
    fileSoalUrl,
    submissionFileUrl: submission.fileUrl,
    submissionFileType: submission.fileType,
  });

  const useCanvasViewer = hasAnnotations && Boolean(baseDocumentUrl);
  const fallbackDocUrl =
    submission.annotatedFileUrl || submission.fileUrl || fileSoalUrl || "";

  const modalTitle = isSudahDinilai
    ? `Hasil Koreksi Guru - ${judul}`
    : isPerluRevisi
    ? `Catatan & Coretan Revisi - ${judul}`
    : `Lembar Jawaban Saya - ${judul}`;

  // Handle Escape key (exit native fullscreen first if active, otherwise close modal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadCanvasSnapshot = () => {
    const dataUrl = canvasRef.current?.getFlattenedCanvasDataUrl?.();
    if (dataUrl) {
      const safeName = judul.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "tugas";
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${isSudahDinilai ? "Hasil-Koreksi" : "Lembar-Jawaban"}-${safeName}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (fallbackDocUrl) {
      window.open(
        `/api/download?file=${encodeURIComponent(fallbackDocUrl)}&name=${encodeURIComponent(
          `${isSudahDinilai ? "Hasil-Koreksi" : "Lembar-Jawaban"}-${judul}`
        )}`,
        "_blank"
      );
      return;
    }

    toast.info("Lembar kerja masih dimuat, silakan coba beberapa detik lagi.");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
    >
      <div className="flex flex-col w-full h-full max-w-6xl max-h-[94vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-3 sm:px-5 py-3 border-b border-border bg-card flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isSudahDinilai
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : isPerluRevisi
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isSudahDinilai ? (
                <Award className="h-4 w-4" />
              ) : isPerluRevisi ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {modalTitle}
                </h3>
                <Badge
                  variant={
                    isSudahDinilai
                      ? "emerald"
                      : isPerluRevisi
                      ? "outline"
                      : "secondary"
                  }
                  size="xs"
                  className={
                    isPerluRevisi
                      ? "border-amber-500/40 text-amber-700 dark:text-amber-400"
                      : ""
                  }
                >
                  {isSudahDinilai
                    ? "Sudah Dinilai"
                    : isPerluRevisi
                    ? "Perlu Revisi"
                    : "Menunggu Koreksi"}
                </Badge>
              </div>
              {summary.pages.length > 1 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Terdapat coretan/evaluasi pada halaman: {summary.pages.join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSudahDinilai && submission.nilai !== null && (
              <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-black text-emerald-700 dark:text-emerald-300">
                Nilai: {submission.nilai} / {poinMaksimal}
              </div>
            )}

            {useCanvasViewer && (
              <Button
                type="button"
                size="sm"
                onClick={handleDownloadCanvasSnapshot}
                className="h-8 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl"
                title="Unduh gambar hasil koreksi halaman ini"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
              title="Tutup (Esc)"
              aria-label="Tutup dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Teacher Feedback & Correction Summary Strip */}
        {(isSudahDinilai || isPerluRevisi) && (
          <div
            className={`px-3 sm:px-5 py-2.5 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
              isSudahDinilai
                ? "bg-emerald-500/5"
                : "bg-amber-500/5"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
              <MessageSquareQuote
                className={`h-4 w-4 shrink-0 mt-0.5 sm:mt-0 ${
                  isSudahDinilai ? "text-emerald-600" : "text-amber-600"
                }`}
              />
              {submission.catatanGuru ? (
                <p className="text-xs text-foreground leading-relaxed">
                  <strong className="font-bold">Catatan Guru:</strong>{" "}
                  &ldquo;{submission.catatanGuru}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {useCanvasViewer
                    ? "Periksa coretan dan stempel evaluasi dari Ustadz/Ustadzah pada lembar kerja di bawah."
                    : "Tugas telah dinilai oleh Ustadz/Ustadzah."}
                </p>
              )}
            </div>

            {summary.totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {summary.checkCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                    <Check className="h-3 w-3" />
                    <span>{summary.checkCount}</span>
                  </span>
                )}
                {summary.crossCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                    <X className="h-3 w-3" />
                    <span>{summary.crossCount}</span>
                  </span>
                )}
                {summary.starCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{summary.starCount}</span>
                  </span>
                )}
                {summary.strokeCount + summary.textCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold">
                    <PenLine className="h-3 w-3" />
                    <span>{summary.strokeCount + summary.textCount} Coretan/Teks</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Document Body */}
        <div className="flex-1 min-h-0 overflow-hidden relative bg-muted/20">
          {useCanvasViewer ? (
            <DocumentCanvasEditor
              ref={canvasRef}
              fileUrl={baseDocumentUrl}
              fileName={judul}
              initialAnnotationData={submission.annotatedData}
              readOnly={true}
              className="border-0 rounded-none shadow-none"
            />
          ) : (
            <InBrowserDocViewer
              inline={true}
              allowDownload={true}
              title={modalTitle}
              downloadPrefix={isSudahDinilai ? "Hasil-Koreksi" : "Lembar-Jawaban"}
              files={fallbackDocUrl}
              className="w-full h-full border-0 rounded-none shadow-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}

