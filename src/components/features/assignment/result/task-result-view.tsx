"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
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
  const isWaitingGrading =
    submission.status === "menunggu_penilaian" ||
    submission.status === "dikumpulkan" ||
    submission.nilai === null;
  const finalScore = submission.nilai ?? 0;

  useEffect(() => {
    if (!isWaitingGrading && tampilkanNilaiInstan && finalScore >= 75) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
  }, [finalScore, isWaitingGrading, tampilkanNilaiInstan]);

  const formatDuration = (secs?: number | null) => {
    if (!secs) return "-";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m === 0 ? `${s} detik` : `${m} menit ${s} detik`;
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 pb-10 sm:pb-12">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/siswa/mapel"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group bg-muted/40 hover:bg-muted px-3.5 py-2 rounded-xl border border-border/60 min-h-9"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Mata Pelajaran</span>
        </Link>

        <Link
          href={`/siswa/tugas/${tugasId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted/40"
        >
          <span>Detail Tugas</span>
        </Link>
      </div>

      {/* Kartu Ringkasan Header & Nilai */}
      <Card className="rounded-2xl sm:rounded-3xl card-elevation shadow-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Baris Atas: Info Tugas (Kiri) + Nilai Akhir (Kanan) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-xs text-muted-foreground font-medium">
                {mapelNama} • {kelasNama}
              </p>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-snug break-words">
                {tugasJudul}
              </h1>
            </div>

            {/* Panel Nilai */}
            <div className="shrink-0">
              {isWaitingGrading ? (
                <div className="px-4 py-3 rounded-2xl glass-subpanel border border-border/70 text-left sm:text-right">
                  <p className="text-xs font-bold text-foreground">Menunggu Penilaian</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Nilai akan diperbarui setelah dikoreksi guru
                  </p>
                </div>
              ) : !tampilkanNilaiInstan ? (
                <div className="px-4 py-3 rounded-2xl glass-subpanel border border-border/70 text-left sm:text-right">
                  <p className="text-xs font-bold text-foreground">Tugas Dikumpulkan</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Skor akan diumumkan oleh guru
                  </p>
                </div>
              ) : (
                <div className="px-4 py-3 sm:px-5 sm:py-3 rounded-2xl glass-subpanel border border-border/70 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Nilai Akhir
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${
                        finalScore >= 75
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {finalScore}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-muted-foreground">
                      /{poinMaksimal}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Baris Statistik Simpel */}
          {tampilkanNilaiInstan && !isWaitingGrading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x sm:divide-border/60 pt-4 border-t border-border/60">
              <div className="sm:pr-4 space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Total Soal
                </span>
                <strong className="text-sm sm:text-base font-bold text-foreground">
                  {questions.length} Soal
                </strong>
              </div>

              <div className="sm:px-4 space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Benar
                </span>
                <strong className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {submission.totalBenar}
                </strong>
              </div>

              <div className="sm:px-4 space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Salah
                </span>
                <strong className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                  {submission.totalSalah}
                </strong>
              </div>

              <div className="sm:pl-4 space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Durasi Pengerjaan
                </span>
                <strong className="text-sm sm:text-base font-bold text-foreground">
                  {formatDuration(submission.durasiDetik)}
                </strong>
              </div>
            </div>
          )}

          {/* Catatan Guru */}
          {submission.catatanGuru && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm space-y-1 break-words">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Catatan Guru</span>
              </span>
              <p className="text-foreground leading-relaxed">{submission.catatanGuru}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pembahasan Soal jika diizinkan */}
      {tampilkanNilaiInstan && questions.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-foreground px-1">
            Pembahasan Soal
          </h2>

          {questions.map((q, idx) => {
            const ans = q.jawabanSiswa;
            const chosen = ans?.jawaban_siswa?.toUpperCase() || "";
            const isCorrect = ans?.is_benar === true;
            const isEssay = q.tipe_soal === "ESAI";

            return (
              <Card key={q.id} className="rounded-2xl sm:rounded-3xl card-elevation">
                <CardContent className="p-4 sm:p-5 md:p-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Soal {idx + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({ans?.poin_didapat ?? 0}/{q.bobot_poin} poin)
                      </span>
                    </div>
                    {!isEssay && (
                      <span
                        className={`text-xs font-semibold ${
                          isCorrect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isCorrect ? "Benar" : "Salah"}
                      </span>
                    )}
                  </div>

                  {q.gambar_soal && (
                    <div className="rounded-xl border border-border overflow-hidden bg-muted/20 p-1.5 inline-block max-w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.gambar_soal}
                        alt="Stimulus"
                        className="max-h-48 sm:max-h-64 w-auto max-w-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed whitespace-pre-line break-words">
                    {q.pertanyaan}
                  </p>

                  {/* Pilihan Ganda */}
                  {(q.tipe_soal === "PILIHAN_GANDA" || q.tipe_soal === "PILIHAN_GAMBAR") && (
                    <div className="space-y-2">
                      {q.opsi.map((op) => {
                        const isStudentPick =
                          (op.id && chosen === op.id.toString()) ||
                          (op.label && chosen.toUpperCase() === op.label.toUpperCase());
                        const isKey = op.is_benar;
                        return (
                          <div
                            key={op.id || op.label}
                            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm ${
                              isKey
                                ? "bg-emerald-500/10 border-emerald-500/30 font-medium"
                                : isStudentPick && !isKey
                                ? "bg-rose-500/10 border-rose-500/30"
                                : "bg-background border-border"
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 sm:mt-0 ${
                                  isKey
                                    ? "bg-emerald-600 text-white"
                                    : isStudentPick
                                    ? "bg-rose-600 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {op.label}
                              </span>
                              <div className="flex flex-col gap-1 py-0.5 min-w-0 flex-1">
                                {op.teks_opsi && (
                                  <span className="break-words leading-relaxed">
                                    {op.teks_opsi}
                                  </span>
                                )}
                                {op.gambar_opsi && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={op.gambar_opsi}
                                    alt={`Opsi ${op.label}`}
                                    className="max-h-20 w-auto max-w-full object-contain rounded-lg border border-border bg-card p-0.5 self-start"
                                  />
                                )}
                              </div>
                            </div>
                            {(isStudentPick || isKey) && (
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                                {isStudentPick && (
                                  <Badge variant="secondary" size="sm">
                                    Jawabanmu
                                  </Badge>
                                )}
                                {isKey && (
                                  <Badge variant="outline" size="sm">
                                    Kunci
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Isian Singkat */}
                  {q.tipe_soal === "ISIAN_SINGKAT" && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border text-xs sm:text-sm space-y-1.5 break-words">
                      <div>
                        <span className="text-muted-foreground">Jawabanmu: </span>
                        <strong
                          className={
                            isCorrect
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
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
                    <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border text-xs sm:text-sm space-y-2 break-words">
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-1">
                          Jawaban uraianmu:
                        </span>
                        <p className="p-2.5 sm:p-3 bg-background rounded-xl border border-border text-foreground whitespace-pre-wrap leading-relaxed">
                          {ans?.jawaban_siswa || "(Tidak dijawab)"}
                        </p>
                      </div>
                      {ans?.catatan_koreksi && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Catatan guru: {ans.catatan_koreksi}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pembahasan */}
                  {q.pembahasan && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm space-y-1 break-words">
                      <span className="font-semibold text-muted-foreground block text-xs">
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
