"use client";

import React, { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InBrowserDocViewer } from "./in-browser-doc-viewer";

interface StudentTaskQuestionCardProps {
  mapelNama: string;
  kelasNama: string;
  guruNama: string;
  judul: string;
  deskripsi: string;
  deadlineFormatted: string;
  poinMaksimal: number;
  filePetunjuk?: string | null;
}

export function StudentTaskQuestionCard({
  mapelNama,
  kelasNama,
  guruNama,
  judul,
  deskripsi,
  deadlineFormatted,
  poinMaksimal,
  filePetunjuk,
}: StudentTaskQuestionCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* IN-BROWSER QUESTION VIEWER MODAL (ZERO DOWNLOAD) */}
      {filePetunjuk && (
        <InBrowserDocViewer
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          title={`Lembar Soal: ${judul}`}
          files={[{ url: filePetunjuk, name: `Soal - ${judul}` }]}
          downloadPrefix={`Soal-${mapelNama}`}
        />
      )}

      {/* Header Badges & Deadline */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {mapelNama}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border/50">
            {kelasNama}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/50">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Tenggat: <strong className="text-foreground font-semibold">{deadlineFormatted}</strong></span>
        </div>
      </div>

      {/* Title & Teacher Info */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          {judul}
        </h1>
        <p className="text-xs text-muted-foreground">
          Ustadz / Ustadzah: <span className="font-semibold text-foreground">{guruNama}</span> • Poin Maksimal:{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{poinMaksimal} Poin</span>
        </p>
      </div>

      {/* Instruksi Soal / Petunjuk */}
      <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Petunjuk & Soal dari Guru:
        </p>
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-foreground/90"
          dangerouslySetInnerHTML={{ __html: deskripsi }}
        />
      </div>

      {/* Lampiran Soal Guru (Zero-Download In-Browser Viewer + Download Button) */}
      {filePetunjuk && (
        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
              <FileText className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                Lembar Soal & Dokumen Panduan Guru
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Bisa langsung dibaca di layar tanpa perlu mengunduh ke perangkat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* IN-BROWSER VIEW BUTTON (NO DOWNLOAD REQUIRED) */}
            <Button
              type="button"
              size="sm"
              onClick={() => setIsViewerOpen(true)}
              className="h-8 px-3 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Buka Soal di Layar</span>
            </Button>

            {/* DOWNLOAD BUTTON (OPTIONAL ARSIP) */}
            <a
              href={`/api/download?file=${encodeURIComponent(
                filePetunjuk
              )}&name=${encodeURIComponent(`Soal - ${judul}`)}`}
              download
              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
              title="Download lembar soal"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
