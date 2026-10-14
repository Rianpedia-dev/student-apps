import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft, FileText } from "lucide-react";
import { RecapClient } from "./_components/recap-client";
import { getAcademicYear } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Membaca periode (bulan/tahun) dari URL dengan validasi rentang.
 * Nilai yang tidak valid dikembalikan ke default: bulan & tahun berjalan.
 */
function parsePeriod(rawMonth?: string, rawYear?: string, now: Date = new Date()) {
  const m = parseInt(rawMonth ?? "", 10);
  const y = parseInt(rawYear ?? "", 10);
  return {
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : now.getMonth() + 1,
    year: Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : now.getFullYear(),
  };
}

export default async function GuruAttendanceRecapPage(props: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const { month: rawMonth, year: rawYear } = await props.searchParams;
  const { month: selectedMonth, year: selectedYear } = parsePeriod(rawMonth, rawYear);

  const guruClass = session.kelas || "";
  const academic = getAcademicYear();

  // Rentang pilihan tahun: 3 tahun ke belakang sampai 1 tahun ke depan.
  const thisYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => thisYear - 3 + i);

  let formattedStudents: any[] = [];
  let formattedAbsens: any[] = [];

  try {
    const monthPadded = String(selectedMonth).padStart(2, "0");

    const [students, absens] = await Promise.all([
      guruClass
        ? prisma.user.findMany({
            where: { kelas: guruClass, status: "1" },
            orderBy: { name: "asc" },
          })
        : [],
      // Hanya ambil baris pada periode terpilih, bukan seluruh riwayat.
      // `date` disimpan sebagai string "YYYY-MM-DD", namun data warisan ada
      // yang tanpa padding ("YYYY-M-D"), sehingga kedua variasi prefix dicakup.
      // Tahun selalu ikut difilter agar data lintas tahun tidak tercampur.
      guruClass
        ? prisma.absen.findMany({
            where: {
              kelas: guruClass,
              OR: [
                { date: { startsWith: `${selectedYear}-${monthPadded}-` } },
                { date: { startsWith: `${selectedYear}-${selectedMonth}-` } },
              ],
            },
          })
        : [],
    ]);

    formattedStudents = students.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      nis: s.nis,
      gender: s.gender,
      email: s.email,
      status: s.status,
    }));

    formattedAbsens = absens.map((a) => ({
      user_id: a.user_id.toString(),
      date: a.date || "",
      keterangan: a.keterangan || "Hadir",
    }));
  } catch (e) {
    console.error("Database query error in attendance recap:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/guru/attendance"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Presensi
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekapitulasi Presensi & Export PDF</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate dokumen resmi rekap kehadiran bulanan kelas {guruClass} format PDF (Landscape A4).
        </p>
      </div>

      <RecapClient
        guruClass={guruClass}
        tahunPelajaran={academic.tahunPelajaran}
        semester={academic.semester}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        availableYears={availableYears}
        students={formattedStudents}
        allAbsen={formattedAbsens}
      />
    </div>
  );
}
