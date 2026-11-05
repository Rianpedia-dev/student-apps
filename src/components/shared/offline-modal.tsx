"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Minimize2,
  Maximize2,
  HelpCircle,
  Radio,
  Sparkles,
} from "lucide-react";
import { useNetwork } from "@/components/shared/network-provider";
import { Button } from "@/components/ui/button";

export function OfflineModal() {
  const {
    isOnline,
    isChecking,
    checkConnectivity,
    isMinimized,
    setIsMinimized,
    openModal,
  } = useNetwork();

  const [lastCheckFailed, setLastCheckFailed] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Jika kondisi sedang online, tidak perlu merender apa pun
  if (isOnline) {
    return null;
  }

  const handleManualCheck = async () => {
    setLastCheckFailed(false);
    const success = await checkConnectivity();
    if (!success) {
      setLastCheckFailed(true);
      setTimeout(() => setLastCheckFailed(false), 3500);
    }
  };

  return (
    <AnimatePresence>
      {/* TAMPILAN 1: MINIMIZED FLOATING PILL (Jika pengguna mengecilkan modal) */}
      {isMinimized ? (
        <motion.aside
          aria-label="Notifikasi Jaringan Offline"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] sm:w-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-background/95 backdrop-blur-md border border-amber-500/40 shadow-xl shadow-amber-500/10 text-foreground">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-30 animate-ping" />
              <WifiOff className="w-4 h-4 relative" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                Mode Offline
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </span>
              <span className="text-[11px] text-muted-foreground line-clamp-1">
                Data di layar tetap aman
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto pl-2 border-l border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="h-8 px-2.5 text-xs font-medium hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:text-amber-800"
                title="Cek koneksi internet"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1 ${isChecking ? "animate-spin" : ""}`}
                />
                <span>{isChecking ? "Mengecek..." : "Coba Sambung"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={openModal}
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                title="Buka panduan lengkap"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.aside>
      ) : (
        /* TAMPILAN 2: MODAL LENGKAP & RAMAH (Tampilan Standar Saat Terputus) */
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="offline-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop Blur Lembut */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Kotak Dialog Ramah */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg rounded-3xl bg-card text-card-foreground border border-amber-500/30 shadow-2xl overflow-hidden z-10"
          >
            {/* Header Visual Lembut Bertema Al-Azhar */}
            <div className="relative pt-8 pb-4 px-6 text-center bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent">
              {/* Tombol Minimize di Pojok Kanan Atas */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Kecilkan tampilan agar bisa melihat halaman"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              {/* Ikon Utama dengan Efek Denyut Halus */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <span className="absolute inline-flex h-20 w-20 rounded-full bg-amber-500/20 animate-ping opacity-60" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-600/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-inner">
                  <WifiOff className="w-8 h-8" />
                </div>
              </div>

              {/* Judul & Pesan Ramah Pengguna */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                Jaringan Internet Terputus Sejenak
              </span>

              <h2 id="offline-dialog-title" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Koneksi Internetmu Terputus
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                Jangan khawatir ya! Kami menjaga sesi dan data belajarmu tetap aman. Kami sedang menunggu koneksi internet perangkatmu tersambung kembali.
              </p>
            </div>

            {/* Kotak Kepastian & Jaminan Keamanan Data */}
            <div className="px-6 py-2">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Data Kamu Aman
                  </p>
                  <p className="text-muted-foreground dark:text-emerald-300/80 mt-0.5">
                    Halaman tidak di-refresh sehingga isian atau jawaban yang sedang kamu buat tidak hilang.
                  </p>
                </div>
              </div>
            </div>

            {/* Panduan Ringkas & Tips Mudah */}
            <div className="px-6 py-3">
              <button
                type="button"
                onClick={() => setShowTips((prev) => !prev)}
                className="w-full flex items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span className="flex items-center gap-1.5 text-foreground/80 group-hover:text-foreground">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  Tips cepat mengembalikan koneksi internet
                </span>
                <span className="text-[11px] underline text-primary">
                  {showTips ? "Sembunyikan" : "Lihat Tips"}
                </span>
              </button>

              <AnimatePresence>
                {showTips && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className="space-y-2 p-3.5 rounded-2xl bg-muted/60 border border-border/80 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Pastikan saklar <strong>Wi-Fi</strong> atau <strong>Paket Data</strong> pada perangkat ponsel/laptopmu sudah aktif.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Coba aktifkan <strong>Mode Pesawat (Airplane Mode)</strong> selama 5 detik, lalu matikan kembali.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Jika memakai Wi-Fi sekolah atau rumah, pastikan sinyal router terjangkau dengan baik.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Indikator Jika Cek Manual Gagal */}
            {lastCheckFailed && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mb-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs text-center font-medium"
              >
                Koneksi internet belum terdeteksi. Silakan periksa jaringan Anda lalu coba lagi ya.
              </motion.div>
            )}

            {/* Tombol Aksi Bawah */}
            <div className="p-6 pt-2 space-y-3 bg-muted/20">
              <Button
                onClick={handleManualCheck}
                disabled={isChecking}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
                />
                <span>
                  {isChecking
                    ? "Sedang Memeriksa Koneksi..."
                    : "Coba Hubungkan Kembali"}
                </span>
              </Button>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mengecek otomatis setiap beberapa detik
                </span>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Lihat halaman sementara
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

