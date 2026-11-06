"use client";

import React from "react";
import { AchievementLeaderboardView } from "@/components/features/achievements/achievement-leaderboard-view";
import type { StudentLeaderboardEntry } from "@/services/achievement.service";
import type { AchievementItem } from "@/app/(dashboard)/guru/achievements/_components/achievement-detail-modal";

interface SiswaAchievementsClientProps {
  myAchievements?: AchievementItem[];
  leaderboardEntries: StudentLeaderboardEntry[];
  rombelOptions: { id: string; name: string }[];
  currentUserId: string;
  studentName?: string;
  studentClass: string;
  studentJenjang: string;
}

export function SiswaAchievementsClient({
  leaderboardEntries,
  rombelOptions,
  currentUserId,
  studentClass,
  studentJenjang,
}: SiswaAchievementsClientProps) {
  return (
    <div className="space-y-6">
      {/* Papan Peringkat (Leaderboard) Siswa Langsung Tampil */}
      <AchievementLeaderboardView
        entries={leaderboardEntries}
        rombelOptions={rombelOptions}
        currentUserId={currentUserId}
        jenjangLabel={studentJenjang}
        userRole="siswa"
        userClass={studentClass}
      />
    </div>
  );
}
