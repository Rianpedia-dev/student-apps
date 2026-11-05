"use client";

import React, { useState, useMemo } from "react";
import { Trophy, Plus, SearchX, LayoutGrid, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AchievementToolbar, type ClassScope } from "./achievement-toolbar";
import { AchievementCard } from "./achievement-card";
import { AchievementDetailModal, type AchievementItem } from "./achievement-detail-modal";
import {
  AddAchievementModal,
  type StudentOption,
  type EditableAchievement,
} from "./add-achievement-modal";
import { DeleteAchievementDialog } from "./delete-achievement-dialog";
import { AchievementLeaderboardView } from "@/components/features/achievements/achievement-leaderboard-view";
import type { StudentLeaderboardEntry } from "@/services/achievement.service";
import {
  isSameRombel,
  isAchievementFromPreviousClass,
} from "@/lib/achievement-points";

interface AchievementsClientViewProps {
  initialAchievements: AchievementItem[];
  students: StudentOption[];
  guruClass: string;
  canManage?: boolean;
  userRole?: string;
  userStatus?: string;
  leaderboardEntries?: StudentLeaderboardEntry[];
  rombelOptions?: { id: string; name: string }[];
  currentUserId?: string;
  jenjangLabel?: string;
}

export function AchievementsClientView({
  initialAchievements,
  students,
  guruClass,
  canManage = true,
  userRole = "guru",
  userStatus = "4",
  leaderboardEntries = [],
  rombelOptions = [],
  currentUserId,
  jenjangLabel = "SD",
}: AchievementsClientViewProps) {
  // Active Tab: "gallery" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"gallery" | "leaderboard">("gallery");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [classScope, setClassScope] = useState<ClassScope>(guruClass ? "MY_CLASS" : "ALL_CLASSES");

  // Dialogs State
  const [detailAchievement, setDetailAchievement] = useState<AchievementItem | null>(null);
  const [editAchievement, setEditAchievement] = useState<EditableAchievement | null>(null);
  const [deleteAchievement, setDeleteAchievement] = useState<AchievementItem | null>(null);

  // Compute Filtered Achievements (Card terbaru berada di urutan paling atas)
  const filteredAchievements = useMemo(() => {
    return initialAchievements
      .filter((ach) => {
        // 1. Class Scope Filter
        if (classScope === "MY_CLASS" && guruClass) {
          const achClass = (ach.kelas || "").trim().toLowerCase();
          const myClass = guruClass.trim().toLowerCase();
          if (!achClass.includes(myClass) && !myClass.includes(achClass)) {
            return false;
          }
        }

        // 2. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = ach.nama.toLowerCase().includes(q);
          const matchTitle = ach.prestasi.toLowerCase().includes(q);
          const matchClass = (ach.kelas || "").toLowerCase().includes(q);
          const matchTingkat = (ach.tingkat || "").toLowerCase().includes(q);
          const matchPeringkat = (ach.peringkat || "").toLowerCase().includes(q);
          if (!matchName && !matchTitle && !matchClass && !matchTingkat && !matchPeringkat) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        try {
          return Number(BigInt(b.id) - BigInt(a.id));
        } catch {
          return 0;
        }
      });
  }, [initialAchievements, classScope, guruClass, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setClassScope(guruClass ? "MY_CLASS" : "ALL_CLASSES");
  };

  const isFilterActive =
    searchQuery.trim() !== "" ||
    (guruClass ? classScope !== "MY_CLASS" : classScope !== "ALL_CLASSES");

  // Helper Evaluasi Hak Kelola Granular Kartu Prestasi:
  // 1. Super Admin: Bebas kelola semua prestasi.
  // 2. Admin Jenjang: Bebas kelola semua prestasi di jenjangnya (SD / SMP).
  // 3. Wali Kelas:
  //    - Siswa kelas lain -> TIDAK BISA EDIT/DELETE.
  //    - Siswa binaan tapi diraih di kelas sebelumnya -> TIDAK BISA EDIT/DELETE (Arsip Historis).
  //    - Siswa binaan dan diraih di kelas binaan saat ini -> BISA EDIT & DELETE.
  const getCardPermissions = (ach: AchievementItem) => {
    if (!canManage) {
      return { canManage: false, isHistoricalArchive: false };
    }

    // Super Admin (akses penuh jenjang ALL)
    if (userRole === "admin" && (!jenjangLabel || jenjangLabel.includes("ALL") || jenjangLabel.includes("Semua"))) {
      return { canManage: true, isHistoricalArchive: false };
    }

    // Admin Jenjang (terbatas jenjang SD atau SMP)
    if (userRole === "admin") {
      const matchJenjang = !ach.jenjang || ach.jenjang === jenjangLabel || jenjangLabel.includes(ach.jenjang);
      return { canManage: matchJenjang, isHistoricalArchive: false };
    }

    // Wali Kelas (status === "4")
    if (userRole === "guru" && userStatus === "4" && guruClass) {
      // Siswa kelas lain (bukan rombel binaan wali kelas saat ini)
      const isStudentInMyClass = isSameRombel(guruClass, ach.kelas);

      if (!isStudentInMyClass) {
        return { canManage: false, isHistoricalArchive: false };
      }

      // Siswa terdaftar di rombel binaan. Apakah diraih di kelas saat ini atau kelas lampau?
      const isPrevious = isAchievementFromPreviousClass(
        guruClass,
        ach.kelas_saat_prestasi,
        ach.kelas
      );

      if (isPrevious) {
        // Diraih di kelas sebelumnya -> Kunci sebagai Arsip Historis!
        return { canManage: false, isHistoricalArchive: true };
      }

      // Sah diraih di kelas binaan aktif
      return { canManage: true, isHistoricalArchive: false };
    }

    return { canManage: false, isHistoricalArchive: false };
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Galeri Prestasi vs Leaderboard Siswa */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("gallery")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "gallery"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Galeri Prestasi ({initialAchievements.length})
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

      {activeTab === "leaderboard" ? (
        <AchievementLeaderboardView
          entries={leaderboardEntries}
          rombelOptions={rombelOptions}
          currentUserId={currentUserId}
          jenjangLabel={jenjangLabel}
        />
      ) : (
        <>
          {/* 1. Class Switcher & Search Bar */}
          <AchievementToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            classScope={classScope}
            onClassScopeChange={setClassScope}
            guruClass={guruClass}
          />

          {/* 2. Achievements Grid / Empty State */}
          {filteredAchievements.length === 0 ? (
            <Card className="border-dashed rounded-3xl glass-card">
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  {isFilterActive ? <SearchX className="h-7 w-7" /> : <Trophy className="h-7 w-7" />}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-base text-foreground">
                    {isFilterActive
                      ? "Tidak ada prestasi yang cocok dengan pencarian"
                      : classScope === "MY_CLASS"
                      ? `Belum ada catatan prestasi untuk siswa kelas ${guruClass}`
                      : "Belum ada catatan prestasi terdaftar"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {isFilterActive
                      ? "Coba ganti kata kunci pencarian untuk menemukan prestasi siswa."
                      : "Tambahkan catatan rekam jejak juara siswa untuk mengabadikan pencapaian mereka."}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  {isFilterActive ? (
                    <Button variant="outline" size="sm" onClick={handleResetFilters} className="cursor-pointer">
                      Reset Pencarian
                    </Button>
                  ) : canManage ? (
                    <AddAchievementModal
                      students={students}
                      guruClass={guruClass}
                      triggerButton={
                        <Button variant="launch" size="sm" className="gap-2 cursor-pointer">
                          <Plus className="h-4 w-4" /> Catat Prestasi Pertama
                        </Button>
                      }
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((ach) => {
                const perms = getCardPermissions(ach);
                return (
                  <AchievementCard
                    key={ach.id}
                    achievement={ach}
                    canManage={perms.canManage}
                    isHistoricalArchive={perms.isHistoricalArchive}
                    onViewDetail={(item) => setDetailAchievement(item)}
                    onEdit={(item) =>
                      setEditAchievement({
                        id: item.id,
                        id_user: item.id_user,
                        nama: item.nama,
                        kelas: item.kelas,
                        kelas_saat_prestasi: item.kelas_saat_prestasi,
                        tahun_ajaran: item.tahun_ajaran,
                        tingkat: item.tingkat,
                        peringkat: item.peringkat,
                        poin: item.poin,
                        prestasi: item.prestasi,
                        fotoanak: item.fotoanak,
                      })
                    }
                    onDelete={(item) => setDeleteAchievement(item)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 3. Detail & Certificate Lightbox Modal */}
      <AchievementDetailModal
        achievement={detailAchievement}
        open={Boolean(detailAchievement)}
        onOpenChange={(open) => !open && setDetailAchievement(null)}
      />

      {/* 4. Edit Modal (Controlled) */}
      <AddAchievementModal
        students={students}
        guruClass={guruClass}
        isOpen={Boolean(editAchievement)}
        onOpenChange={(open) => !open && setEditAchievement(null)}
        achievementToEdit={editAchievement}
      />

      {/* 5. Delete Confirmation Alert Dialog */}
      <DeleteAchievementDialog
        id={deleteAchievement?.id || null}
        studentName={deleteAchievement?.nama}
        achievementTitle={deleteAchievement?.prestasi}
        open={Boolean(deleteAchievement)}
        onOpenChange={(open) => !open && setDeleteAchievement(null)}
        onSuccess={() => setDeleteAchievement(null)}
      />
    </div>
  );
}
