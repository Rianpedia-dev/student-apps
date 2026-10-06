"use client";

import React from "react";
import { Clock, Award, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface BuilderStepSettingsProps {
  hasDurationLimit: boolean;
  setHasDurationLimit: (val: boolean) => void;
  durasiMenit: string;
  setDurasiMenit: (val: string) => void;
  acakSoal: boolean;
  setAcakSoal: (val: boolean) => void;
  acakOpsi: boolean;
  setAcakOpsi: (val: boolean) => void;
  tampilkanNilai: boolean;
  setTampilkanNilai: (val: boolean) => void;
  judul: string;
  totalQuestions: number;
  totalBobot: number;
  isSubmitting: boolean;
  isEditing: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function BuilderStepSettings({
  hasDurationLimit,
  setHasDurationLimit,
  durasiMenit,
  setDurasiMenit,
  acakSoal,
  setAcakSoal,
  acakOpsi,
  setAcakOpsi,
  tampilkanNilai,
  setTampilkanNilai,
  judul,
  totalQuestions,
  totalBobot,
  isSubmitting,
  isEditing,
  onBack,
  onSubmit,
}: BuilderStepSettingsProps) {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Pengaturan Pengerjaan & Konfirmasi
        </CardTitle>
        <CardDescription className="text-xs">
          Atur batas waktu pengerjaan kuis, sistem acak butir soal, dan opsi tampilan nilai.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Durasi Pengerjaan */}
          <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>Batas Waktu (Timer)</span>
              </span>
              <Checkbox
                checked={hasDurationLimit}
                onCheckedChange={(checked) => setHasDurationLimit(!!checked)}
              />
            </div>

            {hasDurationLimit ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(e.target.value)}
                    className="w-24 text-xs font-bold h-9"
                  />
                  <span className="text-xs font-medium text-foreground">Menit</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["15", "30", "45", "60", "90"].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={durasiMenit === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDurasiMenit(preset)}
                      className="text-xs h-7 px-2.5"
                    >
                      {preset}m
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Durasi antara 5 hingga 180 menit. Siswa akan melihat timer hitung mundur saat pengerjaan.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Tanpa batas waktu (siswa dapat mengerjakan hingga deadline).
              </p>
            )}
          </div>

          {/* Opsi Acak & Tampilan Nilai */}
          <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={acakSoal}
                onCheckedChange={(checked) => setAcakSoal(!!checked)}
                className="mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Acak Urutan Soal
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Setiap siswa menerima urutan nomor soal yang berbeda.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={acakOpsi}
                onCheckedChange={(checked) => setAcakOpsi(!!checked)}
                className="mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Acak Opsi Pilihan Jawaban
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Letak pilihan A, B, C, D diacak di perangkat masing-masing.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={tampilkanNilai}
                onCheckedChange={(checked) => setTampilkanNilai(!!checked)}
                className="mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Tampilkan Nilai Langsung
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Siswa dapat langsung melihat skor setelah kuis dikumpulkan.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Ringkasan Akhir */}
        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span>Ringkasan Tugas Interaktif:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                acakSoal ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
              }`}>
                {acakSoal ? "Soal Diacak" : "Soal Urut"}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                acakOpsi ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
              }`}>
                {acakOpsi ? "Opsi Diacak" : "Opsi Tetap"}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                tampilkanNilai ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}>
                {tampilkanNilai ? "Nilai Langsung" : "Nilai Dirahasiakan"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Judul:</span>
              <strong className="text-foreground truncate block">{judul}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Jumlah Soal:</span>
              <strong className="text-foreground">{totalQuestions} Soal</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Skor:</span>
              <strong className="text-foreground">{totalBobot} Poin</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Durasi:</span>
              <strong className="text-foreground">
                {hasDurationLimit ? `${durasiMenit || 30} Menit` : "Tanpa Batas"}
              </strong>
            </div>
          </div>
        </div>

        {/* Tombol Navigasi / Submit */}
        <div className="pt-2 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="text-xs h-10 px-4 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Soal</span>
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="text-xs font-semibold h-10 px-5 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan Tugas...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {isEditing ? "Simpan Perubahan" : "Terbitkan Tugas Sekarang"}
                </span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
