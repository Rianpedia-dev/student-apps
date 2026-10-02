"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RunnerQuestion } from "./runner-question-card";

interface RunnerNavigationProps {
  questions: RunnerQuestion[];
  currentIndex: number;
  answers: Record<string, { jawaban: string; isRagu: boolean }>;
  onSelectIndex: (index: number) => void;
  onSubmitClick: () => void;
  answeredCount: number;
}

export function RunnerNavigation({
  questions,
  currentIndex,
  answers,
  onSelectIndex,
  onSubmitClick,
  answeredCount,
}: RunnerNavigationProps) {
  return (
    <Card className="sticky top-20">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Title & Count */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Nomor Soal</span>
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{questions.length} terisi
          </span>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const hasAnswer = ans?.jawaban?.trim().length > 0;
            const isRagu = ans?.isRagu;
            const isActive = idx === currentIndex;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`h-10 rounded-lg border text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 shadow-xs"
                    : isRagu
                    ? "bg-muted text-foreground border-border font-bold underline decoration-2 underline-offset-2"
                    : hasAnswer
                    ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <Separator />
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary/10 border border-primary/30 shrink-0" />
            <span>Sudah Dijawab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-muted border border-border shrink-0 underline decoration-2" />
            <span>Ditandai Ragu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-muted/40 border border-border shrink-0" />
            <span>Belum Dijawab</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={onSubmitClick}
          className="w-full text-xs font-semibold h-10 mt-2"
        >
          Kumpulkan Tugas
        </Button>
      </CardContent>
    </Card>
  );
}
