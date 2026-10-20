import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Table as TableIcon,
  FileText,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Search,
} from "lucide-react";
import { ClipboardListIcon } from "@/components/icons/clipboard-list-icon";
import { BuildingLibraryIcon } from "@/components/icons/building-library-icon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceService } from "@/services/attendance.service";
import { formatDateIndo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuruAttendancePage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);

  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: guruId },
        select: { status: true, kelas: true, guru_bidang: true, name: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const guruClass = dbUser?.kelas || session.kelas || "";
  const isWaliKelas = currentStatus === "4";
  const guruBidang = dbUser?.guru_bidang || "Dewan Guru";

  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Ambil jadwal mengajar hari ini beserta status pengisian presensinya
  const todaySchedules = await AttendanceService.getTeacherTodaySchedulesWithAttendance(
    guruId,
    todayFormatted
  );

  // Ambil semua daftar mata pelajaran yang diampu guru ini untuk filter/shortcut
  const allTeacherSchedules = await prisma.jadwalPelajaran.findMany({
    where: { guru_id: guruId },
    include: {
      kelas: true,
      mapel: true,
    },
    orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
  });

  // Unique mapel yang diajar
  const uniqueMapelMap = new Map();
  allTeacherSchedules.forEach((s) => {
    const key = `${s.mapel_id}-${s.kelas_id}`;
    if (!uniqueMapelMap.has(key)) {
      uniqueMapelMap.set(key, {
        mapelId: s.mapel_id.toString(),
        mapelNama: s.mapel.nama_mapel,
        mapelKode: s.mapel.kode_mapel,
        kelasId: s.kelas_id.toString(),
        kelasNama: s.kelas.nama_kelas,
      });
    }
  });
  const assignedSubjects = Array.from(uniqueMapelMap.values());

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const currentDayName = dayNames[now.getDay()];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link href={`/guru/attendance/recap`}>
          <Card enableHover className="cursor-pointer">
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rekapitulasi</p>
                <p className="text-sm font-bold text-foreground">Rekap Presensi per Mapel</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {isWaliKelas ? (
          <Link href="/guru/attendance/matrix">
            <Card enableHover className="cursor-pointer">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Wali Kelas: {guruClass}</p>
                  <p className="text-sm font-bold text-foreground">Matriks Supervisi Rombel</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/guru/mapel">
            <Card enableHover className="cursor-pointer">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Materi & Silabus</p>
                  <p className="text-sm font-bold text-foreground">Buka Mapel & Tugas</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isWaliKelas ? (
          <Link href={`/guru/attendance/table/${todayFormatted}`}>
            <Card enableHover className="cursor-pointer">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  <TableIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Bulanan Rombel</p>
                  <p className="text-sm font-bold text-foreground">Tabel Presensi 1–31</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/guru/calendar">
            <Card enableHover className="cursor-pointer">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Agenda</p>
                  <p className="text-sm font-bold text-foreground">Kalender Akademik</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Section 1: Today's Teaching Schedule & Attendance Status */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>Jadwal Mengajar & Presensi Hari Ini</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Daftar sesi KBM yang dijadwalkan untuk Anda pada hari {currentDayName}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {todaySchedules.length} Sesi Terjadwal
          </Badge>
        </div>

        {todaySchedules.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2.5 text-muted-foreground/60" />
            <h3 className="text-sm font-bold text-foreground">Tidak Ada Jadwal Mengajar Hari Ini</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Tidak ada jadwal KBM yang terdaftar untuk akun Anda pada hari {currentDayName}. Anda tetap dapat membuka dan mengabsen kelas lain melalui daftar mata pelajaran di bawah.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySchedules.map((schedule) => {
              const attendanceUrl = `/guru/attendance/${schedule.mapelId}/${schedule.kelasId}/${todayFormatted}`;

              return (
                <Card
                  key={schedule.jadwalId}
                  variant={schedule.isFilled ? "emerald" : "amber"}
                  enableHover
                >
                  <div className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                            {schedule.jenjang} • {schedule.jamMulai} - {schedule.jamSelesai}
                          </span>
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {schedule.mapelNama}
                          </h3>
                        </div>

                        {schedule.isFilled ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] font-semibold shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Sudah Diabsen
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1 text-[11px] font-semibold shrink-0 animate-pulse">
                            <AlertCircle className="h-3 w-3" /> Belum Diabsen
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BuildingLibraryIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-foreground">{schedule.kelasNama}</span>
                        {schedule.totalSiswa > 0 && (
                          <span>• {schedule.totalSiswa} Siswa Terdaftar</span>
                        )}
                      </div>

                      {schedule.isFilled && (
                        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-2xl glass-subpanel text-center text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Hadir</span>
                            <span className="font-bold text-emerald-600">{schedule.hadirCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Sakit</span>
                            <span className="font-bold text-sky-600">{schedule.sakitCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Izin</span>
                            <span className="font-bold text-amber-600">{schedule.izinCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Alpha</span>
                            <span className="font-bold text-rose-600">{schedule.alphaCount}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Link href={attendanceUrl} className="block">
                        <Button
                          className={`w-full gap-2 rounded-xl text-xs font-semibold cursor-pointer ${
                            schedule.isFilled
                              ? "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                              : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                          }`}
                        >
                          <ClipboardListIcon className="h-4 w-4" />
                          <span>{schedule.isFilled ? "Koreksi / Perbarui Presensi" : "Mulai Presensi Kelas"}</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: All Teaching Classes Shortcut */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-600" />
              <span>Pilih Mata Pelajaran & Kelas Lain</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Buka form presensi tanggal tertentu untuk mata pelajaran yang Anda ampu
            </p>
          </div>
        </div>

        {assignedSubjects.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada mata pelajaran yang ditugaskan ke akun Anda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignedSubjects.map((sub, idx) => (
              <Link
                key={idx}
                href={`/guru/attendance/${sub.mapelId}/${sub.kelasId}/${todayFormatted}`}
                className="group"
              >
                <div className="p-3.5 rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/25 backdrop-blur-md hover:border-teal-500 transition-all flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-teal-600 transition-colors">
                      {sub.mapelNama}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {sub.kelasNama}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 text-muted-foreground group-hover:text-teal-600">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
