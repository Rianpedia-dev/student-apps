"use client";

import React from "react";
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

        {/* Image Stimulus */}
        {question.gambar_soal && (
          <div className="relative inline-block border border-border rounded-lg overflow-hidden bg-muted/20 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.gambar_soal}
              alt="Stimulus Soal"
              className="max-h-64 w-auto object-contain rounded cursor-pointer"
              onClick={() => onZoomImage(question.gambar_soal!)}
            />
            <button
              type="button"
              onClick={() => onZoomImage(question.gambar_soal!)}
              className="absolute bottom-2 right-2 bg-foreground/80 text-background p-1.5 rounded-md text-xs flex items-center gap-1 hover:bg-foreground transition-colors"
            >
              <ZoomIn className="h-3 w-3" />
              Perbesar
            </button>
          </div>
        )}

        {/* Question Text */}
        <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed whitespace-pre-line">
          {question.pertanyaan}
        </p>

        {/* ── Option: Pilihan Ganda & Pilihan Gambar ── */}
        {(question.tipe_soal === "PILIHAN_GANDA" ||
          question.tipe_soal === "PILIHAN_GAMBAR") && (
          <div className="space-y-2.5">
            {question.opsi.map((op) => {
              const isSelected =
                currentAnswer.toUpperCase() === op.label.toUpperCase();
              return (
                <button
                  key={op.id || op.label}
                  type="button"
                  onClick={() => onSelectAnswer(question.id, op.label)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                      : "bg-background border-border hover:bg-muted/50 hover:border-primary/30"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      op.label
                    )}
                  </span>
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    {op.teks_opsi && (
                      <span
                        className={`text-sm block leading-snug ${
                          isSelected
                            ? "text-foreground font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        {op.teks_opsi}
                      </span>
                    )}
                    {op.gambar_opsi && (
                      <div className="inline-block border border-border rounded-lg overflow-hidden p-1 bg-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={op.gambar_opsi}
                          alt={`Pilihan ${op.label}`}
                          className="h-24 sm:h-28 object-contain rounded"
                        />
                      </div>
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

        {/* Bottom Navigation */}
        <Separator />
        <div className="flex items-center justify-between gap-3 pt-1">
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
      </CardContent>
    </Card>
  );
}
