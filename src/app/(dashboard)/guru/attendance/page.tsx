import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceService } from "@/services/attendance.service";

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

  const activeJenjang = await getActiveJenjang(session);
  const isRestricted = activeJenjang !== "ALL";

  // Ambil jadwal mengajar hari ini beserta status pengisian presensinya
  const rawTodaySchedules = await AttendanceService.getTeacherTodaySchedulesWithAttendance(
    guruId,
    todayFormatted
  );

  const todaySchedules = isRestricted
    ? rawTodaySchedules.filter((s: any) => !s.jenjang || s.jenjang === activeJenjang)
    : rawTodaySchedules;

  // Ambil semua daftar mata pelajaran yang diampu guru ini untuk filter/shortcut
  const allTeacherSchedules = await prisma.jadwalPelajaran.findMany({
    where: {
      guru_id: guruId,
      ...(isRestricted ? { kelas: { jenjang: activeJenjang } } : {}),
    },
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
    <div className="space-y-6 max-w-6xl mx-auto w-full px-2 sm:px-4 md:px-0">
      {/* Quick Action Cards */}
      {isWaliKelas ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Link href="/guru/attendance/recap" className="group">
            <Card enableHover className="cursor-pointer group-hover:border-teal-500/50 transition-all">
              <CardContent className="p-4 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Rekap Presensi Mapel
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guru/attendance/matrix" className="group">
            <Card enableHover className="cursor-pointer group-hover:border-emerald-500/50 transition-all">
              <CardContent className="p-4 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Supervisi Kelas {guruClass}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/guru/attendance/table/${todayFormatted}`} className="group">
            <Card enableHover className="cursor-pointer group-hover:border-sky-500/50 transition-all">
              <CardContent className="p-4 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Tabel Presensi Bulanan
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        <div className="flex">
          <Link href="/guru/attendance/recap" className="group w-full sm:w-auto">
            <Card enableHover className="cursor-pointer group-hover:border-teal-500/50 transition-all">
              <CardContent className="py-3 px-5 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Rekap Presensi Mapel
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Section 1: Today's Teaching Schedule & Attendance Status */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Jadwal Mengajar Hari Ini
          </h2>
          <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 bg-card/80 border-border/80">
            {todaySchedules.length} Sesi
          </Badge>
        </div>

        {todaySchedules.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <h3 className="text-sm font-bold text-foreground">Tidak Ada Jadwal Mengajar Hari Ini</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Tidak ada sesi KBM untuk hari {currentDayName}. Anda tetap dapat membuka presensi kelas lain pada daftar di bawah.
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
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                            {schedule.jenjang} • {schedule.jamMulai} - {schedule.jamSelesai}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                            {schedule.mapelNama}
                          </h3>
                        </div>

                        {schedule.isFilled ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shrink-0">
                            Sudah Diabsen
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold shrink-0 animate-pulse">
                            Belum Diabsen
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground font-semibold">
                        <span className="text-foreground">{schedule.kelasNama}</span>
                      </div>

                      {schedule.isFilled && (
                        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-card border border-border/60 text-center shadow-2xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-medium">Hadir</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{schedule.hadirCount}</span>
                          </div>
                          <div className="border-l border-border/50">
                            <span className="text-[10px] text-muted-foreground block font-medium">Sakit</span>
                            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{schedule.sakitCount}</span>
                          </div>
                          <div className="border-l border-border/50">
                            <span className="text-[10px] text-muted-foreground block font-medium">Izin</span>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{schedule.izinCount}</span>
                          </div>
                          <div className="border-l border-border/50">
                            <span className="text-[10px] text-muted-foreground block font-medium">Alpha</span>
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{schedule.alphaCount}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <Link href={attendanceUrl} className="block">
                        <Button
                          className={`w-full rounded-xl text-xs sm:text-sm font-semibold cursor-pointer h-10 ${
                            schedule.isFilled
                              ? "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                              : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                          }`}
                        >
                          {schedule.isFilled ? "Perbarui Presensi" : "Mulai Presensi"}
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Mata Pelajaran & Kelas Lain
          </h2>
        </div>

        {assignedSubjects.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada mata pelajaran yang ditugaskan ke akun Anda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignedSubjects.map((sub, idx) => (
              <Link
                key={idx}
                href={`/guru/attendance/${sub.mapelId}/${sub.kelasId}/${todayFormatted}`}
                className="group block"
              >
                <div className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/95 hover:bg-card hover:border-teal-500/60 dark:bg-card/90 shadow-2xs hover:shadow-md transition-all">
                  <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {sub.mapelNama}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">
                    {sub.kelasNama}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
