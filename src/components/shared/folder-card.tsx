"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  FolderCard                                                                 */
/*                                                                             */
/*  A folder-shaped media card: a solid-colored cover sits behind a clean      */
/*  solid folder panel that is notched over it, with title and subtitle       */
/*  inside the tab and a stat figure along the bottom.                        */
/*                                                                             */
/*  On hover the panel slides down to reveal more of the solid color cover,   */
/*  and the whole card lifts smoothly.                                        */
/* -------------------------------------------------------------------------- */

export type FolderCardVariant =
  | "primary"
  | "emerald"
  | "amber"
  | "accent"
  | "blue"
  | "rose"
  | "purple"
  | "secondary"
  | "teal"
  | "indigo"
  | "orange"
  | "pink";

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
  /** Cover image URL. Falls back to a solid fixed color when omitted. */
  cover?: string;
  /** Alt text for the cover image. */
  coverAlt?: string;
  /** Optional custom solid color background for the cover. */
  coverColor?: string;
  /** Optional custom CSS background for backwards compatibility. */
  coverGradient?: string;
  /** Color theme variant for solid cover color. */
  variant?: FolderCardVariant;
  /** Optional icon. */
  icon?: React.ReactNode;
  /** Optional target URL for clickable navigation. */
  href?: string;
  /** Hover motion. Default: true. */
  interactive?: boolean;
}

/**
 * The folder silhouette path.
 */
const FOLDER_PATH =
  "M-2,151 a16,16 0 0 1 16,-16 h247 " +
  "c26.6,0 59.3,59 76,59 " +
  "h149 a32,32 0 0 1 32,32 v368 " +
  "a32,32 0 0 1 -32,32 h-456 a32,32 0 0 1 -32,-32 Z";

/**
 * Vibrant, solid, fixed colors for each folder card (no gradients).
 */
export const FOLDER_SOLID_COLORS: Record<FolderCardVariant, string> = {
  // Emerald / Hijau Al-Azhar
  emerald: "#059669",
  primary: "#059669",

  // Blue / Biru Safir
  accent: "#2563eb",
  blue: "#2563eb",

  // Purple / Ungu Elegan
  purple: "#7c3aed",
  secondary: "#7c3aed",

  // Amber / Kuning Emas
  amber: "#d97706",

  // Rose / Merah Delima
  rose: "#e11d48",

  // Teal / Cyan
  teal: "#0d9488",

  // Indigo
  indigo: "#4f46e5",

  // Orange
  orange: "#ea580c",

  // Pink
  pink: "#db2777",
};

const FONT_STACK =
  'var(--font-plus-jakarta-sans), var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const LIGHT_TOKENS = [
  "[--folder-card-bezel:#e2e8f0]",
  "[--folder-card-surface:#f8fafc]",
  "[--folder-card-panel:#ffffff]",
  "[--folder-card-title:#0f172a]",
  "[--folder-card-subtitle:#64748b]",
].join(" ");

const DARK_TOKENS = [
  "dark:[--folder-card-bezel:#0d1527]",
  "dark:[--folder-card-surface:#0a0f1d]",
  "dark:[--folder-card-panel:#1e293b]",
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
      subtitle = "",
      count = "0",
      countLabel = "",
      meta = "",
      cover,
      coverAlt = "",
      coverColor,
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
    const reduceMotion = useReducedMotion();
    const animate = interactive && !reduceMotion;

    // Use pure solid color (no gradients)
    const activeColor =
      coverColor ||
      coverGradient ||
      FOLDER_SOLID_COLORS[variant] ||
      FOLDER_SOLID_COLORS.primary;

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
            {/* Cover: Image or Solid Fixed Color */}
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
                    style={{ backgroundColor: activeColor }}
                    className="h-full w-full"
                  />
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
                  {/* Clean solid fill and stroke without gradient */}
                  <path
                    d={FOLDER_PATH}
                    fill="var(--folder-card-panel)"
                    stroke="var(--folder-card-panel)"
                    strokeWidth="2"
                  />
                </svg>

                {/* Title & Subtitle inside the tab */}
                <div
                  className={cn(
                    "absolute max-w-[72%] leading-tight pointer-events-auto",
                    subtitle
                      ? "left-[5.2cqw] top-[30cqw]"
                      : "left-[6.8cqw] top-[32.5cqw]"
                  )}
                >
                  <h3
                    className={cn(
                      "m-0 font-bold tracking-[0.01em] text-[var(--folder-card-title)]",
                      subtitle
                        ? "text-[clamp(11px,4.5cqw,17px)] line-clamp-1"
                        : "text-[clamp(13px,5.6cqw,20px)] font-extrabold line-clamp-2"
                    )}
                  >
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
            <div
              className={cn(
                "absolute flex items-baseline justify-between leading-none text-[var(--folder-card-title)]",
                subtitle
                  ? "inset-x-[5.2cqw] bottom-[4.8cqw]"
                  : "inset-x-[6.8cqw] bottom-[6.5cqw]"
              )}
            >
              <div className="m-0 flex items-baseline gap-[1.8cqw]">
                <span
                  className={cn(
                    "font-extrabold tracking-[-0.02em]",
                    subtitle
                      ? "text-[clamp(18px,9.2cqw,36px)]"
                      : "text-[clamp(21px,10.6cqw,40px)]"
                  )}
                >
                  {count}
                </span>
                {countLabel && (
                  <span
                    className={cn(
                      "font-semibold text-[var(--folder-card-subtitle)]",
                      subtitle
                        ? "text-[clamp(10px,4.2cqw,14px)] font-medium"
                        : "text-[clamp(11.5px,4.6cqw,16px)]"
                    )}
                  >
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
