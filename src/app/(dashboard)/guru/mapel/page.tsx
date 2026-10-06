import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareScheduleTime } from "@/lib/utils";
import { GuruMapelTable, ScheduleItemData } from "./_components/guru-mapel-table";

export const dynamic = "force-dynamic";

export default async function GuruMapelPage() {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const guruId = BigInt(session.id);

  // Ambil jadwal mengajar guru ini
  const rawSchedules = await prisma.jadwalPelajaran.findMany({
    where: { guru_id: guruId },
    include: {
      kelas: true,
      mapel: true,
    },
  });

  const schedules = [...rawSchedules].sort((a, b) => {
    const comp = compareScheduleTime(
      a.hari,
      a.jam_mulai,
      a.jam_selesai,
      b.hari,
      b.jam_mulai,
      b.jam_selesai
    );
    if (comp !== 0) return comp;
    return (a.kelas?.nama_kelas || "").localeCompare(b.kelas?.nama_kelas || "");
  });

  // Ambil tugas yang pernah dibuat untuk mapel-mapel ini
  const tasks = await prisma.tugas.findMany({
    where: { guru_id: guruId },
    include: {
      kelas: true,
      mapel: true,
      submissions: true,
    },
  });

  // Ambil data pertemuan yang telah dibuat
  const meetings = (prisma as any).pertemuan?.findMany
    ? await (prisma as any).pertemuan.findMany({
        where: session.role === "admin" ? {} : { guru_id: guruId },
        select: {
          id: true,
          kelas_id: true,
          mapel_id: true,
          is_published: true,
        },
      })
    : [];

  const formattedSchedules: ScheduleItemData[] = schedules.map((sch) => {
    const tasksInSchedule = tasks.filter(
      (t) => t.kelas_id === sch.kelas_id && t.mapel_id === sch.mapel_id
    );
    const meetingsInSchedule = meetings.filter(
      (m: any) => m.kelas_id === sch.kelas_id && m.mapel_id === sch.mapel_id
    );

    return {
      id: sch.id.toString(),
      kelasId: sch.kelas_id.toString(),
      kelasNama: sch.kelas.nama_kelas,
      jenjang: sch.kelas.jenjang || "SD",
      mapelId: sch.mapel_id.toString(),
      mapelNama: sch.mapel.nama_mapel,
      mapelKode: sch.mapel.kode_mapel,
      mapelWarna: sch.mapel.warna || "emerald",
      hari: sch.hari,
      jamMulai: sch.jam_mulai,
      jamSelesai: sch.jam_selesai,
      ruang: sch.ruang || null,
      meetingsCount: meetingsInSchedule.length,
      tasksCount: tasksInSchedule.length,
    };
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card/60 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Mata Pelajaran & Tugas Siswa
        </h1>
      </div>

      {/* Schedule Table View */}
      {formattedSchedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">Jadwal Mengajar Belum Ditetapkan</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Administrator belum mendaftarkan jadwal mengajar spesifik untuk akun Anda. Anda tetap dapat mengelola tugas dari halaman tugas.
          </p>
          <div className="mt-4">
            <Link href="/guru/tugas">
              <Button size="sm" variant="outline" className="text-xs rounded-xl">
                Buka Halaman Tugas
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <GuruMapelTable schedules={formattedSchedules} />
      )}
    </div>
  );
}

