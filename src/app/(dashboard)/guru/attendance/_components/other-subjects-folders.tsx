"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, type FolderColor } from "@/components/ui/folder-components";

interface SubjectItem {
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  kelasId: string;
  kelasNama: string;
}

interface OtherSubjectsFoldersProps {
  assignedSubjects: SubjectItem[];
  todayFormatted: string;
}

// Palet warna cerah beragam untuk membuat folder warna-warni dinamis
const VIBRANT_FOLDER_COLORS: FolderColor[] = [
  "blue",
  "purple",
  "orange",
  "emerald",
  "teal",
  "red",
  "yellow",
];

export function OtherSubjectsFolders({
  assignedSubjects,
  todayFormatted,
}: OtherSubjectsFoldersProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (assignedSubjects.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada mata pelajaran yang ditugaskan ke akun Anda.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 sm:gap-7 lg:gap-8 py-2">
      {assignedSubjects.map((sub, idx) => {
        const href = `/guru/attendance/${sub.mapelId}/${sub.kelasId}/${todayFormatted}`;
        const folderColor = VIBRANT_FOLDER_COLORS[idx % VIBRANT_FOLDER_COLORS.length];

        return (
          <Link
            key={`${sub.mapelId}-${sub.kelasId}-${idx}`}
            href={href}
            title={`${sub.mapelNama} - ${sub.kelasNama}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="group transition-transform hover:-translate-y-2 active:scale-95 duration-200 focus:outline-none cursor-pointer"
          >
            <Folder
              color={folderColor}
              size="xl"
              label={sub.mapelNama}
              sublabel={sub.kelasNama}
              isHovered={hoveredIdx === idx}
            />
          </Link>
        );
      })}
    </div>
  );
}

