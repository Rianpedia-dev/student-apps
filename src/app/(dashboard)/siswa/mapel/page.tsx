import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Calendar } from "lucide-react";
import { compareScheduleTime } from "@/lib/utils";
import { SiswaMapelView, SiswaMapelItem } from "./_components/siswa-mapel-view";

export const dynamic = "force-dynamic";

export default async function SiswaMataPelajaranPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  const studentClass = session.kelas || "";
  const kelas = await prisma.kelas.findFirst({
    where: { nama_kelas: studentClass },
  });

  const rawJadwalList = kelas
    ? await prisma.jadwalPelajaran.findMany({
      where: { kelas_id: kelas.id },
      include: {
        mapel: true,
        guru: { select: { id: true, name: true, image: true, gender: true } },
      },
    })
    : [];

  const jadwalList = [...rawJadwalList].sort((a, b) => {
    const comp = compareScheduleTime(
      a.hari,
      a.jam_mulai,
      a.jam_selesai,
      b.hari,
      b.jam_mulai,
      b.jam_selesai
    );
    if (comp !== 0) return comp;
    return (a.mapel?.nama_mapel || "").localeCompare(b.mapel?.nama_mapel || "");
  });

  // Ambil tugas aktif untuk badge count
  const siswaId = BigInt(session.id);
  const activeTasks = kelas
    ? await prisma.tugas.findMany({
      where: { kelas_id: kelas.id, status: "aktif" },
      include: {
        submissions: {
          where: { siswa_id: siswaId },
        },
      },
    })
    : [];

  const formattedSchedules: SiswaMapelItem[] = jadwalList.map((sch) => {
    const tasksForMapel = activeTasks.filter(
      (t) => t.mapel_id === sch.mapel_id
    );
    const unsubmittedCount = tasksForMapel.filter(
      (t) => t.submissions.length === 0
    ).length;

    return {
      id: sch.id.toString(),
      mapelId: sch.mapel_id.toString(),
      namaMapel: sch.mapel.nama_mapel,
      kodeMapel: sch.mapel.kode_mapel,
      warna: sch.mapel.warna || "emerald",
      hari: sch.hari,
      jamMulai: sch.jam_mulai,
      jamSelesai: sch.jam_selesai,
      ruang: sch.ruang || null,
      guru: sch.guru
        ? {
            id: sch.guru.id.toString(),
            name: sch.guru.name,
            image: sch.guru.image,
            gender: sch.guru.gender,
          }
        : null,
      totalTasks: tasksForMapel.length,
      unsubmittedTasks: unsubmittedCount,
    };
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card/60 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Jadwal & Mata Pelajaran
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Daftar jadwal pelajaran mingguan dan materi pembelajaran untuk kelas {studentClass || "Anda"}.
        </p>
      </div>

      {/* Konten Mata Pelajaran (Card & Table View) */}
      {formattedSchedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">Jadwal Pelajaran Belum Tersedia</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Administrator belum mendaftarkan jadwal pelajaran untuk kelas {studentClass || "Anda"}.
          </p>
        </div>
      ) : (
        <SiswaMapelView
          schedules={formattedSchedules}
          studentClass={studentClass}
        />
      )}
    </div>
  );
}
