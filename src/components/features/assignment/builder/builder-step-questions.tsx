"use client";

import React from "react";
import {
  Plus,
  ImageIcon,
  FileQuestion,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionItemInput, QuestionOptionInput } from "@/actions/assignment";
import { BuilderQuestionEditor } from "./builder-question-editor";

interface BuilderStepQuestionsProps {
  questions: QuestionItemInput[];
  activeQuestionIndex: number;
  setActiveQuestionIndex: (idx: number) => void;
  onAddQuestion: (type?: QuestionItemInput["tipe_soal"]) => void;
  onDeleteQuestion: (idx: number) => void;
  onUpdateQuestion: (index: number, updates: Partial<QuestionItemInput>) => void;
  onUpdateOption: (
    qIndex: number,
    opIndex: number,
    updates: Partial<QuestionOptionInput>
  ) => void;
  onDistributePointsEvenly: () => void;
  onUploadImage: (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
    onSuccess: (url: string) => void
  ) => void;
  uploadingImageKey: string | null;
  totalBobot: number;
  onBack: () => void;
  onNext: () => void;
}

export function BuilderStepQuestions({
  questions,
  activeQuestionIndex,
  setActiveQuestionIndex,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
  onUpdateOption,
  onDistributePointsEvenly,
  onUploadImage,
  uploadingImageKey,
  totalBobot,
  onBack,
  onNext,
}: BuilderStepQuestionsProps) {
  const currentQ = questions[activeQuestionIndex] || questions[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ── Sidebar: Question Map & Action Buttons ── */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="sticky top-20">
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Header: Total questions & points */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Daftar Soal ({questions.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Total: {totalBobot} Poin
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDistributePointsEvenly}
                className="text-[11px] h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                title="Bagi rata bobot poin semua butir soal menjadi total 100 poin"
              >
                <Sparkles className="h-3 w-3" />
                <span>Bagi Rata (100)</span>
              </Button>
            </div>

            {/* Question Buttons Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isActive = idx === activeQuestionIndex;
                const isComplete =
                  q.pertanyaan.trim().length > 0 &&
                  (q.tipe_soal === "ESAI" ||
                    q.tipe_soal === "ISIAN_SINGKAT" ||
                    q.opsi.some((o) => o.is_benar));

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                        : isComplete
                        ? "bg-background hover:bg-muted text-foreground border-border"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs font-bold">{idx + 1}</span>
                    <span className="text-[10px] opacity-75">{q.bobot_poin}pt</span>
                    {isComplete && !isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Add Buttons */}
            <div className="pt-2 border-t border-border flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddQuestion("PILIHAN_GANDA")}
                className="w-full text-xs h-8 justify-start gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Pilihan Ganda (Teks)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddQuestion("PILIHAN_GAMBAR")}
                className="w-full text-xs h-8 justify-start gap-2"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>+ Pilihan Bergambar</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddQuestion("ISIAN_SINGKAT")}
                className="w-full text-xs h-8 justify-start gap-2"
              >
                <FileQuestion className="h-3.5 w-3.5" />
                <span>+ Isian Singkat</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddQuestion("ESAI")}
                className="w-full text-xs h-8 justify-start gap-2"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>+ Esai / Uraian</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Area: Active Question Editor ── */}
      <div className="lg:col-span-8">
        <BuilderQuestionEditor
          question={currentQ}
          questionIndex={activeQuestionIndex}
          totalQuestions={questions.length}
          onUpdateQuestion={(updates) =>
            onUpdateQuestion(activeQuestionIndex, updates)
          }
          onUpdateOption={(opIndex, updates) =>
            onUpdateOption(activeQuestionIndex, opIndex, updates)
          }
          onDeleteQuestion={() => onDeleteQuestion(activeQuestionIndex)}
          onUploadImage={onUploadImage}
          uploadingImageKey={uploadingImageKey}
          onPrev={() =>
            setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))
          }
          onNext={() =>
            setActiveQuestionIndex(
              Math.min(questions.length - 1, activeQuestionIndex + 1)
            )
          }
          onProceedToStep3={onNext}
        />
      </div>
    </div>
  );
}
