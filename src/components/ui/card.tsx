"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tiles } from "@/components/shared/tiles";

// ─── Card Background (Interactive Grid) ─────────────────────────────────────

function CardBackground({
  rows = 12,
  cols = 8,
  tileSize = "md",
  className,
}: {
  rows?: number;
  cols?: number;
  tileSize?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none z-0 select-none opacity-25",
        className
      )}
      aria-hidden="true"
    >
      <Tiles rows={rows} cols={cols} tileSize={tileSize} />
    </div>
  );
}

// ─── Card Variants ──────────────────────────────────────────────────────────

export type CardVariant =
  | "default"
  | "emerald"
  | "amber"
  | "sky"
  | "rose"
  | "purple"
  | "dark-glass";

const CARD_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "",
  emerald:
    "bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/25 dark:border-emerald-400/20 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/5",
  amber:
    "bg-amber-500/10 dark:bg-amber-950/25 border-amber-500/25 dark:border-amber-400/20 text-amber-950 dark:text-amber-100 shadow-amber-500/5",
  sky:
    "bg-sky-500/10 dark:bg-sky-950/25 border-sky-500/25 dark:border-sky-400/20 text-sky-950 dark:text-sky-100 shadow-sky-500/5",
  rose:
    "bg-rose-500/10 dark:bg-rose-950/25 border-rose-500/25 dark:border-rose-400/20 text-rose-950 dark:text-rose-100 shadow-rose-500/5",
  purple:
    "bg-purple-500/10 dark:bg-purple-950/25 border-purple-500/25 dark:border-purple-400/20 text-purple-950 dark:text-purple-100 shadow-purple-500/5",
  "dark-glass":
    "bg-black/25 backdrop-blur-xl border-white/10 text-white shadow-2xl",
};

// ─── Card ────────────────────────────────────────────────────────────────────

export interface CardProps extends React.ComponentProps<"div"> {
  enableTiles?: boolean;
  tileRows?: number;
  tileCols?: number;
  tileSize?: "sm" | "md" | "lg";
  elevationSize?: "default" | "sm";
  enableHover?: boolean;
  variant?: CardVariant;
}

function Card({
  className,
  enableTiles = false,
  tileRows = 12,
  tileCols = 8,
  tileSize = "md",
  elevationSize = "default",
  enableHover = false,
  variant = "default",
  children,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "card-elevation text-card-foreground relative overflow-hidden flex flex-col rounded-3xl",
        enableHover && "card-elevation-hover",
        elevationSize === "sm" && "card-elevation-sm rounded-2xl",
        CARD_VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {enableTiles && (
        <CardBackground rows={tileRows} cols={tileCols} tileSize={tileSize} />
      )}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

// ─── Card Sub-Components ─────────────────────────────────────────────────────

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-5 sm:p-6 pb-2 sm:pb-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 [.border-b]:border-border/60",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-snug font-semibold text-base sm:text-lg tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs sm:text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-5 sm:p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-5 sm:p-6 pt-0 [.border-t]:pt-4 [.border-t]:border-border/60", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardBackground,
};

export default Card;
