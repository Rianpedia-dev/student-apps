"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ServerCrash,
  RefreshCw,
  Home,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface SystemErrorStateProps {
  error?: Error & { digest?: string };
  title?: string;
  description?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  fullPage?: boolean;
  videoSrc?: string;
}

export function SystemErrorState({
  error,
  title,
  description,
  onRetry,
  showHomeButton = true,
  fullPage = false,
  videoSrc = "/videos/maitenets-vidio.mkv",
}: SystemErrorStateProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const digestId = error?.digest || "ERR_ALAZHAR_SYS_503";

  const displayTitle =
    title || "Afwan, Layanan Sistem Sedang Mengalami Kendala";

  const displayDescription =
    description ||
    "Qadarullah, sistem atau server basis data saat ini sedang mengalami kendala teknis atau dalam pemeliharaan berkala. Jangan khawatir ya, seluruh data akademik, nilai, dan tugas Ananda/Bapak/Ibu tetap aman tersimpan.";

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setIsRetrying(false), 600);
    }
  };

  const handleCopyDigest = async () => {
    try {
      await navigator.clipboard.writeText(digestId);
      setCopiedId(true);
      toast.success("Kode kendala berhasil disalin!");
      setTimeout(() => setCopiedId(false), 2500);
    } catch {
      toast.error("Gagal menyalin kode kendala");
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-8 w-full overflow-hidden ${
        fullPage ? "min-h-screen py-8 sm:py-12" : "min-h-[50vh] py-6 sm:py-8"
      }`}
    >
      {/* Lapisan Video Layar Penuh dengan Tint Gelap Halus */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center scale-105 opacity-90 filter contrast-[1.08] saturate-[1.1]"
        >
          <source src={videoSrc} type="video/x-matroska" />
          <source src={videoSrc} type="video/mp4" />
          <source src="/videos/maitenets-vidio.mp4" type="video/mp4" />
          <source src="/videos/2.mp4" type="video/mp4" />
        </video>
        {/* Tint Gelap Merata di Seluruh Layar */}
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[0.5px]" />
      </div>

      {/* Konten Utama Responsif (Mobile, Tablet, Desktop) - Digeser Sedikit ke Atas */}
      <div className="relative z-10 w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto flex flex-col items-center text-white px-2 sm:px-4 -translate-y-4 sm:-translate-y-8 md:-translate-y-12">
        {/* Ikon Utama Visual dengan Animasi Core Spin Loader */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-3 sm:mb-4">
          {/* Base Glow */}
          <div className="absolute inset-0 rounded-full blur-xl animate-pulse bg-emerald-400/25" />

          {/* Outer Dashed Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-emerald-400/40 animate-[spin_10s_linear_infinite]" />

          {/* Main Arc */}
          <div className="absolute inset-1 sm:inset-1.5 rounded-full border-2 border-transparent border-t-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-[spin_2s_linear_infinite]" />

          {/* Reverse Arc */}
          <div className="absolute inset-2.5 sm:inset-3 rounded-full border-2 border-transparent border-b-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)] animate-[spin_3s_linear_infinite_reverse]" />

          {/* Inner Fast Ring */}
          <div className="absolute inset-4 sm:inset-5 rounded-full border border-transparent border-l-emerald-300/70 animate-[spin_1s_ease-in-out_infinite]" />

          {/* Orbital Dot */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          </div>

          {/* Center Icon Box */}
          <div className="relative z-10 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-emerald-400/50 bg-emerald-950/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md">
            <ServerCrash className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Badge Status Ramah & Islami */}
        <div className="mb-3 sm:mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-emerald-400/50 bg-emerald-950/70 text-emerald-200 shadow-md backdrop-blur-md">
            <span className="tracking-wide">بِسْمِ اللَّهِ • Pemulihan Layanan Sistem & Basis Data</span>
          </span>
        </div>

        {/* Judul Utama - Responsif & Tajam */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] max-w-xl">
          {displayTitle}
        </h2>

        {/* Penjelasan / Deskripsi */}
        <p className="text-xs sm:text-sm md:text-base text-white/95 font-medium mt-2.5 sm:mt-3 max-w-md sm:max-w-lg md:max-w-xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {displayDescription}
        </p>

        {/* Kotak Kode ID Kendala / Tiket (Floating Capsule Ramping & Responsif) */}
        <div className="mt-5 sm:mt-6 w-full max-w-xs sm:max-w-sm md:max-w-md flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden min-w-0">
            <span className="font-mono text-[10px] sm:text-[11px] text-white font-bold shrink-0">
              ID Kendala:
            </span>
            <span
              className="font-mono text-[10px] sm:text-[11px] truncate text-emerald-300 font-semibold"
              title={digestId}
            >
              {digestId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyDigest}
            className="h-7 px-2.5 rounded-lg text-[11px] sm:text-xs flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border border-white/30 font-semibold transition-all cursor-pointer shadow-xs backdrop-blur-sm shrink-0"
            title="Salin ID Kendala"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300 font-semibold">Disalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/90" />
                <span>Salin ID</span>
              </>
            )}
          </button>
        </div>

        {/* Tombol Aksi Utama (Responsif: Full width di Mobile, Baris di iPad & Desktop) */}
        <div className="mt-5 sm:mt-6 w-full max-w-xs sm:max-w-md flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
          {/* Tombol 1: Coba Muat Ulang */}
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto h-11 sm:h-10 px-5 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-950/60 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
              />
              <span>
                {isRetrying ? "Sedang Memeriksa..." : "Muat Ulang"}
              </span>
            </button>
          )}

          {/* Tombol 2: Kembali ke Beranda */}
          {showHomeButton && (
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full sm:w-auto h-11 sm:h-10 px-4 sm:px-5 rounded-xl flex items-center justify-center gap-2 border border-white/30 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold shadow-md transition-all duration-200 cursor-pointer text-xs sm:text-sm backdrop-blur-md"
            >
              <Home className="w-4 h-4 text-white" />
              <span>Beranda</span>
            </button>
          )}
        </div>

        {/* Footer Sub-Note */}
        <div className="mt-6 sm:mt-8 pt-4 border-t border-white/15 w-full max-w-sm sm:max-w-md text-[10px] sm:text-[11px] text-white/80 font-medium flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 drop-shadow-md">
          <span>Student Apps</span>
          <span>•</span>
          <span>SD & SMP Islam Al-Azhar Cairo Palembang</span>
        </div>
      </div>
    </div>
  );
}

export default SystemErrorState;
