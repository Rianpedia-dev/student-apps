"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Shield,
  Users,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminManagementTable, type AdminUserItem } from "./admin-table";
import { DemoSettingsCard } from "./demo-settings-card";
import type { DemoStats } from "@/services/demo-data.service";

interface ManageAdminsViewProps {
  admins: AdminUserItem[];
  currentUserId: string;
  isDemoEnabled: boolean;
  demoStats: DemoStats;
}

export function ManageAdminsView({
  admins,
  currentUserId,
  isDemoEnabled,
  demoStats,
}: ManageAdminsViewProps) {
  const [activeTab, setActiveTab] = useState("admins");

  const totalAdmin = admins.length;
  const superAdminCount = admins.filter((a) => a.jenjang === "ALL" || !a.jenjang).length;
  const adminSdCount = admins.filter((a) => a.jenjang === "SD").length;
  const adminSmpCount = admins.filter((a) => a.jenjang === "SMP").length;

  return (
    <div className="space-y-6">
      {/* Page Header with Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="amber" className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 shadow-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Super Administrator Portal
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Manajemen Akun Admin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola hak akses administrator per jenjang dan pengaturan akun percontohan demo.
          </p>
        </div>

        {/* Tab Switcher Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center p-1 bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("admins")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "admins"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-amber-500" />
              <span>Daftar Admin</span>
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 ml-0.5">
                {totalAdmin}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("demo")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "demo"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              <span>Pengaturan Demo</span>
              {isDemoEnabled && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content: Daftar Administrator */}
      {activeTab === "admins" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Admin */}
            <Card
              elevationSize="sm"
              enableHover
              className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border-border/60 shadow-sm"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Total Admin</span>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-foreground tracking-tight">{totalAdmin}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Semua akun admin aktif</div>
                </div>
              </CardContent>
            </Card>

            {/* Super Admin */}
            <Card
              elevationSize="sm"
              enableHover
              className="bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/20 shadow-sm"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Super Admin</span>
                  <div className="h-8 w-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
                    {superAdminCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Akses penuh SD & SMP</div>
                </div>
              </CardContent>
            </Card>

            {/* Admin SD */}
            <Card
              elevationSize="sm"
              enableHover
              className="bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 shadow-sm"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Admin SD</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                    {adminSdCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Scope data jenjang SD</div>
                </div>
              </CardContent>
            </Card>

            {/* Admin SMP */}
            <Card
              elevationSize="sm"
              enableHover
              className="bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 shadow-sm"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Admin SMP</span>
                  <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                    {adminSmpCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Scope data jenjang SMP</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Table Component */}
          <AdminManagementTable admins={admins} currentUserId={currentUserId} />
        </div>
      )}

      {/* Tab Content: Pengaturan Demo */}
      {activeTab === "demo" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <DemoSettingsCard initialDemoEnabled={isDemoEnabled} initialDemoStats={demoStats} />
        </div>
      )}
    </div>
  );
}
