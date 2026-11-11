"use client";

import { motion } from "framer-motion";
import { getAcademicYear } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface NavbarAcademicInfo {
  tahunPelajaran: string;
  semester?: string;
  semesterNum?: number;
}

interface NavbarLiveClockProps {
  academic?: NavbarAcademicInfo;
}

/**
 * Menormalkan label tahun pelajaran dan semester berjalan untuk tampilan banner navbar.
 */
export function resolveSemesterDisplay(academic?: NavbarAcademicInfo) {
  const fallback = getAcademicYear();
  const tahunPelajaran = academic?.tahunPelajaran || fallback.tahunPelajaran;
  const semesterNum =
    academic?.semesterNum ??
    (academic?.semester
      ? academic.semester.includes("2") || /genap/i.test(academic.semester)
        ? 2
        : 1
      : fallback.semesterNum);

  return {
    tahunPelajaran,
    semesterNum,
    semesterLabel: `Semester ${semesterNum}`,
    semesterPeriod: semesterNum === 2 ? "Genap" : "Ganjil",
  };
}

export function NavbarLiveClock({ academic: academicProp }: NavbarLiveClockProps = {}) {
  const { tahunPelajaran, semesterLabel, semesterPeriod } = resolveSemesterDisplay(academicProp);

  const baseShadow = "0px 2px 4px 0px rgba(0, 0, 0, 0.25)";
  const hoverShadow = "0px 3px 6px 0px rgba(0, 0, 0, 0.35)";
  const pressedShadow = "0px 0px 0px 0px rgba(0, 0, 0, 0.25)";

  return (
    <motion.div
      initial={{ x: 0, y: 0, boxShadow: baseShadow }}
      animate={{ x: 0, y: 0, boxShadow: baseShadow }}
      whileHover={{ y: -1, boxShadow: hoverShadow }}
      whileTap={{ y: 1, boxShadow: pressedShadow }}
      transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.6 }}
      className="inline-flex flex-col justify-center rounded-2xl border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-slate-900/80 px-3.5 sm:px-4 py-1.5 select-none backdrop-blur-xl shrink-0 w-fit cursor-default shadow-md"
    >
      {/* Baris 1 (Atas): Tahun Pelajaran */}
      <div className="flex items-center text-xs sm:text-[13px] font-extrabold text-foreground leading-tight tracking-tight">
        <span>TP {tahunPelajaran}</span>
      </div>

      {/* Baris 2 (Bawah): Semester Berjalan */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs leading-tight text-muted-foreground mt-0.5 sm:mt-1 tracking-tight font-medium">
        <span className="font-bold text-xs sm:text-[13px] text-foreground tracking-tight">
          {semesterLabel}
        </span>

        <Badge variant="emerald" size="xs" className="text-[9px] font-bold uppercase tracking-wider">
          {semesterPeriod}
        </Badge>
      </div>
    </motion.div>
  );
}
