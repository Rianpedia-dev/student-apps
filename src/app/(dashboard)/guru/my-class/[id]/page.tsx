import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  ArrowLeft,
  ShieldAlert,
  Mail,
  Hash,
  GraduationCap,
  User,
  Tablet,
  MapPin,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";

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

  try {
    const isNum = /^\d+$/.test(id);
    if (isNum) {
      student = await prisma.user.findUnique({
        where: { id: BigInt(id) },
      });
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

            {/* Poin Reward Badge */}
            <div className="self-start sm:self-auto shrink-0">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold">Poin Reward: {student.point || "0"}</span>
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
    </div>
  );
}
