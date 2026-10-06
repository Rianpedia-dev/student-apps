"use client";

import React from "react";
import {
  Trash2,
  ImageIcon,
  UploadCloud,
  Loader2,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { QuestionItemInput, QuestionOptionInput } from "@/actions/assignment";

const DEFAULT_OPTIONS: QuestionOptionInput[] = [
  { label: "A", teks_opsi: "", gambar_opsi: null, is_benar: true },
  { label: "B", teks_opsi: "", gambar_opsi: null, is_benar: false },
  { label: "C", teks_opsi: "", gambar_opsi: null, is_benar: false },
  { label: "D", teks_opsi: "", gambar_opsi: null, is_benar: false },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "PILIHAN_GANDA", label: "Pilihan Ganda" },
  { value: "ESAI", label: "Esai / Uraian" },
];

interface BuilderQuestionEditorProps {
  question: QuestionItemInput;
  questionIndex: number;
  totalQuestions: number;
  onUpdateQuestion: (updates: Partial<QuestionItemInput>) => void;
  onUpdateOption: (opIndex: number, updates: Partial<QuestionOptionInput>) => void;
  onDeleteQuestion: () => void;
  onUploadImage: (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
    onSuccess: (url: string) => void
  ) => void;
  uploadingImageKey: string | null;
  onPrev: () => void;
  onNext: () => void;
  onProceedToStep3: () => void;
}

export function BuilderQuestionEditor({
  question,
  questionIndex,
  totalQuestions,
  onUpdateQuestion,
  onUpdateOption,
  onDeleteQuestion,
  onUploadImage,
  uploadingImageKey,
  onPrev,
  onNext,
  onProceedToStep3,
}: BuilderQuestionEditorProps) {
  const isLastQuestion = questionIndex === totalQuestions - 1;

  const handleTypeChange = (type: string) => {
    onUpdateQuestion({
      tipe_soal: type as QuestionItemInput["tipe_soal"],
      opsi:
        type === "ESAI"
          ? []
          : question.opsi.length > 0
          ? question.opsi
          : DEFAULT_OPTIONS.map((o) => ({ ...o })),
      kunci_jawaban: type === "ESAI" ? null : "A",
    });
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header Bar: Question Number, Type Selector, Points, Delete */}
        <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-bold">
              Soal {questionIndex + 1}
            </Badge>

            <Select
              items={QUESTION_TYPE_OPTIONS}
              value={question.tipe_soal === "PILIHAN_GAMBAR" ? "PILIHAN_GANDA" : question.tipe_soal}
              onValueChange={(val) => val && handleTypeChange(val)}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Tipe Soal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PILIHAN_GANDA">Pilihan Ganda</SelectItem>
                <SelectItem value="ESAI">Esai / Uraian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md border border-border">
              <span className="text-xs text-muted-foreground">Bobot:</span>
              <Input
                type="number"
                min="1"
                max="100"
                value={question.bobot_poin}
                onChange={(e) =>
                  onUpdateQuestion({
                    bobot_poin: parseInt(e.target.value, 10) || 10,
                  })
                }
                className="w-12 text-xs font-bold h-7 p-1 text-center"
              />
              <span className="text-xs text-muted-foreground">Poin</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDeleteQuestion}
              className="text-destructive hover:bg-destructive/10 h-8 px-2"
              title="Hapus soal ini"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Teks Pertanyaan */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Teks Pertanyaan <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={question.pertanyaan}
            onChange={(e) => onUpdateQuestion({ pertanyaan: e.target.value })}
            rows={3}
            placeholder="Tuliskan pertanyaan soal secara lengkap di sini..."
            className="text-xs sm:text-sm leading-relaxed"
          />
        </div>

        {/* Gambar Stimulus */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Gambar Stimulus / Diagram (Opsional)
          </label>

          {question.gambar_soal ? (
            <div className="relative inline-block border border-border rounded-lg p-2 bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.gambar_soal}
                alt="Stimulus Soal"
                className="max-h-44 rounded-md object-contain"
              />
              <button
                type="button"
                onClick={() => onUpdateQuestion({ gambar_soal: null })}
                className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:opacity-90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id={`stimulus-img-${questionIndex}`}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  onUploadImage(e, `stimulus-${questionIndex}`, (url) => {
                    onUpdateQuestion({ gambar_soal: url });
                  })
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingImageKey === `stimulus-${questionIndex}`}
                onClick={() =>
                  document.getElementById(`stimulus-img-${questionIndex}`)?.click()
                }
                className="text-xs h-8 gap-1.5"
              >
                {uploadingImageKey === `stimulus-${questionIndex}` ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Unggah Gambar Stimulus</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ── Pilihan Ganda (Teks & Gambar) ── */}
        {(question.tipe_soal === "PILIHAN_GANDA" ||
          question.tipe_soal === "PILIHAN_GAMBAR") && (
          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Pilihan Jawaban (Klik tombol huruf untuk memilih kunci jawaban benar):
              </label>
              <span className="text-[11px] text-muted-foreground">
                Kunci: <strong>{question.kunci_jawaban || "A"}</strong>
              </span>
            </div>

            <div className="space-y-2">
              {question.opsi.map((op, opIdx) => (
                <div
                  key={op.label}
                  className={`p-2.5 rounded-lg border transition-all ${
                    op.is_benar
                      ? "bg-primary/5 border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Key selector button */}
                    <button
                      type="button"
                      onClick={() => onUpdateOption(opIdx, { is_benar: true })}
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                        op.is_benar
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title={`Jadikan Opsi ${op.label} sebagai Kunci Benar`}
                    >
                      {op.is_benar ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : op.label}
                    </button>

                    <div className="flex-1 space-y-2">
                      <Input
                        type="text"
                        value={op.teks_opsi || ""}
                        onChange={(e) =>
                          onUpdateOption(opIdx, { teks_opsi: e.target.value })
                        }
                        placeholder={`Teks pilihan ${op.label} (opsional jika menggunakan gambar)...`}
                        className="text-xs h-8"
                      />

                      {/* Lampiran Gambar Opsi (Mendukung pilihan gambar pada Pilihan Ganda) */}
                      <div>
                        {op.gambar_opsi ? (
                          <div className="relative inline-block border border-border rounded-md p-1 bg-muted/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={op.gambar_opsi}
                              alt={`Opsi ${op.label}`}
                              className="h-16 rounded object-contain"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOption(opIdx, { gambar_opsi: null })
                              }
                              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground hover:opacity-90"
                              title="Hapus gambar opsi"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id={`opt-img-${questionIndex}-${opIdx}`}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                onUploadImage(
                                  e,
                                  `opt-${questionIndex}-${opIdx}`,
                                  (url) => onUpdateOption(opIdx, { gambar_opsi: url })
                                )
                              }
                            />
                            <button
                              type="button"
                              disabled={uploadingImageKey === `opt-${questionIndex}-${opIdx}`}
                              onClick={() =>
                                document
                                  .getElementById(`opt-img-${questionIndex}-${opIdx}`)
                                  ?.click()
                              }
                              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {uploadingImageKey === `opt-${questionIndex}-${opIdx}` ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Mengunggah...</span>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-3 w-3" />
                                  <span>+ Lampirkan Gambar Opsi {op.label} (Opsional)</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Esai ── */}
        {question.tipe_soal === "ESAI" && (
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border space-y-1">
            <span className="text-xs font-semibold text-foreground block">
              Penilaian Soal Esai:
            </span>
            <p className="text-xs text-muted-foreground">
              Jawaban esai dinilai secara manual oleh guru pada lembar ulasan setelah siswa mengumpulkan.
            </p>
          </div>
        )}

        {/* Pembahasan / Penjelasan */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-semibold text-foreground block">
            Pembahasan / Penjelasan (Opsional, terlihat setelah dinilai):
          </label>
          <Textarea
            value={question.pembahasan || ""}
            onChange={(e) => onUpdateQuestion({ pembahasan: e.target.value })}
            rows={2}
            placeholder="Tuliskan alasan jawaban atau penjelasan langkah pengerjaan..."
            className="text-xs leading-relaxed"
          />
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={questionIndex === 0}
            onClick={onPrev}
            className="text-xs h-9 gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Soal Sebelumnya</span>
          </Button>

          {isLastQuestion ? (
            <Button
              type="button"
              size="sm"
              onClick={onProceedToStep3}
              className="text-xs font-semibold h-9 px-4 gap-1.5"
            >
              <span>Lanjut ke Pengaturan</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNext}
              className="text-xs h-9 px-4 gap-1.5"
            >
              <span>Soal Berikutnya</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
