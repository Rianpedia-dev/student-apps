"use client";

import React from "react";
import Image from "next/image";
import LanyardBadge from "@/components/ui/lanyard-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AlAzharMosaicStrip } from "@/components/shared/alazhar-patterns";
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface ProfileLanyardBadgeProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    gender?: string | null;
    role: "siswa" | "guru";
    nis?: string | null; // Untuk siswa
    kelas?: string | null; // Untuk siswa / wali kelas
    nip?: string | null; // Untuk guru (NIY)
    guru_bidang?: string | null; // Untuk guru
    address?: string | null;
  };
  anchorRatio?: number;
  anchorTop?: number;
  buckleY?: number;
  height?: string;
  className?: string;
}

/**
 * Komponen IC Chip Logam Emas (seperti pada smart ID card fisik)
 */
function SmartChip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative w-7 h-5 rounded-[3px] bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 p-[1px] shadow-sm border border-amber-500/60 ${className}`}
      aria-hidden="true"
    >
      <div className="w-full h-full rounded-[2px] bg-gradient-to-br from-amber-400 via-amber-200 to-amber-500 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 border border-amber-800/25 rounded-[1px]" />
        <div className="w-full h-[0.8px] bg-amber-800/40" />
        <div className="h-full w-[0.8px] bg-amber-800/40 absolute" />
        <div className="w-2.5 h-2.5 rounded-full border border-amber-800/30 absolute" />
      </div>
    </div>
  );
}

/**
 * Barcode grafis realistis untuk sisi belakang kartu
 */
function BarcodeGraphic({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-center gap-[1.5px] h-6 px-1">
        {Array.from({ length: 32 }).map((_, i) => {
          const isThick = i % 3 === 0 || i % 7 === 0;
          return (
            <div
              key={i}
              className={`h-full bg-slate-900 dark:bg-slate-100 ${isThick ? "w-[2.2px]" : "w-[0.9px]"}`}
            />
          );
        })}
      </div>
      <span className="font-mono text-[8px] tracking-widest text-slate-700 dark:text-slate-300 mt-0.5 font-bold">
        *{code}*
      </span>
    </div>
  );
}

/**
 * Stempel verifikasi resmi melingkar Al-Azhar Cairo
 */
function OfficialStamp({ text = "AL-AZHAR", sub = "VERIFIED" }: { text?: string; sub?: string }) {
  return (
    <div className="w-11 h-11 rounded-full border border-emerald-600/50 dark:border-emerald-400/50 flex flex-col items-center justify-center text-[6px] font-black uppercase text-emerald-700 dark:text-emerald-400 rotate-[-10deg] select-none pointer-events-none p-0.5">
      <div className="w-full h-full rounded-full border border-dashed border-emerald-600/40 flex flex-col items-center justify-center text-center leading-none">
        <span className="text-[5.5px] tracking-tight">{text}</span>
        <span className="text-[7px] text-amber-600 dark:text-amber-400 my-0.2">★ ★ ★</span>
        <span className="text-[5.5px] tracking-widest">{sub}</span>
      </div>
    </div>
  );
}

export function ProfileLanyardBadge({
  user,
  anchorRatio,
  anchorTop,
  buckleY = 175,
  height = "720px",
  className = "",
}: ProfileLanyardBadgeProps) {
  const isSiswa = user.role === "siswa";

  // Warna Tali Lanyard Al-Azhar
  const strapColor = isSiswa ? "#064e3b" : "#042f2e"; // Deep Emerald / Deep Teal
  const inkColor = "#fbbf24"; // Emas Al-Azhar
  const strapText = isSiswa ? "SMP ISLAM AL-AZHAR CAIRO" : "SD - SMP ISLAM AL-AZHAR CAIRO";
  const strapLabel = isSiswa ? "STUDENT APPS 2026" : "PENDIDIK AL-AZHAR 2026";

  // Desain Sisi DEPAN Kartu (Front Face)
  const frontFace = (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0b1f17] via-[#0f2d22] to-[#071610] text-white p-3.5 select-none font-sans">
      {/* Mozaik Prisma Segitiga Khas Al-Azhar di Atas */}
      <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden z-10">
        <AlAzharMosaicStrip className="h-full object-cover" />
      </div>

      {/* Watermark Ornamen Lembut di Belakang */}
      <div
        className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full border border-emerald-500/10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-10 top-20 w-36 h-36 rounded-full border border-amber-500/10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Bagian Header Kartu */}
      <div className="pt-2">
        <div className="flex items-center justify-between gap-1.5 border-b border-emerald-500/30 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="relative w-6 h-6 shrink-0 rounded-full bg-white/10 p-0.5 border border-white/20">
              <Image
                src="/images/logo-alazhar-cairo.avif"
                alt="Logo Al-Azhar"
                fill
                sizes="24px"
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[9px] font-extrabold tracking-tight text-white leading-tight">
                {isSiswa ? "SEKOLAH ISLAM AL-AZHAR CAIRO" : "SEKOLAH ISLAM AL-AZHAR CAIRO"}
              </p>
              <p className="text-[7px] text-emerald-300 font-medium tracking-wider">PALEMBANG</p>
            </div>
          </div>
       
        </div>
      </div>

      {/* Bagian Tengah: Foto Profil & Smart Chip */}
      <div className="my-auto py-1">      
        {/* Foto Profil Utama */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-18 h-20 rounded-2xl p-[2px] bg-gradient-to-tr from-amber-400 via-emerald-400 to-amber-200 shadow-lg shadow-black/40 overflow-hidden mb-2">
            <UserAvatar
              src={user.image}
              gender={user.gender}
              alt={user.name}
              previewable={false}
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>

          {/* Identitas Nama */}
          <h3 className="font-extrabold text-[12.5px] text-white tracking-tight line-clamp-1 w-full px-1">
            {user.name}
          </h3>

          {/* Nomor Induk & Kelas/Bidang */}
          {isSiswa ? (
            <div className="mt-0.5 space-y-0.5">
              <p className="font-mono text-[9.5px] font-bold text-amber-300">
                NIS: {user.nis || "-"}
              </p>
              <p className="text-[9px] text-emerald-200/90 font-medium">
                {user.kelas
                  ? user.kelas.toLowerCase().startsWith("kelas")
                    ? user.kelas
                    : `Kelas ${user.kelas}`
                  : "-"}
              </p>
            </div>
          ) : (
            <div className="mt-0.5 space-y-0.5">
              <p className="font-mono text-[9px] font-bold text-amber-300">
                NIY: {user.nip || "-"}
              </p>
              <p className="text-[8.5px] text-emerald-200/90 font-medium line-clamp-1">
                {user.guru_bidang ||
                  (user.kelas
                    ? user.kelas.toLowerCase().startsWith("wali")
                      ? user.kelas
                      : `Wali Kelas ${user.kelas}`
                    : "Pendidik Al-Azhar")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bagian Bawah: Footer Kartu */}
      <div className="border-t border-emerald-500/30 pt-1.5 flex items-center justify-between text-[7.5px] text-emerald-300/80">
        <span className="font-bold tracking-wider text-amber-400">AL-AZHAR CAIRO</span>
      </div>
    </div>
  );

  // Desain Sisi BELAKANG Kartu (Back Face) - Murni Berisi Data Siswa / Pendidik
  const backFace = (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0b1f17] via-[#081b14] to-[#04100c] text-slate-200 p-3.5 select-none font-sans">
      {/* Mozaik Prisma Segitiga Khas Al-Azhar di Atas */}
      <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden z-10">
        <AlAzharMosaicStrip className="h-full object-cover" />
      </div>

      {/* Header Belakang */}
      <div className="pt-2 border-b border-emerald-500/30 pb-1.5 text-center">
        <p className="text-[8.5px] font-black uppercase tracking-wider text-amber-300">
          {isSiswa ? "DATA IDENTITAS SISWA" : "DATA IDENTITAS PENDIDIK"}
        </p>
        <p className="text-[6.5px] text-emerald-300/80 mt-0.5">
          SD - SMP Islam Al-Azhar Cairo Palembang
        </p>
      </div>

      {/* Rincian Data Lengkap Siswa / Pendidik */}
      <div className="my-auto py-1">
        <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/40 divide-y divide-emerald-800/30 text-[7.5px] space-y-1">
          <div className="flex justify-between items-center pb-1">
            <span className="text-emerald-300/70 font-medium">Nama</span>
            <span className="font-bold text-white max-w-[130px] truncate text-right">
              {user.name}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-emerald-300/70 font-medium">{isSiswa ? "NIS" : "NIY"}</span>
            <span className="font-mono font-bold text-amber-300">
              {isSiswa ? user.nis || "-" : user.nip || "-"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-emerald-300/70 font-medium">
              {isSiswa ? "Kelas" : "Bidang Studi"}
            </span>
            <span className="font-semibold text-white max-w-[130px] truncate text-right">
              {isSiswa ? user.kelas || "-" : user.guru_bidang || "-"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-emerald-300/70 font-medium">Jenis Kelamin</span>
            <span className="font-medium text-white">
              {user.gender === "L" ? "Laki-laki (L)" : user.gender === "P" ? "Perempuan (P)" : "-"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-emerald-300/70 font-medium">Email</span>
            <span className="font-mono text-white/90 max-w-[130px] truncate text-right">
              {user.email}
            </span>
          </div>

          {user.address && (
            <div className="flex justify-between items-center py-1">
              <span className="text-emerald-300/70 font-medium">Alamat</span>
              <span className="text-white/90 max-w-[130px] truncate text-right">
                {user.address}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="text-emerald-300/70 font-medium">Status</span>
            <span className="font-bold text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{isSiswa ? "Siswa Aktif" : "Pendidik Aktif"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Barcode & Stempel Verifikasi */}
      <div className="pt-1 border-t border-emerald-500/30 flex items-center justify-between">
        <div className="flex-1">
          <BarcodeGraphic code={user.nis || user.nip || user.id} />
        </div>
        <OfficialStamp text="AL-AZHAR" sub="VALID" />
      </div>

      {/* Footer Website Resmi */}
      <div className="text-center text-[6.5px] text-emerald-400/80 pt-0.5">
        <span>alazharcairoplg.sch.id</span>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full flex flex-col items-center bg-transparent ${className}`}>
      <LanyardBadge
        cardWidth={224}
        cardHeight={336}
        height={height}
        buckleY={buckleY}
        anchorRatio={anchorRatio}
        anchorTop={anchorTop}
        strapColor={strapColor}
        inkColor={inkColor}
        strapText={strapText}
        strapLabel={strapLabel}
        flipButton={false}
        front={frontFace}
        back={backFace}
        className="mx-auto bg-transparent overflow-visible"
      />
    </div>
  );
}

