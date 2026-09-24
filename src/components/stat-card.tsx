import Link from "next/link";
import Image from "next/image";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlAzharMosqueWatermark, AlAzharCornerMosaic } from "@/components/ui/alazhar-patterns";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  imageSrc?: string;
  description?: string;
  variant?: "emerald" | "blue" | "amber" | "rose" | "purple" | "primary" | "secondary" | "accent";
  href?: string;
  valueClassName?: string;
  showWatermark?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  imageSrc,
  description,
  variant = "primary",
  href,
  valueClassName,
  showWatermark = true,
}: StatCardProps) {
  const variantStyles = {
    // Primary / Emerald: Hijau Zamrud Al-Azhar
    primary: {
      card: "border-emerald-500/25 bg-white dark:bg-card hover:border-emerald-500/50 hover:shadow-lg",
      header: "bg-emerald-500/10 border-b border-emerald-500/15 text-emerald-800 dark:text-emerald-300",
      glow: "bg-emerald-500/15",
      iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs",
      dot: "bg-emerald-500 shadow-xs",
      titleHover: "group-hover:text-emerald-600",
      accent: "text-emerald-600",
      watermark: "text-emerald-600/20 dark:text-emerald-400/20",
    },
    emerald: {
      card: "border-emerald-500/25 bg-white dark:bg-card hover:border-emerald-500/50 hover:shadow-lg",
      header: "bg-emerald-500/10 border-b border-emerald-500/15 text-emerald-800 dark:text-emerald-300",
      glow: "bg-emerald-500/15",
      iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs",
      dot: "bg-emerald-500 shadow-xs",
      titleHover: "group-hover:text-emerald-600",
      accent: "text-emerald-600",
      watermark: "text-emerald-600/20 dark:text-emerald-400/20",
    },
    // Amber / Gold: Emas & Jingga Al-Azhar
    amber: {
      card: "border-amber-500/25 bg-white dark:bg-card hover:border-amber-500/50 hover:shadow-lg",
      header: "bg-amber-500/10 border-b border-amber-500/15 text-amber-800 dark:text-amber-300",
      glow: "bg-amber-500/15",
      iconBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs",
      dot: "bg-amber-500 shadow-xs",
      titleHover: "group-hover:text-amber-600",
      accent: "text-amber-600",
      watermark: "text-amber-600/20 dark:text-amber-400/20",
    },
    // Accent / Blue: Biru Safir & Cyan Lembut
    accent: {
      card: "border-sky-500/25 bg-white dark:bg-card hover:border-sky-500/50 hover:shadow-lg",
      header: "bg-sky-500/10 border-b border-sky-500/15 text-sky-800 dark:text-sky-300",
      glow: "bg-sky-500/15",
      iconBg: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 shadow-xs",
      dot: "bg-sky-500 shadow-xs",
      titleHover: "group-hover:text-sky-600",
      accent: "text-sky-600",
      watermark: "text-sky-600/20 dark:text-sky-400/20",
    },
    blue: {
      card: "border-sky-500/25 bg-white dark:bg-card hover:border-sky-500/50 hover:shadow-lg",
      header: "bg-sky-500/10 border-b border-sky-500/15 text-sky-800 dark:text-sky-300",
      glow: "bg-sky-500/15",
      iconBg: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 shadow-xs",
      dot: "bg-sky-500 shadow-xs",
      titleHover: "group-hover:text-sky-600",
      accent: "text-sky-600",
      watermark: "text-sky-600/20 dark:text-sky-400/20",
    },
    // Secondary: Teal / Jade Green
    secondary: {
      card: "border-teal-500/25 bg-white dark:bg-card hover:border-teal-500/50 hover:shadow-lg",
      header: "bg-teal-500/10 border-b border-teal-500/15 text-teal-800 dark:text-teal-300",
      glow: "bg-teal-500/15",
      iconBg: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 shadow-xs",
      dot: "bg-teal-500 shadow-xs",
      titleHover: "group-hover:text-teal-600",
      accent: "text-teal-600",
      watermark: "text-teal-600/20 dark:text-teal-400/20",
    },
    // Purple: Ungu Amethyst Al-Azhar
    purple: {
      card: "border-purple-500/25 bg-white dark:bg-card hover:border-purple-500/50 hover:shadow-lg",
      header: "bg-purple-500/10 border-b border-purple-500/15 text-purple-800 dark:text-purple-300",
      glow: "bg-purple-500/15",
      iconBg: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 shadow-xs",
      dot: "bg-purple-500 shadow-xs",
      titleHover: "group-hover:text-purple-600",
      accent: "text-purple-600",
      watermark: "text-purple-600/20 dark:text-purple-400/20",
    },
    // Rose: Red Carmine
    rose: {
      card: "border-rose-500/25 bg-white dark:bg-card hover:border-rose-500/50 hover:shadow-lg",
      header: "bg-rose-500/10 border-b border-rose-500/15 text-rose-800 dark:text-rose-300",
      glow: "bg-rose-500/15",
      iconBg: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-xs",
      dot: "bg-rose-500 shadow-xs",
      titleHover: "group-hover:text-rose-600",
      accent: "text-rose-600",
      watermark: "text-rose-600/20 dark:text-rose-400/20",
    },
  };

  const current = variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary;

  const cardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300 h-full flex flex-col justify-between shadow-xs",
        href
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-[0.99]"
          : "hover:-translate-y-0.5 hover:shadow-sm",
        current.card
      )}
    >
      {/* Ambient background glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 opacity-40 group-hover:opacity-80",
          current.glow
        )}
      />

      {/* Top Themed Header Band with Mosque Watermark (As seen in Al-Azhar mockup) */}
      <div
        className={cn(
          "relative flex items-center justify-between px-3.5 py-2 text-xs font-semibold overflow-hidden shrink-0",
          current.header
        )}
      >
        {/* Corner Geometric Prism Accent */}
        <AlAzharCornerMosaic className="absolute top-0 right-0 w-24 sm:w-28 h-full pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity select-none z-0" />
        <div className="flex items-center gap-1.5 min-w-0 z-10">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", current.dot)} />
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-wider truncate",
              href && current.titleHover
            )}
          >
            {title}
          </span>
        </div>

        {showWatermark && (
          <AlAzharMosqueWatermark
            className={cn("h-5.5 w-14 shrink-0 transition-opacity", current.watermark)}
          />
        )}
      </div>

      <CardContent className="relative p-3.5 sm:p-4 flex flex-col justify-between flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div
              className={cn(
                "tracking-tight text-foreground",
                valueClassName || "text-xl sm:text-2xl lg:text-3xl font-extrabold truncate"
              )}
              title={typeof value === "string" ? value : undefined}
            >
              {value}
            </div>
            {description && (
              <p className="text-[11px] font-medium text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>

          {Icon ? (
            <div
              className={cn(
                "flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                current.iconBg
              )}
            >
              <span className="menu-icon-wrapper shrink-0 flex items-center justify-center">
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </span>
            </div>
          ) : imageSrc ? (
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl overflow-hidden border border-border bg-muted/60 flex items-center justify-center shadow-xs">
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="44px"
                className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          ) : null}
        </div>

      </CardContent>

      {/* Subtle Bottom Multi-Color Prism Strip Indicator */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-emerald-500 to-sky-400 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus:outline-hidden h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

