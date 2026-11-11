"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Info,
  Loader2,
  School,
  Sparkles,
  UserCheck,
  Video,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreateRoomInitialPreset,
  KelasOnlineSessionType,
  TeacherOnlineClassContext,
  TeacherPertemuanOption,
} from "@/types/kelas-online";

interface CreateRoomFormProps {
  context: TeacherOnlineClassContext;
  initialPreset?: CreateRoomInitialPreset;
}

interface ConflictRoomInfo {
  id: string;
  room_name: string;
  kelas: string;
  mata_pelajaran: string | null;
  guru_name: string;
  isOwner: boolean;
}

export function CreateRoomForm({ context, initialPreset }: CreateRoomFormProps) {
  const router = useRouter();
  const hasPreset = Boolean(
    initialPreset?.kelasId ||
      initialPreset?.mapelId ||
      initialPreset?.pertemuanId ||
      initialPreset?.sessionType
  );

  const canUseWaliMode = context.isWaliKelas && Boolean(context.waliKelas);

  const resolveInitialSessionType = (): KelasOnlineSessionType => {
    if (initialPreset?.sessionType === "WALI_KELAS" && canUseWaliMode) {
      return "WALI_KELAS";
    }
    return "MAPEL";
  };

  const resolveInitialKelasId = (): string => {
    if (
      initialPreset?.kelasId &&
      context.classes.some((c) => c.id === initialPreset.kelasId)
    ) {
      return initialPreset.kelasId;
    }
    return context.classes[0]?.id || "";
  };

  const resolveInitialMapelId = (targetKelasId: string): string => {
    const subjects = context.subjectsByClass[targetKelasId] || [];
    if (
      initialPreset?.mapelId &&
      subjects.some((m) => m.id === initialPreset.mapelId)
    ) {
      return initialPreset.mapelId;
    }
    return subjects.length === 1 ? subjects[0].id : subjects[0]?.id || "";
  };

  const defaultKelasId = resolveInitialKelasId();
  const defaultMapelId = resolveInitialMapelId(defaultKelasId);

  const [open, setOpen] = useState(hasPreset);
  const [sessionType, setSessionType] = useState<KelasOnlineSessionType>(
    resolveInitialSessionType()
  );
  const [kelasId, setKelasId] = useState<string>(defaultKelasId);
  const [mapelId, setMapelId] = useState<string>(defaultMapelId);
  const [pertemuanId, setPertemuanId] = useState<string>(
    initialPreset?.pertemuanId || ""
  );
  const [topik, setTopik] = useState<string>(initialPreset?.topik || "");
  const [isLoading, setIsLoading] = useState(false);
  const [conflictRoom, setConflictRoom] = useState<ConflictRoomInfo | null>(null);
  const [dynamicPertemuan, setDynamicPertemuan] = useState<
    Record<string, TeacherPertemuanOption[]>
  >(context.pertemuanByPair);

  const availableSubjects = useMemo(
    () => context.subjectsByClass[kelasId] || [],
    [context.subjectsByClass, kelasId]
  );

  const classSelectItems = useMemo(
    () =>
      context.classes.map((c) => ({
        value: c.id,
        label: `${c.namaKelas} (${c.jenjang})`,
      })),
    [context.classes]
  );

  const subjectSelectItems = useMemo(
    () =>
      availableSubjects.map((m) => ({
        value: m.id,
        label: `${m.namaMapel} (${m.kodeMapel})`,
      })),
    [availableSubjects]
  );

  const pairKey = `${kelasId}:${mapelId}`;
  const currentPertemuanList = useMemo(
    () => dynamicPertemuan[pairKey] || [],
    [dynamicPertemuan, pairKey]
  );

  const pertemuanSelectItems = useMemo(() => {
    const base = [{ value: "none", label: "Tidak ditautkan ke pertemuan" }];
    currentPertemuanList.forEach((p) => {
      base.push({
        value: p.id,
        label: `Pertemuan ${p.pertemuanKe}: ${p.judul}`,
      });
    });
    return base;
  }, [currentPertemuanList]);

  // Saat mode fallback aktif (belum ada jadwal terpetakan), muat daftar pertemuan secara dinamis
  useEffect(() => {
    if (!open || sessionType !== "MAPEL" || !kelasId || !mapelId) return;
    if (dynamicPertemuan[pairKey] !== undefined) return;

    let cancelled = false;
    fetch(`/api/kelas-online/pertemuan?kelasId=${kelasId}&mapelId=${mapelId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: TeacherPertemuanOption[]) => {
        if (!cancelled) {
          setDynamicPertemuan((prev) => ({ ...prev, [pairKey]: rows }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [open, sessionType, kelasId, mapelId, pairKey, dynamicPertemuan]);

  const handleKelasChange = useCallback(
    (nextKelasId: string | null) => {
      if (!nextKelasId) return;
      setKelasId(nextKelasId);
      setConflictRoom(null);

      const nextSubjects = context.subjectsByClass[nextKelasId] || [];
      const keepCurrent = nextSubjects.some((m) => m.id === mapelId);
      const nextMapelId = keepCurrent ? mapelId : nextSubjects[0]?.id || "";
      setMapelId(nextMapelId);
      setPertemuanId("");
    },
    [context.subjectsByClass, mapelId]
  );

  const handleMapelChange = useCallback((nextMapelId: string | null) => {
    if (!nextMapelId) return;
    setMapelId(nextMapelId);
    setPertemuanId("");
    setConflictRoom(null);
  }, []);

  const resetForm = () => {
    setSessionType(resolveInitialSessionType());
    const initK = resolveInitialKelasId();
    setKelasId(initK);
    setMapelId(resolveInitialMapelId(initK));
    setPertemuanId(initialPreset?.pertemuanId || "");
    setTopik(initialPreset?.topik || "");
    setConflictRoom(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictRoom(null);

    if (sessionType === "MAPEL" && (!kelasId || !mapelId)) {
      toast.error("Silakan pilih kelas dan mata pelajaran terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    try {
      const payload =
        sessionType === "WALI_KELAS"
          ? {
              sessionType: "WALI_KELAS",
              topik: topik.trim() || undefined,
            }
          : {
              sessionType: "MAPEL",
              kelasId,
              mapelId,
              jadwalId: initialPreset?.jadwalId || undefined,
              pertemuanId: pertemuanId && pertemuanId !== "none" ? pertemuanId : undefined,
              topik: topik.trim() || undefined,
            };

      const res = await fetch("/api/kelas-online/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.existingRoom) {
        setConflictRoom(data.existingRoom);
        toast.warning(data.error || "Sudah ada kelas online yang sedang aktif.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat kelas online.");
      }

      toast.success("Kelas online berhasil dibuat!");
      setOpen(false);
      router.push(`/guru/kelas-online/${data.roomId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="emerald"
        onClick={() => setOpen(true)}
        className="rounded-xl shadow-md shadow-emerald-600/20 dark:shadow-emerald-950/50"
      >
        <Video className="h-4 w-4" />
        <span>Buat Kelas</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Buat Kelas Online Baru
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Pilih rombel kelas dan mata pelajaran yang diampu untuk memulai ruang tatap muka virtual.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Wali Kelas mendapat dual-mode tabs; Guru Mapel langsung mode MAPEL */}
            {canUseWaliMode ? (
              <Tabs
                value={sessionType}
                onValueChange={(val) => {
                  setSessionType(val as KelasOnlineSessionType);
                  setConflictRoom(null);
                }}
              >
                <TabsList className="w-full grid grid-cols-2 h-10 p-1 rounded-xl">
                  <TabsTrigger value="MAPEL" className="rounded-lg text-xs font-semibold">
                    <BookOpen className="h-3.5 w-3.5" />
                    Mengajar Mapel
                  </TabsTrigger>
                  <TabsTrigger value="WALI_KELAS" className="rounded-lg text-xs font-semibold">
                    <UserCheck className="h-3.5 w-3.5" />
                    Sesi Wali Kelas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="MAPEL" className="mt-3 space-y-3.5">
                  {renderMapelFields()}
                </TabsContent>

                <TabsContent value="WALI_KELAS" className="mt-3 space-y-3.5">
                  {renderWaliKelasFields()}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-3.5">{renderMapelFields()}</div>
            )}

            {/* Topik / Agenda Pertemuan (untuk kedua mode) */}
            <div className="space-y-1.5">
              <Label htmlFor="topik_kelas_online" className="text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {sessionType === "WALI_KELAS"
                  ? "Agenda / Topik Pembinaan (opsional)"
                  : "Topik / Catatan Pertemuan (opsional)"}
              </Label>
              <Input
                id="topik_kelas_online"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder={
                  sessionType === "WALI_KELAS"
                    ? "Contoh: Pembinaan Pagi & Evaluasi Pekan Ini"
                    : "Contoh: Latihan Soal Pecahan Bab 3"
                }
                maxLength={255}
                className="h-10 rounded-xl"
              />
            </div>

            {/* Peringatan Konflik 409 + Tombol Masuk Room Aktif */}
            {conflictRoom && (
              <Card variant="amber" elevationSize="sm">
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">
                        Kelas Online Sudah Berlangsung
                      </p>
                      <p className="text-muted-foreground">
                        {conflictRoom.mata_pelajaran || "Kelas Online"} ({conflictRoom.kelas}) oleh{" "}
                        <strong>{conflictRoom.guru_name}</strong> masih aktif.
                      </p>
                    </div>
                  </div>
                  {conflictRoom.isOwner && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="emerald"
                        onClick={() => {
                          setOpen(false);
                          router.push(`/guru/kelas-online/${conflictRoom.id}`);
                        }}
                      >
                        Masuk ke Room Aktif
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter className="mx-0 mb-0 rounded-b-2xl p-3 sm:p-4">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="emerald"
                disabled={
                  isLoading ||
                  (sessionType === "MAPEL" && context.classes.length === 0)
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat Kelas...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Mulai Kelas Online
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );

  function renderMapelFields() {
    if (context.classes.length === 0) {
      return (
        <Card variant="amber" elevationSize="sm">
          <CardContent className="p-4 text-xs text-muted-foreground">
            Belum ada rombel kelas yang tersedia pada jenjang aktif Anda. Hubungi Administrator
            untuk menambahkan data kelas.
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {!context.hasScheduleMapping && (
          <Card variant="sky" elevationSize="sm">
            <CardContent className="p-3 flex items-start gap-2 text-xs">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                Jadwal mengajar Anda belum dipetakan di <strong>Jadwal Pelajaran</strong> oleh
                Admin. Anda tetap dapat memilih seluruh kelas &amp; mata pelajaran pada jenjang aktif.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 1. Pilih Kelas */}
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">
            <School className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Rombel Kelas <span className="text-destructive">*</span>
          </Label>
          <Select
            items={classSelectItems}
            value={kelasId}
            onValueChange={handleKelasChange}
          >
            <SelectTrigger className="w-full h-10 rounded-xl text-xs sm:text-sm">
              <SelectValue placeholder="Pilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {context.classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.namaKelas} ({cls.jenjang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Pilih Mata Pelajaran (terfilter berdasarkan kelas) */}
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Mata Pelajaran <span className="text-destructive">*</span>
          </Label>
          <Select
            items={subjectSelectItems}
            value={mapelId}
            onValueChange={handleMapelChange}
            disabled={availableSubjects.length === 0}
          >
            <SelectTrigger className="w-full h-10 rounded-xl text-xs sm:text-sm">
              <SelectValue placeholder="Pilih mata pelajaran..." />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((mapel) => (
                <SelectItem key={mapel.id} value={mapel.id}>
                  {mapel.namaMapel} ({mapel.kodeMapel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Pilih Pertemuan (Opsional) */}
        {currentPertemuanList.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Tautkan ke Pertemuan (opsional)
            </Label>
            <Select
              items={pertemuanSelectItems}
              value={pertemuanId || "none"}
              onValueChange={(val) => setPertemuanId(val === "none" ? "" : val || "")}
            >
              <SelectTrigger className="w-full h-10 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Tidak ditautkan ke pertemuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ditautkan ke pertemuan</SelectItem>
                {currentPertemuanList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Pertemuan {p.pertemuanKe}: {p.judul}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    );
  }

  function renderWaliKelasFields() {
    if (!context.waliKelas) return null;

    return (
      <Card variant="emerald" elevationSize="sm">
        <CardContent className="p-3.5 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              Rombel Perwalian (Terkunci Otomatis)
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {context.waliKelas.namaKelas}
            </p>
          </div>
          <Badge variant="emerald" size="sm">
            {context.waliKelas.jenjang}
          </Badge>
        </CardContent>
      </Card>
    );
  }
}
