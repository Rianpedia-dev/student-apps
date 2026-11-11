import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { KelasOnlineService } from "@/services/kelas-online.service";
import { GuruKelasOnlineClient } from "./_components/guru-kelas-online-client";
import type { CreateRoomInitialPreset } from "@/types/kelas-online";

export const dynamic = "force-dynamic";

interface GuruKelasOnlinePageProps {
  searchParams: Promise<{
    mapelId?: string;
    kelasId?: string;
    pertemuanId?: string;
    mode?: string;
  }>;
}

export default async function GuruKelasOnlinePage({
  searchParams,
}: GuruKelasOnlinePageProps) {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const activeJenjang = await getActiveJenjang(session);

  await KelasOnlineService.cleanupExpiredRooms();

  const context = await KelasOnlineService.getTeacherOnlineClassContext(
    session.id,
    activeJenjang
  );

  const { activeRooms, endedRooms, waliMonitorRooms } =
    await KelasOnlineService.getGuruRoomsAndMonitoring(
      session.id,
      activeJenjang,
      context
    );

  const initialPreset: CreateRoomInitialPreset | undefined =
    resolvedParams.mapelId ||
    resolvedParams.kelasId ||
    resolvedParams.pertemuanId ||
    resolvedParams.mode === "wali"
      ? {
          sessionType: resolvedParams.mode === "wali" ? "WALI_KELAS" : "MAPEL",
          kelasId:
            resolvedParams.kelasId && /^\d+$/.test(resolvedParams.kelasId)
              ? resolvedParams.kelasId
              : undefined,
          mapelId:
            resolvedParams.mapelId && /^\d+$/.test(resolvedParams.mapelId)
              ? resolvedParams.mapelId
              : undefined,
          pertemuanId:
            resolvedParams.pertemuanId && /^\d+$/.test(resolvedParams.pertemuanId)
              ? resolvedParams.pertemuanId
              : undefined,
        }
      : undefined;

  return (
    <GuruKelasOnlineClient
      context={context}
      activeRooms={activeRooms}
      endedRooms={endedRooms}
      waliMonitorRooms={waliMonitorRooms}
      initialPreset={initialPreset}
    />
  );
}
