"use client";

import { useState, useTransition } from "react";
import {
  Lock,
  Unlock,
  Database,
  Sparkles,
  Trash2,
  RefreshCw,
  Calendar,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toggleDemoModeAction, toggleDemoDataAction } from "@/actions/manage-admins";
import { toast } from "sonner";
import type { DemoStats } from "@/services/demo-data.service";

interface DemoSettingsCardProps {
  initialDemoEnabled: boolean;
  initialDemoStats: DemoStats;
}

export function DemoSettingsCard({
  initialDemoEnabled,
  initialDemoStats,
}: DemoSettingsCardProps) {
  // Login demo mode state
  const [isDemoLoginEnabled, setIsDemoLoginEnabled] = useState(initialDemoEnabled);
  const [openLoginConfirm, setOpenLoginConfirm] = useState(false);
  const [isLoginPending, startLoginTransition] = useTransition();

  // Demo dashboard data state
  const [stats, setStats] = useState<DemoStats>(initialDemoStats);
  const [openDataConfirm, setOpenDataConfirm] = useState(false);
  const [dataActionType, setDataActionType] = useState<"activate" | "deactivate">("activate");
  const [isDataPending, startDataTransition] = useTransition();

  // Toggle demo login mode
  const handleToggleDemoLogin = () => {
    const nextState = !isDemoLoginEnabled;
    startLoginTransition(async () => {
      try {
        const res = await toggleDemoModeAction(nextState);
        if (res.success) {
          setIsDemoLoginEnabled(nextState);
          toast.success(res.message);
          setOpenLoginConfirm(false);
        } else {
          toast.error(res.error || "Gagal mengubah mode demo.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Terjadi kesalahan server.");
      }
    });
  };

  // Toggle / seed demo dashboard data
  const handleExecuteDemoData = () => {
    const activate = dataActionType === "activate";
    startDataTransition(async () => {
      try {
        const res = await toggleDemoDataAction(activate);
        if (res.success) {
          if (res.stats) {
            setStats(res.stats);
          }
          toast.success(res.message);
          setOpenDataConfirm(false);
        } else {
          toast.error(res.error || "Gagal memperbarui data demo.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Terjadi kesalahan server.");
      }
    });
  };

  return (
    <>
      <Card
        elevationSize="sm"
        className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border-border/60 shadow-sm overflow-hidden"
      >
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Konfigurasi Akun & Data Demo
                </CardTitle>
                <CardDescription className="text-xs">
                  Kelola visibilitas tombol login demo dan data simulasi dashboard untuk 7 role percontohan.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={isDemoLoginEnabled ? "emerald" : "outline"}
                className="text-[11px] font-semibold gap-1"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isDemoLoginEnabled ? "bg-emerald-600 dark:bg-emerald-300 animate-pulse" : "bg-muted-foreground"
                  }`}
                />
                Login Demo: {isDemoLoginEnabled ? "Aktif" : "Nonaktif"}
              </Badge>

              <Badge
                variant={stats.isActive ? "teal" : "outline"}
                className="text-[11px] font-semibold gap-1"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    stats.isActive ? "bg-teal-600 dark:bg-teal-300 animate-pulse" : "bg-muted-foreground"
                  }`}
                />
                Data Demo: {stats.isActive ? "Terisi" : "Kosong"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 sm:pt-5 pb-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bagian 1: Kontrol Login Demo */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs ${
                        isDemoLoginEnabled
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isDemoLoginEnabled ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </div>
                    <span>Akses Cepat Halaman Login</span>
                  </div>
                  <Badge variant={isDemoLoginEnabled ? "emerald" : "rose"} className="text-[10px] h-5">
                    {isDemoLoginEnabled ? "Tampil di Login" : "Disembunyikan"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menampilkan atau menyembunyikan tombol akses demo di portal masuk utama (
                  <code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded text-foreground">
                    /login
                  </code>
                  ). Nonaktifkan ketika portal mulai beroperasi resmi untuk guru dan siswa.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Status: <strong>{isDemoLoginEnabled ? "Tombol Aktif" : "Terkunci Aman"}</strong>
                </span>

                {isDemoLoginEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenLoginConfirm(true)}
                    disabled={isLoginPending}
                    className="gap-1.5 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs h-8"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Nonaktifkan Login Demo</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="emerald"
                    size="sm"
                    onClick={() => setOpenLoginConfirm(true)}
                    disabled={isLoginPending}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Aktifkan Login Demo</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Bagian 2: Kontrol Data Contoh Dashboard */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                    <div className="h-7 w-7 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs">
                      <Database className="h-3.5 w-3.5" />
                    </div>
                    <span>Data Simulasi Dashboard</span>
                  </div>
                  <Badge variant={stats.isActive ? "teal" : "secondary"} className="text-[10px] h-5">
                    {stats.isActive ? "Data Terisi" : "Data Bersih"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menyediakan data realistis (Jadwal, Modul KBM, Kuis Interaktif, Hasil Penilaian, Presensi, Chat) khusus untuk 7 role demo (Guru SD/SMP, Walas SD/SMP, Guru Lintas, Siswa SD/SMP).
                </p>

                {/* Metrics Chips */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 border border-border/50 text-muted-foreground">
                    <Calendar className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="truncate">{stats.totalJadwal} Jadwal</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 border border-border/50 text-muted-foreground">
                    <BookOpen className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{stats.totalPertemuan} Modul</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 border border-border/50 text-muted-foreground">
                    <FileText className="h-3 w-3 text-purple-500 shrink-0" />
                    <span className="truncate">{stats.totalTugas} Kuis</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 border border-border/50 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-teal-500 shrink-0" />
                    <span className="truncate">{stats.totalSubmissions} Submisi</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 border border-border/50 text-muted-foreground">
                    <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="truncate">{stats.totalAbsensi} Presensi</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 border border-border/50 text-muted-foreground">
                    <MessageSquare className="h-3 w-3 text-rose-500 shrink-0" />
                    <span className="truncate">{stats.totalChat + stats.totalPrestasi} Chat & Prestasi</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-end gap-2 flex-wrap">
                {stats.isActive ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDataActionType("activate");
                        setOpenDataConfirm(true);
                      }}
                      disabled={isDataPending}
                      className="gap-1.5 text-xs h-8 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/10"
                    >
                      {isDataPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      <span>Refresh</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDataActionType("deactivate");
                        setOpenDataConfirm(true);
                      }}
                      disabled={isDataPending}
                      className="gap-1.5 text-xs h-8 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Bersihkan Data</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setDataActionType("activate");
                      setOpenDataConfirm(true);
                    }}
                    disabled={isDataPending}
                    className="gap-1.5 text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-medium"
                  >
                    {isDataPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Aktifkan & Isi Data Demo</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="py-2.5 px-5 bg-muted/30 border-t border-border/40 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong>Terisolasi & Aman:</strong> Operasi demo hanya mempengaruhi 7 akun demo. Data asli 1.200+ siswa dan seluruh guru terdaftar 100% aman dan tidak terpengaruh.
          </span>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog: Login Demo Mode */}
      <AlertDialog open={openLoginConfirm} onOpenChange={setOpenLoginConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  isDemoLoginEnabled ? "bg-rose-500/15 text-rose-600" : "bg-emerald-500/15 text-emerald-600"
                }`}
              >
                {isDemoLoginEnabled ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </div>
              <div>
                <AlertDialogTitle>
                  {isDemoLoginEnabled ? "Nonaktifkan Akses Login Demo?" : "Aktifkan Akses Login Demo?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs mt-0.5">
                  Konfirmasi pengubahan tampilan tombol demo pada portal masuk.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="py-2 text-xs text-muted-foreground leading-relaxed">
            {isDemoLoginEnabled ? (
              <p>
                Tombol akses cepat mode demo akan <strong>disembunyikan sepenuhnya</strong> dari halaman login (
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded text-foreground">/login</code>).
                Pengguna hanya dapat masuk dengan kredensial akun terdaftar.
              </p>
            ) : (
              <p>
                Tombol akses cepat mode demo akan <strong>tampil kembali</strong> di bawah formulir login untuk memudahkan demonstrasi dan presentasi sistem.
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoginPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleDemoLogin}
              disabled={isLoginPending}
              className={
                isDemoLoginEnabled
                  ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              }
            >
              {isLoginPending ? "Menyimpan..." : isDemoLoginEnabled ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog: Demo Dashboard Data */}
      <AlertDialog open={openDataConfirm} onOpenChange={setOpenDataConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  dataActionType === "deactivate" ? "bg-rose-500/15 text-rose-600" : "bg-teal-500/15 text-teal-600"
                }`}
              >
                {dataActionType === "deactivate" ? <AlertTriangle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <AlertDialogTitle>
                  {dataActionType === "deactivate"
                    ? "Bersihkan Data Contoh Demo?"
                    : "Aktifkan & Isi Data Contoh Demo?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs mt-0.5">
                  Konfirmasi pengelolaan data contoh pada akun-akun demo.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="py-2 text-xs text-muted-foreground leading-relaxed">
            {dataActionType === "deactivate" ? (
              <div className="space-y-1.5 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-950 dark:text-rose-200">
                <p className="font-semibold">Data yang akan dibersihkan:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11.5px]">
                  <li>Seluruh sesi jadwal mengajar KBM akun demo.</li>
                  <li>Seluruh modul/pertemuan materi KBM akun demo.</li>
                  <li>Seluruh tugas kuis interaktif dan submisi nilai akun demo.</li>
                  <li>Rekap presensi KBM dan riwayat chat akun demo.</li>
                </ul>
                <p className="text-[11px] text-muted-foreground mt-1">Data riil sekolah tidak disentuh sama sekali.</p>
              </div>
            ) : (
              <div className="space-y-1.5 p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 text-teal-950 dark:text-teal-200">
                <p className="font-semibold">Data yang akan disuntikkan secara instan:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11.5px]">
                  <li>14 Sesi Jadwal Pelajaran (SD Kelas 4 & SMP Kelas 7).</li>
                  <li>8 Modul KBM lengkap (PDF & Video YouTube).</li>
                  <li>5 Kuis interaktif pilihan ganda dan esai.</li>
                  <li>Submisi nilai siswa SD & SMP beserta koreksi guru.</li>
                  <li>1.000+ catatan presensi 14 hari efektif dan chat guru-siswa.</li>
                </ul>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDataPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteDemoData}
              disabled={isDataPending}
              className={
                dataActionType === "deactivate"
                  ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  : "bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              }
            >
              {isDataPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : dataActionType === "deactivate" ? (
                "Ya, Bersihkan Data"
              ) : (
                "Ya, Isi Data Sekarang"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
