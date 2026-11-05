import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  GuruAnnouncementsClient,
  type AnnouncementItem,
} from "./_components/guru-announcements-client";

export const dynamic = "force-dynamic";

export default async function GuruAnnouncementsPage() {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const guruName = session.name || "Guru";
  const guruClass = session.kelas || null;
  const isWaliKelas = Boolean(session.kelas);
  const guruJenjang = session.jenjang || null;
  const guruId = session.id ? BigInt(session.id) : null;

  // 1. Ambil daftar kelas yang diajar oleh guru ini melalui jadwal pelajaran
  let classesTaught: string[] = [];
  try {
    if (guruId) {
      const schedules = await prisma.jadwalPelajaran.findMany({
        where: { guru_id: guruId },
        include: { kelas: true },
      });
      const uniqueClasses = new Set<string>();
      schedules.forEach((s) => {
        if (s.kelas?.nama_kelas) {
          uniqueClasses.add(s.kelas.nama_kelas);
        }
      });
      classesTaught = Array.from(uniqueClasses).sort();
    }
  } catch (e) {
    console.error("Database query error in guru schedules:", e);
  }

  // 2. Ambil master semua kelas untuk opsi fallback
  let allClasses: Array<{ id: string; nama_kelas: string; jenjang?: string }> = [];
  try {
    const classRecords = await prisma.kelas.findMany({
      where:
        guruJenjang && guruJenjang !== "ALL"
          ? { jenjang: guruJenjang }
          : {},
      select: { id: true, nama_kelas: true, jenjang: true },
      orderBy: { nama_kelas: "asc" },
    });
    allClasses = classRecords.map((c) => ({
      id: c.id.toString(),
      nama_kelas: c.nama_kelas,
      jenjang: c.jenjang || undefined,
    }));
  } catch (e) {
    console.error("Database query error in fetching all classes:", e);
  }

  // 3. Ambil Pengumuman Resmi Sekolah (ditujukan untuk Guru atau ALL)
  let officialAnnouncements: AnnouncementItem[] = [];
  try {
    const officialWhere: Prisma.PengumumanWhereInput[] = [
      {
        OR: [
          { target_role: "GURU" },
          { target_role: "ALL" },
          { target_role: null },
        ],
      },
      {
        // Pengumuman sekolah tidak terkunci pada 1 kelas spesifik
        OR: [
          { target_kelas: null },
          { target_kelas: "" },
        ],
      },
    ];

    if (guruJenjang && guruJenjang !== "ALL") {
      officialWhere.push({
        OR: [
          { jenjang: guruJenjang },
          { jenjang: "ALL" },
          { jenjang: null },
        ],
      });
    }

    const rawOfficial = await prisma.pengumuman.findMany({
      where: {
        AND: officialWhere,
      },
      orderBy: { id: "desc" },
    });

    // Cek likes untuk akun guru ini
    const officialIds = rawOfficial.map((item) => item.id.toString());
    const userLikes = await prisma.like.findMany({
      where: {
        user_id: session.id,
        post_id: { in: officialIds },
      },
      select: { post_id: true },
    });
    const likedSet = new Set(userLikes.map((l) => l.post_id));

    officialAnnouncements = rawOfficial.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      from: item.from,
      file: item.file,
      pengumuman: item.pengumuman,
      like: item.like,
      isLiked: likedSet.has(item.id.toString()),
      jenjang: item.jenjang,
      target_role: item.target_role,
      target_kelas: item.target_kelas,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }));
  } catch (e) {
    console.error("Database query error in guru official announcements:", e);
  }

  // 4. Ambil Pengumuman Saya / Kelas (dibuat oleh guru ini atau untuk kelas binaan wali kelas)
  let myClassAnnouncements: AnnouncementItem[] = [];
  try {
    const myClassConditions: Prisma.PengumumanWhereInput[] = [
      { from: guruName },
    ];

    if (guruClass) {
      myClassConditions.push({ from: guruClass });
      myClassConditions.push({ target_kelas: guruClass });
    }

    const rawMyClass = await prisma.pengumuman.findMany({
      where: {
        OR: myClassConditions,
      },
      orderBy: { id: "desc" },
    });

    const myClassIds = rawMyClass.map((item) => item.id.toString());
    const userLikesClass = await prisma.like.findMany({
      where: {
        user_id: session.id,
        post_id: { in: myClassIds },
      },
      select: { post_id: true },
    });
    const likedClassSet = new Set(userLikesClass.map((l) => l.post_id));

    myClassAnnouncements = rawMyClass.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      from: item.from,
      file: item.file,
      pengumuman: item.pengumuman,
      like: item.like,
      isLiked: likedClassSet.has(item.id.toString()),
      jenjang: item.jenjang,
      target_role: item.target_role,
      target_kelas: item.target_kelas,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }));
  } catch (e) {
    console.error("Database query error in guru class announcements:", e);
  }

  return (
    <GuruAnnouncementsClient
      officialAnnouncements={officialAnnouncements}
      myClassAnnouncements={myClassAnnouncements}
      guruName={guruName}
      guruClass={guruClass}
      isWaliKelas={isWaliKelas}
      guruJenjang={guruJenjang}
      classesTaught={classesTaught}
      allClasses={allClasses}
    />
  );
}
