"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoader } from "./page-loader";

interface RouteTransitionOverlayProps {
  children: React.ReactNode;
}

export function RouteTransitionOverlay({ children }: RouteTransitionOverlayProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string>("");
  const [, startTransition] = useTransition();

  // Reset loading state setiap kali pathname atau searchParams berhasil berpindah
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Intercept klik pada link internal untuk memberikan instant feedback
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Abaikan jika klik dengan tombol selain tombol kiri utama
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Abaikan hash links, external links, javascript:, download, atau new tab
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target.getAttribute("target") === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        // Pastikan link berada di domain yang sama
        if (url.origin === window.location.origin) {
          const currentUrl = window.location.pathname + window.location.search;
          const destinationUrl = url.pathname + url.search;

          // Jika URL tujuan berbeda dengan halaman saat ini, trigger animasi loading
          if (destinationUrl !== currentUrl) {
            setTargetPath(url.pathname);
            startTransition(() => {
              setIsNavigating(true);
            });
          }
        }
      } catch {}
    };

    document.addEventListener("click", handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, []);

  // Safety timer: Otomatis matikan loading jika dalam 8 detik navigasi tidak selesai (misal dibatalkan)
  useEffect(() => {
    if (!isNavigating) return;

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  // Tentukan pesan berdasarkan rute tujuan
  const getLoadingMessage = (path: string) => {
    if (path.startsWith("/admin")) return "Memuat data administrasi...";
    if (path.startsWith("/guru")) return "Memuat data akademik & kelas...";
    if (path.startsWith("/siswa")) return "Memuat materi & jadwal belajar...";
    return "Memuat halaman...";
  };

  return (
    <div className="relative flex-1 flex flex-col w-full min-w-0">
      {/* Seamless in-content loading overlay */}
      {isNavigating && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 backdrop-blur-[2px] transition-all duration-300 animate-in fade-in rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="py-12">
            <PageLoader
              message={getLoadingMessage(targetPath || pathname)}
              subMessage="SD - SMP Islam Al-Azhar Cairo Palembang"
              fullScreen={false}
            />
          </div>
        </div>
      )}

      {/* Konten Halaman */}
      <div className={isNavigating ? "opacity-30 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200 flex-1 flex flex-col"}>
        {children}
      </div>
    </div>
  );
}
