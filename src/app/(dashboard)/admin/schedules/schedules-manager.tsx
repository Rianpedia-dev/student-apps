"use client";

import React, { useState } from "react";
import { Plus, Search, Trash2, Calendar, Clock, School, User, BookOpen, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createJadwalAction, deleteJadwalAction } from "@/actions/subject";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScheduleItem {
  id: string;
  kelasId: string;
  kelasNama: string;
  jenjang: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
  guruId: string;
  guruNama: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
}

interface SchedulesManagerProps {
  initialSchedules: ScheduleItem[];
  classes: Array<{ id: string; nama: string; jenjang: string }>;
  subjects: Array<{ id: string; nama: string; kode: string }>;
  teachers: Array<{ id: string; nama: string; bidang?: string | null }>;
}

export function SchedulesManager({
  initialSchedules,
  classes,
  subjects,
  teachers,
}: SchedulesManagerProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedJenjang, setSelectedJenjang] = useState<"ALL" | "SD" | "SMP">("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);

  const filtered = schedules.filter((s) => {
    const matchClass = selectedClassId === "ALL" || s.kelasId === selectedClassId;
    const matchJenjang = selectedJenjang === "ALL" || s.jenjang === selectedJenjang;
    return matchClass && matchJenjang;
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createJadwalAction(formData);
      if (res.success) {
        toast.success(res.message);
        setOpenModal(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menambahkan jadwal.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteJadwalAction(deleteTarget.id);
      if (res.success) {
        toast.success(res.message);
        setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error(res.error || "Gagal menghapus.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls: Jenjang filter, Class selector, and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["ALL", "SD", "SMP"] as const).map((jenjang) => (
            <button
              key={jenjang}
              type="button"
              onClick={() => { setSelectedJenjang(jenjang); setSelectedClassId("ALL"); }}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedJenjang === jenjang
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {jenjang === "ALL" ? "Semua Jenjang" : `Jenjang ${jenjang}`}
            </button>
          ))}

          {/* Class Dropdown Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs rounded-xl border border-input bg-card px-3 py-1.5 text-foreground"
          >
            <option value="ALL">Semua Kelas</option>
            {classes
              .filter((c) => selectedJenjang === "ALL" || c.jenjang === selectedJenjang)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.jenjang})
                </option>
              ))}
          </select>
        </div>

        <Button
          type="button"
          onClick={() => setOpenModal(true)}
          size="sm"
          className="h-8 text-xs font-bold gap-1.5 rounded-xl shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Jadwal Kelas</span>
        </Button>
      </div>

      {/* Schedules Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-xs">
            Belum ada jadwal pelajaran untuk filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Kelas & Jenjang</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Guru Pengampu</th>
                  <th className="p-3">Hari & Waktu</th>
                  <th className="p-3">Ruang</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={s.jenjang === "SMP" ? "secondary" : "default"} className="text-[10px]">
                          {s.jenjang}
                        </Badge>
                        <span>{s.kelasNama}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      {s.mapelNama} ({s.mapelKode})
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-primary shrink-0" />
                        <span>{s.guruNama}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-primary shrink-0" />
                        <span>{s.hari}, {s.jamMulai} - {s.jamSelesai}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {s.ruang}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(s)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/10"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Tambah Jadwal Pelajaran</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold block mb-1">Rombongan Belajar (Kelas) *</label>
              <select
                name="kelas_id"
                defaultValue={classes[0]?.id || ""}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                required
              >
                <optgroup label="── Sekolah Dasar (SD) ──">
                  {classes.filter((c) => c.jenjang === "SD").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Sekolah Menengah Pertama (SMP) ──">
                  {classes.filter((c) => c.jenjang === "SMP").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Mata Pelajaran *</label>
              <select
                name="mapel_id"
                defaultValue={subjects[0]?.id || ""}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Guru Pengampu *</label>
              <select
                name="guru_id"
                defaultValue={teachers[0]?.id || ""}
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} {t.bidang ? `(${t.bidang})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold block mb-1">Hari *</label>
                <select
                  name="hari"
                  defaultValue="Senin"
                  className="w-full text-xs rounded-xl border border-input bg-background p-2"
                  required
                >
                  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Mulai *</label>
                <input
                  type="time"
                  name="jam_mulai"
                  defaultValue="07:30"
                  className="w-full text-xs rounded-xl border border-input bg-background p-2"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Selesai *</label>
                <input
                  type="time"
                  name="jam_selesai"
                  defaultValue="09:00"
                  className="w-full text-xs rounded-xl border border-input bg-background p-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Ruang / Lab (Opsional)</label>
              <input
                type="text"
                name="ruang"
                placeholder="Contoh: R. Mehmed Al Fatih / Lab Sains"
                className="w-full text-xs rounded-xl border border-input bg-background p-2.5"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpenModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} size="sm" className="font-bold text-xs gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Simpan Jadwal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-600">Hapus Jadwal</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Hapus sesi <strong>{deleteTarget?.mapelNama}</strong> di kelas <strong>{deleteTarget?.kelasNama}</strong>?
          </p>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="text-xs font-bold"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
