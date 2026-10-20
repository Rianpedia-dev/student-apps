import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AttendanceService } from "@/services/attendance.service";
import { AttendanceHistoryClient } from "./_components/attendance-history-client";

export const dynamic = "force-dynamic";

export default async function SiswaAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentId = BigInt(session.id);
  const data = await AttendanceService.getStudentSubjectAttendanceHistory(studentId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Riwayat Presensi Siswa
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            SD - SMP Islam Al-Azhar Cairo Palembang • Catatan kehadiran KBM per mata pelajaran
          </p>
        </div>
      </div>

      <AttendanceHistoryClient
        overallStats={data.overallStats}
        subjectSummaries={data.subjectSummaries}
        recentLogs={data.recentLogs}
      />
    </div>
  );
}
