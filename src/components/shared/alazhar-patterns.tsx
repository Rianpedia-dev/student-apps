import React from "react";

interface PatternProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AlAzharMosaicStrip
 * Pita mozaik segitiga prisma warna-warni (merah, jingga, emas, hijau, sian, biru, ungu)
 * seperti pada bagian bawah sidebar dan header di mockup resmi Al-Azhar Cairo.
 */
export function AlAzharMosaicStrip({ className = "", style }: PatternProps) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full pointer-events-none select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Row 1 Triangles */}
      <polygon points="0,0 40,0 20,30" fill="#e11d48" />
      <polygon points="40,0 80,0 60,30" fill="#ea580c" />
      <polygon points="80,0 120,0 100,30" fill="#f59e0b" />
      <polygon points="120,0 160,0 140,30" fill="#10b981" />
      <polygon points="160,0 200,0 180,30" fill="#06b6d4" />
      <polygon points="200,0 240,0 220,30" fill="#0284c7" />
      <polygon points="240,0 280,0 260,30" fill="#7c3aed" />
      <polygon points="280,0 320,0 300,30" fill="#d946ef" />
      <polygon points="320,0 360,0 340,30" fill="#f43f5e" />
      <polygon points="360,0 400,0 380,30" fill="#f59e0b" />

      {/* Row 1 Inverted Triangles */}
      <polygon points="20,30 60,30 40,0" fill="#fbbf24" />
      <polygon points="60,30 100,30 80,0" fill="#34d399" />
      <polygon points="100,30 140,30 120,0" fill="#0ea5e9" />
      <polygon points="140,30 180,30 160,0" fill="#8b5cf6" />
      <polygon points="180,30 220,30 200,0" fill="#ec4899" />
      <polygon points="220,30 260,30 240,0" fill="#ef4444" />
      <polygon points="260,30 300,30 280,0" fill="#f97316" />
      <polygon points="300,30 340,30 320,0" fill="#10b981" />
      <polygon points="340,30 380,30 360,0" fill="#0284c7" />
      <polygon points="380,30 400,30 400,0" fill="#7c3aed" />
      <polygon points="0,0 20,30 0,30" fill="#f97316" />

      {/* Row 2 Triangles */}
      <polygon points="0,30 40,30 20,60" fill="#059669" />
      <polygon points="40,30 80,30 60,60" fill="#0284c7" />
      <polygon points="80,30 120,30 100,60" fill="#7c3aed" />
      <polygon points="120,30 160,30 140,60" fill="#d946ef" />
      <polygon points="160,30 200,30 180,60" fill="#e11d48" />
      <polygon points="200,30 240,30 220,60" fill="#f59e0b" />
      <polygon points="240,30 280,30 260,60" fill="#10b981" />
      <polygon points="280,30 320,30 300,60" fill="#06b6d4" />
      <polygon points="320,30 360,30 340,60" fill="#8b5cf6" />
      <polygon points="360,30 400,30 380,60" fill="#ea580c" />

      {/* Row 2 Inverted Triangles */}
      <polygon points="20,60 60,60 40,30" fill="#38bdf8" />
      <polygon points="60,60 100,60 80,30" fill="#a855f7" />
      <polygon points="100,60 140,60 120,30" fill="#f43f5e" />
      <polygon points="140,60 180,60 160,30" fill="#fbbf24" />
      <polygon points="180,60 220,60 200,30" fill="#34d399" />
      <polygon points="220,60 260,60 240,30" fill="#0284c7" />
      <polygon points="260,60 300,60 280,30" fill="#7c3aed" />
      <polygon points="300,60 340,60 320,30" fill="#ea580c" />
      <polygon points="340,60 380,60 360,30" fill="#10b981" />
      <polygon points="380,60 400,60 400,30" fill="#0ea5e9" />
      <polygon points="0,30 20,60 0,60" fill="#fbbf24" />
    </svg>
  );
}

/**
 * AlAzharCornerMosaic
 * Ornamen sudut kanan atas prisma segitiga warna-warni persis seperti di mockup header.
 */
export function AlAzharCornerMosaic({ className = "", style }: PatternProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      preserveAspectRatio="xMaxYMin meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <polygon points="160,0 100,0 130,40" fill="#f59e0b" />
      <polygon points="100,0 40,0 70,40" fill="#10b981" />
      <polygon points="40,0 0,0 20,40" fill="#0284c7" />

      <polygon points="130,40 160,0 160,60" fill="#e11d48" />
      <polygon points="70,40 130,40 100,0" fill="#f97316" />
      <polygon points="20,40 70,40 40,0" fill="#34d399" />

      <polygon points="160,60 110,60 140,100" fill="#7c3aed" />
      <polygon points="110,60 60,60 85,100" fill="#06b6d4" />
      <polygon points="140,100 160,60 160,120" fill="#d946ef" />
      <polygon points="85,100 140,100 110,60" fill="#fbbf24" />
      <polygon points="70,40 110,60 85,100" fill="#ea580c" />
      <polygon points="130,40 160,60 110,60" fill="#f43f5e" />
    </svg>
  );
}

/**
 * AlAzharMosqueWatermark
 * Siluet vektor halus menara & kubah masjid Al-Azhar yang disematkan di pojok header kartu.
 */
export function AlAzharMosqueWatermark({ className = "", style }: PatternProps) {
  return (
    <svg
      viewBox="0 0 140 50"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Minaret 1 (Far Left) */}
      <rect x="15" y="18" width="4" height="32" rx="0.5" />
      <rect x="13.5" y="16" width="7" height="2" rx="0.5" />
      <polygon points="15,16 19,16 17,6" />
      <circle cx="17" cy="5" r="1" />

      {/* Minaret 2 (Tall Left) */}
      <rect x="35" y="10" width="5" height="40" rx="0.5" />
      <rect x="33" y="18" width="9" height="2.5" rx="0.5" />
      <rect x="34" y="9" width="7" height="2" rx="0.5" />
      <polygon points="35,9 40,9 37.5,2" />
      <circle cx="37.5" cy="1.5" r="1.2" />

      {/* Side Dome Left */}
      <path d="M 45 50 L 45 35 Q 55 25 65 35 L 65 50 Z" />

      {/* Central Grand Dome */}
      <rect x="68" y="32" width="28" height="18" rx="1" />
      <path d="M 68 32 C 68 16 96 16 96 32 Z" />
      <polygon points="81,16 83,16 82,10" />
      <circle cx="82" cy="9" r="1.5" />

      {/* Side Dome Right */}
      <path d="M 99 50 L 99 35 Q 109 25 119 35 L 119 50 Z" />

      {/* Minaret 3 (Tall Right) */}
      <rect x="123" y="10" width="5" height="40" rx="0.5" />
      <rect x="121" y="18" width="9" height="2.5" rx="0.5" />
      <rect x="122" y="9" width="7" height="2" rx="0.5" />
      <polygon points="123,9 128,9 125.5,2" />
      <circle cx="125.5" cy="1.5" r="1.2" />
    </svg>
  );
}

/**
 * AlAzharSchoolBanner
 * Ilustrasi siluet masjid Al-Azhar warna-warni dengan moto resmi:
 * "PENDIDIKAN MODERN & INKLUSIF BERBASIS NILAI ISLAM"
 */
export function AlAzharSchoolBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-3 ${className}`}>
      {/* Mosque Silhouette with Logo Colors */}
      <svg
        viewBox="0 0 200 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-40 sm:w-48 h-auto mb-1.5"
      >
        {/* Minarets */}
        <polygon points="40,70 43,20 47,20 50,70" fill="#0284c7" />
        <polygon points="41,20 49,20 45,6" fill="#0ea5e9" />

        <polygon points="70,70 74,12 78,12 82,70" fill="#e11d48" />
        <polygon points="72,12 80,12 76,2" fill="#f43f5e" />

        <polygon points="120,70 124,12 128,12 132,70" fill="#f59e0b" />
        <polygon points="122,12 130,12 126,2" fill="#fbbf24" />

        <polygon points="152,70 155,20 159,20 162,70" fill="#7c3aed" />
        <polygon points="153,20 161,20 157,6" fill="#8b5cf6" />

        {/* Central Dome */}
        <path d="M 85 70 L 85 45 C 85 24 117 24 117 45 L 117 70 Z" fill="#059669" />
        <circle cx="101" cy="20" r="2.5" fill="#f59e0b" />

        {/* Small Domes */}
        <path d="M 52 70 L 52 50 C 52 38 72 38 72 50 L 72 70 Z" fill="#0284c7" />
        <path d="M 130 70 L 130 50 C 130 38 150 38 150 50 L 150 70 Z" fill="#10b981" />
      </svg>
      <span className="text-[11px] sm:text-xs font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
        Pendidikan Modern & Inklusif
      </span>
      <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-primary">
        Berbasis Nilai Islam
      </span>
    </div>
  );
}

/**
 * IslamicMosaicPattern (Subtle Watermark Background)
 */
export function IslamicMosaicPattern({ className = "", style }: PatternProps) {
  return (
    <svg
      className={`w-full h-full pointer-events-none select-none ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="alazhar-mosaic-pattern"
          width="160"
          height="160"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(15)"
        >
          <polygon points="0,0 80,0 40,40" fill="#f59e0b" opacity="0.12" />
          <polygon points="80,0 160,0 120,40" fill="#059669" opacity="0.12" />
          <polygon points="40,40 120,40 80,80" fill="#0284c7" opacity="0.12" />
          <polygon points="0,0 40,40 0,80" fill="#e11d48" opacity="0.10" />
          <polygon points="120,40 160,0 160,80" fill="#7c3aed" opacity="0.10" />
          <polygon points="0,80 80,80 40,120" fill="#f97316" opacity="0.12" />
          <polygon points="80,80 160,80 120,120" fill="#10b981" opacity="0.12" />
          <polygon points="40,120 120,120 80,160" fill="#0ea5e9" opacity="0.12" />
          <polygon points="0,80 40,120 0,160" fill="#d946ef" opacity="0.10" />
          <polygon points="160,80 120,120 160,160" fill="#f59e0b" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#alazhar-mosaic-pattern)" />
    </svg>
  );
}

/**
 * AlAzharSkylineSilhouette
 * Siluet menara & kubah masjid Al-Azhar yang membentang halus untuk watermark latar belakang bawah.
 */
export function AlAzharSkylineSilhouette({ className = "", style }: PatternProps) {
  return (
    <svg
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none select-none text-emerald-800/10 dark:text-emerald-400/10 ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Mosque Minarets and Domes Landscape */}
      <polygon points="50,200 55,60 62,60 67,200" />
      <polygon points="55,60 62,60 58.5,35" />
      <circle cx="58.5" cy="32" r="3" />

      <polygon points="120,200 126,30 134,30 140,200" />
      <polygon points="126,30 134,30 130,5" />
      <circle cx="130" cy="3" r="3.5" />

      {/* Domes */}
      <path d="M 150 200 L 150 120 C 150 80 210 80 210 120 L 210 200 Z" />
      <path d="M 220 200 L 220 90 C 220 40 320 40 320 90 L 320 200 Z" />
      <circle cx="270" cy="35" r="4.5" />

      <polygon points="340,200 346,45 354,45 360,200" />
      <polygon points="346,45 354,45 350,20" />
      <circle cx="350" cy="18" r="3" />

      {/* Central Grand Mosque Silhouette */}
      <path d="M 380 200 L 380 110 C 380 50 480 50 480 110 L 480 200 Z" />
      <polygon points="428,50 432,50 430,30" />
      <circle cx="430" cy="27" r="4" />

      <polygon points="510,200 516,30 524,30 530,200" />
      <polygon points="516,30 524,30 520,5" />
      <circle cx="520" cy="3" r="3.5" />

      <path d="M 545 200 L 545 120 C 545 80 605 80 605 120 L 605 200 Z" />

      <polygon points="630,200 635,70 642,70 647,200" />
      <polygon points="635,70 642,70 638.5,45" />
      <circle cx="638.5" cy="42" r="3" />

      <path d="M 660 200 L 660 130 C 660 95 720 95 720 130 L 720 200 Z" />

      <polygon points="745,200 750,55 757,55 762,200" />
      <polygon points="750,55 757,55 753.5,30" />
      <circle cx="753.5" cy="27" r="3" />
    </svg>
  );
}

/**
 * AlAzharPrismBadge
 */
export function AlAzharPrismBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center p-1.5 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 text-white shadow-xs ${className}`}
      aria-hidden="true"
    >
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </span>
  );
}

