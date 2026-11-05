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

  // Hak Akses / Kepemilikan: Guru hanya boleh mengedit pengumuman yang mereka buat sendiri atau untuk kelas binaannya
  if (session.role === "guru") {
    const isOwner =
      announcement.from === session.name ||
      (session.kelas && announcement.from === session.kelas) ||
      (session.kelas && announcement.target_kelas === session.kelas);

    if (!isOwner) {
      redirect("/guru/announcements");
    }
  }

  // Ambil kelas yang diajar oleh guru ini
  let taughtClasses: Array<{ id: string; nama_kelas: string; jenjang?: string }> = [];
  try {
    if (session.id) {
      const guruId = BigInt(session.id);
      const schedules = await prisma.jadwalPelajaran.findMany({
        where: { guru_id: guruId },
        include: { kelas: true },
      });
      const uniqueClasses = new Map<string, { id: string; nama_kelas: string; jenjang?: string }>();
      if (session.kelas) {
        uniqueClasses.set(session.kelas, {
          id: "wali",
          nama_kelas: session.kelas,
          jenjang: session.jenjang || undefined,
        });
      }
      schedules.forEach((s) => {
        if (s.kelas && !uniqueClasses.has(s.kelas.nama_kelas)) {
          uniqueClasses.set(s.kelas.nama_kelas, {
            id: s.kelas.id.toString(),
            nama_kelas: s.kelas.nama_kelas,
            jenjang: s.kelas.jenjang || undefined,
          });
        }
      });
      taughtClasses = Array.from(uniqueClasses.values());
    }
  } catch (err) {
    console.error("Error fetching taught classes for edit page:", err);
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
        jenjang: announcement.jenjang,
        target_role: announcement.target_role,
        target_kelas: announcement.target_kelas,
      }}
      classes={taughtClasses}
      isGuru={true}
      defaultGuruFrom={session.name || session.kelas || "Guru"}
      backHref="/guru/announcements"
      redirectHref="/guru/announcements"
    />
  );
}
