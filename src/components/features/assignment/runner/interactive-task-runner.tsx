"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  saveAnswerDraftAction,
  submitInteractiveTaskAction,
} from "@/actions/assignment";
import { toast } from "sonner";
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

      {/* ── Mobile Horizontal Question Strip ── */}
      <div className="lg:hidden bg-muted/40 border-b border-border py-2 px-4 overflow-x-auto scrollbar-none flex items-center gap-1.5">
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Question Card */}
          <div className="lg:col-span-8">
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

          {/* Desktop/Tablet Sidebar Question Map */}
          <div className="hidden lg:block lg:col-span-4">
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

      {/* ── Lightbox Image Modal ── */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Perbesar Gambar"
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
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
