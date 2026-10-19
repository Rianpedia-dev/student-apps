import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ClipboardListIcon } from "@/components/icons/clipboard-list-icon";
import { AttendanceHistoryClient } from "./_components/attendance-history-client";

export const dynamic = "force-dynamic";

export default async function SiswaAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Presensi</h1>
          <p className="text-xs text-muted-foreground">Catatan presensi dan kehadiran bulanan Anda</p>
        </div>
      </div>

      <AttendanceHistoryClient />
    </div>
  );
}
