"use client";

import { useState } from "react";
import { History, ChevronDown, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { KelasOnlineSessionType } from "@/types/kelas-online";

export interface SiswaHistoryRecord {
  id: string;
  room_id: string;
  mata_pelajaran: string;
  session_type: KelasOnlineSessionType;
  topik: string | null;
  pertemuan_ke: number | null;
  guru_name: string;
  joined_at: string | null;
  left_at: string | null;
  duration_minutes: number | null;
  date: string;
}

interface SiswaHistorySectionProps {
  records: SiswaHistoryRecord[];
}

export function SiswaHistorySection({ records }: SiswaHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <History className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-500 group-hover:text-primary transition-colors shrink-0" />
          <span className="truncate text-sm sm:text-[15px] font-semibold text-foreground">
            Riwayat Kelas Sebelumnya
          </span>
          {records.length > 0 && (
            <Badge variant="secondary" size="xs" className="shrink-0">
              {records.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          <span>{isOpen ? "Tutup" : "Buka Riwayat"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="pt-0.5 animate-in fade-in-50 duration-200">
          {records.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {records.map((rec) => (
                <Card key={rec.id} elevationSize="sm">
                  <CardContent className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">
                          {rec.mata_pelajaran}
                        </p>
                        <Badge
                          variant={rec.session_type === "WALI_KELAS" ? "violet" : "emerald"}
                          size="xs"
                        >
                          {rec.session_type === "WALI_KELAS" ? "Wali Kelas" : "Mapel"}
                        </Badge>
                        {rec.pertemuan_ke && (
                          <Badge variant="outline" size="xs">
                            Pert. {rec.pertemuan_ke}
                          </Badge>
                        )}
                      </div>
                      {rec.topik && (
                        <p className="text-[11px] sm:text-xs text-foreground/80 line-clamp-1">
                          Topik: {rec.topik}
                        </p>
                      )}
                      <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {rec.guru_name} • {rec.date}
                        </span>
                      </p>
                    </div>
                    <Badge variant="secondary" size="xs" className="gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {rec.duration_minutes
                        ? rec.duration_minutes < 60
                          ? `${rec.duration_minutes}m`
                          : `${Math.floor(rec.duration_minutes / 60)}j ${rec.duration_minutes % 60}m`
                        : "-"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                <History className="h-7 w-7 mx-auto mb-2 opacity-40" />
                <p>Belum ada riwayat kelas online</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
