import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ mapelId?: string }>;
}

export default async function SiswaTugasIndexPage({ searchParams }: PageProps) {
  const { mapelId } = await searchParams;
  if (mapelId && /^\d+$/.test(mapelId)) {
    redirect(`/siswa/mapel/${mapelId}/tugas`);
  }
  redirect("/siswa/mapel");
}
