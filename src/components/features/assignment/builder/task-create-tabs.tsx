"use client";

import React, { useState } from "react";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DocumentTaskBuilder } from "./document-task-builder";
import { InteractiveTaskBuilder } from "./interactive-task-builder";

interface TaskCreateTabsProps {
  classes: Array<{ id: string; nama: string; jenjang?: string; tingkat?: number | null }>;
  subjects: Array<{ id: string; kode: string; nama: string; jenjang?: string }>;
  pertemuanList?: Array<{ id: string; pertemuan_ke: number; judul: string }>;
  defaultKelas?: string;
  initialKelasId?: string;
  initialMapelId?: string;
  fromOrigin?: string;
}

export function TaskCreateTabs({
  classes,
  subjects,
  pertemuanList = [],
  defaultKelas,
  initialKelasId,
  initialMapelId,
  fromOrigin,
}: TaskCreateTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("document");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Symmetrical Compact Dual-Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Lembar Kerja Berkas */}
          <button
            type="button"
            onClick={() => setActiveTab("document")}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "document"
                ? "bg-white/95 dark:bg-slate-900/95 border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm"
                : "bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className={`font-bold text-sm ${
                  activeTab === "document"
                    ? "text-emerald-950 dark:text-emerald-100"
                    : "text-foreground"
                }`}
              >
                Lembar Kerja (PDF / Gambar)
              </span>
              <Badge
                variant="emerald"
                size="sm"
                className="text-[10px] font-bold py-0.5 px-2 shrink-0"
              >
                Baru ✨
              </Badge>
            </div>

            <div className="shrink-0">
              {activeTab === "document" ? (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              )}
            </div>
          </button>

          {/* Option 2: Kuis Interaktif CBT Online */}
          <button
            type="button"
            onClick={() => setActiveTab("interactive")}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "interactive"
                ? "bg-white/95 dark:bg-slate-900/95 border-blue-500 ring-2 ring-blue-500/15 shadow-sm"
                : "bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className={`font-bold text-sm ${
                  activeTab === "interactive"
                    ? "text-blue-950 dark:text-blue-100"
                    : "text-foreground"
                }`}
              >
                Kuis CBT Online
              </span>
              <Badge
                variant="secondary"
                size="sm"
                className="text-[10px] font-bold py-0.5 px-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shrink-0"
              >
                Otomatis ⚡
              </Badge>
            </div>

            <div className="shrink-0">
              {activeTab === "interactive" ? (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              )}
            </div>
          </button>
        </div>

        {/* Tab 1: Lembar Kerja Berkas PDF / Image */}
        <TabsContent value="document" className="mt-5 space-y-4">
          <DocumentTaskBuilder
            classes={classes}
            subjects={subjects}
            pertemuanList={pertemuanList}
            defaultKelas={defaultKelas}
            initialKelasId={initialKelasId}
            initialMapelId={initialMapelId}
          />
        </TabsContent>

        {/* Tab 2: Kuis Interaktif CBT */}
        <TabsContent value="interactive" className="mt-5 space-y-4">
          <InteractiveTaskBuilder
            classes={classes.map((c) => ({
              id: c.id,
              nama: c.nama,
              jenjang: c.jenjang || "SD",
              tingkat: c.tingkat || 4,
            }))}
            subjects={subjects.map((s) => ({
              id: s.id,
              kode: s.kode,
              nama: s.nama,
              jenjang: s.jenjang || "SEMUA",
            }))}
            pertemuanList={pertemuanList}
            defaultKelas={defaultKelas}
            initialKelasId={initialKelasId}
            initialMapelId={initialMapelId}
            fromOrigin={fromOrigin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
