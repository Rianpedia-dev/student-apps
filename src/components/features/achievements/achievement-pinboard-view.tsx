"use client";

import React, { useMemo } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

export interface AchievementHistoryItem {
  id: string;
  id_user: string;
  nama: string;
  kelas: string;
  kelas_saat_prestasi: string;
  tahun_ajaran: string;
  tingkat: string;
  peringkat: string;
  poin: number;
  fotoanak: string;
  prestasi: string;
  tanggal_prestasi: string | null;
  created_at: string | null;
}

interface AchievementPinboardViewProps {
  achievements: AchievementHistoryItem[];
  onPreviewPhoto?: (photoUrl: string, title: string) => void;
  canManageItem?: (item: AchievementHistoryItem) => boolean;
  onEditAchievement?: (item: AchievementHistoryItem) => void;
  onDeleteAchievement?: (item: AchievementHistoryItem) => void;
  className?: string;
}

// Palet warna-warni solid untuk kartu pinboard (warna solid, cerah, elegan)
const SOLID_CARD_PALETTES = [
  {
    name: "amber",
    outerBg: "bg-amber-500 dark:bg-amber-600",
    outerBorder: "border-amber-600/80 dark:border-amber-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(245,158,11,0.35)]",
    innerBg: "bg-amber-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-amber-200/90 dark:border-amber-500/30",
  },
  {
    name: "blue",
    outerBg: "bg-blue-600 dark:bg-blue-600",
    outerBorder: "border-blue-700/80 dark:border-blue-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(37,99,235,0.35)]",
    innerBg: "bg-blue-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-blue-200/90 dark:border-blue-500/30",
  },
  {
    name: "purple",
    outerBg: "bg-purple-600 dark:bg-purple-600",
    outerBorder: "border-purple-700/80 dark:border-purple-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(147,51,234,0.35)]",
    innerBg: "bg-purple-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-purple-200/90 dark:border-purple-500/30",
  },
  {
    name: "emerald",
    outerBg: "bg-emerald-600 dark:bg-emerald-600",
    outerBorder: "border-emerald-700/80 dark:border-emerald-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(5,150,105,0.35)]",
    innerBg: "bg-emerald-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-emerald-200/90 dark:border-emerald-500/30",
  },
  {
    name: "rose",
    outerBg: "bg-rose-500 dark:bg-rose-600",
    outerBorder: "border-rose-600/80 dark:border-rose-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(244,63,94,0.35)]",
    innerBg: "bg-rose-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-rose-200/90 dark:border-rose-500/30",
  },
  {
    name: "teal",
    outerBg: "bg-teal-600 dark:bg-teal-600",
    outerBorder: "border-teal-700/80 dark:border-teal-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(13,148,136,0.35)]",
    innerBg: "bg-teal-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-teal-200/90 dark:border-teal-500/30",
  },
  {
    name: "indigo",
    outerBg: "bg-indigo-600 dark:bg-indigo-600",
    outerBorder: "border-indigo-700/80 dark:border-indigo-500/80",
    outerShadow: "shadow-[0px_10px_25px_0px_rgba(79,70,229,0.35)]",
    innerBg: "bg-indigo-50/95 dark:bg-neutral-950/90",
    innerBorder: "border-indigo-200/90 dark:border-indigo-500/30",
  },
];

// Ikon Pushpin Jarum Pentul persis seperti referensi komponen
const Pin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

// Format tanggal Indonesia yang ringkas & bersih tanpa nama hari (contoh: "5 November 2026")
function formatCleanDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Helper pemetaan varian badge ke @/components/ui/badge
function getTingkatBadgeVariant(tingkat: string): "purple" | "rose" | "blue" | "emerald" {
  const lower = (tingkat || "").toLowerCase();
  if (lower.includes("internasional")) return "purple";
  if (lower.includes("nasional")) return "rose";
  if (lower.includes("daerah") || lower.includes("kota")) return "blue";
  return "emerald";
}

function getPeringkatBadgeVariant(peringkat: string): "amber" | "secondary" | "orange" | "teal" {
  const lower = (peringkat || "").toLowerCase();
  if (lower.includes("1")) return "amber";
  if (lower.includes("2")) return "secondary";
  if (lower.includes("3")) return "orange";
  return "teal";
}

export function AchievementPinboardView({
  achievements,
  onPreviewPhoto,
  canManageItem,
  onEditAchievement,
  onDeleteAchievement,
  className,
}: AchievementPinboardViewProps) {
  // Urutkan otomatis: prestasi terbaru selalu berada di paling atas
  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      const timeA = a.tanggal_prestasi ? new Date(a.tanggal_prestasi).getTime() : 0;
      const timeB = b.tanggal_prestasi ? new Date(b.tanggal_prestasi).getTime() : 0;
      if (timeA > 0 && timeB > 0 && timeA !== timeB) {
        return timeB - timeA;
      }
      if (a.tahun_ajaran && b.tahun_ajaran && a.tahun_ajaran !== b.tahun_ajaran) {
        return b.tahun_ajaran.localeCompare(a.tahun_ajaran);
      }
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (createA !== createB) {
        return createB - createA;
      }
      return Number(b.id) - Number(a.id);
    });
  }, [achievements]);

  const count = sortedAchievements.length;

  // Hitung total tinggi kanvas desktop secara dinamis
  const desktopHeight = useMemo(() => {
    if (count <= 1) return 460;
    if (count === 2) return 560;
    if (count === 3) return 920;
    if (count === 4) return 1060;
    return Math.ceil(count / 2) * 500 + 160;
  }, [count]);

  // Kalkulasi kurva SVG garis putus-putus berliku (Winding Path)
  const svgWindingPath = useMemo(() => {
    if (count <= 1) return "";

    let path = "";
    for (let i = 0; i < count - 1; i++) {
      const isCurrentRight = i % 2 === 1;
      const isNextRight = (i + 1) % 2 === 1;

      // Titik tengah kartu awal
      const x1 = isCurrentRight ? 720 : 280;
      const y1 = isCurrentRight
        ? Math.floor(i / 2) * 500 + 340
        : Math.floor(i / 2) * 500 + 200;

      // Titik tengah kartu berikutnya
      const x2 = isNextRight ? 720 : 280;
      const y2 = isNextRight
        ? Math.floor((i + 1) / 2) * 500 + 340
        : Math.floor((i + 1) / 2) * 500 + 200;

      if (i === 0) {
        // 1 -> 2 (Kiri ke Kanan)
        path = `M ${x1} ${y1} C 500 ${y1}, 550 ${y2}, ${x2} ${y2}`;
      } else if (!isCurrentRight) {
        // Kiri ke Kanan
        path += ` C 500 ${y1}, 550 ${y2}, ${x2} ${y2}`;
      } else {
        // Kanan ke Kiri
        const midY = (y1 + y2) / 2;
        path += ` C 850 ${y1}, 500 ${midY}, ${x2} ${y2}`;
      }
    }

    return path;
  }, [count]);

  if (count === 0) {
    return (
      <div className="py-24 text-center text-muted-foreground italic">
        Belum ada catatan kejuaraan yang disematkan pada papan ini.
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={`relative w-full py-8 sm:py-12 px-4 sm:px-6 select-none ${className || ""}`}
      >
        {/* CSS Scoped untuk memastikan Absolute Position aktif khusus Desktop & Tablet (md ke atas) */}
        <style>{`
          @media (min-width: 768px) {
            .pinboard-desktop-item {
              position: absolute !important;
            }
          }
        `}</style>

        {/* Latar Belakang Kertas Buku Bergaris (Lined Paper Background) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.14]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px)",
            backgroundSize: "100% 32px",
            marginTop: "4px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-[0.08]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "100% 32px",
            marginTop: "4px",
          }}
        />

        {/* Gradien Fade di Tepi Kiri & Kanan (Side Vignettes) */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r z-1" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l z-1" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="relative w-full max-w-[1000px] mx-auto flex flex-col space-y-8 md:space-y-0 md:block"
            style={
              {
                minHeight:
                  typeof window !== "undefined" && window.innerWidth >= 768
                    ? `${desktopHeight}px`
                    : "auto",
              } as React.CSSProperties
            }
          >
            {/* SVG Connecting Animated Winding Dashed Path (Tampil di Layar Tablet & Desktop md+) */}
            {count > 1 && svgWindingPath && (
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block z-0"
                viewBox={`0 0 1000 ${desktopHeight}`}
                preserveAspectRatio="none"
              >
                <m.path
                  d={svgWindingPath}
                  stroke="currentColor"
                  className="text-amber-500/40 dark:text-amber-400/30"
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                  fill="none"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -140 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </svg>
            )}

            {/* Render Kartu-Kartu Pinboard (Terurut Otomatis dari yang Terbaru) */}
            {sortedAchievements.map((item, index) => {
              const hasPhoto =
                item.fotoanak &&
                !item.fotoanak.includes("trophy") &&
                !item.fotoanak.includes("best-student") &&
                !item.fotoanak.includes("best-point");

              // Pilih skema palet warna solid dinamis (Warna-Warni Solid)
              const palette = SOLID_CARD_PALETTES[index % SOLID_CARD_PALETTES.length];

              // Posisi & Rotasi kartu
              const isRight = index % 2 === 1;
              const rowIndex = Math.floor(index / 2);
              const topOffset = rowIndex * 500 + (isRight ? 150 : 0);
              const rotateClass = isRight ? "-rotate-6" : "rotate-6";

              // Kalkulasi Style Desktop
              const desktopStyle: React.CSSProperties =
                count === 1
                  ? {
                      top: "20px",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }
                  : {
                      top: `${topOffset}px`,
                      left: isRight ? undefined : "10%",
                      right: isRight ? "10%" : undefined,
                    };

              return (
                <div
                  key={item.id}
                  style={desktopStyle}
                  className={`pinboard-desktop-item relative w-full max-w-[380px] mx-auto md:w-[350px] lg:w-[380px] transition-transform duration-300 hover:z-30 hover:scale-105 hover:rotate-0 ${rotateClass}`}
                >
                  {/* Polaroid Solid Color Card Container (Warna-Warni yang Solid) */}
                  <div
                    className={`group ${palette.outerBg} p-2.5 sm:p-3 rounded-[24px] ${palette.outerShadow} border ${palette.outerBorder} transition-all duration-300 hover:shadow-[0px_16px_36px_0px_rgba(0,0,0,0.35)] flex flex-col`}
                  >
                    {/* Pushpin Jarum Pentul Putih 3D di Bagian Atas */}
                    <Pin className="w-8 h-8 text-white z-20 mb-3 mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />

                    {/* Pastel Inner Note dengan Sertifikat sebagai Background */}
                    <div
                      className={`${palette.innerBg} border ${palette.innerBorder} rounded-[18px] p-4 sm:p-5 min-h-[220px] sm:min-h-[240px] flex-1 flex flex-col relative overflow-hidden`}
                    >
                      {/* Background Foto Sertifikat (Jika Ada Piagam) */}
                      {hasPhoto && (
                        <>
                          <div
                            className="absolute -inset-1 bg-cover bg-center pointer-events-none transition-transform duration-500 group-hover:scale-105 filter blur-[1.5px]"
                            style={{ backgroundImage: `url(${item.fotoanak})` }}
                          />
                          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/82 backdrop-blur-[0.5px] pointer-events-none" />
                        </>
                      )}

                      <div className="relative z-10 flex-1 flex flex-col justify-between">
                        {/* Bagian Atas: Badges & Judul Kejuaraan */}
                        <div className="space-y-3 mb-3">
                          {/* Baris Badges: Tingkat, Peringkat, & Poin di Dalam Note */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant={getTingkatBadgeVariant(item.tingkat)} size="xs" className="font-bold">
                                {item.tingkat}
                              </Badge>
                              <Badge variant={getPeringkatBadgeVariant(item.peringkat)} size="xs" className="font-bold">
                                {item.peringkat}
                              </Badge>
                            </div>

                            <Badge variant="amber" size="xs" className="font-black shrink-0">
                              +{item.poin} Poin
                            </Badge>
                          </div>

                          {/* Judul Kejuaraan */}
                          <h3
                            className="text-[15px] sm:text-[16px] font-extrabold text-neutral-950 dark:text-neutral-50 leading-snug tracking-tight break-words pt-1"
                            title={item.prestasi}
                          >
                            {item.prestasi}
                          </h3>
                        </div>

                        {/* Bagian Bawah: Divider Garis + Metadata Kelas & Tanggal + Tombol Aksi */}
                        <div className="pt-2.5 border-t border-neutral-300/80 dark:border-neutral-700/80 mt-auto space-y-1.5">
                          {/* Nama Kelas Lengkap (Tidak Terpotong) */}
                          <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs sm:text-[13px] leading-snug break-words">
                            {item.kelas_saat_prestasi || item.kelas}
                          </div>

                          {/* Baris Tanggal & Tombol Aksi */}
                          <div className="flex items-center justify-between gap-2">
                            {item.tanggal_prestasi ? (
                              <div className="text-neutral-800 dark:text-neutral-200 font-semibold text-xs">
                                {formatCleanDate(item.tanggal_prestasi)}
                              </div>
                            ) : (
                              <div />
                            )}

                            {/* Tombol Aksi: Edit & Hapus (Jika Berhak) + Pratinjau Piagam */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {canManageItem?.(item) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onEditAchievement?.(item)}
                                    className="h-7 w-7 rounded-lg bg-neutral-900/10 dark:bg-white/10 hover:bg-amber-500 hover:text-white text-neutral-800 dark:text-neutral-100 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                                    title="Edit Prestasi Siswa"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteAchievement?.(item)}
                                    className="h-7 w-7 rounded-lg bg-neutral-900/10 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-neutral-800 dark:text-neutral-100 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                                    title="Hapus Prestasi Siswa"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              {hasPhoto ? (
                                <button
                                  type="button"
                                  onClick={() => onPreviewPhoto?.(item.fotoanak, item.prestasi)}
                                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm hover:scale-105 transition-all cursor-pointer"
                                  title="Lihat Sertifikat"
                                >
                                  View
                                </button>
                              ) : (
                                <div className="shrink-0 text-xs font-semibold text-neutral-800 dark:text-neutral-200 italic pb-0.5">
                                  Piagam tervalidasi
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
