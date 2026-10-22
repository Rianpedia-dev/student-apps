import prisma from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serializer";
import { AnnouncementsManager } from "./_components/announcements-manager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  let classes: any[] = [];
  let announcements: any[] = [];
  try {
    const [dbClasses, dbAnnounce] = await Promise.all([
      prisma.kelas.findMany({
        orderBy: { nama_kelas: "asc" },
      }),
      prisma.pengumuman.findMany({
        orderBy: { id: "desc" },
      }),
    ]);
    classes = dbClasses;
    announcements = dbAnnounce;
  } catch (e) {
    console.error("Database query error in announcements:", e);
  }

  const serializedAnnouncements = serializeBigInt(announcements).map((item: any) => ({
    id: item.id.toString(),
    title: item.title,
    from: item.from,
    file: item.file,
    pengumuman: item.pengumuman,
    like: item.like,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  const serializedClasses = serializeBigInt(classes).map((c: any) => ({
    id: c.id.toString(),
    nama_kelas: c.nama_kelas,
  }));

  return (
    <div className="space-y-6">
      <AnnouncementsManager
        initialAnnouncements={serializedAnnouncements}
        classes={serializedClasses}
      />
    </div>
  );
}
