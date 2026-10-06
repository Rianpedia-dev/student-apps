import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EditAnnouncementForm } from "@/components/features/announcement/edit-announcement-form";

export const dynamic = "force-dynamic";

export default async function GuruEditAnnouncementPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const { id } = await props.params;

  let announcement: any = null;

  try {
    const isNum = /^\d+$/.test(id);
    if (isNum) {
      announcement = await prisma.pengumuman.findUnique({
        where: { id: BigInt(id) },
      });
    }
  } catch (e) {
    console.error("Database query error in guru edit announcement:", e);
  }

  if (!announcement) {
    notFound();
  }

  return (
    <EditAnnouncementForm
      id={id}
      announcement={{
        id: announcement.id.toString(),
        title: announcement.title,
        from: announcement.from,
        file: announcement.file,
        pengumuman: announcement.pengumuman,
      }}
      isGuru={true}
      defaultGuruFrom={session.kelas || "Guru"}
      backHref="/guru/announcements"
      redirectHref="/guru/announcements"
    />
  );
}
