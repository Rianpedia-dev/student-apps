"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder } from "@/components/ui/folder-components";

interface AttendanceQuickActionsProps {
  isWaliKelas: boolean;
  guruClass: string;
  todayFormatted: string;
}

export function AttendanceQuickActions({
  isWaliKelas,
  guruClass,
  todayFormatted,
}: AttendanceQuickActionsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!isWaliKelas) {
    return (
      <div className="flex items-center justify-center sm:justify-start py-2">
        <Link
          href="/guru/attendance/recap"
          onMouseEnter={() => setHoveredIndex(0)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group transition-transform hover:-translate-y-2 active:scale-95 duration-200 focus:outline-none cursor-pointer"
        >
          <Folder
            color="teal"
            size="xl"
            label="Rekap Presensi Mapel"
            sublabel="Riwayat & Persentase KBM"
            isHovered={hoveredIndex === 0}
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 sm:gap-7 lg:gap-8 py-2">
      {/* 1. Rekap & Tabel Presensi */}
      <Link
        href="/guru/attendance/recap"
        onMouseEnter={() => setHoveredIndex(1)}
        onMouseLeave={() => setHoveredIndex(null)}
        className="group transition-transform hover:-translate-y-2 active:scale-95 duration-200 focus:outline-none cursor-pointer"
      >
        <Folder
          color="teal"
          size="xl"
          label="Rekap & Tabel Presensi"
          sublabel="Buku Absen & Rapor Bulanan"
          isHovered={hoveredIndex === 1}
        />
      </Link>

      {/* 2. Supervisi Kelas */}
      <Link
        href="/guru/attendance/matrix"
        onMouseEnter={() => setHoveredIndex(2)}
        onMouseLeave={() => setHoveredIndex(null)}
        className="group transition-transform hover:-translate-y-2 active:scale-95 duration-200 focus:outline-none cursor-pointer"
      >
        <Folder
          color="emerald"
          size="xl"
          label="Supervisi Kelas"
          sublabel={guruClass || "Wali Kelas"}
          isHovered={hoveredIndex === 2}
        />
      </Link>
    </div>
  );
}
