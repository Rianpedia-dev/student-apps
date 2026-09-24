import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BookOpen, Plus, Trash2, Atom, Calculator, Languages, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubjectsManager } from "./subjects-manager";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const subjects = await prisma.mataPelajaran.findMany({
    include: {
      jadwal: {
        include: {
          kelas: { select: { nama_kelas: true } },
          guru: { select: { name: true } },
        },
      },
      tugas: {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </span>
            <span>Master Data Mata Pelajaran</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola kurikulum dan mata pelajaran untuk jenjang SD (Kelas 4-6) dan SMP (Kelas 7-9).
          </p>
        </div>
      </div>

      <SubjectsManager initialSubjects={formatted} />
    </div>
  );
}
