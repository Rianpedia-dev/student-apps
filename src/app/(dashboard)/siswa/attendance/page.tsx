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

  const isNumeric = /^\d+$/.test(session.id);
  const studentId = isNumeric ? BigInt(session.id) : null;

  const data = studentId
    ? await AttendanceService.getStudentSubjectAttendanceHistory(studentId)
    : {
        overallStats: { hadir: 0, sakit: 0, izin: 0, alpha: 0, percentage: 100 },
        subjectSummaries: [],
        recentLogs: [],
        allLogs: [],
        calendarEvents: [],
      };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto w-full px-2 sm:px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Riwayat Presensi Siswa
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            SD - SMP Islam Al-Azhar Cairo Palembang • Catatan kehadiran KBM per mata pelajaran
          </p>
        </div>
      </div>

      <AttendanceHistoryClient
        overallStats={data.overallStats}
        subjectSummaries={data.subjectSummaries}
        recentLogs={data.recentLogs}
        allLogs={data.allLogs}
        calendarEvents={data.calendarEvents}
      />
    </div>
  );
}
