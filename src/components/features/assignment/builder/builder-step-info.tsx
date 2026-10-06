"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  const sdClasses = classes.filter((c) => c.jenjang === "SD");
  const smpClasses = classes.filter((c) => c.jenjang === "SMP");

  const classItems = React.useMemo(
    () =>
      classes.map((c) => ({
        value: c.id,
        label: c.nama,
      })),
    [classes]
  );

  const subjectItems = React.useMemo(
    () =>
      subjects.map((s) => ({
        value: s.id,
        label: s.jenjang ? `${s.nama} (${s.jenjang})` : s.nama,
      })),
    [subjects]
  );

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
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Informasi Tugas</CardTitle>
        <CardDescription className="text-xs">
          Lengkapi data utama tugas seperti judul, kelas tujuan, mata pelajaran, dan tenggat waktu pengerjaan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Judul Tugas */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Judul Tugas <span className="text-destructive">*</span>
          </label>
          <Input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Kuis Interaktif Bab 1 - Bilangan Bulat"
            className="text-xs sm:text-sm h-10"
          />
        </div>

        {/* Kelas & Mapel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Kelas Tujuan <span className="text-destructive">*</span>
            </label>
            <Select
              items={classItems}
              value={kelasId}
              onValueChange={(val) => setKelasId(val || "")}
            >
              <SelectTrigger className="w-full text-xs h-10">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {sdClasses.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                      Jenjang SD
                    </div>
                    {sdClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nama}
                      </SelectItem>
                    ))}
                  </>
                )}
                {smpClasses.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                      Jenjang SMP
                    </div>
                    {smpClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nama}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mata Pelajaran <span className="text-destructive">*</span>
            </label>
            <Select
              items={subjectItems}
              value={mapelId}
              onValueChange={(val) => setMapelId(val || "")}
            >
              <SelectTrigger className="w-full text-xs h-10">
                <SelectValue placeholder="Pilih Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nama} ({s.jenjang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pertemuan & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pertemuanList.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tautkan ke Pertemuan (Opsional)
              </label>
              <Select
                items={pertemuanItems}
                value={pertemuanId || "none"}
                onValueChange={(val) => setPertemuanId(val === "none" ? "" : val || "")}
              >
                <SelectTrigger className="w-full text-xs h-10">
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
          ) : null}

          <div className={`space-y-1.5 ${pertemuanList.length === 0 ? "sm:col-span-2" : ""}`}>
            <label className="text-xs font-semibold text-foreground">
              Tenggat Waktu / Deadline <span className="text-destructive">*</span>
            </label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="text-xs sm:text-sm h-10"
            />
          </div>
        </div>

        {/* Deskripsi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Instruksi / Petunjuk Pengerjaan <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={3}
            placeholder="Tuliskan petunjuk pengerjaan tugas untuk siswa..."
            className="text-xs sm:text-sm leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            onClick={onNext}
            className="text-xs font-semibold gap-1.5 h-10 px-5"
          >
            <span>Lanjut ke Butir Soal</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
