import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BookOpen, FileCheck } from "lucide-react";
import { CreateTaskForm } from "./_components/create-task-form";
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

  const [classes, subjects] = await Promise.all([
    prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      orderBy: { nama_mapel: "asc" },
    }),
  ]);

  const isFromMapel = from === "mapel" && !!mapelId;
  const backHref = isFromMapel
    ? "/guru/mapel"
    : mapelId
      ? `/guru/tugas?mapelId=${mapelId}${kelasId ? `&kelasId=${kelasId}` : ""}`
      : "/guru/tugas";
  const backLabel = isFromMapel ? "Kembali ke Jadwal & Mapel" : "Kembali ke Daftar Tugas";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back Navigation */}
      <DashboardBreadcrumb
        backHref={backHref}
        backLabel={backLabel}
      />

      {/* Header Info */}
      <div className="bg-card/60 backdrop-blur-xs p-5 rounded-2xl border border-border">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Buat Tugas Baru
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Tentukan kelas, mata pelajaran, tenggat pengumpulan, dan instruksi tugas siswa.
        </p>
      </div>

      <CreateTaskForm
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
        defaultKelas={session.kelas || ""}
        initialKelasId={kelasId}
        initialMapelId={mapelId}
        fromOrigin={from}
      />
    </div>
  );
}
