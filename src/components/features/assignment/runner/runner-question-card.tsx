"use client";

import React, { useState } from "react";
import {
  Bookmark,
  Check,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export interface RunnerOption {
  id: string;
  label: string;
  teks_opsi?: string | null;
  gambar_opsi?: string | null;
}

export interface RunnerQuestion {
  id: string;
  nomor_urut: number;
  tipe_soal: string;
  pertanyaan: string;
  gambar_soal?: string | null;
  bobot_poin: number;
  opsi: RunnerOption[];
}

interface RunnerImageProps {
  src: string;
  alt: string;
  onZoom: (src: string) => void;
  /** Kelas untuk elemen <img> (mengatur tinggi/rasio). */
  imgClassName?: string;
  /** Kelas untuk elemen pembungkus. */
  wrapperClassName?: string;
}

/**
 * RunnerImage
 * Pembungkus gambar lampiran yang konsisten: object-contain, latar halus,
 * rounded, state loading, dan klik untuk memperbesar.
 */
function RunnerImage({ src, alt, onZoom, imgClassName, wrapperClassName }: RunnerImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={
        "relative overflow-hidden rounded-lg border border-border bg-muted/20 " +
        (wrapperClassName ?? "")
      }
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted/40" aria-hidden="true" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onClick={() => onZoom(src)}
        className={
          "cursor-zoom-in transition-opacity duration-300 " +
          (loaded ? "opacity-100" : "opacity-0") +
          " " +
          (imgClassName ?? "")
        }
      />
    </div>
  );
}

interface RunnerQuestionCardProps {
  question: RunnerQuestion;
  currentIndex: number;
  totalQuestions: number;
  currentAnswer: string;
  isRagu: boolean;
  onSelectAnswer: (soalId: string, answerValue: string) => void;
  onToggleRagu: (soalId: string) => void;
  onZoomImage: (url: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmitClick: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function RunnerQuestionCard({
  question,
  currentIndex,
  totalQuestions,
  currentAnswer,
  isRagu,
  onSelectAnswer,
  onToggleRagu,
  onZoomImage,
  onPrev,
  onNext,
  onSubmitClick,
  hasPrev,
  hasNext,
}: RunnerQuestionCardProps) {
  const isChoice =
    question.tipe_soal === "PILIHAN_GANDA" || question.tipe_soal === "PILIHAN_GAMBAR";
  // Mode tile gambar dipakai bila ada salah satu opsi yang menyertakan gambar.
  const hasImageOptions = isChoice && question.opsi.some((op) => !!op.gambar_opsi);

  const isOptionSelected = (op: RunnerOption) =>
    (op.id && currentAnswer === op.id) ||
    (!!op.label && currentAnswer.toUpperCase() === op.label.toUpperCase());

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Question Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Soal {currentIndex + 1}</Badge>
            <span className="text-xs text-muted-foreground">
              {question.bobot_poin} poin
            </span>
          </div>

          <Button
            type="button"
            variant={isRagu ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleRagu(question.id)}
            className="text-xs h-8 gap-1.5"
          >
            <Bookmark className={`h-3.5 w-3.5 ${isRagu ? "fill-current" : ""}`} />
            {isRagu ? "Ditandai Ragu" : "Ragu-Ragu"}
          </Button>
        </div>

        {/* Image Stimulus — blok penuh, ter-center, zoom via overlay pojok kanan-atas */}
        {question.gambar_soal && (
          <div className="relative w-full">
            <RunnerImage
              src={question.gambar_soal}
              alt="Stimulus Soal"
              onZoom={onZoomImage}
              wrapperClassName="w-full"
              imgClassName="w-full max-h-[45vh] md:max-h-[60vh] object-contain"
            />
            <button
              type="button"
              onClick={() => onZoomImage(question.gambar_soal!)}
              className="absolute top-2 right-2 bg-foreground/80 text-background p-1.5 sm:px-2 rounded-md text-xs flex items-center gap-1 hover:bg-foreground transition-colors"
              title="Perbesar gambar"
            >
              <ZoomIn className="h-4 w-4" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>
          </div>
        )}

        {/* Question Text */}
        <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed whitespace-pre-line">
          {question.pertanyaan}
        </p>

        {/* ── Option: Grid tile untuk opsi bergambar ── */}
        {hasImageOptions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {question.opsi.map((op) => {
              const selected = isOptionSelected(op);
              return (
                <button
                  key={op.id || op.label}
                  type="button"
                  onClick={() => onSelectAnswer(question.id, op.id || op.label)}
                  className={`relative text-left rounded-xl border overflow-hidden transition-all cursor-pointer bg-background ${
                    selected
                      ? "border-primary ring-2 ring-primary/40 shadow-xs"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="aspect-[4/3] w-full bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={op.gambar_opsi!}
                      alt={`Pilihan ${op.label}`}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* Label A/B/C */}
                  <span className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-background/90 text-foreground border border-border shadow-xs">
                    {op.label}
                  </span>

                  {/* Indikator terpilih */}
                  {selected && (
                    <span className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}

                  {/* Teks opsi (bila ada) di bawah gambar */}
                  {op.teks_opsi && (
                    <div className="p-2.5 border-t border-border/60">
                      <span
                        className={`text-sm leading-snug block ${
                          selected ? "font-semibold text-foreground" : "text-foreground"
                        }`}
                      >
                        {op.teks_opsi}
                      </span>
                    </div>
                  )}

                  {/* Tombol perbesar gambar opsi */}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomImage(op.gambar_opsi!);
                    }}
                    className="absolute bottom-2 right-2 bg-foreground/70 text-background p-1.5 rounded-md opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Perbesar gambar opsi"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Option: List teks untuk pilihan ganda murni (tanpa gambar) ── */}
        {isChoice && !hasImageOptions && (
          <div className="space-y-2.5">
            {question.opsi.map((op) => {
              const selected = isOptionSelected(op);
              return (
                <button
                  key={op.id || op.label}
                  type="button"
                  onClick={() => onSelectAnswer(question.id, op.id || op.label)}
                  className={`w-full text-left p-3 sm:p-3.5 min-h-11 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                    selected
                      ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                      : "bg-background border-border hover:bg-muted/50 hover:border-primary/30"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selected ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      op.label
                    )}
                  </span>
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    {op.teks_opsi && (
                      <span
                        className={`text-sm block leading-snug ${
                          selected ? "text-foreground font-semibold" : "text-foreground"
                        }`}
                      >
                        {op.teks_opsi}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Option: Isian Singkat ── */}
        {question.tipe_soal === "ISIAN_SINGKAT" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">
              Jawaban singkat:
            </label>
            <Input
              value={currentAnswer}
              onChange={(e) => onSelectAnswer(question.id, e.target.value)}
              placeholder="Ketik jawaban kamu di sini..."
              className="text-sm h-11"
            />
            <p className="text-[11px] text-muted-foreground">Tersimpan otomatis saat kamu mengetik.</p>
          </div>
        )}

        {/* ── Option: Esai ── */}
        {question.tipe_soal === "ESAI" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">
              Jawaban uraian:
            </label>
            <Textarea
              value={currentAnswer}
              onChange={(e) => onSelectAnswer(question.id, e.target.value)}
              rows={5}
              placeholder="Tuliskan jawaban lengkap kamu di sini..."
              className="text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Tersimpan otomatis saat kamu mengetik.</span>
              <span>{currentAnswer.length} karakter</span>
            </div>
          </div>
        )}

        {/* Bottom Navigation — hanya tablet/desktop; mobile memakai sticky bar global */}
        <div className="hidden md:block">
          <Separator />
          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={onPrev}
              className="text-xs h-10 px-4 gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>

            {hasNext ? (
              <Button
                type="button"
                size="sm"
                onClick={onNext}
                className="text-xs font-semibold h-10 px-5 gap-1.5"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={onSubmitClick}
                className="text-xs font-semibold h-10 px-5 gap-1.5"
              >
                Selesai & Kumpulkan
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
