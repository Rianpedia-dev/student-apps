"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  wasOffline: boolean;
  lastCheckedAt: Date | null;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  openModal: () => void;
  checkConnectivity: () => Promise<boolean>;
  resetWasOffline: () => void;
}

/**
 * Hook untuk mendeteksi status konektivitas internet secara akurat.
 * Mengombinasikan event browser (navigator.onLine) dengan HTTP HEAD ping ringan
 * untuk memastikan ketersediaan koneksi internet nyata (mengantisipasi captive portal).
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const isCheckingRef = useRef(false);

  /**
   * Menguji konektivitas nyata dengan mengirimkan HEAD request ke /api/health
   */
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;

    // Jika browser sendiri sudah melaporkan offline secara lokal, langsung false
    if (!navigator.onLine) {
      setIsOnline(false);
      setWasOffline(true);
      setLastCheckedAt(new Date());
      return false;
    }

    if (isCheckingRef.current) return isOnline;
    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      // AbortController dengan batas waktu 3500ms
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`/api/health?t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const online = response.ok;
      setIsOnline(online);
      if (!online) {
        setWasOffline(true);
      }
      setLastCheckedAt(new Date());
      return online;
    } catch {
      // Terjadi network error / timeout saat fetch
      setIsOnline(false);
      setWasOffline(true);
      setLastCheckedAt(new Date());
      return false;
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, [isOnline]);

  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  const openModal = useCallback(() => {
    setIsMinimized(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBrowserOnline = () => {
      // Saat browser mengindikasikan online kembali, verifikasi dengan ping nyata
      checkConnectivity();
    };

    const handleBrowserOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setIsMinimized(false);
      setLastCheckedAt(new Date());
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    return () => {
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
    };
  }, [checkConnectivity]);

  // Polling berkala setiap 6 detik HANYA saat kondisi sedang offline
  // agar jika internet kembali pulih, aplikasi langsung mendeteksi secara otomatis
  useEffect(() => {
    if (isOnline || typeof window === "undefined") return;

    const intervalId = setInterval(() => {
      checkConnectivity();
    }, 6000);

    return () => clearInterval(intervalId);
  }, [isOnline, checkConnectivity]);

  return {
    isOnline,
    isChecking,
    wasOffline,
    lastCheckedAt,
    isMinimized,
    setIsMinimized,
    openModal,
    checkConnectivity,
    resetWasOffline,
  };
}
