"use client";

import React, { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  Clock,
  User,
  Sparkles,
  BookOpen,
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

  const getMapelIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("matematika")) return "📐";
    if (lower.includes("agama") || lower.includes("pai") || lower.includes("qur'an")) return "🕌";
    if (lower.includes("ipa") || lower.includes("sains")) return "🔬";
    if (lower.includes("ips")) return "🌍";
    if (lower.includes("arab")) return "📖";
    if (lower.includes("inggris")) return "💬";
    if (lower.includes("indonesia")) return "📝";
    return "📚";
  };

  const isPdf = filePetunjuk?.toLowerCase().endsWith(".pdf");

  return (
    <div className="bg-card border-2 border-border/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
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
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1 rounded-xl bg-primary/10 text-primary flex items-center gap-1.5">
            <span>{getMapelIcon(mapelNama)}</span>
            <span>{mapelNama}</span>
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-muted text-muted-foreground">
            {kelasNama}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-xl font-medium">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Tenggat: <strong className="text-foreground">{deadlineFormatted}</strong></span>
        </div>
      </div>

      {/* Title & Teacher Info */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          {judul}
        </h1>
        <p className="text-xs text-muted-foreground">
          Ustadz / Ustadzah: <span className="font-bold text-foreground">{guruNama}</span> • Poin Maksimal:{" "}
          <span className="font-bold text-primary">{poinMaksimal} Poin</span>
        </p>
      </div>

      {/* Instruksi Soal / Petunjuk */}
      <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>Petunjuk & Soal dari Guru:</span>
        </div>
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-foreground/90"
          dangerouslySetInnerHTML={{ __html: deskripsi }}
        />
      </div>

      {/* Lampiran Soal Guru (Zero-Download In-Browser Viewer + Download Button) */}
      {filePetunjuk && (
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Lembar Soal & Dokumen Panduan Guru
              </p>
              <p className="text-[11px] text-muted-foreground">
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
              className="h-9 px-3.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs transition-all active:scale-95"
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
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
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
