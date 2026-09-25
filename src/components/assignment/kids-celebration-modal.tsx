"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, Award, Heart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KidsCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "submitted" | "high_score" | "perfect";
  title?: string;
  message?: string;
  score?: number | null;
}

export function KidsCelebrationModal({
  isOpen,
  onClose,
  type = "submitted",
  title,
  message,
  score,
}: KidsCelebrationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Trigger joyful kid-friendly confetti bursts
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);
      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultTitle =
    type === "perfect"
      ? "Mumtaz! Nilai Sempurna! 🌟"
      : type === "high_score"
      ? "Hebat Sekali! Nilai Sangat Baik! ⭐"
      : "Alhamdulillah! Misi Berhasil Dikumpulkan! 🚀";

  const defaultMsg =
    type === "perfect"
      ? "Masya Allah, jawabanmu luar biasa teliti dan tepat! Pertahankan prestasimu ya!"
      : type === "high_score"
      ? "Kerja kerasmu membuahkan hasil yang membanggakan. Terus semangat belajar!"
      : "Tugasmu sudah sampai ke ustadz/ustadzah. Sekarang istirahat sejenak sambil menunggu hasil koreksi!";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-primary/30 rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Playful background decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        {/* Big Animated Icon */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-tr from-amber-400/20 via-primary/20 to-emerald-400/20 flex items-center justify-center border border-primary/30 shadow-inner">
          {type === "perfect" ? (
            <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 animate-bounce" />
          ) : type === "high_score" ? (
            <Award className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500 animate-pulse" />
          ) : (
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin-slow" />
          )}
        </div>

        {/* Score Badge if provided */}
        {score !== null && score !== undefined && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-black text-lg">
            <span>Nilai: {score}</span>
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        {/* Title & Message */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            {title || defaultTitle}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {message || defaultMsg}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl bg-linear-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 shadow-md transition-all active:scale-98 gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Siap, Terima Kasih!</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
