"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import {
  saveAnswerDraftAction,
  submitInteractiveTaskAction,
} from "@/actions/assignment";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RunnerHeader } from "./runner-header";
import {
  RunnerQuestionCard,
  RunnerQuestion,
  RunnerOption,
} from "./runner-question-card";
import { RunnerNavigation } from "./runner-navigation";
import { RunnerSubmitDialog } from "./runner-submit-dialog";

export type { RunnerQuestion, RunnerOption };

export interface InitialAnswerItem {
  soalId: string;
  jawaban: string;
  isRagu: boolean;
}

interface InteractiveTaskRunnerProps {
  tugasId: string;
  tugasJudul: string;
  mapelNama: string;
  kelasNama: string;
  durasiMenit?: number | null;
  submissionId: string;
  questions: RunnerQuestion[];
  initialAnswers?: InitialAnswerItem[];
  mulaiMengerjakanAt?: string | null;
}

export function InteractiveTaskRunner({
  tugasId,
  tugasJudul,
  mapelNama,
  durasiMenit,
  submissionId,
  questions,
  initialAnswers = [],
  mulaiMengerjakanAt,
}: InteractiveTaskRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers Map: soalId -> { jawaban, isRagu }
  const [answers, setAnswers] = useState<
    Record<string, { jawaban: string; isRagu: boolean }>
  >(() => {
    const map: Record<string, { jawaban: string; isRagu: boolean }> = {};
    initialAnswers.forEach((ans) => {
      map[ans.soalId] = { jawaban: ans.jawaban, isRagu: ans.isRagu };
    });
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(
          `draft_task_${tugasId}_sub_${submissionId}`
        );
        if (stored) Object.assign(map, JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    return map;
  });

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer calculation
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (!durasiMenit) return null;
    const totalSecs = durasiMenit * 60;
    if (mulaiMengerjakanAt) {
      const elapsed = Math.floor(
        (Date.now() - new Date(mulaiMengerjakanAt).getTime()) / 1000
      );
      return Math.max(0, totalSecs - elapsed);
    }
    return totalSecs;
  });

  const handleFinalSubmit = async (isTimeOut = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (isTimeOut) {
      toast.info("Waktu pengerjaan telah habis! Mengumpulkan otomatis...");
    }
    try {
      const res = await submitInteractiveTaskAction({ submissionId });
      if (res.success) {
        try {
          localStorage.removeItem(`draft_task_${tugasId}_sub_${submissionId}`);
        } catch {
          /* ignore */
        }
        toast.success(res.message || "Tugas berhasil dikumpulkan!");
        router.push(`/siswa/tugas/${tugasId}/hasil`);
      } else {
        toast.error(res.error || "Gagal mengumpulkan tugas.");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Terjadi kendala jaringan.");
      setIsSubmitting(false);
    }
  };

  // Tutup lightbox dengan tombol Esc
  useEffect(() => {
    if (!zoomedImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedImage]);

  useEffect(() => {
    if (secondsRemaining === null) return;
    if (secondsRemaining <= 0) {
      handleFinalSubmit(true);
      return;
    }
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectAnswer = (soalId: string, answerValue: string) => {
    const currentIsRagu = answers[soalId]?.isRagu || false;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [soalId]: {
          jawaban: answerValue,
          isRagu: prev[soalId]?.isRagu || false,
        },
      };
      try {
        localStorage.setItem(
          `draft_task_${tugasId}_sub_${submissionId}`,
          JSON.stringify(next)
        );
      } catch {
        /* ignore */
      }
      return next;
    });

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswerDraftAction({
        submissionId,
        soalId,
        jawaban: answerValue,
        isRagu: currentIsRagu,
      }).catch(() => {});
    }, 400);
  };

  const handleToggleRagu = (soalId: string) => {
    const current = answers[soalId] || { jawaban: "", isRagu: false };
    const nextIsRagu = !current.isRagu;
    setAnswers((prev) => {
      const next = { ...prev, [soalId]: { ...current, isRagu: nextIsRagu } };
      try {
        localStorage.setItem(
          `draft_task_${tugasId}_sub_${submissionId}`,
          JSON.stringify(next)
        );
      } catch {
        /* ignore */
      }
      return next;
    });
    saveAnswerDraftAction({
      submissionId,
      soalId,
      jawaban: current.jawaban,
      isRagu: nextIsRagu,
    }).catch(() => {});
  };

  const currentQ = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentQ?.id]?.jawaban || "";
  const currentIsRagu = answers[currentQ?.id]?.isRagu || false;

  const answeredCount = questions.filter(
    (q) => answers[q.id]?.jawaban?.trim().length > 0
  ).length;
  const progressPercent = Math.round(
    (answeredCount / Math.max(1, questions.length)) * 100
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* ── Sticky Top Header ── */}
      <RunnerHeader
        mapelNama={mapelNama}
        tugasJudul={tugasJudul}
        secondsRemaining={secondsRemaining}
        answeredCount={answeredCount}
        totalCount={questions.length}
        progressPercent={progressPercent}
        onSubmitClick={() => setShowConfirmModal(true)}
      />

      {/* ── Mobile/Tablet-portrait Horizontal Question Strip ── */}
      <div className="md:hidden bg-muted/40 border-b border-border py-2 px-4 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const hasAnswer = ans?.jawaban?.trim().length > 0;
          const isRagu = ans?.isRagu;
          const isActive = idx === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-8 min-w-8 px-2 rounded-md text-xs font-semibold shrink-0 transition-all border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : isRagu
                  ? "bg-muted text-foreground border-border underline decoration-2"
                  : hasAnswer
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* ── Main Layout (Question Card + Sidebar) ── */}
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 pt-4 sm:pt-5 pb-24 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Question Card */}
          <div className="md:col-span-8">
            <RunnerQuestionCard
              question={currentQ}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              currentAnswer={currentAnswer}
              isRagu={currentIsRagu}
              onSelectAnswer={handleSelectAnswer}
              onToggleRagu={handleToggleRagu}
              onZoomImage={(src) => setZoomedImage(src)}
              onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              onNext={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              onSubmitClick={() => setShowConfirmModal(true)}
              hasPrev={currentIndex > 0}
              hasNext={currentIndex < questions.length - 1}
            />
          </div>

          {/* Tablet/Desktop Sidebar Question Map */}
          <div className="hidden md:block md:col-span-4">
            <RunnerNavigation
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              onSelectIndex={(idx) => setCurrentIndex(idx)}
              onSubmitClick={() => setShowConfirmModal(true)}
              answeredCount={answeredCount}
            />
          </div>
        </div>
      </main>

      {/* ── Sticky Bottom Action Bar (mobile/tablet-portrait) ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-md border-t border-border px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="flex-1 text-xs font-semibold h-11 gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              className="flex-1 text-xs font-semibold h-11 gap-1.5"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 text-xs font-semibold h-11 gap-1.5"
            >
              Kumpulkan
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Lightbox Image Modal ── */}
      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Perbesar Gambar"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setZoomedImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            aria-label="Tutup"
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-w-[95vw] max-h-[92vh] overflow-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Perbesar Gambar"
              className="max-w-full max-h-[92vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* ── Confirm Submit Dialog ── */}
      <RunnerSubmitDialog
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        totalCount={questions.length}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
        onConfirm={() => handleFinalSubmit(false)}
      />
    </div>
  );
}
