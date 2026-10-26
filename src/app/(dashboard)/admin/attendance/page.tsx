import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { ClipboardList, ShieldAlert, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceService } from "@/services/attendance.service";
import { formatDateIndo } from "@/lib/utils";
import { AdminAttendanceClient } from "./_components/admin-attendance-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    jenjang?: string;
    kelas?: string;
  }>;
}

export default async function AdminAttendancePage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const { date, jenjang, kelas } = await props.searchParams;
  const activeJenjang = await getActiveJenjang(session);

  const now = new Date();
  const dateStr =
    date ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

  const isSuperAdmin = session?.jenjang === "ALL";
  const effectiveJenjang = !isSuperAdmin && activeJenjang !== "ALL" ? activeJenjang : (jenjang || undefined);

  const dashboardData = await AttendanceService.getAdminAttendanceDashboard(dateStr, {
    jenjang: effectiveJenjang,
    kelas: kelas !== "SEMUA" ? kelas : undefined,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Audit & Monitoring Presensi Siswa
                </h1>
                <Badge className="bg-slate-800 text-white text-[11px] font-semibold dark:bg-slate-700">
                  Administrator
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                SD - SMP Islam Al-Azhar Cairo Palembang • Pengawasan kepatuhan pengisian presensi KBM harian
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-foreground block">
              {formatDateIndo(dateStr)}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Hari: {dashboardData.hari}
            </span>
          </div>
        </div>
      </div>

      {/* Main Admin Attendance Client */}
      <AdminAttendanceClient
        dateStr={dateStr}
        hari={dashboardData.hari}
        summary={dashboardData.summary}
        scheduleCompliance={dashboardData.scheduleCompliance}
        classList={dashboardData.classList}
        currentJenjang={jenjang || "SEMUA"}
        currentKelas={kelas || "SEMUA"}
      />
    </div>
  );
}
