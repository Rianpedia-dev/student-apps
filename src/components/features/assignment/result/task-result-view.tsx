"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import confetti from "canvas-confetti";

export interface ResultOption {
  id: string;
  label: string;
  teks_opsi?: string | null;
  gambar_opsi?: string | null;
  is_benar: boolean;
}

export interface ResultQuestionItem {
  id: string;
  nomor_urut: number;
  tipe_soal: string;
  pertanyaan: string;
  gambar_soal?: string | null;
  bobot_poin: number;
  kunci_jawaban?: string | null;
  pembahasan?: string | null;
  opsi: ResultOption[];
  jawabanSiswa?: {
    jawaban_siswa: string | null;
    is_benar: boolean | null;
    poin_didapat: number | null;
    catatan_koreksi?: string | null;
  } | null;
}

interface TaskResultViewProps {
  tugasId: string;
  tugasJudul: string;
  mapelNama: string;
  kelasNama: string;
  poinMaksimal: number;
  tampilkanNilaiInstan: boolean;
  submission: {
    id: string;
    nilai: number | null;
    totalBenar: number;
    totalSalah: number;
    durasiDetik?: number | null;
    status: string;
    catatanGuru?: string | null;
    submittedAt: string;
  };
  questions: ResultQuestionItem[];
}

export function TaskResultView({
  tugasId,
  tugasJudul,
  mapelNama,
  kelasNama,
  poinMaksimal,
  tampilkanNilaiInstan,
  submission,
  questions,
}: TaskResultViewProps) {
  const finalScore = submission.nilai ?? 0;

  useEffect(() => {
    if (finalScore >= 75) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
  }, [finalScore]);

  const formatDuration = (secs?: number | null) => {
    if (!secs) return "-";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m === 0 ? `${s} detik` : `${m} menit ${s} detik`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Kartu Hasil Nilai */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-6 sm:p-8 text-center space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              {mapelNama} • {kelasNama}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {tugasJudul}
            </h1>
          </div>

          {/* Tampilan Skor / Nilai */}
          {submission.status === "menunggu_penilaian" ? (
            <div className="py-2">
              <p className="text-sm font-semibold text-foreground">Menunggu Penilaian Esai</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nilai akhir akan diperbarui setelah guru selesai mengoreksi soal esai.
              </p>
            </div>
          ) : !tampilkanNilaiInstan ? (
            <div className="py-3 px-4 rounded-xl bg-muted/40 border border-border/80 max-w-md mx-auto space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Tugas Berhasil Dikumpulkan
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skor dan pembahasan soal akan diumumkan oleh guru setelah seluruh siswa menyelesaikan tugas ini.
              </p>
            </div>
          ) : (
            <div className="py-2">
              <div className="flex items-baseline justify-center gap-1 text-foreground">
                <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">
                  {finalScore}
                </span>
                <span className="text-xl font-medium text-muted-foreground">
                  /{poinMaksimal}
                </span>
              </div>
            </div>
          )}

          {/* Rincian Statistik Simpel */}
          {tampilkanNilaiInstan && submission.status !== "menunggu_penilaian" && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
              <span>Total Soal: <strong className="text-foreground">{questions.length}</strong></span>
              <span>•</span>
              <span>Benar: <strong className="text-emerald-600 dark:text-emerald-400">{submission.totalBenar}</strong></span>
              <span>•</span>
              <span>Salah: <strong className="text-rose-600 dark:text-rose-400">{submission.totalSalah}</strong></span>
              <span>•</span>
              <span>Durasi: <strong className="text-foreground">{formatDuration(submission.durasiDetik)}</strong></span>
            </div>
          )}

          {/* Catatan Guru */}
          {submission.catatanGuru && (
            <div className="p-3 rounded-xl bg-muted/40 text-xs text-left max-w-md mx-auto">
              <span className="font-semibold text-muted-foreground block mb-0.5">Catatan Guru:</span>
              <p className="text-foreground">{submission.catatanGuru}</p>
            </div>
          )}

          {/* Tombol Navigasi Tunggal */}
          <div className="pt-2">
            <Link href="/siswa/tugas">
              <Button className="rounded-xl px-6 text-xs font-semibold">
                Kembali ke Daftar Tugas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pembahasan Soal jika diizinkan */}
      {tampilkanNilaiInstan && questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground px-1">Pembahasan Soal</h2>

          {questions.map((q, idx) => {
            const ans = q.jawabanSiswa;
            const chosen = ans?.jawaban_siswa?.toUpperCase() || "";
            const isCorrect = ans?.is_benar === true;
            const isEssay = q.tipe_soal === "ESAI";

            return (
              <Card key={q.id} className="border border-border/80">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Soal {idx + 1}</span>
                      <span className="text-xs text-muted-foreground">({ans?.poin_didapat ?? 0}/{q.bobot_poin} poin)</span>
                    </div>
                    {!isEssay && (
                      <span className={`text-xs font-semibold ${isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isCorrect ? "Benar" : "Salah"}
                      </span>
                    )}
                  </div>

                  {q.gambar_soal && (
                    <div className="rounded-lg border border-border overflow-hidden bg-muted/20 p-1 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.gambar_soal} alt="Stimulus" className="max-h-48 object-contain rounded" />
                    </div>
                  )}

                  <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
                    {q.pertanyaan}
                  </p>

                  {/* Pilihan Ganda */}
                  {(q.tipe_soal === "PILIHAN_GANDA" || q.tipe_soal === "PILIHAN_GAMBAR") && (
                    <div className="space-y-1.5">
                      {q.opsi.map((op) => {
                        const isStudentPick =
                          (op.id && chosen === op.id.toString()) ||
                          (op.label && chosen.toUpperCase() === op.label.toUpperCase());
                        const isKey = op.is_benar;
                        return (
                          <div
                            key={op.id || op.label}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                              isKey
                                ? "bg-emerald-500/10 border-emerald-500/30 font-medium"
                                : isStudentPick && !isKey
                                ? "bg-rose-500/10 border-rose-500/30"
                                : "bg-background border-border"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                                isKey ? "bg-emerald-600 text-white" : isStudentPick ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"
                              }`}>
                                {op.label}
                              </span>
                              <div className="flex flex-col gap-1 py-0.5">
                                {op.teks_opsi && <span>{op.teks_opsi}</span>}
                                {op.gambar_opsi && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={op.gambar_opsi}
                                    alt={`Opsi ${op.label}`}
                                    className="h-14 object-contain rounded border border-border bg-card p-0.5"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isStudentPick && <Badge variant="secondary" size="sm">Jawabanmu</Badge>}
                              {isKey && <Badge variant="outline" size="sm">Kunci</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Isian Singkat */}
                  {q.tipe_soal === "ISIAN_SINGKAT" && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                      <div>
                        <span className="text-muted-foreground">Jawabanmu: </span>
                        <strong className={isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {ans?.jawaban_siswa || "(Tidak dijawab)"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kunci: </span>
                        <strong className="text-foreground">{q.kunci_jawaban}</strong>
                      </div>
                    </div>
                  )}

                  {/* Esai */}
                  {q.tipe_soal === "ESAI" && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-1">Jawaban uraianmu:</span>
                        <p className="p-2 bg-background rounded border border-border text-foreground whitespace-pre-wrap">
                          {ans?.jawaban_siswa || "(Tidak dijawab)"}
                        </p>
                      </div>
                      {ans?.catatan_koreksi && (
                        <p className="text-xs text-muted-foreground">
                          Catatan guru: {ans.catatan_koreksi}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pembahasan */}
                  {q.pembahasan && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-1">
                      <span className="font-semibold text-muted-foreground block">
                        Pembahasan:
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{q.pembahasan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
