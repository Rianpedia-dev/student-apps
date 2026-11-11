"use client";

import React from "react";
import { Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateRoomForm } from "@/components/features/kelas-online/create-room-form";
import { GuruTodaySchedule } from "./guru-today-schedule";
import { GuruRoomList } from "./guru-room-list";
import { GuruHistorySection } from "./guru-history-section";
import type {
  CreateRoomInitialPreset,
  OnlineClassRoomItem,
  TeacherOnlineClassContext,
  WaliKelasMonitorItem,
} from "@/types/kelas-online";

interface GuruKelasOnlineClientProps {
  context: TeacherOnlineClassContext;
  activeRooms: OnlineClassRoomItem[];
  endedRooms: OnlineClassRoomItem[];
  waliMonitorRooms: WaliKelasMonitorItem[];
  initialPreset?: CreateRoomInitialPreset;
}

export function GuruKelasOnlineClient({
  context,
  activeRooms,
  endedRooms,
  waliMonitorRooms,
  initialPreset,
}: GuruKelasOnlineClientProps) {
  const activeWaliRoom = activeRooms.find((r) => r.session_type === "WALI_KELAS");

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Kelas Online
        </h1>

        <CreateRoomForm context={context} initialPreset={initialPreset} />
      </div>

      {/* Pintasan Jadwal Mengajar Hari Ini & Sesi Wali Kelas */}
      <GuruTodaySchedule
        todaySchedules={context.todaySchedules}
        isWaliKelas={context.isWaliKelas}
        waliKelas={context.waliKelas}
        activeWaliRoomId={activeWaliRoom?.id || null}
      />

      {/* Active Rooms */}
      {activeRooms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <Wifi className="h-5 w-5 text-emerald-500" />
            <span>Kelas Aktif</span>
            <Badge variant="success" size="sm">
              {activeRooms.length}
            </Badge>
          </h2>
          <GuruRoomList rooms={activeRooms} variant="active" />
        </div>
      )}

      {/* Riwayat Kelas Online & Monitoring Perwalian */}
      <GuruHistorySection
        rooms={endedRooms}
        waliMonitorRooms={waliMonitorRooms}
        isWaliKelas={context.isWaliKelas}
        waliKelasName={context.waliKelas?.namaKelas || null}
      />
    </div>
  );
}
