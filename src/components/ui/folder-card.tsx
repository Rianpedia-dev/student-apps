"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  FolderCard                                                                 */
/*                                                                             */
/*  A folder-shaped media card: a cover sits behind a dark/light folder panel  */
/*  that is notched over it, with the title and subtitle riding in the tab    */
/*  and a stat line along the bottom.                                          */
/*                                                                             */
/*  On hover the panel slides down to reveal more of the cover, the cover       */
/*  drifts in, and the whole card lifts — one spring, driven by variants on     */
/*  the root, so the parts stay in sync.                                        */
/*                                                                             */
/*  Every dimension is in container query units (cqw) with responsive clamping, */
/*  so the card is pixel-exact and readable at any width.                       */
/* -------------------------------------------------------------------------- */

export type FolderCardVariant =
  | "primary"
  | "emerald"
  | "amber"
  | "accent"
  | "blue"
  | "rose"
  | "purple"
  | "secondary";

export interface FolderCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  > {
  /** Headline shown inside the folder tab. */
  title?: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Large figure in the footer, e.g. "24". */
  count?: React.ReactNode;
  /** Word next to the figure, e.g. "Files". */
  countLabel?: string;
  /** Right-aligned footer text, e.g. "312 Assets". */
  meta?: string;
  /** Cover image URL. Falls back to a CSS aurora gradient when omitted. */
  cover?: string;
  /** Alt text for the cover image. */
  coverAlt?: string;
  /** Optional custom CSS background for the cover. */
  coverGradient?: string;
  /** Color theme variant for aurora cover & accent colors. */
  variant?: FolderCardVariant;
  /** Optional icon displayed as a frosted glass badge in the cover notch. */
  icon?: React.ReactNode;
  /** Optional target URL for clickable navigation. */
  href?: string;
  /** Hover motion. Default: true. */
  interactive?: boolean;
}

/**
 * The folder silhouette. The viewBox matches the inner (inside-bezel) box
 * exactly, so `preserveAspectRatio="none"` scales it without distorting radii.
 *
 * The notch is one cubic Bézier fitted to the design's own curve: a long, flat
 * shoulder easing out of the tab, then a steepening sweep that lands softly on
 * the body. 76 across, 59 down, horizontal tangents at both ends so it meets
 * the straight edges without a kink.
 */
const FOLDER_PATH =
  "M-2,151 a16,16 0 0 1 16,-16 h247 " +
  "c26.6,0 59.3,59 76,59 " +
  "h149 a32,32 0 0 1 32,32 v368 " +
  "a32,32 0 0 1 -32,32 h-456 a32,32 0 0 1 -32,-32 Z";

/** Themed aurora gradients tuned for Al-Azhar portal aesthetics */
const AURORA_VARIANTS: Record<FolderCardVariant, string> = {
  // Amethyst / Purple
  purple: [
    "radial-gradient(58% 76% at 76% 114%, rgba(246,238,255,.8) 0%, rgba(208,154,255,.42) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(167,90,247,.72) 0%, rgba(109,40,217,.38) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #140726 0%, #29104f 40%, #4a1c8f 74%, #6d28d9 100%)",
  ].join(","),

  // Emerald / Hijau Zamrud Al-Azhar
  emerald: [
    "radial-gradient(58% 76% at 76% 114%, rgba(209,250,229,.85) 0%, rgba(52,211,153,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(16,185,129,.75) 0%, rgba(5,150,105,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #021c14 0%, #064e3b 40%, #047857 74%, #059669 100%)",
  ].join(","),
  primary: [
    "radial-gradient(58% 76% at 76% 114%, rgba(209,250,229,.85) 0%, rgba(52,211,153,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(16,185,129,.75) 0%, rgba(5,150,105,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #021c14 0%, #064e3b 40%, #047857 74%, #059669 100%)",
  ].join(","),

  // Amber / Gold Emas Al-Azhar
  amber: [
    "radial-gradient(58% 76% at 76% 114%, rgba(254,243,199,.85) 0%, rgba(251,191,36,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(245,158,11,.75) 0%, rgba(217,119,6,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #1e1303 0%, #3d2305 40%, #78350f 74%, #b45309 100%)",
  ].join(","),

  // Accent / Blue Biru Safir Al-Azhar
  accent: [
    "radial-gradient(58% 76% at 76% 114%, rgba(224,242,254,.85) 0%, rgba(56,189,248,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(14,165,233,.75) 0%, rgba(2,132,199,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #031726 0%, #082f49 40%, #0369a1 74%, #0284c7 100%)",
  ].join(","),
  blue: [
    "radial-gradient(58% 76% at 76% 114%, rgba(224,242,254,.85) 0%, rgba(56,189,248,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(14,165,233,.75) 0%, rgba(2,132,199,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #031726 0%, #082f49 40%, #0369a1 74%, #0284c7 100%)",
  ].join(","),

  // Rose / Crimson Red Delima
  rose: [
    "radial-gradient(58% 76% at 76% 114%, rgba(255,228,230,.85) 0%, rgba(251,113,133,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(244,63,94,.75) 0%, rgba(225,29,72,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #26050e 0%, #4c0519 40%, #881337 74%, #be123c 100%)",
  ].join(","),

  // Secondary / Teal
  secondary: [
    "radial-gradient(58% 76% at 76% 114%, rgba(204,251,241,.85) 0%, rgba(45,212,191,.5) 34%, rgba(0,0,0,0) 72%)",
    "radial-gradient(105% 95% at 28% 136%, rgba(20,184,166,.75) 0%, rgba(13,148,136,.4) 46%, rgba(0,0,0,0) 80%)",
    "linear-gradient(172deg, #021a17 0%, #042f2c 40%, #0f766e 74%, #14b8a6 100%)",
  ].join(","),
};

/** Floating icon badge styles per variant */
const ICON_STYLES: Record<FolderCardVariant, string> = {
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shadow-emerald-950/40",
  primary: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shadow-emerald-950/40",
  amber: "bg-amber-500/20 text-amber-300 border-amber-400/30 shadow-amber-950/40",
  accent: "bg-sky-500/20 text-sky-300 border-sky-400/30 shadow-sky-950/40",
  blue: "bg-sky-500/20 text-sky-300 border-sky-400/30 shadow-sky-950/40",
  rose: "bg-rose-500/20 text-rose-300 border-rose-400/30 shadow-rose-950/40",
  purple: "bg-purple-500/20 text-purple-300 border-purple-400/30 shadow-purple-950/40",
  secondary: "bg-teal-500/20 text-teal-300 border-teal-400/30 shadow-teal-950/40",
};

const FONT_STACK =
  'var(--font-oxanium), "Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const LIGHT_TOKENS = [
  "[--folder-card-bezel:#e2e8f0]",
  "[--folder-card-surface:#f8fafc]",
  "[--folder-card-panel-from:#ffffff]",
  "[--folder-card-panel-to:#f1f5f9]",
  "[--folder-card-title:#0f172a]",
  "[--folder-card-subtitle:#64748b]",
].join(" ");

const DARK_TOKENS = [
  "dark:[--folder-card-bezel:#0d1527]",
  "dark:[--folder-card-surface:#0a0f1d]",
  "dark:[--folder-card-panel-from:#1e293b]",
  "dark:[--folder-card-panel-to:#0f172a]",
  "dark:[--folder-card-title:#ffffff]",
  "dark:[--folder-card-subtitle:#94a3b8]",
].join(" ");

const SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
} as const;

const cardVariants: Variants = {
  rest: { y: 0 },
  hover: { y: -8 },
  tap: { y: -4, scale: 0.99 },
};

/** The folder front — panel plus the copy riding in its tab. */
const panelVariants: Variants = {
  rest: { y: "0%" },
  hover: { y: "8%" },
};

const coverVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.07 },
};

export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    {
      title = "Card Title",
      subtitle = "Deskripsi",
      count = "0",
      countLabel = "",
      meta = "",
      cover,
      coverAlt = "",
      coverGradient,
      variant = "primary",
      icon,
      href,
      interactive = true,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const gradientId = React.useId();
    const reduceMotion = useReducedMotion();
    const animate = interactive && !reduceMotion;

    const activeAurora = coverGradient || AURORA_VARIANTS[variant] || AURORA_VARIANTS.primary;
    const iconStyle = ICON_STYLES[variant] || ICON_STYLES.primary;

    const cardElement = (
      <motion.div
        ref={ref}
        initial="rest"
        animate="rest"
        whileHover={animate ? "hover" : undefined}
        whileTap={animate ? "tap" : undefined}
        transition={SPRING}
        variants={animate ? cardVariants : undefined}
        style={
          {
            "--folder-card-font": FONT_STACK,
            fontFamily: "var(--folder-card-font)",
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "w-full select-none [container-type:inline-size]",
          LIGHT_TOKENS,
          DARK_TOKENS,
          className,
        )}
        {...props}
      >
        {/* bezel */}
        <div className="relative box-border aspect-[544/522] w-full rounded-[8.46cqw] bg-[var(--folder-card-bezel)] p-[2.57cqw] shadow-[0_2cqw_5cqw_-2cqw_rgb(0_0_0/.5)] transition-shadow duration-300">
          <div className="relative h-full w-full overflow-hidden rounded-[5.88cqw] bg-[var(--folder-card-surface)]">
            {/* Cover: Image or Aurora Gradient */}
            <div className="absolute left-px right-px top-0 h-[54%] overflow-hidden">
              <motion.div
                variants={animate ? coverVariants : undefined}
                transition={SPRING}
                className="relative h-full w-full origin-bottom"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={coverAlt}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{ background: activeAurora }}
                    className="h-full w-full"
                  />
                )}

                {/* Floating Frosted Glass Icon Badge in the exposed notch area */}
                {icon && (
                  <div className="absolute right-[5.5cqw] top-[5.5cqw] z-10">
                    <div
                      className={cn(
                        "flex h-[11cqw] w-[11cqw] min-h-[30px] min-w-[30px] items-center justify-center rounded-[3cqw] border backdrop-blur-md shadow-md transition-transform duration-300",
                        iconStyle
                      )}
                    >
                      <div className="flex h-[5.5cqw] w-[5.5cqw] min-h-[16px] min-w-[16px] items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-[2.2]">
                        {icon}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* folder front: panel + tab copy, moving as one */}
            <div className="absolute -left-px -right-px inset-y-0 overflow-hidden pointer-events-none">
              <motion.div
                variants={animate ? panelVariants : undefined}
                transition={SPRING}
                className="absolute inset-0"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 516 494"
                  preserveAspectRatio="none"
                  className="absolute inset-0 block h-full w-full"
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0"
                        stopColor="var(--folder-card-panel-from)"
                      />
                      <stop
                        offset="1"
                        stopColor="var(--folder-card-panel-to)"
                      />
                    </linearGradient>
                  </defs>
                  {/* stroked as well as filled so no seam shows at the edges */}
                  <path
                    d={FOLDER_PATH}
                    fill={"url(#" + gradientId + ")"}
                    stroke={"url(#" + gradientId + ")"}
                    strokeWidth="2"
                  />
                </svg>

                {/* Title & Subtitle inside the tab */}
                <div className="absolute left-[5.2cqw] top-[30cqw] max-w-[65%] leading-tight pointer-events-auto">
                  <h3 className="m-0 text-[clamp(11px,4.5cqw,17px)] font-bold tracking-[0.01em] text-[var(--folder-card-title)] line-clamp-1">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="mt-[1.8cqw] text-[clamp(9.5px,3.8cqw,13px)] font-medium tracking-[0.005em] text-[var(--folder-card-subtitle)] line-clamp-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* footer stays put while the folder front slides */}
            <div className="absolute inset-x-[5.2cqw] bottom-[4.8cqw] flex items-baseline justify-between leading-none text-[var(--folder-card-title)]">
              <div className="m-0 flex items-baseline gap-[1.5cqw]">
                <span className="text-[clamp(18px,9.2cqw,36px)] font-extrabold tracking-[-0.02em]">
                  {count}
                </span>
                {countLabel && (
                  <span className="text-[clamp(10px,4.2cqw,14px)] font-medium text-[var(--folder-card-subtitle)]">
                    {countLabel}
                  </span>
                )}
              </div>
              {meta && (
                <div className="m-0 text-[clamp(9px,3.9cqw,13px)] font-semibold text-[var(--folder-card-subtitle)] px-[2.2cqw] py-[1cqw] rounded-[2cqw] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  {meta}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );

    if (href) {
      return (
        <Link href={href} className="block group focus:outline-hidden h-full">
          {cardElement}
        </Link>
      );
    }

    return cardElement;
  },
);

export default FolderCard;

export { FolderCard as Component };
