"use client";

import React, { useState, useMemo, useEffect } from "react";
import { LeaderboardCard, type LeaderboardRunOption } from "@/components/ui/leaderboard-card";
import type { StudentLeaderboardEntry, StudentBasicInfo } from "@/services/achievement.service";
import { isSameRombel } from "@/lib/achievement-points";
import {
  StudentAchievementHistoryDialog,
  type SelectedStudentHistoryTarget,
} from "@/components/features/achievements/student-achievement-history-dialog";
import type { AchievementHistoryItem } from "./achievement-pinboard-view";

interface AchievementLeaderboardViewProps {
  entries: StudentLeaderboardEntry[];
  allStudents?: StudentBasicInfo[];
  rombelOptions?: { id: string; name: string }[];
  currentUserId?: string;
  defaultRunId?: string;
  jenjangLabel?: string;
  userRole?: "siswa" | "guru" | "admin" | string;
  userStatus?: string;
  userClass?: string | null;
  isWaliKelas?: boolean;
  canManage?: boolean;
  onEditAchievement?: (item: AchievementHistoryItem) => void;
  onDeleteAchievement?: (item: AchievementHistoryItem) => void;
  refreshTrigger?: number;
  actionButton?: React.ReactNode;
}

export function AchievementLeaderboardView({
  entries,
  allStudents = [],
  rombelOptions = [],
  currentUserId,
  defaultRunId = "all-school",
  jenjangLabel = "SD",
  userRole,
  userStatus,
  userClass,
  isWaliKelas,
  canManage,
  onEditAchievement,
  onDeleteAchievement,
  refreshTrigger,
  actionButton,
}: AchievementLeaderboardViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string>(defaultRunId);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudentHistoryTarget | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const handleSelectStudent = (student: SelectedStudentHistoryTarget) => {
    setSelectedStudent(student);
    setIsHistoryDialogOpen(true);
  };

  // Daftar opsi filter runOptions berdasarkan peran (Role-Aware Scope)
  const runOptions: LeaderboardRunOption[] = useMemo(() => {
    const topJenjangOption: LeaderboardRunOption = {
      id: "all-school",
      label: `Jenjang ${jenjangLabel}`,
    };

    // 1. Siswa: Hanya Top Jenjang dan Top Kelas Siswa
    if (userRole === "siswa") {
      const options: LeaderboardRunOption[] = [topJenjangOption];
      if (userClass && userClass.trim()) {
        const cleanClass = userClass.trim().replace(/^kelas\s*/i, "");
        options.push({
          id: `rombel_${userClass.trim()}`,
          label: `Kelas Saya `,
        });
      }
      return options;
    }

    // 2. Guru: Jika Wali Kelas hanya Top Jenjang dan Top Kelas Binaan
    if (userRole === "guru") {
      const options: LeaderboardRunOption[] = [topJenjangOption];
      if (isWaliKelas && userClass && userClass.trim()) {
        const cleanClass = userClass.trim().replace(/^kelas\s*/i, "");
        options.push({
          id: `rombel_${userClass.trim()}`,
          label: `Kelas Binaan (${cleanClass})`,
        });
      }
      return options;
    }

    // 3. Admin: Akses monitoring menyeluruh (Top Jenjang + Seluruh Rombel)
    if (userRole === "admin") {
      return [
        { id: "all-school", label: `Top Jenjang ${jenjangLabel} (Semua Rombel)` },
        ...rombelOptions.map((r) => ({
          id: `rombel_${r.name}`,
          label: `Kelas: ${r.name}`,
        })),
      ];
    }

    // Fallback umum jika role tidak dispesifikasikan
    if (userClass && userClass.trim()) {
      return [
        topJenjangOption,
        {
          id: `rombel_${userClass.trim()}`,
          label: `Top Kelas (${userClass.trim()})`,
        },
      ];
    }

    return [
      topJenjangOption,
      ...rombelOptions.map((r) => ({
        id: `rombel_${r.name}`,
        label: `Kelas: ${r.name}`,
      })),
    ];
  }, [userRole, userClass, isWaliKelas, jenjangLabel, rombelOptions]);

  // Validasi jika selectedRunId tidak ada di daftar opsi yang diperbolehkan
  useEffect(() => {
    if (runOptions.length > 0 && !runOptions.some((opt) => opt.id === selectedRunId)) {
      setSelectedRunId(runOptions[0].id);
    }
  }, [runOptions, selectedRunId]);

  // Filter siswa sesuai pilihan runOption dengan toleransi isSameRombel
  const filteredEntries = useMemo(() => {
    if (selectedRunId === "all-school") {
      return entries;
    }

    const rombelName = selectedRunId.replace(/^rombel_/, "").trim();
    return entries.filter((e) => {
      return (
        isSameRombel(e.kelas, rombelName) ||
        e.kelas.toLowerCase().trim().includes(rombelName.toLowerCase())
      );
    });
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
      byline: e.kelas,
      value: `${e.totalPoints} Poin`,
      avatarUrl: e.avatarUrl,
      gender: e.gender,
      displayed: true,
    }));
  }, [rankedSubset]);

  // Filter allStudents sesuai pilihan runOption untuk pencarian nama siswa dengan 0 Poin
  const scopedStudents = useMemo(() => {
    if (!allStudents || allStudents.length === 0) return [];
    if (selectedRunId === "all-school") {
      return allStudents;
    }

    const rombelName = selectedRunId.replace(/^rombel_/, "").trim();
    return allStudents.filter((s) => {
      return (
        isSameRombel(s.kelas, rombelName) ||
        (s.kelas && s.kelas.toLowerCase().trim().includes(rombelName.toLowerCase()))
      );
    });
  }, [allStudents, selectedRunId]);

  return (
    <>
      <LeaderboardCard
        currentUserId={currentUserId}
        runOptions={runOptions}
        selectedRunId={selectedRunId}
        onRunChange={setSelectedRunId}
        podiumRankings={podiumRankings}
        rankings={rankings}
        allStudents={scopedStudents}
        showPagination={false}
        onSelectStudent={handleSelectStudent}
        actionButton={actionButton}
      />

      <StudentAchievementHistoryDialog
        target={selectedStudent}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        canManage={canManage ?? isWaliKelas}
        userRole={userRole}
        userStatus={userStatus}
        guruClass={userClass || undefined}
        onEditAchievement={onEditAchievement}
        onDeleteAchievement={onDeleteAchievement}
        refreshTrigger={refreshTrigger}
      />
    </>
  );
}

