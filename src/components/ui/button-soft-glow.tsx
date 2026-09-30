"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SoftGlowButtonProps extends React.ComponentProps<typeof Button> {
  glowColor?: "primary" | "amber" | "emerald" | "steel" | "rose";
}

/**
 * Komponen SoftGlowButton:
 * Mengimplementasikan gaya Soft Glow Button dengan gradient vertikal halus,
 * border translusen 2px, shadow glow berwarna pekat, ring halo luar,
 * dan animasi interaktif hover brightness.
 */
export function SoftGlowButton({
  className,
  glowColor = "primary",
  children,
  ...props
}: SoftGlowButtonProps) {
  const glowVariants = {
    primary:
      "from-primary to-primary/85 text-primary-foreground border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-primary/70 ring-4 ring-offset ring-background/30 transition-[filter,box-shadow,transform] duration-200 hover:brightness-120 active:brightness-100",
    amber:
      "from-amber-500 to-amber-400 text-slate-950 border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-amber-500/70 ring-4 ring-offset ring-background/30 transition-[filter,box-shadow,transform] duration-200 hover:brightness-120 active:brightness-100",
    emerald:
      "from-emerald-600 to-emerald-500 text-white border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-emerald-600/70 ring-4 ring-offset ring-background/30 transition-[filter,box-shadow,transform] duration-200 hover:brightness-120 active:brightness-100",
    steel:
      "from-sky-500 to-blue-600 text-white border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-sky-500/70 ring-4 ring-offset ring-background/30 transition-[filter,box-shadow,transform] duration-200 hover:brightness-120 active:brightness-100",
    rose:
      "from-rose-600 to-rose-500 text-white border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-rose-600/70 ring-4 ring-offset ring-background/30 transition-[filter,box-shadow,transform] duration-200 hover:brightness-120 active:brightness-100",
  };

  return (
    <Button
      className={cn(glowVariants[glowColor] || glowVariants.primary, className)}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * ButtonDemo persis sesuai spesifikasi plan-implement-style-button.md:
 */
export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-6 rounded-2xl bg-card border border-border">
      <Button
        size="icon"
        className="h-16 text-xl w-16 from-primary to-primary/85 text-primary-foreground border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-primary/70 ring-4 ring-offset ring-background/30 transition-[filter] duration-200 hover:brightness-120 active:brightness-100"
      >
        <Moon strokeWidth={1.5} className="size-6" />
      </Button>
      <Button
        className="h-16 text-xl px-12 from-primary to-primary/85 text-primary-foreground border-2 border-foreground/10 bg-gradient-to-t shadow-xl shadow-primary/70 ring-4 ring-offset ring-background/30 transition-[filter] duration-200 hover:brightness-120 active:brightness-100"
      >
        <Sparkles strokeWidth={1.5} className="size-5 mr-2" />
        Soft Glow
      </Button>
    </div>
  );
}

export default ButtonDemo;
