import React, { Suspense } from "react";
import AuthSwitch from "@/components/features/auth/auth-switch";
import { PencilLoader } from "@/components/ui/loader-1";
import { SystemSettingService } from "@/services/system-setting.service";

export const metadata = {
  title: "Masuk Akun",
  description: "Portal Sistem Sekolah Terpadu SD - SMP Islam Al-Azhar Cairo Palembang",
};

export default async function LoginPage() {
  const isDemoEnabled = await SystemSettingService.isDemoModeEnabled();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-emerald-900 gap-3">
          <PencilLoader size="md" />
          <p className="text-white text-xs font-medium tracking-wide">Memuat halaman masuk...</p>
        </div>
      }
    >
      <AuthSwitch initialMode="signin" isDemoEnabled={isDemoEnabled} />
    </Suspense>
  );
}

