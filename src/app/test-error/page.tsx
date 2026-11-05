"use client";

import React, { useState } from "react";
import { SystemErrorState } from "@/components/shared/system-error-state";
import { AlertTriangle } from "lucide-react";

export default function TestErrorPage() {
  const [shouldCrash, setShouldCrash] = useState(false);

  // Jika tombol Uji Crash Nyata ditekan, lempar error sungguhan agar ditangkap error.tsx
  if (shouldCrash) {
    throw new Error("Simulasi Error Runtime: Layanan database/sistem gagal memproses permintaan.");
  }

  const sampleError: Error & { digest?: string } = Object.assign(
    new Error("Can't reach database server at mariadb (PrismaClientInitializationError)"),
    {
      name: "DatabaseSystemError",
      digest: "ERR_ALAZHAR_IT_SUPPORT_9921",
    }
  );

  return (
    <div className="min-h-screen text-gray-900 relative flex flex-col justify-between">
      {/* Tampilan Tunggal Halaman Error Sistem & Basis Data Lengkap dengan Background Video */}
      <main className="flex-1 flex items-center justify-center p-4">
        <SystemErrorState
          fullPage
          error={sampleError}
          onRetry={() => {
            alert("Simulasi: Sedang mencoba memuat ulang layanan...");
          }}
        />
      </main>

      {/* Bar Pengujian Developer Ringkas di Bagian Bawah */}
      <footer className="relative z-20 p-3 text-center border-t border-white/20 bg-white/75 backdrop-blur-md">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
          <span>Mode Pratinjau Pengembang</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShouldCrash(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            title="Uji coba error boundary asli Next.js"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Uji Error Boundary Nyata</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
