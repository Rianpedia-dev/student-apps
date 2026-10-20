import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskCreateTabs } from "@/components/features/assignment/builder/task-create-tabs";
import { DashboardBreadcrumb } from "@/components/shared/dashboard-breadcrumb";

import { GraduationCap, BookOpen, FileEdit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    mapelId?: string;
    kelasId?: string;
    from?: string;
  }>;
}

export default async function GuruCreateTugasPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { mapelId, kelasId, from } = await searchParams;

  const [classes, subjects, pertemuanList] = await Promise.all([
    prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      orderBy: { nama_mapel: "asc" },
    }),
    prisma.pertemuan.findMany({
      where: {
        guru_id: BigInt(session.id),
        ...(mapelId ? { mapel_id: BigInt(mapelId) } : {}),
        ...(kelasId ? { kelas_id: BigInt(kelasId) } : {}),
      },
      select: {
        id: true,
        pertemuan_ke: true,
        judul: true,
      },
      orderBy: { pertemuan_ke: "asc" },
    }),
  ]);

  const activeKelasId =
    kelasId ||
    classes.find((c) => c.nama_kelas === session.kelas)?.id.toString() ||
    classes[0]?.id.toString() ||
    "";
  const activeMapelId = mapelId || subjects[0]?.id.toString() || "";

  const selectedClass = classes.find((c) => c.id.toString() === activeKelasId);
  const selectedSubject = subjects.find((s) => s.id.toString() === activeMapelId);

  const isFromMapel = from === "mapel" && !!mapelId;
  const backHref = isFromMapel
    ? "/guru/mapel"
    : mapelId
      ? `/guru/tugas?mapelId=${mapelId}${kelasId ? `&kelasId=${kelasId}` : ""}`
      : "/guru/tugas";
  const backLabel = isFromMapel ? "Kembali ke Mapel & Tugas" : "Kembali ke Daftar Tugas";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Navigation */}
      <DashboardBreadcrumb
        backHref={backHref}
        backLabel={backLabel}
      />

      {/* Header Info - Clean & Minimal */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Buat Tugas Baru
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pilih jenis tugas dan lengkapi konfigurasi berikut.
          </p>
        </div>

        {(selectedClass || selectedSubject) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedClass && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedClass.nama_kelas}</span>
              </div>
            )}
            {selectedSubject && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-foreground">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{selectedSubject.nama_mapel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <TaskCreateTabs
        classes={classes.map((c) => ({
          id: c.id.toString(),
          nama: c.nama_kelas,
          jenjang: c.jenjang,
          tingkat: c.tingkat,
        }))}
        subjects={subjects.map((s) => ({
          id: s.id.toString(),
          kode: s.kode_mapel,
          nama: s.nama_mapel,
          jenjang: s.jenjang,
        }))}
        pertemuanList={pertemuanList.map((p) => ({
          id: p.id.toString(),
          pertemuan_ke: p.pertemuan_ke,
          judul: p.judul,
        }))}
        defaultKelas={session.kelas || ""}
        initialKelasId={activeKelasId}
        initialMapelId={activeMapelId}
        fromOrigin={from}
      />
    </div>
  );
}
