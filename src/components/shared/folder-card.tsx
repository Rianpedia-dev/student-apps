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
  /** Sleek compact size for dense dashboard views. Default: false. */
  compact?: boolean;
  /** Custom aspect ratio classes for the bezel, e.g. "aspect-[16/10]". */
  aspectRatioClassName?: string;
  /** Whether to center text horizontally and vertically. Defaults to true when no footer stats. */
  centered?: boolean;
  /** Whether the top-right corner is chamfered / cut diagonally. Default: true. */
  chamfer?: boolean;
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

/**
 * Chamfer silhouette paths with smooth rounded transition fillets.
 * Box size: 500 x 500
 * - Cut depth: 105px (21% of the card - deep and prominent)
 * - Corner radius (top-left, bottom-left, bottom-right): 32px
 * - Chamfer fillet radius: 24px (continuous tangency into the 45deg cut)
 */
export const CHAMFER_PATH_500 =
  "M 32,0 " +
  "L 371,0 " +
  "Q 395,0 412,17 " +
  "L 483,88 " +
  "Q 500,105 500,129 " +
  "L 500,468 " +
  "A 32,32 0 0,1 468,500 " +
  "L 32,500 " +
  "A 32,32 0 0,1 0,468 " +
  "L 0,32 " +
  "A 32,32 0 0,1 32,0 Z";

export const ROUNDED_PATH_500 =
  "M 32,0 " +
  "L 468,0 " +
  "A 32,32 0 0,1 500,32 " +
  "L 500,468 " +
  "A 32,32 0 0,1 468,500 " +
  "L 32,500 " +
  "A 32,32 0 0,1 0,468 " +
  "L 0,32 " +
  "A 32,32 0 0,1 32,0 Z";

/**
 * Normalized path (0 to 1) for SVG clipPath with clipPathUnits="objectBoundingBox".
 */
export const CHAMFER_CLIP_OBB =
  "M 0.064,0 " +
  "L 0.742,0 " +
  "Q 0.79,0 0.824,0.034 " +
  "L 0.966,0.176 " +
  "Q 1,0.21 1,0.258 " +
  "L 1,0.936 " +
  "A 0.064,0.064 0 0,1 0.936,1 " +
  "L 0.064,1 " +
  "A 0.064,0.064 0 0,1 0,0.936 " +
  "L 0,0.064 " +
  "A 0.064,0.064 0 0,1 0.064,0 Z";

export const ROUNDED_CLIP_OBB =
  "M 0.064,0 " +
  "L 0.936,0 " +
  "A 0.064,0.064 0 0,1 1,0.064 " +
  "L 1,0.936 " +
  "A 0.064,0.064 0 0,1 0.936,1 " +
  "L 0.064,1 " +
  "A 0.064,0.064 0 0,1 0,0.936 " +
  "L 0,0.064 " +
  "A 0.064,0.064 0 0,1 0.064,0 Z";

export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    {
      title = "Card Title",
      subtitle = "",
      count,
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
      compact = false,
      aspectRatioClassName,
      centered,
      chamfer = true,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const reduceMotion = useReducedMotion();
    const animate = interactive && !reduceMotion;
    const rawId = React.useId();
    const clipId = `folder-chamfer-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    const hasFooter = Boolean(
      (count !== undefined && count !== null && count !== "") ||
        countLabel ||
        meta
    );
    const isCentered = centered ?? !hasFooter;

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
          "filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.14)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.36)]",
          LIGHT_TOKENS,
          DARK_TOKENS,
          className,
        )}
        {...props}
      >
        {/* SVG clip-path definition with objectBoundingBox */}
        <svg
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={chamfer ? CHAMFER_CLIP_OBB : ROUNDED_CLIP_OBB} />
            </clipPath>
          </defs>
        </svg>

        {/* Card Body — clipped with smooth rounded chamfer */}
        <div
          className={cn(
            "relative box-border w-full aspect-square overflow-hidden bg-[var(--folder-card-surface)] transition-all duration-300 backdrop-blur-xl border border-white/40 dark:border-white/10",
            aspectRatioClassName
          )}
          style={{
            clipPath: `url(#${clipId})`,
          }}
        >
          {/* Cover: Image or Solid Fixed Color */}
          <div className="absolute left-0 right-0 top-0 h-[52%] overflow-hidden">
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
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
                {/* Clean solid fill with translucent glass stroke */}
                <path
                  d={FOLDER_PATH}
                  fill="var(--folder-card-panel)"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Title & Subtitle inside the tab / card body */}
              <div
                className={cn(
                  "absolute pointer-events-auto",
                  isCentered
                    ? "inset-x-[6%] top-[38%] bottom-[8%] flex flex-col items-center justify-center text-center px-2"
                    : subtitle
                    ? "max-w-[82%] left-[7.5%] top-[36%] leading-tight text-left"
                    : "max-w-[82%] left-[8%] top-[39%] leading-tight text-left"
                )}
              >
                <h3
                  className={cn(
                    "m-0 font-bold tracking-[0.01em] text-[var(--folder-card-title)]",
                    isCentered
                      ? "text-[clamp(16.5px,7.5cqw,25px)] font-bold sm:font-extrabold line-clamp-2 leading-snug sm:leading-tight text-center"
                      : subtitle
                      ? "text-[clamp(12.5px,4.8cqw,17.5px)] line-clamp-1"
                      : "text-[clamp(15px,6.5cqw,22px)] font-bold sm:font-extrabold line-clamp-2 leading-snug sm:leading-tight"
                  )}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p
                    className={cn(
                      "mt-1.5 font-medium tracking-[0.005em] text-[var(--folder-card-subtitle)] line-clamp-1",
                      isCentered
                        ? "text-[clamp(11.5px,4.2cqw,15px)] text-center"
                        : "text-[clamp(10.5px,3.8cqw,14px)]"
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* footer stats */}
          {(count !== undefined && count !== null && count !== "") || countLabel || meta ? (
            <div
              className={cn(
                "absolute flex items-baseline justify-between leading-none text-[var(--folder-card-title)]",
                subtitle
                  ? "inset-x-[7.5%] bottom-[9%]"
                  : "inset-x-[8%] bottom-[9.5%]"
              )}
            >
              <div className="m-0 flex items-baseline gap-2 sm:gap-2.5 min-w-0 max-w-full">
                {count !== undefined && count !== null && count !== "" && (
                  <span
                    className={cn(
                      "font-black tracking-[-0.03em] shrink-0",
                      subtitle
                        ? "text-[clamp(22px,10.5cqw,36px)]"
                        : "text-[clamp(26px,12.5cqw,44px)]"
                    )}
                  >
                    {count}
                  </span>
                )}
                {countLabel && (
                  <span
                    className={cn(
                      "font-semibold text-[var(--folder-card-subtitle)] truncate",
                      subtitle
                        ? "text-[clamp(12px,4.5cqw,16px)]"
                        : "text-[clamp(13px,5.2cqw,18px)]"
                    )}
                  >
                    {countLabel}
                  </span>
                )}
              </div>
              {meta && (
                <div className="m-0 text-[clamp(9.5px,3.6cqw,13px)] font-semibold text-[var(--folder-card-subtitle)] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shrink-0 ml-1.5">
                  {meta}
                </div>
              )}
            </div>
          ) : null}

          {/* Precision Bezel Overlay & Chamfer Accent (draws inside the clipped card) */}
          <svg
            aria-hidden
            viewBox="0 0 500 500"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Outer Bezel Frame — uniform width all around */}
            <path
              d={chamfer ? CHAMFER_PATH_500 : ROUNDED_PATH_500}
              fill="none"
              stroke="var(--folder-card-bezel)"
              strokeWidth="18"
            />
            {/* Subtle Inner Highlight Rim */}
            <path
              d={chamfer ? CHAMFER_PATH_500 : ROUNDED_PATH_500}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
            />
            {/* Chamfer diagonal cut specular highlight */}
            {chamfer && (
              <g>
                <line
                  x1="412"
                  y1="17"
                  x2="483"
                  y2="88"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>
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
