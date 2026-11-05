import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Sparkles, ShieldAlert, ShieldCheck, ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateIndo } from "@/lib/utils";
import { parseViolationKeterangan, VIOLATION_SEVERITY_CONFIG } from "@/lib/constants/violations";
import { SiswaProfileForm } from "@/components/features/profile/siswa-profile-form";

export const dynamic = "force-dynamic";

export default async function SiswaProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "siswa") {
    redirect("/login");
  }

  let student: any = null;
  let myAchievements: any[] = [];
  let myViolations: any[] = [];
  let totalViolationsCount = 0;

  try {
    const isNum = /^\d+$/.test(session.id);
    const [dbStudent, dbAchieve, dbViolations] = await Promise.all([
      isNum
        ? prisma.user.findUnique({
            where: { id: BigInt(session.id) },
          })
        : null,
      prisma.prestasi.findMany({
        where: {
          OR: [
            { id_user: session.id },
            ...(session.name ? [{ nama: session.name }] : []),
          ],
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
      prisma.pelanggaran.findMany({
        where: {
          OR: [
            { user_id: session.id },
            ...(session.name ? [{ nama: session.name }] : []),
          ],
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      }),
    ]);
    student = dbStudent;
    myAchievements = dbAchieve;
    const totalPrestasiPoints = (dbAchieve || []).reduce((acc, ach) => acc + (ach.poin || 1), 0);
    myViolations = dbViolations;
    totalViolationsCount = dbViolations.length;
  } catch (e) {
    console.error("Database query error in siswa profile:", e);
  }

  if (!student) {
    student = {
      id: session.id,
      name: session.name || "Siswa",
      email: session.email || "",
      nis: session.nis || "-",
      kelas: session.kelas || "-",
      gender: null,
      status: session.status || "1",
      point: "0",
      address: "",
      skills: "",
      notes: "",
      image: session.image || null,
    };
  }

  const formattedStudent = {
    id: student.id ? student.id.toString() : session.id,
    name: student.name || "",
    email: student.email || "",
    nis: student.nis || null,
    kelas: student.kelas || null,
    gender: student.gender || null,
    address: student.address || null,
    skills: student.skills || null,
    notes: student.notes || null,
    image: student.image || null,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Siswa</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Kelola data diri, pantau riwayat prestasi, dan histori kedisiplinan siswa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card & Edit Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-2xl overflow-hidden rounded-3xl card-elevation">
            <SiswaProfileForm student={formattedStudent} />
          </Card>
        </div>

        {/* Sidebar Info: Prestasi & Catatan Kedisiplinan (1 Col) */}
        <div className="space-y-6">
          {/* 1. Catatan Kedisiplinan Siswa (Requirement Profil) */}
          <Card className="shadow-2xl rounded-3xl card-elevation overflow-hidden border border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  <CardTitle className="text-sm font-bold">Catatan Kedisiplinan</CardTitle>
                </div>
                <Badge
                  variant={totalViolationsCount === 0 ? "emerald" : "outline"}
                  size="sm"
                  className="text-[10px] font-semibold"
                >
                  {totalViolationsCount === 0 ? "Bersih" : `${totalViolationsCount} Catatan`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {totalViolationsCount === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Alhamdulillah, Catatan Bersih!
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tidak ada catatan pelanggaran kedisiplinan yang terdaftar atas nama Anda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myViolations.slice(0, 3).map((v) => {
                    const parsed = parseViolationKeterangan(v.keterangan, v.tingkatan);
                    const severity = (v.tingkatan || parsed.severity || "RINGAN").toUpperCase() as "RINGAN" | "SEDANG" | "BERAT";
                    const sevConfig = VIOLATION_SEVERITY_CONFIG[severity] || VIOLATION_SEVERITY_CONFIG.RINGAN;

                    return (
                      <div
                        key={v.id.toString()}
                        className="rounded-2xl p-3 text-xs bg-muted/40 border border-border/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-foreground truncate text-xs">
                            {v.kategori || "Pelanggaran"}
                          </span>
                          <Badge variant={sevConfig.badgeVariant} size="sm" className="text-[9px]">
                            {sevConfig.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-foreground/80 line-clamp-2">
                          {parsed.cleanKeterangan || v.keterangan}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>{v.kelas || "-"}</span>
                          <span>{formatDateIndo(v.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href="/siswa/violations"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-muted/50 hover:bg-muted text-xs font-semibold text-primary transition-colors border border-border/40 mt-1"
              >
                <span>Lihat Riwayat & Filter Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* 2. Prestasi Saya */}
          <Card className="shadow-2xl rounded-3xl card-elevation border border-border/70">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold">Prestasi Saya</CardTitle>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {myAchievements.reduce((acc, ach) => acc + (ach.poin || 1), 0)} Poin
              </span>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-3">
              {myAchievements.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 italic">
                  Belum ada catatan prestasi terdaftar.
                </p>
              ) : (
                myAchievements.map((ach) => (
                  <div
                    key={ach.id.toString()}
                    className="rounded-2xl p-3 text-xs glass-subpanel shadow-2xs space-y-1.5 border border-border/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span>🏆</span>
                        <span className="line-clamp-1">{ach.prestasi}</span>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 shrink-0">
                        +{ach.poin ?? 1} Poin
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {ach.tingkat || "Sekolah"} • {ach.peringkat || "Juara"}
                      </span>
                      <span>•</span>
                      <span>Saat di {ach.kelas_saat_prestasi || ach.kelas}</span>
                      {ach.created_at && (
                        <>
                          <span>•</span>
                          <span>{formatDateIndo(ach.created_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
