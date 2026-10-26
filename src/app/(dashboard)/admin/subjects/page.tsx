import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { SubjectsManager } from "./_components/subjects-manager";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const activeJenjang = await getActiveJenjang(session);
  const isSuperAdmin = session?.jenjang === "ALL";
  const isRestricted = !isSuperAdmin && activeJenjang !== "ALL";

  const subjectWhere: any = {};
  if (isRestricted) {
    subjectWhere.jenjang = { in: [activeJenjang, "SEMUA"] };
  }

  const subjects = await prisma.mataPelajaran.findMany({
    where: subjectWhere,
    include: {
      jadwal: {
        where: isRestricted ? { kelas: { jenjang: activeJenjang } } : {},
        include: {
          kelas: { select: { nama_kelas: true } },
          guru: { select: { name: true } },
        },
      },
      tugas: {
        where: isRestricted ? { kelas: { jenjang: activeJenjang } } : {},
        select: { id: true },
      },
    },
    orderBy: [{ jenjang: "asc" }, { nama_mapel: "asc" }],
  });

  const formatted = subjects.map((s) => ({
    id: s.id.toString(),
    kode: s.kode_mapel,
    nama: s.nama_mapel,
    jenjang: s.jenjang,
    deskripsi: s.deskripsi || "",
    icon: s.icon || "BookOpen",
    warna: s.warna || "emerald",
    totalJadwal: s.jadwal.length,
    totalTugas: s.tugas.length,
  }));

  const scopeLabel =
    isSuperAdmin && activeJenjang === "ALL"
      ? "Semua Jenjang"
      : activeJenjang === "SD"
        ? "Jenjang SD"
        : activeJenjang === "SMP"
          ? "Jenjang SMP"
          : "Semua Jenjang";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Master Data Mata Pelajaran
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {scopeLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola kurikulum dan mata pelajaran untuk {scopeLabel}.
          </p>
        </div>
      </div>

      <SubjectsManager
        initialSubjects={formatted}
        adminJenjang={session?.jenjang || "ALL"}
        activeJenjang={activeJenjang}
      />
    </div>
  );
}
