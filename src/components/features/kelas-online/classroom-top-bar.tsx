"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Tv,
  HelpCircle,
  Loader2,
  LogOut,
  ScreenShare,
  StopCircle,
  ExternalLink,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useKelasOnline } from "./kelas-online-context";
import { AlAzharCornerMosaic } from "@/components/shared/alazhar-patterns";

interface ClassroomTopBarProps {
  role: "guru" | "siswa" | "admin";
  onEndClass?: () => Promise<void>;
  isEnding?: boolean;
}

export function ClassroomTopBar({
  role,
  onEndClass,
  isEnding = false,
}: ClassroomTopBarProps) {
  const {
    activeSession,
    viewState,
    isSharingScreen,
    toggleScreenShare,
    minimize,
    toggleFullscreen,
    toggleTheater,
    openHelp,
    leaveSession,
  } = useKelasOnline();

  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  if (!activeSession) return null;

  const handleExitClick = () => {
    setConfirmExitOpen(true);
  };

  const handleConfirmExit = async () => {
    setConfirmExitOpen(false);
    if (role === "guru" && onEndClass) {
      await onEndClass();
    } else {
      await leaveSession();
    }
  };

  const embedUrl = activeSession.token
    ? `${activeSession.roomUrl}?t=${activeSession.token}`
    : activeSession.roomUrl;

  const iconBtnClass =
    "h-7 w-7 sm:h-8 sm:w-8 rounded-xl cursor-pointer transition-colors shrink-0";

  return (
    <>
      <div className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 px-2.5 py-2 sm:px-4 sm:py-2 shrink-0 backdrop-blur-md">
        {/* Al-Azhar Corner Prism Accent */}
        <AlAzharCornerMosaic className="absolute top-0 right-0 w-24 h-12 pointer-events-none opacity-40 select-none z-0" />

        {/* Single-Row Classroom Header & Icon Action Toolbar */}
        <div className="relative z-10 flex items-center justify-between gap-2 min-w-0 overflow-x-auto no-scrollbar">
          {/* Left: Back Arrow */}
          <div className="flex items-center shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleExitClick}
              title="Kembali / Keluar Kelas"
              aria-label="Kembali / Keluar Kelas"
              className="shrink-0 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-xl h-7 w-7 sm:h-8 sm:w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Icon-Only Classroom Tools, View Modes, and End/Leave Button */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Tombol Bagikan Layar */}
            <Button
              variant={isSharingScreen ? "destructive" : "outline"}
              size="icon-sm"
              onClick={toggleScreenShare}
              className={`${iconBtnClass} transition-all duration-200 ${
                isSharingScreen
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm ring-2 ring-rose-400/50 animate-pulse"
                  : "border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
              }`}
              title={isSharingScreen ? "Hentikan Berbagi Layar" : "Bagikan Layar"}
              aria-label={isSharingScreen ? "Hentikan Berbagi Layar" : "Bagikan Layar"}
            >
              {isSharingScreen ? (
                <StopCircle className="h-4 w-4 text-white" />
              ) : (
                <ScreenShare className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              )}
            </Button>

            {/* Petunjuk Bantuan Non-IT / Siswa */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={openHelp}
              className={`${iconBtnClass} border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/30`}
              title="Bantuan & Petunjuk Belajar"
              aria-label="Bantuan & Petunjuk Belajar"
            >
              <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </Button>

            {/* Minimize / Perkecil */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={minimize}
              className={`${iconBtnClass} border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300`}
              title="Perkecil ke pojok layar"
              aria-label="Perkecil ke pojok layar"
            >
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Mode Teater / Fokus */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheater}
              className={`${iconBtnClass} ${
                viewState === "theater"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              title={viewState === "theater" ? "Mode Normal" : "Mode Fokus"}
              aria-label={viewState === "theater" ? "Mode Normal" : "Mode Fokus"}
            >
              <Tv className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Fullscreen / Layar Penuh */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleFullscreen}
              className={`${iconBtnClass} ${
                viewState === "fullscreen"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              title={viewState === "fullscreen" ? "Keluar Layar Penuh" : "Layar Penuh"}
              aria-label={viewState === "fullscreen" ? "Keluar Layar Penuh" : "Layar Penuh"}
            >
              <Maximize2
                className={`h-4 w-4 ${
                  viewState === "fullscreen" ? "text-white" : "text-muted-foreground"
                }`}
              />
            </Button>

            {/* Open in New Tab */}
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di Tab Terpisah"
              aria-label="Buka di Tab Terpisah"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                iconBtnClass,
                "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            {/* End Class (Guru) or Leave Class (Siswa) */}
            {role === "guru" ? (
              <Button
                onClick={handleExitClick}
                disabled={isEnding}
                variant="destructive"
                size="icon-sm"
                title={isEnding ? "Mengakhiri kelas..." : "Akhiri Kelas"}
                aria-label={isEnding ? "Mengakhiri kelas..." : "Akhiri Kelas"}
                className={`${iconBtnClass} shadow-xs bg-rose-600 hover:bg-rose-700 text-white`}
              >
                {isEnding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                onClick={handleExitClick}
                variant="outline"
                size="icon-sm"
                title="Keluar Kelas"
                aria-label="Keluar Kelas"
                className={`${iconBtnClass} border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 shadow-xs`}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {role === "guru" ? "Akhiri Kelas Online?" : "Keluar dari Ruang Belajar?"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {role === "guru"
                ? "Semua siswa akan dikeluarkan dari ruangan dan durasi pembelajaran akan dicatat secara otomatis."
                : "Ananda akan meninggalkan kelas online ini. Jika ingin membuka menu lain tanpa keluar, Ananda bisa memilih tombol 'Perkecil' saja."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmExitOpen(false);
                minimize();
              }}
              className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
            >
              <Minimize2 className="h-4 w-4 mr-1.5" />
              Perkecil Saja (Tetap Terhubung)
            </Button>

            <Button
              variant={role === "guru" ? "destructive" : "default"}
              onClick={handleConfirmExit}
              className={`rounded-xl font-bold cursor-pointer ${
                role === "siswa"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }`}
            >
              {role === "guru" ? "Ya, Akhiri Kelas" : "Ya, Keluar Kelas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Full-bleed classroom workspace connecting the single-row top bar and video anchor without nested card borders.
 */
export function ClassroomRoomFrame({
  role,
  onEndClass,
  isEnding = false,
}: ClassroomTopBarProps) {
  return (
    <div className="flex flex-col flex-1 w-full h-full min-h-0 overflow-hidden bg-white dark:bg-slate-950">
      <ClassroomTopBar
        role={role}
        onEndClass={onEndClass}
        isEnding={isEnding}
      />

      <div
        id="kelas-video-anchor"
        className="w-full flex-1 min-h-0 bg-slate-950/5 relative"
      />
    </div>
  );
}
