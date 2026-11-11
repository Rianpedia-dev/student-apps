import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskCreateTabs } from "@/components/features/assignment/builder/task-create-tabs";
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
  const safeMapelId = mapelId && /^\d+$/.test(mapelId) ? mapelId : undefined;
  const safeKelasId = kelasId && /^\d+$/.test(kelasId) ? kelasId : undefined;

  const [classes, subjects, pertemuanList] = await Promise.all([
    prisma.kelas.findMany({
      orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
    }),
    prisma.mataPelajaran.findMany({
      orderBy: { nama_mapel: "asc" },
    }),
    prisma.pertemuan.findMany({
      where: {
        ...(session.role === "admin" ? {} : { guru_id: BigInt(session.id) }),
        ...(safeMapelId ? { mapel_id: BigInt(safeMapelId) } : {}),
        ...(safeKelasId ? { kelas_id: BigInt(safeKelasId) } : {}),
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
    safeKelasId ||
    classes.find((c) => c.nama_kelas === session.kelas)?.id.toString() ||
    classes[0]?.id.toString() ||
    "";
  const activeMapelId = safeMapelId || subjects[0]?.id.toString() || "";

  const selectedSubject = subjects.find((s) => s.id.toString() === activeMapelId);

  const backHref = safeMapelId
    ? `/guru/mapel/${safeMapelId}${safeKelasId ? `?kelasId=${safeKelasId}&tab=tugas` : "?tab=tugas"}`
    : "/guru/mapel";
  const backLabel = selectedSubject
    ? `Kembali ke Tugas ${selectedSubject.nama_mapel}`
    : "Kembali ke Mata Pelajaran";

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* Back Navigation */}
      <DashboardBreadcrumb backHref={backHref} backLabel={backLabel} />

      {/* Header Info */}
      <div className="rounded-2xl sm:rounded-3xl card-elevation shadow-2xl p-4 sm:p-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
          Buat Tugas Baru
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Pilih jenis tugas dan lengkapi konfigurasi berikut.
        </p>
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
