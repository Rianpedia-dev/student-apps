import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ClassDetailClient } from "./_components/class-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminClassDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let kelas: any = null;
  let students: any[] = [];
  let wali: any = null;

  try {
    const isNum = /^\d+$/.test(id);
    if (isNum) {
      kelas = await prisma.kelas.findUnique({
        where: { id: BigInt(id) },
      });
    }
    if (kelas) {
      students = await prisma.user.findMany({
        where: {
          kelas: kelas.nama_kelas,
          status: "1",
        },
        orderBy: { name: "asc" },
      });
      if (kelas.wali_kelas) {
        wali = await prisma.user.findFirst({
          where: { name: kelas.wali_kelas },
        });
      }
    }
  } catch (e) {
    console.error("Database query error in class detail:", e);
  }

  if (!kelas) {
    notFound();
  }

  const serializedKelas = {
    id: kelas.id.toString(),
    nama_kelas: kelas.nama_kelas,
    jenjang: kelas.jenjang,
    tingkat: kelas.tingkat,
    wali_kelas: kelas.wali_kelas,
    code_restrict: kelas.code_restrict,
    jumlah_siswa: kelas.jumlah_siswa,
  };

  const serializedWali = wali
    ? {
        name: wali.name,
        email: wali.email,
      }
    : null;

  const serializedStudents = students.map((s) => ({
    id: s.id.toString(),
    name: s.name,
    nis: s.nis || null,
    gender: s.gender || null,
    email: s.email,
    appleid: s.appleid || null,
    passwordappleid: s.passwordappleid || null,
    point: s.point || "0",
  }));

  return (
    <ClassDetailClient
      kelas={serializedKelas}
      wali={serializedWali}
      students={serializedStudents}
      classId={id}
    />
  );
}
