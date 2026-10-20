"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { SunMoonThemeToggle } from "@/components/ui/sun-moon-theme-toggle";

export interface ThemeToggleProps {
  className?: string;
  size?: number;
  duration?: number;
  sky?: boolean;
}

export function ThemeToggle({
  className,
  size = 37,
  duration = 1000,
  sky = true,
}: ThemeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <SunMoonThemeToggle
      size={size}
      duration={duration}
      sky={sky}
      storageKey="theme"
      onThemeChange={(newTheme) => setTheme(newTheme)}
      className={className}
    />
  );
}

export default ThemeToggle;
