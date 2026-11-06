"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AddAchievementModal,
  type StudentOption,
  type EditableAchievement,
} from "./add-achievement-modal";
import { DeleteAchievementDialog } from "./delete-achievement-dialog";
import { AchievementLeaderboardView } from "@/components/features/achievements/achievement-leaderboard-view";
import type { StudentLeaderboardEntry } from "@/services/achievement.service";
import type { AchievementItem } from "./achievement-detail-modal";

interface AchievementsClientViewProps {
  initialAchievements?: AchievementItem[];
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
  // Modal Edit & Delete State
  const [editAchievement, setEditAchievement] = useState<EditableAchievement | null>(null);
  const [deleteAchievement, setDeleteAchievement] = useState<{
    id: string;
    nama?: string;
    prestasi?: string;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="space-y-6">
      {/* Papan Peringkat (Leaderboard) sebagai Tampilan Utama & Eksklusif */}
      <AchievementLeaderboardView
        entries={leaderboardEntries}
        rombelOptions={rombelOptions}
        currentUserId={currentUserId}
        jenjangLabel={jenjangLabel}
        userRole={userRole}
        userStatus={userStatus}
        userClass={guruClass}
        isWaliKelas={userRole === "guru" && userStatus === "4"}
        canManage={canManage}
        actionButton={
          canManage && (userRole === "admin" || (userRole === "guru" && userStatus === "4")) ? (
            <AddAchievementModal
              students={students}
              guruClass={guruClass}
              onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
              triggerButton={
                <Button
                  type="button"
                  className="h-10 px-3.5 sm:px-4 rounded-xl shadow-xs font-bold gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition-all active:scale-95 text-xs sm:text-sm whitespace-nowrap shrink-0 flex items-center border-0"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tambah Prestasi</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              }
            />
          ) : undefined
        }
        onEditAchievement={(item) =>
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
        onDeleteAchievement={(item) =>
          setDeleteAchievement({
            id: item.id,
            nama: item.nama,
            prestasi: item.prestasi,
          })
        }
        refreshTrigger={refreshTrigger}
      />

      {/* Modal Edit Prestasi Siswa */}
      <AddAchievementModal
        students={students}
        guruClass={guruClass}
        isOpen={Boolean(editAchievement)}
        onOpenChange={(open) => {
          if (!open) {
            setEditAchievement(null);
            setRefreshTrigger((prev) => prev + 1);
          }
        }}
        achievementToEdit={editAchievement}
      />

      {/* Dialog Konfirmasi Hapus Prestasi Siswa */}
      <DeleteAchievementDialog
        id={deleteAchievement?.id || null}
        studentName={deleteAchievement?.nama}
        achievementTitle={deleteAchievement?.prestasi}
        open={Boolean(deleteAchievement)}
        onOpenChange={(open) => !open && setDeleteAchievement(null)}
        onSuccess={() => {
          setDeleteAchievement(null);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
}
