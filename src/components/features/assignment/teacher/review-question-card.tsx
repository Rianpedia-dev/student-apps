"use client";

import React from "react";
import { CheckCircle2, XCircle, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ReviewQuestionItem {
  id: string;
  nomor_urut: number;
  tipe_soal: string;
  pertanyaan: string;
  gambar_soal?: string | null;
  bobot_poin: number;
  kunci_jawaban?: string | null;
  pembahasan?: string | null;
  opsi: Array<{
    id: string;
    label: string;
    teks_opsi?: string | null;
    gambar_opsi?: string | null;
    is_benar: boolean;
  }>;
  jawabanSiswa?: {
    jawaban_siswa: string | null;
    is_benar: boolean | null;
    poin_didapat: number | null;
    catatan_koreksi?: string | null;
  } | null;
}

interface ReviewQuestionCardProps {
  question: ReviewQuestionItem;
  index: number;
  essayScore?: { poin: number; catatan: string };
  onEssayScoreChange: (data: { poin: number; catatan: string }) => void;
  onSaveEssayScore: (soalId: string, maxPoints: number) => void;
  isSavingEssay: boolean;
}

export function ReviewQuestionCard({
  question,
  index,
  essayScore,
  onEssayScoreChange,
  onSaveEssayScore,
  isSavingEssay,
}: ReviewQuestionCardProps) {
  const ans = question.jawabanSiswa;
  const chosen = ans?.jawaban_siswa?.toUpperCase() || "";
  const isCorrect = ans?.is_benar === true;
  const isEssay = question.tipe_soal === "ESAI";

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "PILIHAN_GANDA":
        return "Pilihan Ganda";
      case "PILIHAN_GAMBAR":
        return "Pilihan Bergambar";
      case "ISIAN_SINGKAT":
        return "Isian Singkat";
      case "ESAI":
        return "Esai / Uraian";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Card Header: Number, Type, Score */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-bold">
              Nomor {index + 1}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              Bobot: {question.bobot_poin} Poin
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              {getQuestionTypeLabel(question.tipe_soal)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            {isEssay ? (
              <span className="text-muted-foreground">
                {ans?.poin_didapat !== null && ans?.poin_didapat !== undefined
                  ? `Dinilai: ${ans.poin_didapat} / ${question.bobot_poin} Poin`
                  : "Perlu Dinilai Manual"}
              </span>
            ) : isCorrect ? (
              <span className="text-primary font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>+{question.bobot_poin} Poin</span>
              </span>
            ) : (
              <span className="text-destructive font-semibold flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                <span>0 Poin</span>
              </span>
            )}
          </div>
        </div>

        {/* Stimulus Image */}
        {question.gambar_soal && (
          <div className="rounded-lg border border-border overflow-hidden bg-muted/20 p-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.gambar_soal}
              alt="Stimulus Soal"
              className="max-h-56 object-contain rounded-md"
            />
          </div>
        )}

        {/* Question Text */}
        <div className="text-xs sm:text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
          {question.pertanyaan}
        </div>

        {/* ── Multiple Choice / Pilihan Bergambar ── */}
        {(question.tipe_soal === "PILIHAN_GANDA" ||
          question.tipe_soal === "PILIHAN_GAMBAR") && (
          <div className="space-y-2 pt-1">
            {question.opsi.map((op) => {
              const isStudentPick = chosen === op.label.toUpperCase();
              const isKey = op.is_benar;

              let style = "bg-background border-border text-foreground";
              if (isKey) {
                style = "bg-primary/5 border-primary/50 text-foreground font-semibold";
              } else if (isStudentPick && !isKey) {
                style = "bg-destructive/5 border-destructive/50 text-destructive font-semibold";
              }

              return (
                <div
                  key={op.id || op.label}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${style}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isKey
                          ? "bg-primary text-primary-foreground"
                          : isStudentPick
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {op.label}
                    </span>
                    <span>{op.teks_opsi || "Pilihan Gambar"}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isStudentPick && (
                      <Badge variant="secondary" className="text-[10px]">
                        Jawaban Siswa
                      </Badge>
                    )}
                    {isKey && (
                      <Badge variant="outline" className="text-[10px] border-primary text-primary">
                        Kunci Jawaban
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Isian Singkat ── */}
        {question.tipe_soal === "ISIAN_SINGKAT" && (
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs space-y-1.5">
            <div>
              <span className="text-muted-foreground">Jawaban Siswa: </span>
              <strong className={isCorrect ? "text-primary" : "text-destructive"}>
                {ans?.jawaban_siswa || "(Kosong)"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground">Kunci Jawaban: </span>
              <strong className="text-primary">{question.kunci_jawaban}</strong>
            </div>
          </div>
        )}

        {/* ── Esai Scoring Panel ── */}
        {isEssay && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
            <div>
              <span className="text-xs font-semibold text-foreground block mb-1">
                Uraian Jawaban Siswa:
              </span>
              <p className="p-3 rounded-md bg-background border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {ans?.jawaban_siswa || "(Siswa tidak mengisi jawaban esai ini)"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Beri Poin Esai (Maksimal: {question.bobot_poin}):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={question.bobot_poin}
                    value={essayScore?.poin ?? 0}
                    onChange={(e) =>
                      onEssayScoreChange({
                        poin: parseFloat(e.target.value) || 0,
                        catatan: essayScore?.catatan || "",
                      })
                    }
                    className="w-24 text-xs font-bold h-9"
                  />
                  <span className="text-xs text-muted-foreground">
                    / {question.bobot_poin} Poin
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Catatan Koreksi (Opsional):
                </label>
                <Input
                  type="text"
                  value={essayScore?.catatan ?? ""}
                  onChange={(e) =>
                    onEssayScoreChange({
                      poin: essayScore?.poin ?? 0,
                      catatan: e.target.value,
                    })
                  }
                  placeholder="Catatan untuk siswa..."
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                disabled={isSavingEssay}
                onClick={() =>
                  onSaveEssayScore(question.id, question.bobot_poin)
                }
                className="text-xs font-semibold gap-1.5 h-8"
              >
                {isSavingEssay ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Nilai Esai</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pembahasan */}
        {question.pembahasan && (
          <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
            <strong className="text-foreground">Pembahasan: </strong>
            {question.pembahasan}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
