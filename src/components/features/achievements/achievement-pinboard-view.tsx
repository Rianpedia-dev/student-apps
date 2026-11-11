"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
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

  const boardRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [svgMetrics, setSvgMetrics] = useState<{
    width: number;
    height: number;
    path: string;
  }>({ width: 0, height: 0, path: "" });

  // Hitung path SVG garis putus-putus berdasarkan posisi aktual kartu di grid agar selalu selaras di semua ukuran layar
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || count <= 1) return;

    const computePath = () => {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      if (boardRect.width === 0 || boardRect.height === 0) return;

      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < count; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        points.push({
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        });
      }

      if (points.length <= 1) return;

      let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        if (Math.abs(p1.x - p2.x) > 40) {
          d += ` C ${midX.toFixed(1)} ${p1.y.toFixed(1)}, ${midX.toFixed(1)} ${p2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        } else {
          d += ` Q ${(p1.x + 28).toFixed(1)} ${midY.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
      }

      setSvgMetrics({
        width: boardRect.width,
        height: boardRect.height,
        path: d,
      });
    };

    const rafId = requestAnimationFrame(computePath);
    const observer = new ResizeObserver(computePath);
    observer.observe(boardEl);
    for (let i = 0; i < count; i++) {
      const card = itemRefs.current[i];
      if (card) observer.observe(card);
    }
    window.addEventListener("resize", computePath);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", computePath);
    };
  }, [count, sortedAchievements]);

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
        className={`relative w-full py-6 sm:py-10 lg:py-12 px-4 sm:px-6 md:px-8 select-none overflow-x-hidden ${className || ""}`}
      >
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
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 lg:w-24 bg-gradient-to-r z-1" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 lg:w-24 bg-gradient-to-l z-1" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div
            ref={boardRef}
            className={`relative w-full mx-auto grid items-start ${
              count === 1
                ? "grid-cols-1 max-w-[380px]"
                : "grid-cols-1 md:grid-cols-2 gap-y-7 sm:gap-y-9 md:gap-y-10 lg:gap-y-12 md:gap-x-8 lg:gap-x-12 xl:gap-x-16"
            }`}
          >
            {/* SVG Connecting Animated Winding Dashed Path (Tampil di Layar Tablet & Desktop md+) */}
            {count > 1 && svgMetrics.path && svgMetrics.width > 0 && svgMetrics.height > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none hidden md:block z-0"
                viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
                preserveAspectRatio="none"
              >
                <m.path
                  d={svgMetrics.path}
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

              // Staggered kolom kanan + kemiringan responsif tanpa saling bertumpuk
              const isRight = index % 2 === 1;
              const staggerClass =
                count > 1 && isRight ? "md:mt-12 lg:mt-16 xl:mt-20" : "";
              const rotateClass =
                count === 1
                  ? "rotate-0 sm:rotate-1"
                  : isRight
                    ? "-rotate-1 sm:-rotate-2 md:-rotate-3 lg:-rotate-4"
                    : "rotate-1 sm:rotate-2 md:rotate-3 lg:rotate-4";

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className={`relative w-full max-w-[320px] sm:max-w-[350px] md:max-w-[295px] lg:max-w-[345px] xl:max-w-[375px] mx-auto transition-transform duration-300 hover:z-30 hover:scale-[1.03] hover:rotate-0 ${staggerClass} ${rotateClass}`}
                >
                  {/* Polaroid Solid Color Card Container (Warna-Warni yang Solid) */}
                  <div
                    className={`group ${palette.outerBg} p-2 sm:p-2.5 lg:p-3 rounded-[20px] sm:rounded-[24px] ${palette.outerShadow} border ${palette.outerBorder} transition-all duration-300 hover:shadow-[0px_16px_36px_0px_rgba(0,0,0,0.35)] flex flex-col`}
                  >
                    {/* Pushpin Jarum Pentul Putih 3D di Bagian Atas */}
                    <Pin className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white z-20 mb-2 sm:mb-2.5 lg:mb-3 mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />

                    {/* Pastel Inner Note dengan Sertifikat sebagai Background */}
                    <div
                      className={`${palette.innerBg} border ${palette.innerBorder} rounded-[15px] sm:rounded-[18px] p-3.5 sm:p-4 lg:p-5 min-h-[195px] sm:min-h-[215px] lg:min-h-[235px] flex-1 flex flex-col relative overflow-hidden`}
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
                        <div className="space-y-2.5 sm:space-y-3 mb-3">
                          {/* Baris Badges: Tingkat, Peringkat, & Poin di Dalam Note */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
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
                            className="text-sm sm:text-[15px] lg:text-base font-extrabold text-neutral-950 dark:text-neutral-50 leading-snug tracking-tight break-words pt-0.5"
                            title={item.prestasi}
                          >
                            {item.prestasi}
                          </h3>
                        </div>

                        {/* Bagian Bawah: Divider Garis + Metadata Kelas & Tanggal + Tombol Aksi */}
                        <div className="pt-2.5 border-t border-neutral-300/80 dark:border-neutral-700/80 mt-auto space-y-1.5">
                          {/* Nama Kelas Lengkap (Tidak Terpotong) */}
                          <div className="font-bold text-neutral-900 dark:text-neutral-100 text-[11px] sm:text-xs lg:text-[13px] leading-snug break-words">
                            {item.kelas_saat_prestasi || item.kelas}
                          </div>

                          {/* Baris Tanggal & Tombol Aksi */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            {item.tanggal_prestasi ? (
                              <div className="text-neutral-800 dark:text-neutral-200 font-semibold text-[11px] sm:text-xs">
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
                                  className="shrink-0 text-[11px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm hover:scale-105 transition-all cursor-pointer"
                                  title="Lihat Sertifikat"
                                >
                                  View
                                </button>
                              ) : (
                                <div className="shrink-0 text-[11px] sm:text-xs font-semibold text-neutral-800 dark:text-neutral-200 italic pb-0.5">
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
