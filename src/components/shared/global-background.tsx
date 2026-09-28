import React from "react";
import {
  IslamicMosaicPattern,
  AlAzharSkylineSilhouette,
} from "./alazhar-patterns";

/**
 * GlobalBackground
 * Latar belakang kanvas putih bersih (porcelain white) modern khas portal resmi Al-Azhar Cairo:
 * - Layer 1: School Heritage Photographic Base halus (/bc.avif)
 * - Layer 2: Subtle Warm Ambient Glows (Amber & Emerald)
 * - Layer 3: Islamic Low-Poly Geometric Tessellation Watermark
 * - Layer 4: Mosque Skyline Silhouette
 * - Layer 5: High-Contrast Porcelain Scrim (Clean & Crisp)
 */
export function GlobalBackground() {
  return (
    <div
      className="fixed inset-0 -z-20 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Base Image Layer (Foto Kampus Halus) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out opacity-25 brightness-[1.02] contrast-[0.96] dark:opacity-15 dark:brightness-[0.55] dark:contrast-[1.10]"
        style={{
          backgroundImage: "url('/bc.avif')",
        }}
      />

      {/* 2. Soft Ambient Chroma Glows (Sentuhan Emas & Zamrud Al-Azhar) */}
      <div className="absolute inset-0 transition-opacity duration-700">
        {/* Top-Right: Warm Amber & Gold */}
        <div className="absolute -top-28 -right-28 w-96 h-96 sm:w-[32rem] sm:h-[32rem] rounded-full bg-gradient-to-bl from-amber-400/12 via-yellow-500/06 to-transparent blur-3xl dark:from-amber-500/10 dark:via-yellow-600/05" />

        {/* Bottom-Left: Emerald Mint */}
        <div className="absolute -bottom-32 -left-20 w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full bg-gradient-to-tr from-emerald-500/12 via-teal-500/06 to-transparent blur-3xl dark:from-emerald-600/10 dark:via-teal-700/05" />
      </div>

      {/* 3. Layer Mozaik Poligonal Geometris Prisma */}
      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] mix-blend-multiply dark:mix-blend-screen transition-opacity duration-700">
        <IslamicMosaicPattern />
      </div>

      {/* 4. Layer Watermark Siluet Menara & Kubah Masjid Al-Azhar */}
      <div className="absolute -bottom-6 right-0 sm:right-6 w-[85vw] sm:w-[50vw] max-w-3xl h-60 sm:h-72 opacity-[0.06] dark:opacity-[0.09] transition-opacity duration-700">
        <AlAzharSkylineSilhouette />
      </div>

      {/* 5. Clean Porcelain Scrim (Menjaga kontras teks 100% tajam, putih bersih & cerah) */}
      <div className="absolute inset-0 transition-colors duration-700 ease-in-out bg-gradient-to-b from-slate-50/85 via-white/80 to-slate-100/90 dark:from-slate-950/85 dark:via-slate-900/80 dark:to-slate-950/90" />
    </div>
  );
}

