"use client";

import React, { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
  subjectLabel?: string;
  classLabel?: string;
}

export function TaskCreateTabs({
  classes,
  subjects,
  pertemuanList = [],
  defaultKelas,
  initialKelasId,
  initialMapelId,
  fromOrigin,
  subjectLabel,
  classLabel,
}: TaskCreateTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("document");
  const contextLabel = [subjectLabel, classLabel].filter(Boolean).join(" • ");

  return (
    <div className="space-y-4 sm:space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Header & Segmented Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
              Buat Tugas Baru
            </h1>
            {contextLabel && (
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {contextLabel}
              </p>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Pilih Jenis Tugas"
            className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 rounded-2xl bg-muted/70 border border-border/70 shadow-2xs shrink-0 w-full md:w-fit"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "document"}
              onClick={() => setActiveTab("document")}
              className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "document"
                  ? "bg-card text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="sm:hidden">Lembar Kerja</span>
              <span className="hidden sm:inline whitespace-nowrap">Lembar Kerja (PDF / Gambar)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "interactive"}
              onClick={() => setActiveTab("interactive")}
              className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "interactive"
                  ? "bg-card text-sky-700 dark:text-sky-300 shadow-xs ring-1 ring-sky-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="sm:hidden">Kuis CBT</span>
              <span className="hidden sm:inline whitespace-nowrap">Kuis CBT Online</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Lembar Kerja Berkas PDF / Image */}
        <TabsContent value="document" className="mt-4 sm:mt-5 space-y-4">
          <DocumentTaskBuilder
            classes={classes}
            subjects={subjects}
            pertemuanList={pertemuanList}
            defaultKelas={defaultKelas}
            initialKelasId={initialKelasId}
            initialMapelId={initialMapelId}
            fromOrigin={fromOrigin}
          />
        </TabsContent>

        {/* Tab 2: Kuis Interaktif CBT */}
        <TabsContent value="interactive" className="mt-4 sm:mt-5 space-y-4">
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
