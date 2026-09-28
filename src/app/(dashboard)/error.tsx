"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        Gagal Memuat Halaman Dashboard
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Terjadi kendala saat mengambil data dashboard atau koneksi ke database. Silakan coba muat ulang atau periksa status koneksi.
      </p>
      {error.digest && (
        <span className="text-[11px] font-mono text-muted-foreground/70 bg-muted px-2.5 py-1 rounded-md mb-6 border border-border">
          Digest ID: {error.digest}
        </span>
      )}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Muat Ulang Halaman</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/login")}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Login</span>
        </Button>
      </div>
    </div>
  );
}
