"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DeadlinePicker } from "@/components/shared/deadline-picker";

export interface ClassOption {
  id: string;
  nama: string;
  jenjang: string;
  tingkat?: number | null;
}

export interface SubjectOption {
  id: string;
  kode: string;
  nama: string;
  jenjang: string;
}

export interface PertemuanOption {
  id: string;
  pertemuan_ke: number;
  judul: string;
}

interface BuilderStepInfoProps {
  judul: string;
  setJudul: (val: string) => void;
  deskripsi: string;
  setDeskripsi: (val: string) => void;
  kelasId: string;
  setKelasId: (val: string) => void;
  mapelId: string;
  setMapelId: (val: string) => void;
  pertemuanId: string;
  setPertemuanId: (val: string) => void;
  deadline: string;
  setDeadline: (val: string) => void;
  classes: ClassOption[];
  subjects: SubjectOption[];
  pertemuanList: PertemuanOption[];
  onNext: () => void;
}

export function BuilderStepInfo({
  judul,
  setJudul,
  deskripsi,
  setDeskripsi,
  kelasId,
  setKelasId,
  mapelId,
  setMapelId,
  pertemuanId,
  setPertemuanId,
  deadline,
  setDeadline,
  classes,
  subjects,
  pertemuanList,
  onNext,
}: BuilderStepInfoProps) {
  const pertemuanItems = React.useMemo(() => {
    const list: Array<{ value: string; label: string }> = [
      { value: "none", label: "Tidak ditautkan" },
    ];
    pertemuanList.forEach((p) => {
      list.push({
        value: p.id,
        label: `Pertemuan ${p.pertemuan_ke}: ${p.judul}`,
      });
    });
    return list;
  }, [pertemuanList]);

  return (
    <Card className="w-full rounded-2xl sm:rounded-3xl card-elevation shadow-2xl">
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Judul Tugas & Pertemuan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className={`space-y-1.5 ${pertemuanList.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}`}>
            <label className="text-xs font-semibold text-foreground block">
              Judul Tugas <span className="text-destructive">*</span>
            </label>
            <Input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Kuis Interaktif Bab 1 - Bilangan Bulat"
              className="text-xs sm:text-sm h-10 rounded-xl"
            />
          </div>

          {pertemuanList.length > 0 && (
            <div className="space-y-1.5 lg:col-span-5">
              <label className="text-xs font-semibold text-foreground block">
                Tautkan ke Pertemuan (Opsional)
              </label>
              <Select
                items={pertemuanItems}
                value={pertemuanId || "none"}
                onValueChange={(val) => setPertemuanId(val === "none" ? "" : val || "")}
              >
                <SelectTrigger className="w-full text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Tidak ditautkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ditautkan</SelectItem>
                  {pertemuanList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      Pertemuan {p.pertemuan_ke}: {p.judul}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tenggat Waktu */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Tenggat Waktu / Deadline <span className="text-destructive">*</span>
          </label>
          <DeadlinePicker value={deadline} onChange={setDeadline} />
        </div>

        {/* Deskripsi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Instruksi / Petunjuk Pengerjaan <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={4}
            placeholder="Tuliskan petunjuk pengerjaan tugas untuk siswa..."
            className="text-xs sm:text-sm leading-relaxed rounded-2xl"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto text-xs font-semibold gap-1.5 h-10 px-5 rounded-xl cursor-pointer"
          >
            <span>Lanjut ke Butir Soal</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
