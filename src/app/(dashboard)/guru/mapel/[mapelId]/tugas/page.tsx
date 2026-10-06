import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ mapelId: string }>;
  searchParams: Promise<{ kelasId?: string }>;
}

export default async function GuruMapelTugasRedirectPage({ params, searchParams }: PageProps) {
  const { mapelId } = await params;
  const { kelasId } = await searchParams;

  redirect(`/guru/tugas?mapelId=${mapelId}${kelasId ? `&kelasId=${kelasId}` : ""}`);
}
