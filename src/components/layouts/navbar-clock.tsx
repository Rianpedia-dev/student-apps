"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAcademicYear } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavbarLiveClockProps {
  academic?: {
    tahunPelajaran: string;
    semester?: string;
  };
}

export function NavbarLiveClock({ academic: academicProp }: NavbarLiveClockProps = {}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const academic = academicProp || getAcademicYear();

  const baseShadow = "0px 2px 4px 0px rgba(0, 0, 0, 0.25)";
  const hoverShadow = "0px 3px 6px 0px rgba(0, 0, 0, 0.35)";
  const pressedShadow = "0px 0px 0px 0px rgba(0, 0, 0, 0.25)";

  if (!now) {
    return (
      <div
        style={{ boxShadow: baseShadow }}
        className="inline-flex flex-col justify-center rounded-[var(--radius)] border border-border bg-card px-3.5 sm:px-4 py-1.5 text-xs select-none shrink-0 w-fit"
      >
        <span className="inline-block h-3.5 w-20 animate-pulse rounded-[var(--radius)] bg-muted" />
        <span className="inline-block h-3 w-16 animate-pulse rounded-[var(--radius)] bg-muted/70 mt-1" />
      </div>
    );
  }

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}:${seconds}`;

  return (
    <motion.div
      initial={{ x: 0, y: 0, boxShadow: baseShadow }}
      animate={{ x: 0, y: 0, boxShadow: baseShadow }}
      whileHover={{ y: -1, boxShadow: hoverShadow }}
      whileTap={{ y: 1, boxShadow: pressedShadow }}
      transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.6 }}
      className="inline-flex flex-col justify-center rounded-[var(--radius)] border border-border bg-card px-3.5 sm:px-4 py-1.5 select-none backdrop-blur-sm shrink-0 w-fit cursor-default"
    >
      {/* Baris 1 (Atas): Tahun Pelajaran */}
      <div className="flex items-center text-xs sm:text-[13px] font-bold text-foreground leading-tight tracking-tight">
        <span>TP {academic.tahunPelajaran}</span>
      </div>

      {/* Baris 2 (Bawah): Jam:Menit:Detik & WIB */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs leading-tight text-muted-foreground tabular-nums mt-0.5 sm:mt-1 tracking-tight font-medium">
        {/* Live Time with seconds */}
        <span className="font-mono font-bold text-xs sm:text-[13px] text-foreground tracking-tight">
          {timeStr}
        </span>

        {/* WIB suffix */}
        <Badge variant="outline" size="xs" className="text-[9px] font-bold uppercase tracking-wider text-primary">
          WIB
        </Badge>
      </div>
    </motion.div>
  );
}
