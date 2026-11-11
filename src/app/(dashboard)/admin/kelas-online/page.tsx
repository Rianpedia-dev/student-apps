import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { Video, Clock, Users, BarChart3, Wifi, User } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KelasOnlineService } from "@/services/kelas-online.service";
import { AdminSessionLogSection } from "./_components/admin-session-log-section";

export const dynamic = "force-dynamic";

interface ActiveRoomItem {
  id: string;
  guru_name: string;
  kelas: string;
  mata_pelajaran: string | null;
  session_type: "MAPEL" | "WALI_KELAS";
  topik: string | null;
  started_at: string | null;
  active_participants: number;
}

export interface AdminSessionLogItem {
  id: string;
  guru_name: string;
  kelas: string;
  mata_pelajaran: string | null;
  session_type: "MAPEL" | "WALI_KELAS";
  topik: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  total_attendance: number;
}

export default async function AdminKelasOnlinePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  await KelasOnlineService.cleanupExpiredRooms();
  const activeJenjang = await getActiveJenjang(session);
  const isRestricted = activeJenjang !== "ALL";

  let totalSessions = 0;
  let totalMinutes = 0;
  let avgDuration = 0;
  let avgParticipants = 0;
  let activeRooms: ActiveRoomItem[] = [];
  let allSessions: AdminSessionLogItem[] = [];

  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let jenjangFilter: Record<string, unknown> = {};
    if (isRestricted) {
      const allowedClasses = await prisma.kelas.findMany({
        where: { jenjang: activeJenjang },
        select: { id: true, nama_kelas: true },
      });
      jenjangFilter = {
        OR: [
          { kelas_id: { in: allowedClasses.map((c) => c.id) } },
          { kelas_id: null, kelas: { in: allowedClasses.map((c) => c.nama_kelas) } },
        ],
      };
    }

    const allRooms = await prisma.kelasOnline.findMany({
      where: {
        created_at: { gte: firstOfMonth },
        ...jenjangFilter,
      },
      include: {
        attendance: {
          select: {
            user_role: true,
            user_id: true,
            duration_minutes: true,
            left_at: true,
          },
        },
      },
      orderBy: { started_at: "desc" },
    });

    totalSessions = allRooms.length;

    let totalDuration = 0;
    let totalParticipantsSum = 0;
    let countedSessions = 0;

    for (const room of allRooms) {
      if (room.started_at && room.ended_at) {
        const dur = Math.round(
          (room.ended_at.getTime() - room.started_at.getTime()) / 60000
        );
        totalDuration += dur;
        countedSessions++;
      }

      const uniqueSiswa = new Set(
        room.attendance.filter((a) => a.user_role === "siswa").map((a) => a.user_id.toString())
      );
      totalParticipantsSum += uniqueSiswa.size;

      for (const att of room.attendance) {
        if (att.duration_minutes) {
          totalMinutes += att.duration_minutes;
        }
      }
    }

    avgDuration = countedSessions > 0 ? Math.round(totalDuration / countedSessions) : 0;
    avgParticipants = totalSessions > 0 ? Math.round(totalParticipantsSum / totalSessions) : 0;

    const dbActive = await prisma.kelasOnline.findMany({
      where: {
        status: "active",
        ...jenjangFilter,
      },
      include: {
        attendance: {
          where: { left_at: null },
          select: { id: true },
        },
      },
      orderBy: { started_at: "desc" },
    });

    activeRooms = dbActive.map((r) => ({
      id: r.id.toString(),
      guru_name: r.guru_name,
      kelas: r.kelas,
      mata_pelajaran:
        r.session_type === "WALI_KELAS" ? "Sesi Wali Kelas" : r.mata_pelajaran,
      session_type: r.session_type === "WALI_KELAS" ? "WALI_KELAS" : "MAPEL",
      topik: r.topik,
      started_at: r.started_at?.toISOString() || null,
      active_participants: r.attendance.length,
    }));

    allSessions = allRooms.slice(0, 30).map((r) => {
      const dur =
        r.started_at && r.ended_at
          ? Math.round((r.ended_at.getTime() - r.started_at.getTime()) / 60000)
          : null;
      const uniqueSiswa = new Set(
        r.attendance.filter((a) => a.user_role === "siswa").map((a) => a.user_id.toString())
      );

      return {
        id: r.id.toString(),
        guru_name: r.guru_name,
        kelas: r.kelas,
        mata_pelajaran:
          r.session_type === "WALI_KELAS" ? "Sesi Wali Kelas" : r.mata_pelajaran,
        session_type: r.session_type === "WALI_KELAS" ? "WALI_KELAS" : "MAPEL",
        topik: r.topik,
        status: r.status,
        started_at: r.started_at?.toISOString() || null,
        ended_at: r.ended_at?.toISOString() || null,
        duration_minutes: dur,
        total_attendance: uniqueSiswa.size,
      };
    });
  } catch (e) {
    console.error("Error fetching admin kelas online data:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitor Kelas Online</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau aktivitas kelas online bulan ini
          {isRestricted ? ` (Jenjang ${activeJenjang})` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Sesi"
          value={totalSessions.toString()}
          countLabel="Sesi"
          icon={Video}
          description="Bulan ini"
          variant="emerald"
          meta="Live Class"
        />
        <StatCard
          title="Total Menit"
          value={totalMinutes.toLocaleString("id-ID")}
          countLabel="Menit"
          icon={Clock}
          description="Menit belajar siswa"
          variant="blue"
          meta="Total Durasi"
        />
        <StatCard
          title="Rata-rata Durasi"
          value={`${avgDuration}m`}
          countLabel="Menit"
          icon={BarChart3}
          description="Per sesi belajar"
          variant="amber"
          meta="Rata-rata"
        />
        <StatCard
          title="Rata-rata Peserta"
          value={avgParticipants.toString()}
          countLabel="Siswa"
          icon={Users}
          description="Kehadiran per sesi"
          variant="purple"
          meta="Peserta"
        />
      </div>

      {activeRooms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wifi className="h-5 w-5 text-emerald-500" />
            Kelas Aktif Sekarang
            <Badge variant="success" size="sm">
              {activeRooms.length}
            </Badge>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRooms.map((room) => (
              <Card
                key={room.id}
                variant="emerald"
                elevationSize="sm"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="success" size="sm" className="animate-pulse">
                        AKTIF
                      </Badge>
                      <Badge
                        variant={room.session_type === "WALI_KELAS" ? "violet" : "outline"}
                        size="xs"
                      >
                        {room.session_type === "WALI_KELAS" ? "Wali Kelas" : "Mapel"}
                      </Badge>
                    </div>
                    <Badge variant="sky" size="xs" className="gap-1">
                      <Users className="h-3 w-3" />
                      {room.active_participants} Peserta
                    </Badge>
                  </div>
                  <p className="font-semibold">{room.mata_pelajaran || "Kelas Online"}</p>
                  {room.topik && (
                    <p className="text-xs text-muted-foreground truncate">Topik: {room.topik}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{room.guru_name}</span>
                    <span>•</span>
                    <Badge variant="indigo" size="xs">
                      {room.kelas}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AdminSessionLogSection sessions={allSessions} />
    </div>
  );
}
