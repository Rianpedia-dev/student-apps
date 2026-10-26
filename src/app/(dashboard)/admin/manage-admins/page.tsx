import { redirect } from "next/navigation";
import { ShieldCheck, Shield, Users, UserCheck } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { AdminManagementTable, type AdminUserItem } from "./_components/admin-table";

export const metadata = {
  title: "Kelola Administrator • Student Apps Al-Azhar",
  description: "Manajemen hak akses dan akun administrator SD, SMP, dan Super Admin.",
};

export default async function ManageAdminsPage() {
  let session;
  try {
    session = await requireSuperAdmin();
  } catch {
    // Jika bukan super admin, redirect ke dashboard admin
    redirect("/admin");
  }

  const rawAdmins = await prisma.user.findMany({
    where: { status: "3" },
    select: {
      id: true,
      name: true,
      email: true,
      jenjang: true,
      gender: true,
      created_at: true,
    },
    orderBy: [
      { jenjang: "asc" },
      { name: "asc" },
    ],
  });

  const admins: AdminUserItem[] = rawAdmins.map((a) => ({
    id: a.id.toString(),
    name: a.name,
    email: a.email,
    jenjang: (a.jenjang as "SD" | "SMP" | "ALL") || "ALL",
    gender: a.gender,
    created_at: a.created_at ? a.created_at.toISOString() : null,
  }));

  const totalAdmin = admins.length;
  const superAdminCount = admins.filter((a) => a.jenjang === "ALL" || !a.jenjang).length;
  const adminSdCount = admins.filter((a) => a.jenjang === "SD").length;
  const adminSmpCount = admins.filter((a) => a.jenjang === "SMP").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/50 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Super Administrator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Manajemen Akun Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola hak akses dan peran administrator per jenjang (Super Admin, Admin SD, dan Admin SMP).
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Admin</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-foreground">{totalAdmin}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Semua akun admin aktif</div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              Super Admin
            </span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-purple-700 dark:text-purple-300">
            {superAdminCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Akses penuh SD & SMP</div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Admin SD
            </span>
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-emerald-700 dark:text-emerald-300">
            {adminSdCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Scope data jenjang SD</div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Admin SMP
            </span>
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-blue-700 dark:text-blue-300">
            {adminSmpCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Scope data jenjang SMP</div>
        </div>
      </div>

      {/* Admin Table Component */}
      <AdminManagementTable admins={admins} currentUserId={session.id} />
    </div>
  );
}
