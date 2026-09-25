"use client";

import React, { useState, useEffect, useActionState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loginDirectAction, demoLoginDirectAction, registerTeacherAction } from "@/actions/auth";
import { 
  AlAzharMosaicStrip, 
  AlAzharCornerMosaic, 
  IslamicMosaicPattern 
} from "@/components/ui/alazhar-patterns";
import { 
  Mail, 
  Lock, 
  User, 
  Key, 
  Smartphone, 
  GraduationCap, 
  BookOpen, 
  BadgeCheck, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from "lucide-react";

interface AuthSwitchProps {
  initialMode?: "signin" | "signup";
}

export default function AuthSwitch({ initialMode = "signin" }: AuthSwitchProps) {
  const searchParams = useSearchParams();
  const isRegisteredSuccess = searchParams.get("registered") === "1";

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");

  // Keep state synced with browser history if user navigates back/forward
  useEffect(() => {
    const handlePopState = () => {
      setIsSignUp(window.location.pathname.includes("register"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const switchToSignUp = () => {
    setIsSignUp(true);
    if (typeof window !== "undefined" && window.location.pathname !== "/register") {
      window.history.pushState(null, "", "/register");
    }
  };

  const switchToSignIn = () => {
    setIsSignUp(false);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.history.pushState(null, "", "/login");
    }
  };

  // --- Sign In State & Handlers ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loadingDemoRole, setLoadingDemoRole] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");

  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");

    if (!email.trim()) {
      setLoginError("Silakan masukkan email / username Anda");
      return;
    }
    if (!password) {
      setLoginError("Silakan masukkan password Anda");
      return;
    }

    setIsLoginLoading(true);

    try {
      const result = await loginDirectAction(email.trim(), password);
      if (!result.success) {
        setLoginError(result.error || "Password atau email Anda salah");
        setIsLoginLoading(false);
        return;
      }
      window.location.href = result.redirectPath || "/admin";
    } catch (err: any) {
      setLoginError(err?.message || "Terjadi kendala pada koneksi sistem.");
      setIsLoginLoading(false);
    }
  };

  const handleDemoLogin = async (
    role: "admin" | "guru" | "siswa" | "siswa1" | "siswa2" | "siswa3"
  ) => {
    setLoadingDemoRole(role);
    setLoginError("");

    try {
      const result = await demoLoginDirectAction(role);
      if (!result.success) {
        setLoginError(result.error || "Gagal masuk mode demo.");
        setLoadingDemoRole(null);
        return;
      }
      window.location.href =
        result.redirectPath || (role.startsWith("siswa") ? "/siswa" : `/${role}`);
    } catch (e: any) {
      setLoginError(e?.message || "Terjadi kesalahan saat masuk demo.");
      setLoadingDemoRole(null);
    }
  };

  // --- Sign Up (Teacher Registration) State & Form ---
  const [registerState, formAction, isRegisterPending] = useActionState(registerTeacherAction, null);

  const classListSD = [
    "Kelas 4 - Mehmed Al Fatih",
    "Kelas 4 - Sayfuddin Al Quthuz",
    "Kelas 4 - Sholahuddin Al Ayubi",
    "Kelas 4 - Sulaiman Al Qanuni",
    "Kelas 4 - Mushab bin Umair",
    "Kelas 5 - Al Bukhari",
    "Kelas 5 - Muslim",
    "Kelas 5 - Abu Daud",
    "Kelas 5 - Tirmidzi",
    "Kelas 5 - An Nasa'i",
    "Kelas 6 - Tholhah bin Ubaidillah",
    "Kelas 6 - Anas bin Malik",
    "Kelas 6 - Jabir bin Abdillah",
    "Kelas 6 - Mu'adz bin Jabal",
    "Kelas 6 - Urwah bin Zubair",
  ];

  const classListSMP = [
    "Kelas 7 - Ibnu Sina",
    "Kelas 7 - Al Khawarizmi",
    "Kelas 7 - Al Biruni",
    "Kelas 7 - Jabir Ibnu Hayyan",
    "Kelas 8 - Ibnu Khaldun",
    "Kelas 8 - Al Razi",
    "Kelas 8 - Al Kindi",
    "Kelas 8 - Ibnu Battuta",
    "Kelas 9 - Al Farabi",
    "Kelas 9 - Tariq bin Ziyad",
    "Kelas 9 - Salahuddin Al Ayyubi",
    "Kelas 9 - Umar bin Abdul Aziz",
  ];

  const isAnyLoginBusy = isLoginLoading || loadingDemoRole !== null;

  return (
    <div className="auth-switch">
      <style>{`
        .auth-switch,
        .auth-switch * {
          box-sizing: border-box;
        }

        .auth-switch {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #022018;
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 980px;
          min-height: 600px;
          background: #ffffff;
          border-radius: 26px;
          box-shadow: 0 25px 65px -15px rgba(2, 32, 24, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.25);
          overflow: hidden;
          z-index: 10;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 3.5rem;
          transition: all 0.2s 0.7s;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
          width: 100%;
        }

        form.sign-in-form {
          z-index: 2;
          max-width: 430px;
          margin: 0 auto;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
          max-width: 470px;
          margin: 0 auto;
          max-height: 560px;
          overflow-y: auto;
          padding-top: 1.5rem;
          padding-bottom: 2rem;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        form.sign-up-form::-webkit-scrollbar {
          width: 4px;
        }
        form.sign-up-form::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }

        .title {
          font-size: 1.85rem;
          color: #064e3b;
          margin-bottom: 4px;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-align: center;
        }

        .subtitle {
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 8px;
          text-align: center;
        }

        .input-field {
          max-width: 370px;
          width: 100%;
          background-color: #f1f5f9;
          margin: 6px 0;
          height: 48px;
          border-radius: 48px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          position: relative;
          transition: 0.3s;
          border: 1px solid transparent;
        }

        .input-field.compact {
          height: 42px;
          margin: 4px 0;
          border-radius: 42px;
          font-size: 0.88rem;
        }

        .input-field:focus-within {
          background-color: #ecfdf5;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
        }

        .input-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .input-field input,
        .input-field select {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 0.92rem;
          color: #0f172a;
          width: 100%;
          font-family: inherit;
        }

        .input-field select {
          cursor: pointer;
          appearance: none;
          background: transparent;
        }

        .input-field input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .btn {
          width: 160px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border: none;
          outline: none;
          height: 46px;
          border-radius: 46px;
          color: #fff;
          text-transform: uppercase;
          font-weight: 700;
          margin: 12px 0 8px 0;
          cursor: pointer;
          transition: 0.3s;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(5, 150, 105, 0.45);
        }

        .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 6;
          position: relative;
        }

        .left-panel {
          pointer-events: all;
          padding: 2.5rem 12% 2rem 8%;
        }

        .right-panel {
          pointer-events: none;
          padding: 2.5rem 8% 2rem 12%;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 7;
        }

        .panel h3 {
          font-weight: 800;
          line-height: 1.2;
          font-size: 1.55rem;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .panel p {
          font-size: 0.88rem;
          line-height: 1.5;
          opacity: 0.92;
          padding: 0.3rem 0 1rem 0;
          max-width: 300px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }

        .btn.transparent {
          margin: 0;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.9);
          width: 140px;
          height: 42px;
          font-weight: 700;
          font-size: 0.82rem;
          border-radius: 42px;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: all 0.3s;
        }

        .btn.transparent:hover {
          background: #ffffff;
          color: #047857;
          border-color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        /* Container Before Curved Overlay with Al-Azhar Dark Emerald Gradient */
        .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #059669 0%, #047857 45%, #064e3b 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
          box-shadow: 0 0 60px rgba(2, 32, 24, 0.45);
        }

        /* Sign-up Mode Transformations */
        .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        /* Demo Quick Access */
        .demo-roles-wrap {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .demo-roles-title {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .demo-roles-group {
          display: flex;
          gap: 7px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
        }

        .demo-badge:hover:not(:disabled) {
          background: #ecfdf5;
          border-color: #059669;
          color: #065f46;
          transform: translateY(-1px);
        }

        .demo-badge:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Alert notifications */
        .auth-alert {
          width: 100%;
          max-width: 370px;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          line-height: 1.35;
        }

        .auth-alert-danger {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .auth-alert-success {
          background-color: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        /* 2-column input row for sign-up */
        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
          max-width: 370px;
        }

        /* Media Queries */
        @media (max-width: 870px) {
          .container {
            min-height: 870px;
            height: auto;
          }
          .signin-signup {
            width: 100%;
            top: 92%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2rem 6%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            padding-right: 0;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .panel h3 {
            font-size: 1.2rem;
          }
          .panel p {
            font-size: 0.78rem;
            padding: 0.2rem 0;
          }
          .btn.transparent {
            width: 116px;
            height: 36px;
            font-size: 0.75rem;
          }
          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
          .container.sign-up-mode .signin-signup {
            top: 7%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          form {
            padding: 0 1.2rem;
          }
          .panel .content {
            padding: 0.5rem 0.5rem;
          }
          .input-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>

      {/* Background Kampus Al-Azhar Cairo (bc.avif) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <Image
          src="/bc.avif"
          alt="Latar Belakang Gedung Kampus Al-Azhar Cairo Palembang"
          fill
          priority
          quality={90}
          className="object-cover object-center"
        />

        {/* Emerald & Dark Sapphire Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/80 via-emerald-900/65 to-slate-950/80 backdrop-blur-[1.5px]" />

        {/* Ambient Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,32,24,0.70)_100%)]" />

        {/* Subtle Islamic Geometric Tessellation Texture */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay">
          <IslamicMosaicPattern />
        </div>
      </div>

      {/* Main Interactive Card Container */}
      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        {/* Corner Mosaics from Sidebar (Top Corners of Card) */}
        <AlAzharCornerMosaic className="absolute top-0 right-0 w-32 sm:w-40 h-20 sm:h-24 opacity-85 z-20 pointer-events-none" />
        <AlAzharCornerMosaic className="absolute top-0 left-0 w-32 sm:w-40 h-20 sm:h-24 opacity-85 z-20 pointer-events-none -scale-x-100" />

        {/* Bottom Colorful Triangular Prism Mosaic Strip (Mirrors Sidebar Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden pointer-events-none border-t border-slate-200/50">
          <AlAzharMosaicStrip className="h-3.5 sm:h-4 w-full opacity-95" />
        </div>

        <div className="forms-container">
          <div className="signin-signup">
            {/* ================= FORM SIGN IN ================= */}
            <form className="sign-in-form" onSubmit={handleSignInSubmit}>
              <div className="flex flex-col items-center mb-1">
                {/* Official Circular Logo with Gold Accent */}
                <div className="relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-full overflow-hidden p-1 border-2 border-amber-500/40 bg-white shadow-md mb-2">
                  <Image
                    src="/images/logo-alazhar-cairo.avif"
                    alt="Logo Al-Azhar Cairo Palembang"
                    width={72}
                    height={72}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
                <h2 className="title">Masuk Akun</h2>
                <p className="subtitle">Portal Sistem Sekolah Terpadu Al-Azhar</p>
                {/* Colorful Mosaic Accent Pill */}
                <div className="w-24 h-1.5 rounded-full overflow-hidden mb-3 shadow-sm">
                  <AlAzharMosaicStrip className="h-full w-full" />
                </div>
              </div>

              {isRegisteredSuccess && (
                <div className="auth-alert auth-alert-success">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>Pendaftaran Berhasil! Silakan hubungi Tim IT untuk verifikasi akun.</span>
                </div>
              )}

              {loginError && (
                <div className="auth-alert auth-alert-danger">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="input-field">
                <div className="input-icon">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Email / Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAnyLoginBusy}
                  autoFocus={!isSignUp}
                />
              </div>

              <div className="input-field">
                <div className="input-icon">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnyLoginBusy}
                />
              </div>

              <button type="submit" className="btn" disabled={isAnyLoginBusy}>
                {isLoginLoading ? "Memproses..." : "Masuk"}
                {!isLoginLoading && <ArrowRight size={16} />}
              </button>

              {/* Akses Cepat Demo */}
              <div className="demo-roles-wrap">
                <span className="demo-roles-title">Akses Cepat Demo</span>
                <div className="demo-roles-group">
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("admin")}
                    className="demo-badge"
                  >
                    <ShieldCheck size={13} className="text-emerald-700" />
                    {loadingDemoRole === "admin" ? "..." : "Admin"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("guru")}
                    className="demo-badge"
                  >
                    <GraduationCap size={13} className="text-emerald-700" />
                    {loadingDemoRole === "guru" ? "..." : "Guru"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("siswa1")}
                    className="demo-badge"
                    title="Masuk sebagai Muhammad Rayhan"
                  >
                    <BookOpen size={13} className="text-emerald-700" />
                    {loadingDemoRole === "siswa1" ? "..." : "Rayhan"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("siswa2")}
                    className="demo-badge"
                    title="Masuk sebagai Khalid Al-Ghazi"
                  >
                    <BookOpen size={13} className="text-emerald-700" />
                    {loadingDemoRole === "siswa2" ? "..." : "Khalid"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("siswa3")}
                    className="demo-badge"
                    title="Masuk sebagai Zahra Salsabila"
                  >
                    <BookOpen size={13} className="text-emerald-700" />
                    {loadingDemoRole === "siswa3" ? "..." : "Zahra"}
                  </button>
                </div>
              </div>
            </form>

            {/* ================= FORM SIGN UP (TEACHER) ================= */}
            <form className="sign-up-form" action={formAction}>
              <div className="flex flex-col items-center mb-1">
                <h2 className="title" style={{ fontSize: "1.7rem" }}>Registrasi Guru</h2>
                <p className="subtitle">Pendaftaran Akun Pendidik Baru Al-Azhar</p>
                {/* Colorful Mosaic Accent Pill */}
                <div className="w-24 h-1.5 rounded-full overflow-hidden mb-2.5 shadow-sm">
                  <AlAzharMosaicStrip className="h-full w-full" />
                </div>
              </div>

              {registerState?.error && (
                <div className="auth-alert auth-alert-danger">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{registerState.error}</span>
                </div>
              )}

              <div className="input-field compact">
                <div className="input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nama Lengkap & Gelar"
                  required
                  disabled={isRegisterPending}
                />
              </div>

              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    type="text"
                    name="email"
                    placeholder="Username Elearning"
                    required
                    disabled={isRegisterPending}
                  />
                </div>
                <div className="input-field compact">
                  <div className="input-icon">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password Elearning"
                    required
                    minLength={6}
                    disabled={isRegisterPending}
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <Smartphone size={16} />
                  </div>
                  <input
                    type="text"
                    name="appleid"
                    placeholder="Apple ID"
                    required
                    disabled={isRegisterPending}
                  />
                </div>
                <div className="input-field compact">
                  <div className="input-icon">
                    <Key size={16} />
                  </div>
                  <input
                    type="password"
                    name="passwordappleid"
                    placeholder="Password Apple ID"
                    required
                    disabled={isRegisterPending}
                  />
                </div>
              </div>

              <div className="input-field compact">
                <div className="input-icon">
                  <GraduationCap size={16} />
                </div>
                <select name="kelas" defaultValue="" disabled={isRegisterPending}>
                  <option value="" disabled>Wali Kelas / Kosongkan jika bukan</option>
                  <option value="Bukan Wali Kelas">Bukan Wali Kelas (Guru Bidang Studi)</option>
                  <optgroup label="── Sekolah Dasar (SD) ──">
                    {classListSD.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Sekolah Menengah Pertama (SMP) ──">
                    {classListSMP.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown size={14} className="text-slate-400 ml-auto pointer-events-none" />
              </div>

              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <BookOpen size={16} />
                  </div>
                  <input
                    type="text"
                    name="bidang"
                    placeholder="Bidang Studi"
                    required
                    disabled={isRegisterPending}
                  />
                </div>
                <div className="input-field compact">
                  <div className="input-icon">
                    <BadgeCheck size={16} />
                  </div>
                  <input
                    type="text"
                    name="nip"
                    placeholder="NIP (Opsional)"
                    disabled={isRegisterPending}
                  />
                </div>
              </div>

              <div className="input-field compact">
                <div className="input-icon">
                  <Users size={16} />
                </div>
                <select name="gender" defaultValue="" required disabled={isRegisterPending}>
                  <option value="" disabled>Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
                <ChevronDown size={14} className="text-slate-400 ml-auto pointer-events-none" />
              </div>

              <button type="submit" className="btn" disabled={isRegisterPending}>
                {isRegisterPending ? "Mendaftarkan..." : "Daftar Akun"}
                {!isRegisterPending && <ArrowRight size={16} />}
              </button>
            </form>
          </div>
        </div>

        {/* ================= PANELS CONTAINER ================= */}
        <div className="panels-container">
          {/* Panel Kiri (Terlihat saat Sign In, mengajak ke Sign Up) */}
          <div className="panel left-panel">
            <div className="content">
              {/* Logo Resmi Al-Azhar Cairo Palembang */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-2xl border-2 border-amber-400/50 mb-3.5 bg-white p-2 backdrop-blur-md group transition-transform duration-300 hover:scale-105 flex items-center justify-center">
                <Image
                  src="/logo-alazhar-cairo.avif"
                  alt="Logo Al-Azhar Cairo Palembang"
                  width={96}
                  height={96}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <h3>Pendidik Baru?</h3>
              <p>
                Bergabunglah bersama keluarga besar Al-Azhar Cairo Palembang. Daftarkan akun pendidik Anda dalam beberapa langkah mudah.
              </p>
              <button
                type="button"
                className="btn transparent"
                onClick={switchToSignUp}
              >
                Daftar Guru
              </button>
            </div>
          </div>

          {/* Panel Kanan (Terlihat saat Sign Up, mengajak ke Sign In) */}
          <div className="panel right-panel">
            <div className="content">
              {/* Logo Resmi Al-Azhar Cairo Palembang */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-2xl border-2 border-amber-400/50 mb-3.5 bg-white p-2 backdrop-blur-md group transition-transform duration-300 hover:scale-105 flex items-center justify-center">
                <Image
                  src="/logo-alazhar-cairo.avif"
                  alt="Logo Al-Azhar Cairo Palembang"
                  width={96}
                  height={96}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <h3>Sudah Punya Akun?</h3>
              <p>
                Selamat datang kembali! Masuk ke portal sistem terpadu untuk mengakses layanan dan pembelajaran.
              </p>
              <button
                type="button"
                className="btn transparent"
                onClick={switchToSignIn}
              >
                Masuk Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
