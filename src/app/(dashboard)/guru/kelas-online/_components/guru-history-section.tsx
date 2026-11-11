"use client";

import { useState, useMemo } from "react";
import { History, ChevronDown, Users, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FolderCard } from "@/components/ui/folder-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OnlineClassRoomItem,
  WaliKelasMonitorItem,
} from "@/types/kelas-online";

interface GuruHistorySectionProps {
  rooms: OnlineClassRoomItem[];
  waliMonitorRooms?: WaliKelasMonitorItem[];
  isWaliKelas?: boolean;
  waliKelasName?: string | null;
}

function formatHistoryDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatDurationMeta(minutes: number | null | undefined): string {
  if (!minutes) return "Selesai";
  if (minutes < 60) return `${minutes} Menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} Jam`;
}

export function GuruHistorySection({
  rooms,
  waliMonitorRooms = [],
  isWaliKelas = false,
  waliKelasName,
}: GuruHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("ALL");

  const classFilterItems = useMemo(() => {
    const names = Array.from(new Set(rooms.map((r) => r.kelas))).sort();
    return [
      { value: "ALL", label: "Semua Kelas" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [rooms]);

  const subjectFilterItems = useMemo(() => {
    const labels = Array.from(
      new Set(
        rooms.map((r) =>
          r.session_type === "WALI_KELAS"
            ? "Sesi Wali Kelas"
            : r.mata_pelajaran || "Kelas Online"
        )
      )
    ).sort();
    return [
      { value: "ALL", label: "Semua Mapel / Tipe" },
      ...labels.map((label) => ({ value: label, label })),
    ];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedClassFilter !== "ALL" && r.kelas !== selectedClassFilter) {
        return false;
      }
      const subjectLabel =
        r.session_type === "WALI_KELAS"
          ? "Sesi Wali Kelas"
          : r.mata_pelajaran || "Kelas Online";
      if (selectedSubjectFilter !== "ALL" && subjectLabel !== selectedSubjectFilter) {
        return false;
      }
      return true;
    });
  }, [rooms, selectedClassFilter, selectedSubjectFilter]);

  const renderHistoryCards = (
    list: Array<OnlineClassRoomItem & { isOwnRoom?: boolean }>,
    isMonitorMode = false
  ) => {
    if (list.length === 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <FolderCard
            title="Belum Ada Riwayat"
            subtitle={
              isMonitorMode
                ? "Belum ada sesi kelas online di kelas perwalian Anda"
                : "Sesi kelas selesai akan tampil di sini"
            }
            count="0"
            countLabel="Sesi"
            meta="Kosong"
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {list.map((room) => {
          const isWaliSession = room.session_type === "WALI_KELAS";
          const title = isWaliSession
            ? "Sesi Wali Kelas"
            : room.mata_pelajaran || "Kelas Online";

          const subtitleParts = [
            isMonitorMode ? room.guru_name : room.kelas,
            formatHistoryDate(room.started_at),
          ];
          if (room.pertemuan_ke) {
            subtitleParts.push(`Pert. ${room.pertemuan_ke}`);
          }

          const isRoomActive = room.status === "active";

          return (
            <FolderCard
              key={room.id}
              className="h-full"
              title={title}
              subtitle={subtitleParts.join(" • ")}
              count={
                isRoomActive
                  ? room.active_participants ?? 0
                  : room.total_attendance ?? 0
              }
              countLabel={isRoomActive ? "Online" : "Hadir"}
              meta={
                isRoomActive
                  ? "Berlangsung"
                  : formatDurationMeta(room.duration_minutes)
              }
              coverBadge={
                <span className="inline-flex items-center rounded-full bg-black/45 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white/90 ring-1 ring-white/20">
                  {isRoomActive ? "Aktif" : "Selesai"}
                </span>
              }
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-[#f3f3ea]/90 dark:bg-[#151515]/90 hover:bg-[#f3f3ea] dark:hover:bg-[#1f1f1f] shadow-sm transition-all cursor-pointer text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <History className="h-4 w-4 sm:h-5 sm:w-5 text-[#6e6e6a] dark:text-[#8b8b8b] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors shrink-0" />
          <span className="truncate text-sm sm:text-[15px] font-semibold text-foreground">
            {isWaliKelas
              ? "Riwayat Kelas Online & Monitoring Perwalian"
              : "Riwayat Kelas Online"}
          </span>
          {rooms.length > 0 && (
            <Badge variant="secondary" size="sm" className="shrink-0">
              {rooms.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#6e6e6a] dark:text-[#8b8b8b] group-hover:text-foreground transition-colors shrink-0">
          <span>{isOpen ? "Tutup" : "Buka Riwayat"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="pt-0.5 space-y-4 animate-in fade-in-50 duration-200">
          {isWaliKelas && waliKelasName ? (
            <Tabs defaultValue="my-history" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList className="h-9 p-1 rounded-xl">
                  <TabsTrigger value="my-history" className="rounded-lg text-xs font-semibold">
                    <History className="h-3.5 w-3.5" />
                    Riwayat Mengajar Saya
                    <Badge variant="secondary" size="xs">
                      {rooms.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="wali-monitor" className="rounded-lg text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Monitoring Kelas {waliKelasName}
                    <Badge variant="violet" size="xs">
                      {waliMonitorRooms.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="my-history" className="space-y-4">
                {renderFilters()}
                {renderHistoryCards(filteredRooms)}
              </TabsContent>

              <TabsContent value="wali-monitor" className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>
                    Pantau seluruh sesi kelas online yang berlangsung atau telah selesai di
                    rombel asuhan <strong>{waliKelasName}</strong>.
                  </span>
                </div>
                {renderHistoryCards(waliMonitorRooms, true)}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {renderFilters()}
              {renderHistoryCards(filteredRooms)}
            </>
          )}
        </div>
      )}
    </div>
  );

  function renderFilters() {
    if (rooms.length <= 1) return null;

    return (
      <div className="flex flex-wrap items-center gap-2.5">
        {classFilterItems.length > 2 && (
          <Select
            items={classFilterItems}
            value={selectedClassFilter}
            onValueChange={(val) => setSelectedClassFilter(val || "ALL")}
          >
            <SelectTrigger size="sm" className="w-48 rounded-xl text-xs">
              <SelectValue placeholder="Filter Kelas" />
            </SelectTrigger>
            <SelectContent>
              {classFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {subjectFilterItems.length > 2 && (
          <Select
            items={subjectFilterItems}
            value={selectedSubjectFilter}
            onValueChange={(val) => setSelectedSubjectFilter(val || "ALL")}
          >
            <SelectTrigger size="sm" className="w-48 rounded-xl text-xs">
              <SelectValue placeholder="Filter Mapel" />
            </SelectTrigger>
            <SelectContent>
              {subjectFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }
}
