"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  FolderCard                                                                 */
/*                                                                             */
/*  A folder-shaped card with a notched tab over an aurora gradient cover,     */
/*  responsive across mobile, tablet (iPad), and desktop.                     */
/*                                                                             */
/*  The headline renders directly inside the raised folder tab beside an       */
/*  auto-stretching cubic Bezier S-curve SVG so the tab always wraps the       */
/*  title cleanly without negative-margin hacks or distorted corners.          */
/* -------------------------------------------------------------------------- */

export interface FolderCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  > {
  /** Headline shown inside the folder tab. */
  title?: string;
  /** Supporting line under the tab. */
  subtitle?: string;
  /** Large figure in the footer, e.g. "24". */
  count?: React.ReactNode;
  /** Word next to the figure, e.g. "Hadir". */
  countLabel?: string;
  /** Right-aligned footer text, e.g. "45 Menit". */
  meta?: string;
  /** Cover image URL. Falls back to a CSS aurora gradient when omitted. */
  cover?: string;
  /** Alt text for the cover image. */
  coverAlt?: string;
  /** Optional pill/badge rendered in the exposed top-right cover space. */
  coverBadge?: React.ReactNode;
  /** Hover motion. Default: true. */
  interactive?: boolean;
  /** Lift the outer card on hover when interactive is true. Default: true. */
  liftOnHover?: boolean;
  /** Slide the notched tab on hover when interactive is true. Default: true. */
  slidePanelOnHover?: boolean;
  /** Optional body content (forms, stats, or actions) inside the stationary panel. */
  children?: React.ReactNode;
  /** Optional footer slot beneath children. */
  footer?: React.ReactNode;
}

/** Amethyst dusk — a soft violet bloom rising out of the bottom edge of the cover. */
const AURORA_GRADIENT = [
  "radial-gradient(58% 76% at 76% 114%, rgba(246,238,255,.8) 0%, rgba(208,154,255,.42) 34%, rgba(0,0,0,0) 72%)",
  "radial-gradient(105% 95% at 28% 136%, rgba(167,90,247,.72) 0%, rgba(109,40,217,.38) 46%, rgba(0,0,0,0) 80%)",
  "linear-gradient(172deg, #140726 0%, #29104f 40%, #4a1c8f 74%, #6d28d9 100%)",
].join(",");

const FONT_STACK =
  'var(--font-poppins), "Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const LIGHT_TOKENS = [
  "[--folder-card-bezel:#f3f3ea]",
  "[--folder-card-surface:#f3f3ea]",
  "[--folder-card-panel-from:#f3f3ea]",
  "[--folder-card-panel-mid:#f3f3ea]",
  "[--folder-card-panel-to:#f3f3ea]",
  "[--folder-card-title:#000000]",
  "[--folder-card-subtitle:#6e6e6a]",
].join(" ");

const DARK_TOKENS = [
  "dark:[--folder-card-bezel:#000000]",
  "dark:[--folder-card-surface:#151515]",
  "dark:[--folder-card-panel-from:#242424]",
  "dark:[--folder-card-panel-mid:#222222]",
  "dark:[--folder-card-panel-to:#151515]",
  "dark:[--folder-card-title:#ffffff]",
  "dark:[--folder-card-subtitle:#8b8b8b]",
].join(" ");

const SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
} as const;

const cardVariants: Variants = {
  rest: { y: 0 },
  hover: { y: -6 },
  tap: { y: -2, scale: 0.995 },
};

const notchSlideVariants: Variants = {
  rest: { y: 0 },
  hover: { y: 6 },
};

const coverVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.07 },
};

export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    {
      title = "Brand kit",
      subtitle = "",
      count,
      countLabel = "",
      meta = "",
      cover,
      coverAlt = "",
      coverBadge,
      interactive = true,
      liftOnHover = true,
      slidePanelOnHover = true,
      children,
      footer,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const capGradientId = React.useId();
    const reduceMotion = useReducedMotion();
    const animate = interactive && !reduceMotion;
    const shouldLift = animate && liftOnHover;
    const shouldSlide = animate && slidePanelOnHover;

    const hasStatFooter =
      (count !== undefined && count !== null && count !== "") ||
      Boolean(countLabel) ||
      Boolean(meta);

    return (
      <motion.div
        ref={ref}
        initial="rest"
        animate="rest"
        whileHover={animate ? "hover" : undefined}
        whileTap={shouldLift ? "tap" : undefined}
        transition={SPRING}
        variants={shouldLift ? cardVariants : undefined}
        style={
          {
            "--folder-card-font": FONT_STACK,
            fontFamily: "var(--folder-card-font)",
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "w-full select-none",
          LIGHT_TOKENS,
          DARK_TOKENS,
          className,
        )}
        {...props}
      >
        {/* Outer bezel */}
        <div className="relative box-border h-full w-full rounded-[22px] sm:rounded-[26px] bg-[var(--folder-card-bezel)] p-[7px] sm:p-[9px] shadow-[0_12px_30px_-12px_rgb(0_0_0/0.32)] ring-1 ring-black/[0.06] dark:shadow-[0_16px_36px_-14px_rgb(0_0_0/0.68)] dark:ring-white/[0.08]">
          {/* Inner container */}
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[15px] sm:rounded-[17px] bg-[var(--folder-card-surface)]">
            {/* Compact top cover sized so the bottom aurora bloom shines right behind the notch */}
            <div className="absolute left-px right-px top-0 h-[88px] sm:h-[98px] overflow-hidden">
              <motion.div
                variants={animate ? coverVariants : undefined}
                transition={SPRING}
                className="h-full w-full origin-bottom"
              >
                {cover ? (
                  // Use native img so arbitrary cover URLs render without Next remotePatterns config
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={coverAlt}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{ background: AURORA_GRADIENT }}
                    className="h-full w-full"
                  />
                )}
              </motion.div>
              {coverBadge && (
                <div className="pointer-events-none absolute right-3 top-2.5 sm:right-4 sm:top-3 z-10">
                  {coverBadge}
                </div>
              )}
            </div>

            {/* Folder stack: top spacing reveals aurora cover above the tab */}
            <div className="relative flex flex-1 flex-col pt-[18px] sm:pt-[22px]">
              {/* Stationary lower panel begins beneath max hover notch slide + shoulder corner radius */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 top-[72px] sm:top-[84px] rounded-b-[15px] sm:rounded-b-[17px]"
                style={{
                  background:
                    "linear-gradient(180deg, var(--folder-card-panel-mid) 0%, var(--folder-card-panel-to) 100%)",
                }}
              />

              {/* Sliding folder tab + S-curve notch + shoulder strip */}
              <motion.div
                variants={shouldSlide ? notchSlideVariants : undefined}
                transition={SPRING}
                className="relative z-10 pointer-events-none"
              >
                <div className="flex items-stretch">
                  {/* Tab dynamically hugs the title within safe max width so the right aurora stays prominent */}
                  <div
                    className="flex min-h-[34px] sm:min-h-[38px] min-w-[120px] sm:min-w-[140px] max-w-[66%] sm:max-w-[58%] items-center rounded-tl-[13px] sm:rounded-tl-[14px] px-4 sm:px-5 pt-2 pb-1"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--folder-card-panel-from) 0%, var(--folder-card-panel-mid) 100%)",
                    }}
                  >
                    {title && (
                      <h3
                        title={title}
                        className="m-0 truncate text-sm sm:text-[15px] font-semibold tracking-[0.005em] leading-tight text-[var(--folder-card-title)]"
                      >
                        {title}
                      </h3>
                    )}
                  </div>

                  {/* Auto-stretching S-curve notch matching the exact tab height */}
                  <svg
                    aria-hidden
                    viewBox="0 0 76 59"
                    preserveAspectRatio="none"
                    className="-ml-px block w-[44px] sm:w-[52px] shrink-0 self-stretch"
                  >
                    <defs>
                      <linearGradient id={capGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--folder-card-panel-from)" />
                        <stop offset="1" stopColor="var(--folder-card-panel-mid)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,0 C26.6,0 59.3,59 76,59 L0,59 Z"
                      fill={`url(#${capGradientId})`}
                    />
                  </svg>
                </div>

                {/* Right-shoulder top strip overlaps seamlessly onto the stationary lower background */}
                <div
                  aria-hidden
                  className="-mt-px h-[24px] sm:h-[28px] w-full rounded-tr-[14px] sm:rounded-tr-[18px] bg-[var(--folder-card-panel-mid)]"
                />
              </motion.div>

              {/* Stationary body content & stats */}
              <div className="relative z-10 -mt-[12px] sm:-mt-[14px] flex flex-1 flex-col justify-between px-4 sm:px-5 pb-4 sm:pb-5">
                <div>
                  {subtitle && (
                    <p
                      title={subtitle}
                      className="m-0 truncate text-xs sm:text-[13px] font-normal tracking-[0.005em] leading-snug text-[var(--folder-card-subtitle)]"
                    >
                      {subtitle}
                    </p>
                  )}

                  {children && <div className={subtitle ? "mt-3" : "mt-1"}>{children}</div>}
                </div>

                {hasStatFooter && (
                  <div className="mt-5 flex items-baseline justify-between gap-2 leading-none text-[var(--folder-card-title)]">
                    <p className="m-0 min-w-0 truncate">
                      {count !== undefined && count !== null && count !== "" && (
                        <span className="text-2xl sm:text-[26px] font-bold tracking-tight">
                          {count}
                        </span>
                      )}
                      {countLabel && (
                        <span className="ml-1.5 text-xs sm:text-[13px] font-normal text-[var(--folder-card-subtitle)]">
                          {countLabel}
                        </span>
                      )}
                    </p>
                    {meta && (
                      <p className="m-0 shrink-0 text-xs sm:text-[13px] font-semibold text-[var(--folder-card-title)]">
                        {meta}
                      </p>
                    )}
                  </div>
                )}

                {footer && <div className="mt-3.5">{footer}</div>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

export default FolderCard;

export { FolderCard as Component };
