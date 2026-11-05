import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { AttendanceService } from "@/services/attendance.service";
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
  const adminJenjang = session?.jenjang || "ALL";

  // Jika bukan Super Admin (misal: admin jenjang SD atau SMP), paksa jenjang ke hak aksesnya
  const effectiveJenjang = !isSuperAdmin
    ? (session.jenjang || (activeJenjang !== "ALL" ? activeJenjang : "SD"))
    : (jenjang || (activeJenjang !== "ALL" ? activeJenjang : undefined));

  const dashboardData = await AttendanceService.getAdminAttendanceDashboard(dateStr, {
    jenjang: effectiveJenjang,
    kelas: kelas !== "SEMUA" ? kelas : undefined,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Main Admin Attendance Client */}
      <AdminAttendanceClient
        dateStr={dateStr}
        hari={dashboardData.hari}
        summary={dashboardData.summary}
        scheduleCompliance={dashboardData.scheduleCompliance}
        classList={dashboardData.classList}
        isSuperAdmin={isSuperAdmin}
        adminJenjang={adminJenjang}
        currentJenjang={
          isSuperAdmin
            ? (jenjang || (activeJenjang !== "ALL" ? activeJenjang : "SEMUA"))
            : effectiveJenjang
        }
        currentKelas={kelas || "SEMUA"}
      />
    </div>
  );
}
  