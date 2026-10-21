import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, ShieldCheck, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AttendanceService } from "@/services/attendance.service";
import { formatDateIndo } from "@/lib/utils";
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
  const guruClass = kelas || dbUser?.kelas || session.kelas || "";

  if (!isWaliKelas) {
    redirect("/guru/attendance");
  }

  if (!guruClass) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Kelas Binaan Belum Ditetapkan</h2>
        <p className="text-xs text-muted-foreground">
          Akun Anda belum dikaitkan dengan kelas binaan manapun oleh Administrator.
        </p>
        <Link href="/guru/attendance">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
            Kembali ke Hub Presensi
          </button>
        </Link>
      </div>
    );
  }

  const now = new Date();
  const dateStr = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const matrixData = await AttendanceService.getDailyClassSubjectMatrix(guruClass, dateStr);

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full px-2 sm:px-4 md:px-0">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/guru/attendance"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Hub Presensi
        </Link>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white text-xs font-semibold gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Supervisi Wali Kelas
          </Badge>
        </div>
      </div>

      {/* Matrix Client */}
      <ClassMatrixClient
        kelasNama={guruClass}
        dateStr={dateStr}
        hari={matrixData.hari}
        schedules={matrixData.schedules}
        matrix={matrixData.matrix}
      />
    </div>
  );
}
