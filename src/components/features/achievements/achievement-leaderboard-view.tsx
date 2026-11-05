"use client";

import React, { useState, useMemo } from "react";
import { LeaderboardCard, type LeaderboardRunOption } from "@/components/ui/leaderboard-card";
import type { StudentLeaderboardEntry } from "@/services/achievement.service";

interface AchievementLeaderboardViewProps {
  entries: StudentLeaderboardEntry[];
  rombelOptions: { id: string; name: string }[];
  currentUserId?: string;
  defaultRunId?: string;
  jenjangLabel?: string;
}

export function AchievementLeaderboardView({
  entries,
  rombelOptions,
  currentUserId,
  defaultRunId = "all-school",
  jenjangLabel = "SD",
}: AchievementLeaderboardViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string>(defaultRunId);

  // Daftar opsi filter runOptions
  const runOptions: LeaderboardRunOption[] = useMemo(() => {
    return [
      { id: "all-school", label: `Top Sekolah (Semua Rombel ${jenjangLabel})` },
      ...rombelOptions.map((r) => ({
        id: `rombel_${r.name}`,
        label: `Kelas: ${r.name}`,
      })),
    ];
  }, [rombelOptions, jenjangLabel]);

  // Filter siswa sesuai pilihan runOption
  const filteredEntries = useMemo(() => {
    if (selectedRunId === "all-school") {
      return entries;
    }

    const rombelName = selectedRunId.replace(/^rombel_/, "").toLowerCase().trim();
    return entries.filter((e) => e.kelas.toLowerCase().trim().includes(rombelName));
  }, [entries, selectedRunId]);

  // Recalculate rank numbering untuk subset filter
  const rankedSubset = useMemo(() => {
    return filteredEntries.map((e, idx) => ({
      ...e,
      rank: idx + 1,
    }));
  }, [filteredEntries]);

  // Podium Top 3
  const podiumRankings = useMemo(() => {
    return rankedSubset.slice(0, 3).map((e) => ({
      userId: e.userId,
      userName: e.userName,
      rank: e.rank,
      value: e.totalPoints,
      avatarUrl: e.avatarUrl,
      gender: e.gender,
      byline: e.kelas,
    }));
  }, [rankedSubset]);

  // Ranking List Items
  const rankings = useMemo(() => {
    return rankedSubset.map((e) => ({
      userId: e.userId,
      rank: e.rank,
      userName: e.userName,
      byline: `${e.kelas} • ${e.totalAchievements} Prestasi`,
      value: `${e.totalPoints} Poin`,
      avatarUrl: e.avatarUrl,
      gender: e.gender,
      displayed: true,
    }));
  }, [rankedSubset]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const fromDate = `${currentYear - 1}-07-15`;
  const toDate = `${currentYear}-06-25`;

  return (
    <LeaderboardCard
      title={`Papan Peringkat Prestasi Siswa ${jenjangLabel} Al-Azhar`}
      fromDate={fromDate}
      toDate={toDate}
      currentUserId={currentUserId}
      runOptions={runOptions}
      selectedRunId={selectedRunId}
      onRunChange={setSelectedRunId}
      podiumRankings={podiumRankings}
      rankings={rankings}
      className="card-elevation rounded-3xl"
    />
  );
}

