import React, { Suspense } from "react";
import AuthSwitch from "@/components/auth/auth-switch";
import { PencilLoader } from "@/components/ui/loader-1";

export const metadata = {
  title: "Registrasi Pendidik",
  description: "Pendaftaran Akun Guru & Pendidik SD - SMP Islam Al-Azhar Cairo Palembang",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-emerald-900 gap-3">
          <PencilLoader size="md" />
          <p className="text-white text-xs font-medium tracking-wide">Memuat halaman registrasi...</p>
        </div>
      }
    >
      <AuthSwitch initialMode="signup" />
    </Suspense>
  );
}
