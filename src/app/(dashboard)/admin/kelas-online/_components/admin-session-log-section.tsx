"use client";

import { useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminSessionLogItem } from "../page";

interface AdminSessionLogSectionProps {
  sessions: AdminSessionLogItem[];
}

export function AdminSessionLogSection({ sessions }: AdminSessionLogSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors" />
          <span className="text-base font-semibold text-foreground">
            Log Semua Sesi
          </span>
          {sessions.length > 0 && (
            <Badge variant="secondary" size="sm">
              {sessions.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          <span>{isOpen ? "Tutup" : "Buka Log Sesi"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="pt-1 animate-in fade-in-50 duration-200">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Guru</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Mapel / Tipe</TableHead>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Hadir</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.guru_name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{s.kelas}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span>{s.mata_pelajaran || "-"}</span>
                          <Badge
                            variant={s.session_type === "WALI_KELAS" ? "violet" : "outline"}
                            size="xs"
                          >
                            {s.session_type === "WALI_KELAS" ? "Wali" : "Mapel"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {s.started_at
                          ? new Date(s.started_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {s.duration_minutes
                          ? s.duration_minutes < 60
                            ? `${s.duration_minutes}m`
                            : `${Math.floor(s.duration_minutes / 60)}j ${s.duration_minutes % 60}m`
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{s.total_attendance}</TableCell>
                      <TableCell>
                        {s.status === "active" ? (
                          <Badge variant="success" size="sm">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">
                            Selesai
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Belum ada sesi kelas online bulan ini
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
