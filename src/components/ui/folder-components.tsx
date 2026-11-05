"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type FolderColor =
  | "blue"
  | "black"
  | "grey"
  | "yellow"
  | "orange"
  | "red"
  | "emerald"
  | "teal"
  | "purple";

export type FolderSize = "sm" | "md" | "lg" | "xl";

export type FolderProps = {
  color?: FolderColor;
  size?: FolderSize;
  label?: string;
  sublabel?: string;
  className?: string;
  isHovered?: boolean;
};

const sizeMap: Record<
  FolderSize,
  {
    container: string;
    tabLeft: string;
    tabRight: string;
    tabBridge: string;
    flapBody: string;
    papers: string;
    paperOffset: string;
    paperH: string;
    paperContent: string;
    hoverY: number;
    hoverBackY: number;
  }
> = {
  sm: {
    container: "size-24 rounded-[24px]",
    tabLeft: "w-9 h-3 rounded-tl-lg",
    tabRight: "w-2 h-3 rounded-tr-[24px]",
    tabBridge: "w-2 h-2",
    flapBody: "h-9",
    papers: "inset-x-5 top-2",
    paperOffset: "top-1",
    paperH: "h-16",
    paperContent: "pt-2.5 px-2.5 space-y-1",
    hoverY: -3,
    hoverBackY: -4,
  },
  md: {
    container: "size-32 rounded-[32px]",
    tabLeft: "w-12 h-4 rounded-tl-lg",
    tabRight: "w-2.5 h-4 rounded-tr-[32px]",
    tabBridge: "w-2.5 h-2.5",
    flapBody: "h-12",
    papers: "inset-x-6 top-3",
    paperOffset: "top-1.5",
    paperH: "h-24",
    paperContent: "pt-3 px-3 space-y-1",
    hoverY: -3,
    hoverBackY: -5,
  },
  lg: {
    container: "w-40 h-36 rounded-[32px]",
    tabLeft: "w-16 h-5.5 rounded-tl-xl",
    tabRight: "w-3.25 h-5.5 rounded-tr-[32px]",
    tabBridge: "w-3.25 h-3.25",
    flapBody: "h-16",
    papers: "inset-x-7 top-3.5",
    paperOffset: "top-2",
    paperH: "h-28",
    paperContent: "pt-4 px-4 space-y-1.5",
    hoverY: -4,
    hoverBackY: -6,
  },
  xl: {
    container: "w-48 sm:w-52 h-44 sm:h-48 rounded-[36px] sm:rounded-[40px]",
    tabLeft: "w-20 sm:w-22 h-6 sm:h-7 rounded-tl-2xl",
    tabRight: "w-4 sm:w-4.5 h-6 sm:h-7 rounded-tr-[36px] sm:rounded-tr-[40px]",
    tabBridge: "w-4 sm:w-4.5 h-4 sm:h-4.5",
    flapBody: "h-20 sm:h-22",
    papers: "inset-x-8 sm:inset-x-9 top-4 sm:top-5",
    paperOffset: "top-2.5",
    paperH: "h-32 sm:h-36",
    paperContent: "pt-4 px-4 space-y-2",
    hoverY: -5,
    hoverBackY: -8,
  },
};

const colorMap: Record<
  FolderColor,
  {
    folder: string;
    flap: string;
    paperBack: string;
    paperFront: string;
    paperLine: string;
    paperBorder: string;
    labelBg: string;
    folderBorder: string;
  }
> = {
  blue: {
    folder: "from-blue-400 to-blue-500",
    flap: "bg-blue-300/50",
    paperBack: "bg-blue-100/60 dark:bg-blue-900/40",
    paperFront: "bg-blue-50 dark:bg-slate-900",
    paperLine: "bg-blue-300/40 dark:bg-blue-500/40",
    paperBorder: "border-blue-200 dark:border-blue-800/60",
    labelBg: "bg-blue-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
  black: {
    folder: "from-neutral-800 to-neutral-900",
    flap: "bg-neutral-600/50",
    paperBack: "bg-neutral-500/60",
    paperFront: "bg-neutral-100 dark:bg-neutral-900",
    paperLine: "bg-neutral-300 dark:bg-neutral-700",
    paperBorder: "border-neutral-500",
    labelBg: "bg-white/15 dark:bg-black/60",
    folderBorder: "border-white/10",
  },
  yellow: {
    folder: "from-yellow-400 to-yellow-500",
    flap: "bg-yellow-200/50",
    paperBack: "bg-yellow-100/60 dark:bg-yellow-900/40",
    paperFront: "bg-yellow-50 dark:bg-slate-900",
    paperLine: "bg-yellow-400/40",
    paperBorder: "border-yellow-200 dark:border-yellow-800/60",
    labelBg: "bg-yellow-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
  orange: {
    folder: "from-orange-400 to-orange-500",
    flap: "bg-orange-300/50",
    paperBack: "bg-orange-100/60 dark:bg-orange-900/40",
    paperFront: "bg-orange-50 dark:bg-slate-900",
    paperLine: "bg-orange-400/40",
    paperBorder: "border-orange-200 dark:border-orange-800/60",
    labelBg: "bg-orange-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
  red: {
    folder: "from-red-400 to-red-500",
    flap: "bg-red-300/50",
    paperBack: "bg-red-100/60 dark:bg-red-900/40",
    paperFront: "bg-red-50 dark:bg-slate-900",
    paperLine: "bg-red-400/40",
    paperBorder: "border-red-200 dark:border-red-800/60",
    labelBg: "bg-red-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
  grey: {
    folder: "from-gray-400 to-gray-500",
    flap: "bg-gray-300/50",
    paperBack: "bg-gray-200/60 dark:bg-gray-800/40",
    paperFront: "bg-gray-100 dark:bg-slate-900",
    paperLine: "bg-gray-400/40",
    paperBorder: "border-gray-300 dark:border-gray-700",
    labelBg: "bg-gray-950/45 dark:bg-black/55",
    folderBorder: "border-white/40",
  },
  emerald: {
    folder: "from-emerald-400 to-emerald-600",
    flap: "bg-emerald-300/50",
    paperBack: "bg-emerald-100/60 dark:bg-emerald-900/40",
    paperFront: "bg-emerald-50 dark:bg-slate-900",
    paperLine: "bg-emerald-400/40",
    paperBorder: "border-emerald-200 dark:border-emerald-800/60",
    labelBg: "bg-emerald-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
  teal: {
    folder: "from-teal-400 to-teal-600",
    flap: "bg-teal-300/50",
    paperBack: "bg-teal-100/60 dark:bg-teal-900/40",
    paperFront: "bg-teal-50 dark:bg-slate-900",
    paperLine: "bg-teal-400/40",
    paperBorder: "border-teal-200 dark:border-teal-800/60",
    labelBg: "bg-teal-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
  purple: {
    folder: "from-purple-400 to-purple-600",
    flap: "bg-purple-300/50",
    paperBack: "bg-purple-100/60 dark:bg-purple-900/40",
    paperFront: "bg-purple-50 dark:bg-slate-900",
    paperLine: "bg-purple-400/40",
    paperBorder: "border-purple-200 dark:border-purple-800/60",
    labelBg: "bg-purple-950/45 dark:bg-black/55",
    folderBorder: "border-white/30",
  },
};

const spring = { type: "spring", stiffness: 300, damping: 22 } as const;

export const Folder = ({
  color = "blue",
  size = "lg",
  label,
  sublabel,
  className,
  isHovered,
}: FolderProps) => {
  const c = colorMap[color] || colorMap.blue;
  const s = sizeMap[size] || sizeMap.lg;

  // Use full-width centered badge for sizes lg and xl or whenever sublabel exists
  const isLargeBadge = size === "xl" || size === "lg" || Boolean(sublabel);

  return (
    <motion.div
      aria-label="Folder"
      initial="rest"
      whileHover={isHovered === undefined ? "hover" : undefined}
      animate={isHovered !== undefined ? (isHovered ? "hover" : "rest") : undefined}
      variants={{ rest: {}, hover: {} }}
      className={cn(
        "relative cursor-pointer overflow-hidden border-t-2 bg-gradient-to-b bg-linear-to-b shrink-0 shadow-xl select-none transition-shadow duration-300 group-hover:shadow-2xl",
        s.container,
        c.folder,
        c.folderBorder,
        className
      )}
    >
      {/* Front flap */}
      <div className="absolute right-0 bottom-0 left-0 z-20 pointer-events-none">
        <div className="flex items-end">
          <div className={cn(s.tabLeft, "backdrop-blur-sm", c.flap)} />
          <div className={cn(s.tabRight, "backdrop-blur-sm", c.flap)} />
          <div
            className={cn(
              s.tabBridge,
              "mask-[radial-gradient(200%_200%_at_100%_0%,transparent_50%,black_50%)]",
              c.flap
            )}
            style={{
              WebkitMaskImage:
                "radial-gradient(200% 200% at 100% 0%, transparent 50%, black 50%)",
              maskImage:
                "radial-gradient(200% 200% at 100% 0%, transparent 50%, black 50%)",
            }}
          />
        </div>
        <div
          className={cn(s.flapBody, "rounded-tr-xl backdrop-blur-sm", c.flap)}
        />
      </div>

      {/* Papers */}
      <div className={cn("absolute z-10 pointer-events-none", s.papers)}>
        {/* Back paper — fans right */}
        <motion.div
          variants={{
            rest: { rotate: 4, y: 0, transition: spring },
            hover: { rotate: 6, y: s.hoverBackY, transition: spring },
          }}
          style={{ originY: 1 }}
          className={cn(
            "absolute inset-x-0 rounded-2xl shadow-sm",
            s.paperOffset,
            s.paperH,
            c.paperBack
          )}
        />
        {/* Back paper — fans left */}
        <motion.div
          variants={{
            rest: { rotate: -4, y: 0, transition: spring },
            hover: { rotate: -6, y: s.hoverBackY, transition: spring },
          }}
          style={{ originY: 1 }}
          className={cn(
            "absolute inset-x-0 rounded-2xl shadow-sm",
            s.paperOffset,
            s.paperH,
            c.paperBack
          )}
        />
        {/* Front paper — lifts straight up */}
        <motion.div
          variants={{
            rest: { y: 0, transition: spring },
            hover: { y: s.hoverY, transition: spring },
          }}
          className={cn(
            "absolute inset-x-0 top-0 rounded-xl border-t shadow-sm",
            s.paperH,
            c.paperFront,
            c.paperBorder
          )}
        >
          <div className={s.paperContent}>
            <div className={cn("h-1 w-3/4 rounded-full", c.paperLine)} />
            <div className={cn("h-1 w-1/2 rounded-full", c.paperLine)} />
            <div className={cn("h-1 w-2/3 rounded-full", c.paperLine)} />
          </div>
        </motion.div>
      </div>

      {/* Label inside Folder */}
      {label && (
        isLargeBadge ? (
          <div
            className={cn(
              "absolute z-30 inset-x-2.5 sm:inset-x-3 bottom-2.5 sm:bottom-3 flex flex-col items-center justify-center text-center rounded-2xl px-2.5 py-1.5 sm:py-2 backdrop-blur-md border border-white/25 shadow-md",
              c.labelBg
            )}
          >
            <span className="font-extrabold text-white text-[11.5px] sm:text-xs md:text-sm tracking-tight leading-snug drop-shadow-sm line-clamp-2">
              {label}
            </span>
            {sublabel && (
              <span className="text-[9.5px] sm:text-[10.5px] font-medium text-white/90 leading-tight mt-0.5 line-clamp-1 drop-shadow-xs">
                {sublabel}
              </span>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "absolute z-30 bottom-2.5 left-2.5 rounded-full max-w-[85%] truncate shadow-xs px-2 py-0.5 text-[10px] backdrop-blur-md border border-white/20",
              c.labelBg
            )}
          >
            <span className="font-semibold text-white truncate block">{label}</span>
          </div>
        )
      )}
    </motion.div>
  );
};

export default Folder;
