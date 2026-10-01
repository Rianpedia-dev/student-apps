import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Calendar, Clock, BookOpen, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { compareScheduleTime } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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

      {/* Table */}
      {jadwalList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="text-base font-bold text-foreground">Jadwal Pelajaran Belum Tersedia</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Administrator belum mendaftarkan jadwal pelajaran untuk kelas {studentClass || "Anda"}.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  No
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                  Mata Pelajaran
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[160px]">
                  Guru Pengampu
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[170px]">
                  Jadwal
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jadwalList.map((sch, idx) => {
                const tasksForMapel = activeTasks.filter(
                  (t) => t.mapel_id === sch.mapel_id
                );
                const unsubmittedCount = tasksForMapel.filter(
                  (t) => t.submissions.length === 0
                ).length;

                return (
                  <TableRow
                    key={sch.id.toString()}
                    className="group hover:bg-muted/40 transition-colors border-b border-border/60"
                  >
                    {/* No */}
                    <TableCell className="text-center text-xs font-medium text-muted-foreground/80 py-3.5">
                      {idx + 1}
                    </TableCell>

                    {/* Mata Pelajaran */}
                    <TableCell className="py-3.5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {sch.mapel.nama_mapel}
                        </p>
                        <Badge
                          variant={(sch.mapel.warna as any) || "emerald"}
                          size="xs"
                          className="font-bold font-mono uppercase"
                        >
                          {sch.mapel.kode_mapel}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Guru Pengampu */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={sch.guru?.image}
                          gender={sch.guru?.gender}
                          name={sch.guru?.name || "Guru Pengampu"}
                          className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                          previewable={false}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {sch.guru?.name || "Guru Pengampu"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Jadwal */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold text-primary">{sch.hari}</span>
                          <span className="text-muted-foreground"> • </span>
                          <span className="text-muted-foreground text-[11px]">
                            {sch.jam_mulai} - {sch.jam_selesai}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Aksi: 2 Buttons */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/siswa/mapel/${sch.mapel_id}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1.5 rounded-xl"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Materi</span>
                          </Button>
                        </Link>

                        <Link href={`/siswa/tugas?mapelId=${sch.mapel_id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-xl hover:border-primary/40 gap-1.5"
                          >
                            <ListTodo className="h-3.5 w-3.5 text-primary" />
                            <span>Tugas</span>
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer */}
      {jadwalList.length > 0 && (
        <div className="text-[11px] text-muted-foreground px-1">
          Menampilkan {jadwalList.length} mata pelajaran terjadwal untuk kelas {studentClass}
        </div>
      )}
    </div>
  );
}
