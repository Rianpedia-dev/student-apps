"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Trophy,
  Award,
  Sparkles,
  Calendar,
  Building,
  ZoomIn,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateIndo } from "@/lib/utils";
import { getTingkatBadgeProps, getPeringkatBadgeProps } from "@/lib/achievement-points";
import {
  AchievementDetailModal,
  type AchievementItem,
} from "@/app/(dashboard)/guru/achievements/_components/achievement-detail-modal";
import { AchievementLeaderboardView } from "@/components/features/achievements/achievement-leaderboard-view";
import type { StudentLeaderboardEntry } from "@/services/achievement.service";

interface SiswaAchievementsClientProps {
  myAchievements: AchievementItem[];
  leaderboardEntries: StudentLeaderboardEntry[];
  rombelOptions: { id: string; name: string }[];
  currentUserId: string;
  studentName: string;
  studentClass: string;
  studentJenjang: string;
}

export function SiswaAchievementsClient({
  myAchievements,
  leaderboardEntries,
  rombelOptions,
  currentUserId,
  studentName,
  studentClass,
  studentJenjang,
}: SiswaAchievementsClientProps) {
  const [activeTab, setActiveTab] = useState<"my-achievements" | "leaderboard">("my-achievements");
  const [detailAchievement, setDetailAchievement] = useState<AchievementItem | null>(null);

  return (
    <div className="space-y-6">
      {/* 2. Tab Switcher: "Prestasi Saya" vs "Papan Peringkat (Leaderboard)" */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("my-achievements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "my-achievements"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Award className="h-4 w-4" />
          Prestasi Saya ({myAchievements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Papan Peringkat (Leaderboard)
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "leaderboard" ? (
        <AchievementLeaderboardView
          entries={leaderboardEntries}
          rombelOptions={rombelOptions}
          currentUserId={currentUserId}
          jenjangLabel={studentJenjang}
        />
      ) : (
        <div className="space-y-4">
          {myAchievements.length === 0 ? (
            <Card className="border-dashed rounded-3xl p-10 text-center space-y-3 bg-card/60">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-bold text-base text-foreground">
                  Belum Ada Catatan Prestasi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Semangat terus dalam belajar, mengasah bakat, dan berpartisipasi dalam perlombaan akademik maupun non-akademik. Raih kejuaraan dan jadilah siswa teladan Al-Azhar!
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAchievements.map((ach) => {
                const tingkatProps = getTingkatBadgeProps(ach.tingkat || "Dalam Sekolah");
                const peringkatProps = getPeringkatBadgeProps(ach.peringkat || "Juara 1");
                const hasPhoto =
                  ach.fotoanak &&
                  !ach.fotoanak.includes("trophy") &&
                  !ach.fotoanak.includes("best-student") &&
                  !ach.fotoanak.includes("best-point");

                return (
                  <Card
                    key={ach.id}
                    className="group relative overflow-hidden rounded-3xl border border-border/70 card-elevation hover:shadow-xl transition-all duration-200 flex flex-col justify-between bg-card"
                  >
                    {/* Top Accent Line */}
                    <div
                      className={`h-1.5 w-full bg-gradient-to-r ${
                        ach.peringkat === "Juara 1"
                          ? "from-amber-400 via-yellow-400 to-amber-500"
                          : ach.peringkat === "Juara 2"
                          ? "from-slate-300 via-zinc-400 to-slate-400"
                          : ach.peringkat === "Juara 3"
                          ? "from-amber-700 via-orange-600 to-amber-800"
                          : "from-teal-600 to-emerald-600"
                      }`}
                    />

                    <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3.5">
                      {/* Header Card: Badges & Poin */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tingkatProps.colorClass}`}
                          >
                            {tingkatProps.icon} {ach.tingkat || "Dalam Sekolah"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${peringkatProps.colorClass}`}
                          >
                            {peringkatProps.icon} {ach.peringkat || "Juara 1"}
                          </span>
                        </div>

                        <span className="inline-block text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30 shrink-0">
                          +{ach.poin || 1} Poin
                        </span>
                      </div>

                      {/* Main Description */}
                      <div
                        onClick={() => {
                          if (hasPhoto) setDetailAchievement(ach);
                        }}
                        className={`rounded-2xl border p-3.5 bg-muted/40 transition-all ${
                          hasPhoto ? "cursor-pointer hover:border-amber-500/40" : ""
                        }`}
                      >
                        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {ach.prestasi}
                        </h4>

                        {/* Histori Kelas */}
                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                          <Building className="h-3 w-3 text-muted-foreground/70" />
                          <span>Saat di {ach.kelas_saat_prestasi || ach.kelas}</span>
                          {ach.tahun_ajaran && <span>• TA {ach.tahun_ajaran}</span>}
                        </p>
                      </div>

                      {/* Certificate Thumbnail if available */}
                      {hasPhoto && (
                        <div
                          onClick={() => setDetailAchievement(ach)}
                          className="relative h-28 w-full rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/20 cursor-pointer group/photo"
                        >
                          <Image
                            src={ach.fotoanak}
                            alt={ach.prestasi}
                            fill
                            className="object-cover transition-transform duration-300 group-hover/photo:scale-105"
                            sizes="(max-width: 768px) 100vw, 300px"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                            <ZoomIn className="h-4 w-4" /> Perbesar Piagam
                          </div>
                        </div>
                      )}

                      {/* Footer: Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground mt-auto">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground/70" />
                          {formatDateIndo(ach.created_at)}
                        </span>
                        {hasPhoto && (
                          <span
                            onClick={() => setDetailAchievement(ach)}
                            className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer hover:underline"
                          >
                            Lihat Sertifikat
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal Detail */}
      <AchievementDetailModal
        achievement={detailAchievement}
        open={Boolean(detailAchievement)}
        onOpenChange={(open) => !open && setDetailAchievement(null)}
      />
    </div>
  );
}
