import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, ShieldCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceService } from "@/services/attendance.service";
import { ClassMatrixClient } from "./_components/class-matrix-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string; kelas?: string }>;
}

export default async function GuruAttendanceMatrixPage(props: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { date, kelas } = await props.searchParams;

  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: BigInt(session.id) },
        select: { status: true, kelas: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const isWaliKelas = currentStatus === "4" || session.role === "admin";
  // Khusus role admin yang dapat membuka supervisi kelas manapun via param query.
  // Guru Wali Kelas hanya diizinkan membuka kelas binaannya sendiri.
  const guruClass = session.role === "admin" && kelas
    ? kelas
    : (dbUser?.kelas || session.kelas || "");

  if (!isWaliKelas) {
    redirect("/guru/attendance");
  }

  if (!guruClass) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-rose-500" />
          <CardContent className="p-6 sm:p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Kelas Binaan Belum Ditetapkan
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Akun Anda belum dikaitkan dengan kelas binaan manapun oleh Administrator.
              </p>
            </div>
            <Link href="/guru/attendance" className="inline-block pt-1">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold gap-1.5 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Hub Presensi
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dateStr = date || todayStr;

  const matrixData = await AttendanceService.getDailyClassSubjectMatrix(guruClass, dateStr);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-6xl mx-auto w-full">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Link
          href="/guru/attendance"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/70 shadow-2xs text-xs font-semibold text-foreground/85 hover:text-foreground hover:bg-card transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Hub Presensi
        </Link>
        <span className="inline-flex items-center bg-emerald-600 text-white text-xs font-semibold gap-1.5 px-3 py-1.5 rounded-xl shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5" /> Supervisi Wali Kelas
        </span>
      </div>

      {/* Matrix Client */}
      <ClassMatrixClient
        kelasNama={guruClass}
        dateStr={dateStr}
        todayStr={todayStr}
        hari={matrixData.hari}
        schedules={matrixData.schedules}
        matrix={matrixData.matrix}
      />
    </div>
  );
}
