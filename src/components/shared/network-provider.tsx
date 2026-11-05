"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useNetworkStatus, type NetworkStatus } from "@/hooks/use-network-status";
import { OfflineModal } from "@/components/shared/offline-modal";
import { toast } from "sonner";

const NetworkContext = createContext<NetworkStatus | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const network = useNetworkStatus();
  const { isOnline, wasOffline, resetWasOffline } = network;

  // Pantau pemulihan koneksi (offline -> online) untuk menampilkan toast syukuran
  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.success("Alhamdulillah! Koneksi Kembali Terhubung", {
        description: "Kamu sudah dapat melanjutkan aktivitas belajar dan tugasmu seperti biasa.",
        duration: 4000,
      });
      resetWasOffline();
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  return (
    <NetworkContext.Provider value={network}>
      {children}
      <OfflineModal />
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork harus digunakan di dalam NetworkProvider");
  }
  return context;
}
