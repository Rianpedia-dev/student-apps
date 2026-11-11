"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
    <div className="space-y-4 sm:space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Symmetrical Compact Dual-Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Lembar Kerja Berkas */}
          <button
            type="button"
            onClick={() => setActiveTab("document")}
            className={`p-3.5 sm:p-4 md:p-5 rounded-2xl card-elevation text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "document"
                ? "border-2 border-emerald-500 ring-2 ring-emerald-500/15 shadow-lg"
                : "border border-border/70 opacity-85 hover:opacity-100 hover:border-emerald-400/60"
            }`}
          >
            <div className="min-w-0">
              <span
                className={`font-bold text-xs sm:text-sm ${
                  activeTab === "document"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-foreground"
                }`}
              >
                Lembar Kerja (PDF / Gambar)
              </span>
            </div>

            <div className="shrink-0">
              {activeTab === "document" ? (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
              )}
            </div>
          </button>

          {/* Option 2: Kuis Interaktif CBT Online */}
          <button
            type="button"
            onClick={() => setActiveTab("interactive")}
            className={`p-3.5 sm:p-4 md:p-5 rounded-2xl card-elevation text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
              activeTab === "interactive"
                ? "border-2 border-sky-500 ring-2 ring-sky-500/15 shadow-lg"
                : "border border-border/70 opacity-85 hover:opacity-100 hover:border-sky-400/60"
            }`}
          >
            <div className="min-w-0">
              <span
                className={`font-bold text-xs sm:text-sm ${
                  activeTab === "interactive"
                    ? "text-sky-700 dark:text-sky-300"
                    : "text-foreground"
                }`}
              >
                Kuis CBT Online
              </span>
            </div>

            <div className="shrink-0">
              {activeTab === "interactive" ? (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
              )}
            </div>
          </button>
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
