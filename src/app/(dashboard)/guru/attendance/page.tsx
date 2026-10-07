import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Table as TableIcon, FileText, Calendar as CalendarIcon, ShieldAlert, ArrowLeft } from "lucide-react";
import { ClipboardListIcon } from "@/components/icons/clipboard-list-icon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpenCheckIcon } from "@/components/icons/book-open-check-icon";
import { AttendanceCalendarClient } from "./_components/attendance-calendar-client";

export const dynamic = "force-dynamic";

export default async function GuruAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: BigInt(session.id) },
        select: { status: true, kelas: true, guru_bidang: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const guruClass = dbUser?.kelas || session.kelas || "";
  const isWaliKelas = currentStatus === "4";

  if (!isWaliKelas) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />
          <CardContent className="p-6 sm:p-8 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <ClipboardListIcon className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Khusus Guru & Wali Kelas
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Akun Anda terdaftar sebagai <strong className="text-foreground">Guru Mata Pelajaran</strong>{dbUser?.guru_bidang ? ` (${dbUser.guru_bidang})` : ""}. Pencatatan dan rekapitulasi presensi harian kelas dikelola oleh dewan guru yang bertugas sebagai <strong>Wali Kelas</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground text-left space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0" /> Catatan Akses:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Guru Mata Pelajaran berfokus pada materi, tugas, dan penilaian akademik di menu <strong>Mapel & Tugas</strong>.</li>
                <li>Jika Anda ditugaskan menjadi Wali Kelas, silakan hubungi <strong>Administrator</strong> untuk memperbarui peran ke Guru & Wali Kelas.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link href="/guru/mapel" className="w-full sm:w-auto">
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  <BookOpenCheckIcon className="h-4 w-4" />
                  <span>Buka Mapel & Tugas</span>
                </Button>
              </Link>
              <Link href="/guru" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Dashboard</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guruClass) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-rose-500" />
          <CardContent className="p-6 sm:p-8 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <ClipboardListIcon className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Kelas Binaan Belum Ditetapkan
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Status peran akun Anda adalah <strong className="text-foreground">Guru & Wali Kelas</strong>, namun kelas binaan belum dikaitkan dengan akun Anda oleh Administrator.
              </p>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Link href="/guru">
                <Button variant="outline" className="gap-2 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Dashboard</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let filledDatesSet: string[] = [];
  try {
    const recordedDates = await prisma.absen.findMany({
      where: { kelas: guruClass },
      select: { date: true },
      distinct: ["date"],
    });
    filledDatesSet = recordedDates.map((r) => r.date).filter(Boolean) as string[];
  } catch (e) {
    console.warn("DB error in attendance calendar dates:", e);
    filledDatesSet = [todayFormatted];
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Presensi Absensi Kelas</h1>
        <p className="text-xs text-muted-foreground mt-1">Kelola kehadiran harian dan rekap kelas {guruClass}</p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href={`/guru/attendance/${todayFormatted}`}>
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-emerald-500/10 via-background to-background">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ClipboardListIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Isi Cepat Hari Ini</p>
                <p className="text-sm font-bold text-foreground">Form Absen Hari Ini</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/guru/attendance/table/${todayFormatted}`}>
          <Card className="hover:border-sky-500 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-sky-500/10 via-background to-background">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                <TableIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tampilan Matriks</p>
                <p className="text-sm font-bold text-foreground">Tabel Absen Bulanan</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/guru/attendance/recap">
          <Card className="hover:border-amber-500 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-amber-500/10 via-background to-background">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Export Dokumen</p>
                <p className="text-sm font-bold text-foreground">Rekap Absen & PDF</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Monthly Attendance Calendar */}
      <AttendanceCalendarClient
        filledDates={filledDatesSet}
        guruClass={guruClass}
      />
    </div>
  );
}
