"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Crown, Medal, Sparkles, Star, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { BestStudentSliderItem } from "@/services/achievement.service";
import { getTingkatBadgeProps, getPeringkatBadgeProps } from "@/lib/achievement-points";

interface BestStudentSliderProps {
  title: string;
  subtitle?: string;
  items: BestStudentSliderItem[];
  badgeText?: string;
  variant?: "school" | "rombel";
}

export function BestStudentSlider({
  title,
  subtitle,
  items,
  badgeText = "Best Student",
  variant = "school",
}: BestStudentSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  const isSchool = variant === "school";

  return (
    <div className="space-y-3.5">
      {/* Header Slider */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSchool
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isSchool ? <Crown className="h-3 w-3 text-amber-500" /> : <Medal className="h-3 w-3 text-emerald-500" />}
              {badgeText}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => handleScroll("left")}
            className="h-8 w-8 rounded-full border-border/70 hover:bg-muted cursor-pointer"
            title="Slide Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => handleScroll("right")}
            className="h-8 w-8 rounded-full border-border/70 hover:bg-muted cursor-pointer"
            title="Slide Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Container with Smooth Snap */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((student, idx) => {
          const tingkatProps = getTingkatBadgeProps(student.topTingkat);
          const isTop3 = (student.rank || idx + 1) <= 3;

          return (
            <Card
              key={`${student.userId}-${student.kelas}`}
              className={`shrink-0 w-[240px] sm:w-[270px] snap-start rounded-3xl overflow-hidden card-elevation transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between border ${
                isTop3
                  ? "border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-card to-card"
                  : "border-border/60 bg-card"
              }`}
            >
              {/* Top Accent Gradient */}
              <div
                className={`h-1.5 w-full ${
                  idx === 0
                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"
                    : idx === 1
                    ? "bg-gradient-to-r from-slate-300 via-zinc-400 to-slate-400"
                    : idx === 2
                    ? "bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800"
                    : "bg-emerald-500/60"
                }`}
              />

              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                {/* Header: Avatar, Rank Badge & Points */}
                <div className="flex items-start justify-between gap-2">
                  <div className="relative">
                    <div
                      className={`relative p-0.5 rounded-2xl ${
                        idx === 0
                          ? "bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-md ring-2 ring-amber-400/20"
                          : "border border-border"
                      }`}
                    >
                      <UserAvatar
                        src={student.avatarUrl}
                        gender={student.gender}
                        name={student.userName}
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    </div>
                    {isTop3 && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-xs border border-white">
                        {student.rank || idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                      🔥 {student.totalPoints} Poin
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                      {student.totalAchievements} Kejuaraan
                    </p>
                  </div>
                </div>

                {/* Student Info */}
                <div className="min-w-0">
                  <h4
                    className="font-extrabold text-sm text-foreground truncate leading-tight"
                    title={student.userName}
                  >
                    {student.userName}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 font-semibold">
                    {student.kelas}
                  </p>
                </div>

                {/* Highlight Top Achievement */}
                {student.topAchievement && (
                  <div className="p-2.5 rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/50 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{tingkatProps.icon}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                        {student.topTingkat}
                      </span>
                    </div>
                    <p
                      className="text-xs font-bold text-foreground line-clamp-2 leading-snug"
                      title={student.topAchievement}
                    >
                      {student.topAchievement}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

