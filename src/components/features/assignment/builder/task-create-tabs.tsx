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
        {/* Tab Switcher */}
        <div className="bg-card p-2 rounded-2xl border border-border shadow-2xs">
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="document"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold">Lembar Kerja Berkas (PDF / Image)</span>
                  <Badge variant="emerald" size="sm" className="text-[10px] py-0 px-1.5 h-4">
                    Baru ✨
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-normal hidden sm:block">
                  Upload file soal PDF atau gambar, murid bisa coret langsung atau unduh
                </p>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="interactive"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold">Kuis Interaktif CBT Online</span>
                <p className="text-[11px] text-muted-foreground font-normal hidden sm:block">
                  Susun butir soal pilihan ganda, isian, dan esai dengan penilaian otomatis
                </p>
              </div>
            </TabsTrigger>
          </TabsList>
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
