"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Home, WifiOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SystemErrorState } from "@/components/shared/system-error-state";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("[Root Error Boundary Caught]:", error);
  }, [error]);

  const isOffline =
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("failed to fetch");

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsRetrying(false);
        return;
      }
      reset();
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  // KASUS 1: Error Akibat Koneksi Jaringan / Offline
  if (isOffline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
          <span className="absolute inline-flex h-full w-full rounded-2xl bg-amber-400 opacity-20 animate-ping" />
          <WifiOff className="w-8 h-8 relative" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-2">
          <Radio className="w-3 h-3 animate-pulse text-amber-600" />
          Jaringan Terputus
        </span>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Koneksi Internetmu Terputus
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Kami mendeteksi perangkatmu sedang tidak terhubung ke jaringan internet. Silakan periksa koneksi Wi-Fi atau paket datamu ya.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Memeriksa..." : "Coba Muat Ulang"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Ke Halaman Utama</span>
          </Button>
        </div>
      </div>
    );
  }

  // KASUS 2: Error Akibat Sistem atau Database
  return (
    <SystemErrorState
      error={error}
      onRetry={reset}
      fullPage
      videoSrc="/videos/maitenets-vidio.mkv"
    />
  );
}
