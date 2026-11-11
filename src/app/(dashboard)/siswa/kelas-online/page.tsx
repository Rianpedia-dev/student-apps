import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { KelasOnlineService } from "@/services/kelas-online.service";
import { SiswaRoomList } from "./_components/siswa-room-list";
import { SiswaHistorySection } from "./_components/siswa-history-section";

export const dynamic = "force-dynamic";

export default async function SiswaKelasOnlinePage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  await KelasOnlineService.cleanupExpiredRooms();

  const { activeRooms, historyRecords } =
    await KelasOnlineService.getStudentKelasOnlineData(
      session.id,
      session.kelas
    );

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Kelas Online
        </h1>
      </div>

      {/* Active Classes */}
      {activeRooms.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>Kelas Sedang Berlangsung</span>
            <Badge variant="success" size="xs">
              {activeRooms.length}
            </Badge>
          </h2>
          <SiswaRoomList rooms={activeRooms} />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 sm:py-12 text-center">
            <Inbox className="h-10 w-10 sm:h-11 sm:w-11 mx-auto mb-2.5 text-slate-300 dark:text-slate-600" />
            <p className="text-sm sm:text-base font-semibold text-muted-foreground">
              Tidak ada kelas online saat ini
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tunggu Ustadz/Ustadzah memulai kelas ya!
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <SiswaHistorySection records={historyRecords} />
    </div>
  );
}
