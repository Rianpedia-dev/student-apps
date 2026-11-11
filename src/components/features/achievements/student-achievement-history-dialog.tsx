"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { getStudentAchievementHistoryAction } from "@/actions/achievement";
import {
  Trophy,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AchievementPinboardView,
  type AchievementHistoryItem,
} from "./achievement-pinboard-view";
import { isSameRombel, isAchievementFromPreviousClass } from "@/lib/achievement-points";

export interface SelectedStudentHistoryTarget {
  userId: string;
  userName: string;
  rank?: number | string;
  avatarUrl?: string | null;
  gender?: string | null;
  byline?: string;
  value?: number | string;
}

interface StudentProfile {
  id: string;
  name: string;
  nis: string;
  kelas: string;
  jenjang: string;
  image: string | null;
  gender: string | null;
}

interface StudentAchievementHistoryDialogProps {
  target: SelectedStudentHistoryTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  userRole?: string;
  userStatus?: string;
  guruClass?: string;
  onEditAchievement?: (item: AchievementHistoryItem) => void;
  onDeleteAchievement?: (item: AchievementHistoryItem) => void;
  refreshTrigger?: number;
}

export function StudentAchievementHistoryDialog({
  target,
  open,
  onOpenChange,
  canManage = false,
  userRole,
  userStatus,
  guruClass,
  onEditAchievement,
  onDeleteAchievement,
  refreshTrigger = 0,
}: StudentAchievementHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementHistoryItem[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  // Lightbox preview untuk piagam/sertifikat
  const [previewCert, setPreviewCert] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    setError(null);

    try {
      const res = await getStudentAchievementHistoryAction({
        userId: target.userId,
        userName: target.userName,
      });

      if (res.error) {
        setError(res.error);
      } else if (res.success && res.student) {
        setStudent(res.student);
        setTotalPoints(res.totalPoints || 0);
        setAchievements(res.achievements || []);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data."
      );
    } finally {
      setLoading(false);
    }
  }, [target]);

  const canManageItem = useCallback(
    (ach: AchievementHistoryItem) => {
      if (!canManage) return false;
      if (userRole === "admin") return true;

      if (userRole === "guru" && userStatus === "4" && guruClass) {
        // Siswa harus di kelas binaan saat ini
        const isStudentInMyClass = isSameRombel(guruClass, ach.kelas);
        if (!isStudentInMyClass) return false;

        // Tidak boleh dari kelas sebelumnya (historical archive)
        const isPrevious = isAchievementFromPreviousClass(
          guruClass,
          ach.kelas_saat_prestasi,
          ach.kelas
        );
        if (isPrevious) return false;

        return true;
      }

      return false;
    },
    [canManage, userRole, userStatus, guruClass]
  );

  useEffect(() => {
    if (open && target) {
      fetchHistory();
    } else {
      setPreviewCert(null);
    }
  }, [open, target, fetchHistory, refreshTrigger]);

  if (!target) return null;

  const displayName = student?.name || target.userName;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="!fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !w-[95vw] sm:!w-[92vw] lg:!w-[90vw] !max-w-[1160px] sm:!max-w-[1160px] h-[92vh] sm:h-[90vh] !p-0 !gap-0 !overflow-hidden bg-white dark:bg-black border border-neutral-200/80 dark:border-neutral-800 shadow-2xl rounded-2xl sm:rounded-3xl focus:outline-none flex flex-col no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <DialogTitle className="sr-only">
            Riwayat Prestasi {displayName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Daftar rekam jejak riwayat seluruh prestasi kejuaraan siswa {displayName}
          </DialogDescription>

          {/* Tombol Tutup Melayang yang Elegan (Frosted Glass Circular Button) */}
          <DialogClose
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white dark:bg-black text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/90 dark:border-neutral-800 shadow-sm hover:shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            title="Tutup riwayat"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Tutup</span>
          </DialogClose>

          {/* Body Konten: Riwayat Prestasi Papan Pinboard (Scrollable Tanpa Scrollbar Visual) */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden pt-10 sm:pt-6 no-scrollbar scrollbar-none scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading ? (
              <div className="space-y-3 p-6 py-12 max-w-xl mx-auto">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-2xl border border-border/60 bg-muted/30 animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-24 bg-muted rounded-md" />
                      <div className="h-5 w-20 bg-muted rounded-md" />
                    </div>
                    <div className="h-4 w-3/4 bg-muted rounded-md" />
                    <div className="h-3 w-1/2 bg-muted rounded-md" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive max-w-md mx-auto my-12">
                <AlertCircle className="h-8 w-8 mx-auto" />
                <p className="text-sm font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
                  className="rounded-xl"
                >
                  Coba Muat Ulang
                </Button>
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-20 px-4 max-w-md mx-auto">
                <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">
                  Belum Ada Prestasi Terdata
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Siswa ini belum memiliki catatan kejuaraan yang terdaftar di sistem.
                </p>
              </div>
            ) : (
              /* Eksklusif Tampilan Papan Pinboard */
              <AchievementPinboardView
                achievements={achievements}
                onPreviewPhoto={(url, title) => setPreviewCert({ url, title })}
                canManageItem={canManageItem}
                onEditAchievement={onEditAchievement}
                onDeleteAchievement={onDeleteAchievement}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Piagam Asli Full Viewport Tanpa Card Luar (Portal ke Body) */}
      {typeof document !== "undefined" &&
        previewCert &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200"
            onClick={() => setPreviewCert(null)}
          >
            {/* Tombol Aksi Melayang di Pojok Kanan Atas Viewport */}
            <div
              className="fixed top-5 right-5 z-[100000] flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={previewCert.url}
                target="_blank"
                rel="noreferrer"
                title="Buka gambar penuh di tab baru"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                title="Tutup pratinjau"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Gambar Sertifikat Murni Tanpa Kotak/Card Luar Apapun */}
            <div
              className="relative max-h-[90vh] max-w-[94vw] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewCert.url}
                alt={previewCert.title}
                className="max-h-[88vh] max-w-[94vw] w-auto h-auto object-contain rounded-xl shadow-2xl select-none animate-in zoom-in-95 duration-200"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

