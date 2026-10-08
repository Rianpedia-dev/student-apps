"use client";

import React, { useState, useEffect, useActionState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { loginDirectAction, demoLoginDirectAction, registerTeacherAction } from "@/actions/auth";
import { 
  AlAzharMosaicStrip, 
  AlAzharCornerMosaic, 
  IslamicMosaicPattern 
} from "@/components/shared/alazhar-patterns";
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
  ChevronDown,
  Eye,
  EyeOff
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegApplePassword, setShowRegApplePassword] = useState(false);
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
    role: "admin" | "guru" | "guru1" | "guru2" | "siswa" | "siswa1" | "siswa2" | "siswa3"
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
        result.redirectPath ||
        (role.startsWith("siswa") ? "/siswa" : role.startsWith("guru") ? "/guru" : `/${role}`);
    } catch (e: any) {
      setLoginError(e?.message || "Terjadi kesalahan saat masuk demo.");
      setLoadingDemoRole(null);
    }
  };

  // --- Sign Up (Teacher Registration) State & Form ---
  const [registerState, formAction, isRegisterPending] = useActionState(registerTeacherAction, null);

  const classListSD = [
    "Kelas 3 - Ibnu Hayyan",
    "Kelas 3 - Ibnu Rusyd",
    "Kelas 3 - Ibnu Nafis",
    "Kelas 3 - Ibnu Kholdun",
    "Kelas 3 - Ibnu Batutah",
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
          font-family: var(--font-plus-jakarta-sans), var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #022018;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 1040px;
          min-height: 620px;
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
          padding: 0 3rem;
          transition: all 0.2s 0.7s;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
          width: 100%;
        }

        form.sign-in-form {
          z-index: 2;
          max-width: 430px;
          margin: 0 auto;
          padding-bottom: 2rem;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          max-height: 590px;
          overflow-y: auto;
          padding: 1rem 1.25rem 2.25rem 1.25rem;
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
          font-size: 1.7rem;
          color: #064e3b;
          margin-bottom: 2px;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-align: center;
        }

        .subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 6px;
          text-align: center;
        }

        .input-field {
          max-width: 370px;
          width: 100%;
          background-color: #f8fafc;
          margin: 5px 0;
          height: 46px;
          border-radius: 46px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          position: relative;
          transition: 0.25s ease;
          border: 1px solid #e2e8f0;
        }

        .input-field:hover {
          border-color: #cbd5e1;
          background-color: #ffffff;
        }

        form.sign-up-form .input-field,
        form.sign-up-form .input-row {
          max-width: 440px;
          width: 100%;
        }

        .input-field.compact {
          height: 42px;
          margin: 3.5px 0;
          border-radius: 42px;
          padding: 0 0.85rem;
        }

        .input-field.compact input,
        .input-field.compact select {
          font-size: 0.84rem;
        }

        .input-field.compact input::placeholder {
          font-size: 0.81rem;
          letter-spacing: -0.01em;
          color: #94a3b8;
        }

        .input-field:focus-within {
          background-color: #ffffff;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
        }
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
          left: 27%;
          width: 54%;
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
          gap: 9px;
          width: 100%;
          max-width: 370px;
        }

        .signin-form-logo {
          display: none;
        }

        /* Media Queries */
        @media (max-width: 870px) {
          .container {
            max-width: 600px;
            min-height: 720px;
            height: auto;
            border-radius: 22px;
          }
          .signin-signup {
            width: 100%;
            top: 94%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
            width: 100%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 1.5rem 6%;
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
            font-size: 1.25rem;
            margin-bottom: 4px;
          }
          .panel p {
            font-size: 0.8rem;
            line-height: 1.4;
            padding: 0.2rem 0 0.6rem 0;
            max-width: 320px;
          }
          .btn.transparent {
            width: 124px;
            height: 36px;
            font-size: 0.78rem;
          }
          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 50%;
            bottom: 70%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            left: 50%;
            bottom: 30%;
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
            top: 4%;
            transform: translate(-50%, 0);
          }
          form.sign-in-form {
            padding-bottom: 2.2rem;
          }
          form.sign-up-form {
            max-height: 520px;
            padding: 1rem 1.25rem 2.2rem 1.25rem;
          }
        }

        @media (max-width: 570px) {
          .auth-switch {
            padding: 10px 8px;
          }
          .container {
            max-width: 100%;
            min-height: 600px;
            border-radius: 20px;
            box-shadow: 0 16px 40px -10px rgba(2, 32, 24, 0.55);
          }
          .container.sign-up-mode {
            min-height: 600px;
          }

          /* Gelombang Hijau di Mobile: Terbalik
             Saat Sign In: Berada di BAWAH
             Saat Sign Up: Meluncur NAIK ke ATAS */
          .container:before {
            width: 1200px;
            height: 1200px;
            left: 50%;
            transform: translate(-50%, 100%);
            bottom: 23%;
            right: initial;
            top: initial;
            transition: 1.6s ease-in-out;
          }
          .container.sign-up-mode:before {
            width: 1200px;
            height: 1200px;
            left: 50%;
            transform: translateX(-50%);
            bottom: 74%;
            right: initial;
            top: initial;
          }

          /* Form Container di Mobile:
             Saat Sign In: Form Masuk Akun berada di ATAS
             Saat Sign Up: Form Registrasi berada di BAWAH */
          .signin-signup {
            left: 50%;
            width: 100%;
            top: 2%;
            transform: translate(-50%, 0);
            height: calc(100% - 142px);
            transition: 1s 0.7s ease-in-out;
          }
          .container.sign-up-mode .signin-signup {
            left: 50%;
            width: 100%;
            top: 98%;
            transform: translate(-50%, -100%);
            height: calc(100% - 152px);
          }

          /* Panels Layout di Mobile:
             Saat Sign In: Left Panel (Pendidik Baru?) di BAWAH (row 3)
             Saat Sign Up: Right Panel (Sudah Punya Akun?) di ATAS (row 1) */
          .panels-container {
            pointer-events: none;
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr 140px;
          }
          .container.sign-up-mode .panels-container {
            grid-template-rows: 150px 1fr 1fr;
          }

          .panel {
            padding: 0.5rem 1rem;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .panel .content {
            padding: 0;
            gap: 2px;
            transition: transform 0.8s ease-in-out;
          }

          /* Left Panel (Pendidik Baru? Daftar Guru) */
          .left-panel {
            grid-row: 3 / 4;
            pointer-events: all;
            padding-bottom: 1.6rem;
          }
          .left-panel .content {
            transform: translateY(0);
          }
          .container.sign-up-mode .left-panel {
            pointer-events: none;
          }
          .container.sign-up-mode .left-panel .content {
            transform: translateY(300px);
          }

          /* Right Panel (Sudah Punya Akun? Masuk Akun) */
          .right-panel {
            grid-row: 1 / 2;
            pointer-events: none;
            padding-top: 1rem;
          }
          .right-panel .content {
            transform: translateY(-300px);
          }
          .container.sign-up-mode .right-panel {
            grid-row: 1 / 2;
            pointer-events: all;
            padding-top: 1rem;
          }
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0);
          }

          .left-panel .panel-logo {
            display: none !important;
          }

          .signin-form-logo {
            display: flex !important;
          }

          .panel h3 {
            font-size: 1.05rem;
            margin-bottom: 2px;
            font-weight: 800;
          }
          .panel p {
            display: none;
          }
          .btn.transparent {
            width: 110px;
            height: 30px;
            font-size: 0.72rem;
            margin-top: 2px;
          }
          form {
            padding: 0 0.85rem;
            width: 100%;
            max-width: 100%;
          }
          form.sign-in-form,
          form.sign-up-form {
            width: 100%;
            max-width: 100%;
          }
          form.sign-in-form {
            padding: 0.5rem 0.85rem 0.6rem 0.85rem;
            justify-content: center;
          }
          .title {
            font-size: 1.3rem;
            margin-bottom: 1px;
          }
          .subtitle {
            font-size: 0.72rem;
            margin-bottom: 3px;
          }
          .input-field {
            height: 38px;
            margin: 3.5px 0;
            border-radius: 38px;
            padding: 0 0.75rem;
            width: 100%;
            max-width: 100%;
          }
          .input-field.compact {
            height: 38px;
            margin: 3.5px 0;
            border-radius: 38px;
            padding: 0 0.7rem;
            width: 100%;
            max-width: 100%;
          }
          .input-icon {
            margin-right: 6px;
          }
          .input-icon svg {
            width: 14px;
            height: 14px;
          }
          .input-field input,
          .input-field select {
            font-size: 0.78rem;
          }
          .input-field input::placeholder {
            font-size: 0.73rem;
            letter-spacing: -0.01em;
          }
          .btn {
            height: 38px;
            width: 140px;
            font-size: 0.8rem;
            margin: 10px 0 3px 0;
          }
          .demo-roles-wrap {
            margin-top: 4px;
          }
          .demo-roles-title {
            font-size: 0.66rem;
            margin-bottom: 3px;
          }
          .demo-roles-group {
            gap: 4px;
          }
          .demo-badge {
            padding: 2.5px 7px;
            font-size: 0.68rem;
            gap: 3.5px;
          }
          .input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
            max-width: 100%;
            margin: 1px 0;
          }
          form.sign-up-form {
            height: 100%;
            max-height: 100%;
            overflow-y: auto;
            padding: 0.25rem 0.85rem 0.8rem 0.85rem;
            scrollbar-width: thin;
          }
          form.sign-up-form .input-field,
          form.sign-up-form .input-row {
            width: 100%;
            max-width: 100%;
          }
          form.sign-up-form .title {
            font-size: 1.25rem;
            white-space: nowrap;
            margin-bottom: 1px;
          }
          form.sign-up-form .subtitle {
            font-size: 0.7rem;
            margin-bottom: 3px;
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
        <AlAzharCornerMosaic className="absolute top-0 right-0 w-20 sm:w-32 md:w-40 h-14 sm:h-20 md:h-24 opacity-80 z-20 pointer-events-none" />
        <AlAzharCornerMosaic className="absolute top-0 left-0 w-20 sm:w-32 md:w-40 h-14 sm:h-20 md:h-24 opacity-80 z-20 pointer-events-none -scale-x-100" />

        {/* Bottom Colorful Triangular Prism Mosaic Strip (Mirrors Sidebar Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden pointer-events-none border-t border-slate-200/50">
          <AlAzharMosaicStrip className="h-5 sm:h-6 md:h-8 w-full opacity-100" />
        </div>

        <div className="forms-container">
          <div className="signin-signup">
            {/* ================= FORM SIGN IN ================= */}
            <form className="sign-in-form" onSubmit={handleSignInSubmit}>
              <div className="flex flex-col items-center mb-1">
                {/* Logo Resmi Al-Azhar Cairo (Tampil khusus di mobile di atas Masuk Akun) */}
                <div className="signin-form-logo relative w-12 h-12 mb-1.5 group transition-transform duration-300 hover:scale-105 flex sm:hidden items-center justify-center">
                  <Image
                    src="/images/logo-alazhar-cairo.avif"
                    alt="Logo Al-Azhar Cairo Palembang"
                    width={80}
                    height={80}
                    priority
                    className="h-full w-full object-contain drop-shadow-md"
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
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnyLoginBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 shrink-0 ml-auto transition-colors"
                  tabIndex={-1}
                  title={showLoginPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                    title="Masuk sebagai Administrator SDIA"
                  >
                    <ShieldCheck size={13} className="text-emerald-700" />
                    {loadingDemoRole === "admin" ? "..." : "Admin"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("guru")}
                    className="demo-badge"
                    title="Masuk sebagai Guru 1: Ustadzah Fatimah, S.Pd (Wali Kelas 4 SD)"
                  >
                    <GraduationCap size={13} className="text-emerald-700" />
                    {loadingDemoRole === "guru" || loadingDemoRole === "guru1" ? "..." : "Guru 1"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("guru2")}
                    className="demo-badge"
                    title="Masuk sebagai Guru 2: Ustadz Farhan, S.Pd (Wali Kelas 7 SMP)"
                  >
                    <GraduationCap size={13} className="text-emerald-700" />
                    {loadingDemoRole === "guru2" ? "..." : "Guru 2"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("siswa1")}
                    className="demo-badge"
                    title="Masuk sebagai Siswa: Muhammad Rayhan (Kelas 4 SD)"
                  >
                    <BookOpen size={13} className="text-emerald-700" />
                    {loadingDemoRole === "siswa1" ? "..." : "Rayhan"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("siswa2")}
                    className="demo-badge"
                    title="Masuk sebagai Siswa: Khalid Al-Ghazi (Kelas 4 SD)"
                  >
                    <BookOpen size={13} className="text-emerald-700" />
                    {loadingDemoRole === "siswa2" ? "..." : "Khalid"}
                  </button>
                  <button
                    type="button"
                    disabled={isAnyLoginBusy}
                    onClick={() => handleDemoLogin("siswa3")}
                    className="demo-badge"
                    title="Masuk sebagai Siswi: Zahra Salsabila (Kelas 4 SD)"
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
                <h2 className="title">Registrasi Guru</h2>
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

              {/* Row 1: Nama Lengkap & Gelar (Full Width) */}
              <div className="input-field compact">
                <div className="input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nama Lengkap & Gelar (Ustadz / Ustadzah)"
                  required
                  disabled={isRegisterPending}
                />
              </div>

              {/* Row 2: Kredensial Elearning (2 Kolom) */}
              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <Mail size={15} />
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
                    <Lock size={15} />
                  </div>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    required
                    minLength={6}
                    disabled={isRegisterPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 shrink-0 ml-auto transition-colors"
                    tabIndex={-1}
                    title={showRegPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Row 3: Kredensial iPad & Apple ID (2 Kolom) */}
              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <Smartphone size={15} />
                  </div>
                  <input
                    type="text"
                    name="appleid"
                    placeholder="Apple ID iPad"
                    required
                    disabled={isRegisterPending}
                  />
                </div>
                <div className="input-field compact">
                  <div className="input-icon">
                    <Key size={15} />
                  </div>
                  <input
                    type={showRegApplePassword ? "text" : "password"}
                    name="passwordappleid"
                    placeholder="Pass Apple ID"
                    required
                    disabled={isRegisterPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegApplePassword(!showRegApplePassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 shrink-0 ml-auto transition-colors"
                    tabIndex={-1}
                    title={showRegApplePassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showRegApplePassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Row 4: Bidang Studi & Wali Kelas (2 Kolom) */}
              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <BookOpen size={15} />
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
                    <GraduationCap size={15} />
                  </div>
                  <select name="kelas" defaultValue="" disabled={isRegisterPending}>
                    <option value="" disabled>Wali Kelas</option>
                    <option value="Bukan Wali Kelas">Bukan Wali Kelas</option>
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
                  <ChevronDown size={13} className="text-slate-400 ml-auto pointer-events-none shrink-0" />
                </div>
              </div>

              {/* Row 5: Jenis Kelamin & NIP (2 Kolom) */}
              <div className="input-row">
                <div className="input-field compact">
                  <div className="input-icon">
                    <Users size={15} />
                  </div>
                  <select name="gender" defaultValue="" required disabled={isRegisterPending}>
                    <option value="" disabled>Gender</option>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                  <ChevronDown size={13} className="text-slate-400 ml-auto pointer-events-none shrink-0" />
                </div>
                <div className="input-field compact">
                  <div className="input-icon">
                    <BadgeCheck size={15} />
                  </div>
                  <input
                    type="text"
                    name="nip"
                    placeholder="NIP (Opsional)"
                    disabled={isRegisterPending}
                  />
                </div>
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
              {/* Logo Resmi Al-Azhar Cairo Palembang (Disembunyikan di mobile agar rapi, dipindahkan ke atas Masuk Akun) */}
              <div className="panel-logo relative w-11 h-11 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 xl:w-40 xl:h-40 mb-1 sm:mb-2.5 md:mb-3.5 group transition-transform duration-300 hover:scale-105 hidden sm:flex items-center justify-center">
                <Image
                  src="/images/logo-alazhar-cairo.avif"
                  alt="Logo Al-Azhar Cairo Palembang"
                  width={160}
                  height={160}
                  priority
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>

              <h3>Pendidik Baru?</h3>
              <p>
                Daftarkan akun pendidik Anda bersama Al-Azhar Cairo.
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
              <div className="relative w-11 h-11 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 xl:w-40 xl:h-40 mb-1 sm:mb-2.5 md:mb-3.5 group transition-transform duration-300 hover:scale-105 flex items-center justify-center">
                <Image
                  src="/images/logo-alazhar-cairo.avif"
                  alt="Logo Al-Azhar Cairo Palembang"
                  width={160}
                  height={160}
                  priority
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>

              <h3>Sudah Punya Akun?</h3>
              <p className="hidden sm:block">
                Masuk ke portal sistem terpadu Al-Azhar Cairo.
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
