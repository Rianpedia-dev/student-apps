import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EditAnnouncementForm } from "@/components/features/announcement/edit-announcement-form";

export const dynamic = "force-dynamic";

export default async function AdminEditAnnouncementPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const { id } = await props.params;

  let announcement: any = null;
  let classes: any[] = [];

  try {
    const isNum = /^\d+$/.test(id);
    const [dbAnnounce, dbClasses] = await Promise.all([
      isNum
        ? prisma.pengumuman.findUnique({
          where: { id: BigInt(id) },
        })
        : null,
      prisma.kelas.findMany({
        orderBy: { nama_kelas: "asc" },
      }),
    ]);
    announcement = dbAnnounce;
    classes = dbClasses;
  } catch (e) {
    console.error("Database query error in edit announcement:", e);
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
      classes={classes.map((c) => ({
        id: c.id.toString(),
        nama_kelas: c.nama_kelas,
      }))}
      backHref="/admin/announcements"
      redirectHref="/admin/announcements"
    />
  );
}
