"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileText,
  Save,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyWaliKelasFullDayAction } from "@/actions/guru";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClassSubjectMatrixItem } from "@/services/attendance.service";

interface ScheduleCol {
  jadwalId: string;
  mapelId: string;
  mapelNama: string;
  jamMulai: string;
  jamSelesai: string;
  guruNama: string;
  isFilled: boolean;
}

interface ClassMatrixClientProps {
  kelasNama: string;
  dateStr: string;
  hari: string;
  schedules: ScheduleCol[];
  matrix: ClassSubjectMatrixItem[];
}

export function ClassMatrixClient({
  kelasNama,
  dateStr,
  hari,
  schedules,
  matrix,
}: ClassMatrixClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(dateStr);

  // Modal dialog state for applying full-day excuse
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ClassSubjectMatrixItem | null>(null);
  const [excuseStatus, setExcuseStatus] = useState<"Sakit" | "Izin" | "Alpha" | "Hadir">("Sakit");
  const [excuseNote, setExcuseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMatrix = matrix.filter(
    (item) =>
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const truancyCount = matrix.filter((item) => item.overallStatus === "Bolos Terdeteksi").length;
  const sickCount = matrix.filter((item) => item.overallStatus === "Sakit Seharian").length;
  const permittedCount = matrix.filter((item) => item.overallStatus === "Izin Seharian").length;

  const handleOpenModal = (student: ClassSubjectMatrixItem) => {
    setSelectedStudent(student);
    setExcuseStatus("Sakit");
    setExcuseNote("Surat dokter dari orang tua santri");
    setIsModalOpen(true);
  };

  const handleApplyFullDay = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      const res = await applyWaliKelasFullDayAction({
        dateStr,
        kelasNama,
        studentId: selectedStudent.studentId,
        keterangan: excuseStatus,
        catatan: excuseNote,
      });

      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menerapkan izin seharian.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    if (newDate && newDate !== dateStr) {
      router.push(`/guru/attendance/matrix?date=${newDate}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control & Date Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
              <Calendar className="h-4 w-4 text-emerald-600" /> Tanggal:
            </span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                handleDateChange(e.target.value);
              }}
              className="w-36 sm:w-40 h-9 text-xs rounded-xl"
            />
            <Badge variant="outline" className="text-xs font-medium">
              Hari: {hari}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-card border-border/80 shadow-2xs w-full"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {truancyCount > 0 && (
                <Badge className="bg-rose-600 text-white gap-1 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5" /> {truancyCount} Bolos
                </Badge>
              )}
              {sickCount > 0 && (
                <Badge className="bg-sky-600 text-white text-xs">
                  {sickCount} Sakit
                </Badge>
              )}
              {permittedCount > 0 && (
                <Badge className="bg-amber-600 text-white text-xs">
                  {permittedCount} Izin
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Header Summary */}
      <div className="p-4 rounded-2xl glass-subpanel text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
          Mata Pelajaran Terjadwal di {kelasNama} pada Hari {hari}:
        </p>
        {schedules.length === 0 ? (
          <p className="italic">Tidak ada jadwal KBM pada hari ini.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            {schedules.map((sch, i) => (
              <div
                key={sch.jadwalId}
                className="p-2.5 rounded-xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/30 flex flex-col justify-between text-[11px]"
              >
                <div>
                  <span className="font-bold text-foreground block truncate">
                    {i + 1}. {sch.mapelNama}
                  </span>
                  <span className="text-muted-foreground block text-[10px]">
                    {sch.jamMulai} - {sch.jamSelesai} WIB • {sch.guruNama}
                  </span>
                </div>
                <div className="mt-1.5">
                  {sch.isFilled ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[9px] py-0">
                      ✓ Diabsen
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[9px] py-0">
                      Belum Diabsen
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <Card className="overflow-hidden">
        {/* Mobile scroll hint */}
        <div className="md:hidden px-3.5 py-1.5 bg-muted/40 border-b border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>← Geser tabel supervisi rombel →</span>
          <span className="font-semibold text-foreground">{filteredMatrix.length} Santri</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-muted/60 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4 min-w-[180px]">Nama Santri</th>
                <th className="py-3 px-3 w-24 text-center">NIS</th>
                {schedules.map((sch) => (
                  <th key={sch.jadwalId} className="py-3 px-3 text-center min-w-[120px]">
                    <span className="block truncate font-bold text-foreground">{sch.mapelNama}</span>
                    <span className="text-[9px] text-muted-foreground font-normal">{sch.jamMulai}</span>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[140px]">Status Harian</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={schedules.length + 5} className="py-8 text-center text-muted-foreground">
                    Tidak ada data santri yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((item, idx) => {
                  const isTruant = item.overallStatus === "Bolos Terdeteksi";

                  return (
                    <tr
                      key={item.studentId}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isTruant && "bg-rose-500/10"
                      )}
                    >
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">{item.studentName}</p>
                        <span className="text-[10px] text-muted-foreground">
                          Gender: {item.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">{item.nis}</td>

                      {/* Subject Status Cells */}
                      {schedules.map((sch) => {
                        const statusObj = item.subjectStatuses[sch.mapelId];
                        const ket = statusObj?.keterangan;

                        return (
                          <td key={sch.jadwalId} className="py-2.5 px-3 text-center">
                            {ket ? (
                              <span
                                title={statusObj?.catatan || ket}
                                className={cn(
                                  "inline-flex items-center justify-center h-7 w-7 rounded-lg text-[11px] font-black shadow-2xs",
                                  ket === "Hadir" && "bg-emerald-500 text-white",
                                  ket === "Sakit" && "bg-sky-500 text-white",
                                  ket === "Izin" && "bg-amber-500 text-white",
                                  ket === "Alpha" && "bg-rose-600 text-white ring-2 ring-rose-400"
                                )}
                              >
                                {ket === "Hadir" ? "H" : ket === "Sakit" ? "S" : ket === "Izin" ? "I" : "A"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Overall Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {item.overallStatus === "Bolos Terdeteksi" && (
                          <Badge className="bg-rose-600 text-white gap-1 text-[10px] py-0.5 animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> Bolos Mapel
                          </Badge>
                        )}
                        {item.overallStatus === "Sakit Seharian" && (
                          <Badge className="bg-sky-600 text-white text-[10px] py-0.5">
                            Sakit Seharian
                          </Badge>
                        )}
                        {item.overallStatus === "Izin Seharian" && (
                          <Badge className="bg-amber-600 text-white text-[10px] py-0.5">
                            Izin Seharian
                          </Badge>
                        )}
                        {item.overallStatus === "Lengkap" && (
                          <Badge className="bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] py-0.5">
                            ✓ Lengkap
                          </Badge>
                        )}
                        {item.overallStatus === "Belum Lengkap" && (
                          <span className="text-[10px] text-muted-foreground">Belum Lengkap</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-3 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(item)}
                          className="h-7 text-[11px] px-2 rounded-lg border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 cursor-pointer"
                        >
                          Izin Seharian
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Modal: Apply Full Day Status */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Terapkan Izin / Sakit Seharian
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Wali Kelas dapat menetapkan status kehadiran untuk <strong>seluruh mata pelajaran</strong> pada hari ini ({dateStr}) bagi santri yang berhalangan hadir secara resmi.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/60 border border-border/60 text-xs space-y-1">
                <p className="font-bold text-foreground">{selectedStudent.studentName}</p>
                <p className="text-muted-foreground">NIS: {selectedStudent.nis} • Kelas: {kelasNama}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status Kehadiran:</label>
                <Select
                  value={excuseStatus}
                  onValueChange={(val: any) => setExcuseStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sakit">Sakit (Surat Dokter / Izin Orang Tua)</SelectItem>
                    <SelectItem value="Izin">Izin (Kepentingan Keluarga / Syar'i)</SelectItem>
                    <SelectItem value="Alpha">Alpha (Tidak Hadir Tanpa Keterangan)</SelectItem>
                    <SelectItem value="Hadir">Hadir (Koreksi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Catatan / Alasan Izin:</label>
                <Input
                  value={excuseNote}
                  onChange={(e) => setExcuseNote(e.target.value)}
                  placeholder="Misal: Surat dokter dari RS Islam Palembang..."
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyFullDay}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Menerapkan..." : "Terapkan ke Semua Mapel"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
