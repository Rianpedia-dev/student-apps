import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Hash,
  GraduationCap,
  User,
  Tablet,
  MapPin,
  UserCheck,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDateIndo } from "@/lib/utils";
import { parseViolationKeterangan, VIOLATION_SEVERITY_CONFIG } from "@/lib/constants/violations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GuruStudentDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "guru") {
    redirect("/login");
  }

  const { id } = await props.params;

  let student: any = null;
  let studentViolations: any[] = [];

  try {
    const isNum = /^\d+$/.test(id);
    if (isNum) {
      const [dbStudent, dbViolations] = await Promise.all([
        prisma.user.findUnique({
          where: { id: BigInt(id) },
        }),
        prisma.pelanggaran.findMany({
          where: { user_id: id },
          orderBy: [{ created_at: "desc" }, { id: "desc" }],
        }),
      ]);
      student = dbStudent;
      studentViolations = dbViolations;
    }
  } catch (e) {
    console.warn("DB error in guru student detail:", e);
  }

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header Back & Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/guru/my-class"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Kelas Saya
        </Link>
        <Link href="/guru/violations">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Buku Kedisiplinan</span>
          </Button>
        </Link>
      </div>

      {/* Info Card Profil Siswa */}
      <Card className="border-border shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Header Profil (Avatar, Nama, Kelas, Poin Reward) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl overflow-hidden border-2 border-emerald-500/20 bg-muted shadow-xs">
                <UserAvatar
                  src={student.image}
                  gender={student.gender}
                  name={student.name}
                  alt={student.name}
                  className="h-full w-full object-cover"
                  previewable={true}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {student.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Grid Informasi Rapi & Terstruktur */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            {/* Baris 1: Identitas Pokok (NIS, Kelas, Jenis Kelamin) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* NIS */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background border border-border/60 text-muted-foreground shrink-0 mt-0.5">
                  <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">NIS</span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground font-mono block truncate">
                    {student.nis || "-"}
                  </span>
                </div>
              </div>

              {/* Kelas */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background border border-border/60 text-muted-foreground shrink-0 mt-0.5">
                  <GraduationCap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">Kelas</span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground block truncate">
                    {student.kelas || "-"}
                  </span>
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background border border-border/60 text-muted-foreground shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">Jenis Kelamin</span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground block truncate">
                    {student.gender === "L"
                      ? "Laki-laki"
                      : student.gender === "P"
                      ? "Perempuan"
                      : student.gender || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Baris 2: Akun Digital (Email & Apple ID - 2 Kolom Lebar agar teks email tidak terpotong) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background border border-border/60 text-muted-foreground shrink-0 mt-0.5">
                  <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">Email Akun</span>
                  <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 block font-mono break-all sm:break-normal">
                    {student.email || "-"}
                  </span>
                </div>
              </div>

              {/* Apple ID */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background border border-border/60 text-muted-foreground shrink-0 mt-0.5">
                  <Tablet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">Apple ID (iPad)</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground block font-mono break-all sm:break-normal">
                    {student.appleid || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Baris 3: Alamat Tempat Tinggal (jika ada) */}
            {student.address && (
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background border border-border/60 text-muted-foreground shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">Alamat Tempat Tinggal</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground block leading-relaxed">
                    {student.address}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histori Catatan Kedisiplinan Siswa (Wali Kelas Monitoring) */}
      <Card className="border-border shadow-xs overflow-hidden rounded-2xl bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <CardTitle className="text-sm font-bold">
                Riwayat Catatan Kedisiplinan Siswa
              </CardTitle>
            </div>
            <Badge
              variant={studentViolations.length === 0 ? "emerald" : "outline"}
              size="sm"
              className="text-[10px] font-semibold"
            >
              {studentViolations.length === 0 ? "Rekam Jejak Bersih" : `${studentViolations.length} Catatan`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {studentViolations.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Alhamdulillah, Rekam Jejak Siswa Bersih
              </p>
              <p className="text-[11px] text-muted-foreground">
                Belum ada catatan pelanggaran kedisiplinan yang tercatat untuk {student.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentViolations.map((v) => {
                const parsed = parseViolationKeterangan(v.keterangan, v.tingkatan);
                const severity = (v.tingkatan || parsed.severity || "RINGAN").toUpperCase() as "RINGAN" | "SEDANG" | "BERAT";
                const sevConfig = VIOLATION_SEVERITY_CONFIG[severity] || VIOLATION_SEVERITY_CONFIG.RINGAN;

                return (
                  <div
                    key={v.id.toString()}
                    className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">
                          {v.kategori || "Pelanggaran"}
                        </span>
                        <Badge variant={sevConfig.badgeVariant} size="sm" className="text-[10px]">
                          {sevConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {v.semester && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-primary" />
                            <span>{v.semester}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateIndo(v.created_at)}</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-foreground leading-relaxed">
                      {parsed.cleanKeterangan || v.keterangan}
                    </p>

                    {v.guru_nama && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Dicatat oleh: <strong className="text-foreground">{v.guru_nama}</strong></span>
                        {v.kelas && <span className="ml-auto">Kelas saat kejadian: <strong>{v.kelas}</strong></span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
