import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { InteractiveTaskBuilder } from "@/components/features/assignment/builder/interactive-task-builder";
import { DashboardBreadcrumb } from "@/components/shared/dashboard-breadcrumb";

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

  const isFromMapel = from === "mapel" && !!mapelId;
  const backHref = isFromMapel
    ? "/guru/mapel"
    : mapelId
      ? `/guru/tugas?mapelId=${mapelId}${kelasId ? `&kelasId=${kelasId}` : ""}`
      : "/guru/tugas";
  const backLabel = isFromMapel ? "Kembali ke Mapel & Tugas" : "Kembali ke Daftar Tugas";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Back Navigation */}
      <DashboardBreadcrumb
        backHref={backHref}
        backLabel={backLabel}
      />

      {/* Header Info */}
      <div className="bg-card/70 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-border shadow-2xs">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          Buat Tugas Interaktif Baru
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Susun butir-butir soal interaktif (pilihan ganda, gambar stimulus, isian, dan esai) yang dikerjakan langsung oleh murid di sistem.
        </p>
      </div>

      <InteractiveTaskBuilder
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
        initialKelasId={kelasId}
        initialMapelId={mapelId}
        fromOrigin={from}
      />
    </div>
  );
}
