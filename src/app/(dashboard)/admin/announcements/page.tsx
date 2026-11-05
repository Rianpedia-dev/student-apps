import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { serializeBigInt } from "@/lib/serializer";
import { AnnouncementsManager } from "./_components/announcements-manager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const isSuperAdmin = session.jenjang === "ALL";
  const adminJenjang = session.jenjang || "ALL";

  let classes: any[] = [];
  let announcements: any[] = [];
  try {
    const announceWhere: any = {};
    if (!isSuperAdmin) {
      announceWhere.OR = [
        { jenjang: adminJenjang },
        { jenjang: "ALL" },
        { jenjang: null },
      ];
    }

    const [dbClasses, dbAnnounce] = await Promise.all([
      prisma.kelas.findMany({
        orderBy: [{ jenjang: "asc" }, { tingkat: "asc" }, { nama_kelas: "asc" }],
        select: {
          id: true,
          nama_kelas: true,
          jenjang: true,
          tingkat: true,
        },
      }),
      prisma.pengumuman.findMany({
        where: announceWhere,
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
    jenjang: item.jenjang || "ALL",
    target_role: item.target_role || "ALL",
    target_kelas: item.target_kelas || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  const serializedClasses = serializeBigInt(classes).map((c: any) => ({
    id: c.id.toString(),
    nama_kelas: c.nama_kelas,
    jenjang: c.jenjang || "SD",
    tingkat: c.tingkat || 1,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AnnouncementsManager
        initialAnnouncements={serializedAnnouncements}
        classes={serializedClasses}
        adminJenjang={adminJenjang}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
