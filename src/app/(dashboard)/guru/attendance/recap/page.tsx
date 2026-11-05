import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveJenjang } from "@/lib/jenjang";
import { ArrowLeft, FileText, BookOpen } from "lucide-react";
import { RecapClient } from "./_components/recap-client";
import { getAcademicYear, formatClassDisplay } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parsePeriod(rawMonth?: string, rawYear?: string, now: Date = new Date()) {
  const m = parseInt(rawMonth ?? "", 10);
  const y = parseInt(rawYear ?? "", 10);
  return {
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : now.getMonth() + 1,
    year: Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : now.getFullYear(),
  };
}

export default async function GuruAttendanceRecapPage(props: {
  searchParams: Promise<{
    month?: string;
    year?: string;
    mapelId?: string;
    kelas?: string;
    view?: string;
    scope?: string;
  }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "guru" && session.role !== "admin")) {
    redirect("/login");
  }

  const activeJenjang = await getActiveJenjang(session);
  const isRestricted = activeJenjang !== "ALL";

  const guruId = BigInt(session.id);
  const {
    month: rawMonth,
    year: rawYear,
    mapelId: rawMapelId,
    kelas: rawKelas,
    view: rawView,
    scope: rawScope,
  } = await props.searchParams;
  const { month: selectedMonth, year: selectedYear } = parsePeriod(rawMonth, rawYear);

  // Ambil profil guru di database (untuk mengetahui status wali kelas, NIP, nama resmi)
  const dbUser = /^\d+$/.test(session.id)
    ? await prisma.user.findUnique({
        where: { id: guruId },
        select: { status: true, kelas: true, guru_bidang: true, name: true, nip: true },
      })
    : null;

  const currentStatus = dbUser?.status || session.status;
  const isWaliKelas = currentStatus === "4" || session.role === "admin";
  const teacherName = dbUser?.name || session.name || "Wali Kelas";
  const teacherNip = dbUser?.nip || "-";

  // Ambil daftar mapel & kelas yang diampu guru ini
  const schedules = await prisma.jadwalPelajaran.findMany({
    where: {
      ...(session.role === "guru" ? { guru_id: guruId } : {}),
      ...(isRestricted ? { kelas: { jenjang: activeJenjang } } : {}),
    },
    include: {
      mapel: true,
      kelas: true,
    },
    orderBy: { jam_mulai: "asc" },
  });

  const mapelMap = new Map();
  const classSet = new Set<string>();

  schedules.forEach((s) => {
    if (!mapelMap.has(s.mapel_id.toString())) {
      mapelMap.set(s.mapel_id.toString(), {
        id: s.mapel_id.toString(),
        nama: s.mapel.nama_mapel,
        kode: s.mapel.kode_mapel,
      });
    }
    classSet.add(s.kelas.nama_kelas);
  });

  const guruClass = dbUser?.kelas || session.kelas || "";
  const guruClassJenjang = guruClass && /SMP|Kelas (7|8|9)/i.test(guruClass) ? "SMP" : "SD";
  if (guruClass && (!isRestricted || guruClassJenjang === activeJenjang)) {
    classSet.add(guruClass);
  }

  // Jika admin, sertakan seluruh kelas yang ada dalam jangkauan jenjang
  if (session.role === "admin") {
    const allClasses = await prisma.kelas.findMany({
      where: isRestricted ? { jenjang: activeJenjang } : {},
      select: { nama_kelas: true },
    });
    allClasses.forEach((c) => classSet.add(c.nama_kelas));
  }

  const classList = Array.from(classSet).sort();

  // Tentukan kelas aktif dengan validasi ketat
  let activeClass = "";
  if (rawKelas && (session.role === "admin" || classList.includes(rawKelas))) {
    activeClass = rawKelas;
  } else if (guruClass && classList.includes(guruClass)) {
    activeClass = guruClass;
  } else if (classList.length > 0) {
    activeClass = classList[0];
  }

  // Cek apakah guru berhak sebagai Wali Kelas KHUSUS untuk activeClass terpilih
  const isClassWali =
    (currentStatus === "4" &&
      Boolean(guruClass) &&
      Boolean(activeClass) &&
      guruClass.trim().toLowerCase() === activeClass.trim().toLowerCase()) ||
    session.role === "admin";

  // Ambil daftar mapel KHUSUS yang diajarkan oleh guru di activeClass terpilih
  const classMapelMap = new Map<string, { id: string; nama: string; kode: string }>();

  schedules
    .filter((s) => s.kelas.nama_kelas.trim().toLowerCase() === activeClass.trim().toLowerCase())
    .forEach((s) => {
      const idStr = s.mapel_id.toString();
      if (!classMapelMap.has(idStr)) {
        classMapelMap.set(idStr, {
          id: idStr,
          nama: s.mapel.nama_mapel,
          kode: s.mapel.kode_mapel,
        });
      }
    });

  const classSpecificMapels = Array.from(classMapelMap.values());

  // Opsi khusus Rekap Harian Rombel untuk Wali Kelas
  const rombelOption = {
    id: "ROMBEL",
    nama: "⭐ Rekap Harian Kelas Rombel (Wali Kelas)",
    kode: "ROMBEL",
  };

  // PENTING: Opsi Rekap Rombel HANYA dimasukkan jika guru adalah wali kelas dari activeClass ini (atau admin)
  const fullMapelList = isClassWali
    ? [rombelOption, ...classSpecificMapels]
    : classSpecificMapels;

  // Tentukan default mapel:
  // - Wali kelas di kelas binaannya -> default "ROMBEL"
  // - Bukan wali kelas (hanya guru mapel) -> default ke mapel pertama yang diampu di kelas ini
  const defaultMapelId = isClassWali
    ? "ROMBEL"
    : (classSpecificMapels.length > 0 ? classSpecificMapels[0].id : "");

  // Sanitasi ketat: Cegah URL tampering (?mapelId=ROMBEL pada kelas bukan binaan)
  let activeMapelId = defaultMapelId;
  if (rawMapelId) {
    if (rawMapelId === "ROMBEL") {
      if (isClassWali) {
        activeMapelId = "ROMBEL";
      } else {
        // Blokir akses ROMBEL untuk kelas lain! Kembalikan ke default mapel
        activeMapelId = defaultMapelId;
      }
    } else if (classSpecificMapels.some((m) => m.id === rawMapelId)) {
      activeMapelId = rawMapelId;
    }
  }

  const isRombelMode = activeMapelId === "ROMBEL" && isClassWali;

  const selectedMapel = isRombelMode
    ? rombelOption
    : fullMapelList.find((m) => m.id === activeMapelId);

  // Tentukan identitas penandatangan untuk PDF
  let signerTeacherName = teacherName;
  let signerTeacherNip = teacherNip;

  if (isRombelMode && session.role === "admin") {
    // Jika admin mencetak rekap rombel kelas, ambil nama wali kelas resmi kelas tersebut dari database
    const realWaliUser = await prisma.user.findFirst({
      where: { kelas: activeClass, status: "4" },
      select: { name: true, nip: true },
    });
    if (realWaliUser) {
      signerTeacherName = realWaliUser.name;
      signerTeacherNip = realWaliUser.nip || "-";
    } else {
      const kelasDb = await prisma.kelas.findFirst({
        where: { nama_kelas: activeClass },
        select: { wali_kelas: true },
      });
      if (kelasDb?.wali_kelas) {
        signerTeacherName = kelasDb.wali_kelas;
        signerTeacherNip = "-";
      }
    }
  }

  const academic = getAcademicYear(new Date(selectedYear, selectedMonth - 1, 1));
  const isSemesterScope = !isRombelMode && rawScope === "semester";

  const thisYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => thisYear - 3 + i);

  let formattedStudents: any[] = [];
  let formattedAbsens: any[] = [];

  try {
    const monthPadded = String(selectedMonth).padStart(2, "0");

    // Filter mapel: jika mode ROMBEL, jangan filter mapel_id agar semua catatan terambil untuk di-rollup
    const mapelFilter = !isRombelMode && activeMapelId && /^\d+$/.test(activeMapelId)
      ? { mapel_id: BigInt(activeMapelId) }
      : {};

    const semMonthNums = academic.semesterNum === 1 ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    const dateFilter = isSemesterScope
      ? {
          OR: semMonthNums.flatMap((m) => {
            const mPad = String(m).padStart(2, "0");
            return [
              { date: { startsWith: `${selectedYear}-${mPad}-` } },
              { date: { startsWith: `${selectedYear}-${m}-` } },
              { month: String(m) },
            ];
          }),
        }
      : {
          OR: [
            { date: { startsWith: `${selectedYear}-${monthPadded}-` } },
            { date: { startsWith: `${selectedYear}-${selectedMonth}-` } },
            { month: String(selectedMonth) },
          ],
        };

    const [students, absens] = await Promise.all([
      activeClass
        ? prisma.user.findMany({
            where: { kelas: activeClass, status: "1" },
            orderBy: { name: "asc" },
          })
        : [],
      activeClass
        ? prisma.absen.findMany({
            where: {
              kelas: activeClass,
              ...mapelFilter,
              ...dateFilter,
            },
            select: {
              user_id: true,
              date: true,
              keterangan: true,
              mapel_id: true,
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
      mapel_id: a.mapel_id ? a.mapel_id.toString() : null,
    }));
  } catch (e) {
    console.error("Database query error in attendance recap:", e);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full px-2 sm:px-4 md:px-0">
      <div className="flex items-center justify-between">
        <Link
          href="/guru/attendance"
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Hub Presensi
        </Link>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Rekapitulasi Presensi
        </h1>
      </div>

      <RecapClient
        guruClass={activeClass}
        selectedMapelId={activeMapelId}
        selectedMapelNama={selectedMapel?.nama}
        mapelList={fullMapelList}
        classList={classList}
        tahunPelajaran={academic.tahunPelajaran}
        semester={academic.semester}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        availableYears={availableYears}
        students={formattedStudents}
        allAbsen={formattedAbsens}
        teacherName={signerTeacherName}
        teacherNip={signerTeacherNip}
        isWaliKelas={isWaliKelas}
        isClassWali={isClassWali}
        isRombelMode={isRombelMode}
        initialView={rawView === "matrix" ? "matrix" : "summary"}
        initialScope={isSemesterScope ? "semester" : "month"}
      />
    </div>
  );
}
