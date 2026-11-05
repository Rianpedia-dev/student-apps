"use client";

import React from "react";
import { ModernCalendar } from "./modern-calendar";

interface ClassOption {
  id: string;
  nama_kelas: string;
  jenjang?: string;
}

interface CalendarClientProps {
  canManage?: boolean;
  userRole?: "admin" | "guru" | "siswa";
  userJenjang?: string | null;
  userClass?: string | null;
  classList?: ClassOption[];
  categories?: string[];
  pageTitle?: string;
  pageSubtitle?: string;
}

export function CalendarClient({
  canManage = true,
  userRole = "admin",
  userJenjang = "ALL",
  userClass = null,
  classList = [],
  pageTitle,
  pageSubtitle,
}: CalendarClientProps) {
  return (
    <ModernCalendar
      canManage={canManage}
      userRole={userRole}
      userJenjang={userJenjang}
      userClass={userClass}
      classList={classList}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
    />
  );
}

export default CalendarClient;
