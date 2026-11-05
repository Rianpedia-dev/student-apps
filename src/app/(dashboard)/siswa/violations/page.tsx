import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseViolationKeterangan } from "@/lib/constants/violations";
import { StudentViolationsClient } from "./_components/student-violations-client";
import type { ViolationItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function SiswaViolationsPage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  let dbViolations: any[] = [];
  let studentUser: {
    name: string;
    point: string | null;
    nis: string | null;
    kelas: string | null;
    image: string | null;
    gender: string | null;
  } | null = null;

  try {
    const isNum = /^\d+$/.test(session.id);
    const [violationsData, userData] = await Promise.all([
      prisma.pelanggaran.findMany({
        where: {
          OR: [
            { user_id: session.id },
            ...(session.name ? [{ nama: session.name }] : []),
          ],
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
      isNum
        ? prisma.user.findUnique({
            where: { id: BigInt(session.id) },
            select: {
              name: true,
              point: true,
              nis: true,
              kelas: true,
              image: true,
              gender: true,
            },
          })
        : null,
    ]);

    dbViolations = violationsData;
    studentUser = userData;
  } catch (e) {
    console.warn("DB error in violations, returning empty list:", e);
  }

  const violations: ViolationItem[] = dbViolations.map((vl) => {
    const parsed = parseViolationKeterangan(vl.keterangan, vl.tingkatan);
    return {
      id: vl.id.toString(),
      user_id: vl.user_id,
      nama: vl.nama || studentUser?.name || "Siswa",
      kelas: vl.kelas || studentUser?.kelas || "",
      kategori: vl.kategori || "Pelanggaran Umum",
      keterangan: vl.keterangan,
      created_at: vl.created_at,
      status: parsed.status,
      severity: parsed.severity,
      points: parsed.points,
      cleanKeterangan: parsed.cleanKeterangan,
      tindakan: parsed.tindakan,
      // Database fields
      tingkatan: vl.tingkatan || parsed.severity,
      semester: vl.semester || null,
      tahun_pelajaran: vl.tahun_pelajaran || null,
      jenjang: vl.jenjang || null,
      guru_id: vl.guru_id ? vl.guru_id.toString() : null,
      guru_nama: vl.guru_nama || null,
    };
  });

  // Extract unique classes and semesters from student's historical violations
  const availableSemesters = Array.from(
    new Set(violations.map((v) => v.semester).filter((s): s is string => Boolean(s)))
  );

  const availableClasses = Array.from(
    new Set([
      ...(studentUser?.kelas ? [studentUser.kelas] : session.kelas ? [session.kelas] : []),
      ...violations.map((v) => v.kelas).filter((k): k is string => Boolean(k)),
    ])
  );

  return (
    <div className="space-y-5 sm:space-y-6 max-w-6xl mx-auto w-full px-1 sm:px-2 md:px-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Catatan Kedisiplinan Siswa
          </h1>
        </div>
      </div>

      {/* Interactive Client View: Search/Filter & List Catatan */}
      <StudentViolationsClient
        violations={violations}
        availableSemesters={availableSemesters}
        availableClasses={availableClasses}
      />
    </div>
  );
}
