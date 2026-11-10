import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    mapelId?: string;
    kelasId?: string;
    tab?: string;
  }>;
}

/**
 * Halaman Tugas Siswa sekarang terintegrasi langsung di dalam halaman masing-masing Mata Pelajaran (/guru/mapel/[mapelId]?tab=tugas).
 * Rute ini berfungsi sebagai redirector otomatis agar alur guru tetap simpel, konsisten, dan tidak membingungkan.
 */
export default async function GuruTugasListPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { mapelId, kelasId } = await searchParams;

  if (mapelId && /^\d+$/.test(mapelId)) {
    const kelasQuery = kelasId && /^\d+$/.test(kelasId) ? `&kelasId=${kelasId}` : "";
    redirect(`/guru/mapel/${mapelId}?tab=tugas${kelasQuery}`);
  }

  redirect("/guru/mapel");
}
