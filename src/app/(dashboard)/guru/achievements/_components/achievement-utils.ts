export type AchievementTier = "gold" | "silver" | "bronze" | "special" | "general";

export interface TierInfo {
  tier: AchievementTier;
  label: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
}

export function detectAchievementTier(text: string): TierInfo {
  const lower = text.toLowerCase();

  // 1. Gold / Juara 1
  if (
    lower.includes("juara 1") ||
    lower.includes("juara i ") ||
    lower.includes("juara i-") ||
    lower.includes("medali emas") ||
    lower.includes("gold medal") ||
    lower.includes("terbaik 1") ||
    lower.includes("1st place")
  ) {
    return {
      tier: "gold",
      label: "Juara 1 / Emas",
      badgeClass: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs border-amber-300/40",
      borderClass: "border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/5",
      bgLightClass: "bg-amber-500/[0.08] dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/20",
    };
  }

  // 2. Silver / Juara 2
  if (
    lower.includes("juara 2") ||
    lower.includes("juara ii") ||
    lower.includes("medali perak") ||
    lower.includes("silver medal") ||
    lower.includes("runner up") ||
    lower.includes("2nd place")
  ) {
    return {
      tier: "silver",
      label: "Juara 2 / Perak",
      badgeClass: "bg-gradient-to-r from-slate-400 to-zinc-400 text-white shadow-xs border-slate-300/40",
      borderClass: "border-slate-400/30 hover:border-slate-400/60 shadow-slate-500/5",
      bgLightClass: "bg-slate-500/[0.08] dark:bg-slate-500/15 text-slate-800 dark:text-slate-200 border-slate-400/20",
    };
  }

  // 3. Bronze / Juara 3
  if (
    lower.includes("juara 3") ||
    lower.includes("juara iii") ||
    lower.includes("medali perunggu") ||
    lower.includes("bronze medal") ||
    lower.includes("3rd place")
  ) {
    return {
      tier: "bronze",
      label: "Juara 3 / Perunggu",
      badgeClass: "bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-xs border-amber-600/40",
      borderClass: "border-amber-700/30 hover:border-amber-700/60 shadow-orange-500/5",
      bgLightClass: "bg-orange-500/[0.08] dark:bg-orange-500/15 text-orange-950 dark:text-orange-200 border-orange-500/20",
    };
  }

  // 4. Special: Tahfidz / Qur'an / Islamic
  if (
    lower.includes("mhq") ||
    lower.includes("tahfidz") ||
    lower.includes("hifdzil") ||
    lower.includes("qur'an") ||
    lower.includes("quran") ||
    lower.includes("tilawah") ||
    lower.includes("adzan") ||
    lower.includes("tartil")
  ) {
    return {
      tier: "special",
      label: "Tahfidz & Qur'an",
      badgeClass: "bg-emerald-600 text-white shadow-xs border-emerald-400/30",
      borderClass: "border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/5",
      bgLightClass: "bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border-emerald-500/20",
    };
  }

  // 5. General Juara
  return {
    tier: "general",
    label: "Penghargaan Juara",
    badgeClass: "bg-amber-500/90 text-white shadow-xs border-amber-400/30",
    borderClass: "border-amber-500/20 hover:border-amber-500/50 shadow-amber-500/5",
    bgLightClass: "bg-amber-500/[0.06] dark:bg-amber-500/10 text-foreground border-amber-500/20",
  };
}

export function detectScope(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("internasional") || lower.includes("international")) return "Internasional";
  if (lower.includes("nasional") || lower.includes("indonesia") || lower.includes("se-indonesia")) return "Nasional";
  if (lower.includes("provinsi") || lower.includes("sumatera") || lower.includes("sumbagsel") || lower.includes("sumsel"))
    return "Provinsi";
  if (lower.includes("kota") || lower.includes("kabupaten") || lower.includes("palembang")) return "Kota/Kabupaten";
  if (lower.includes("sekolah") || lower.includes("antar sd") || lower.includes("internal")) return "Sekolah";
  return "Umum";
}

export function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("mhq") ||
    lower.includes("tahfidz") ||
    lower.includes("hifdzil") ||
    lower.includes("qur'an") ||
    lower.includes("quran") ||
    lower.includes("fasi") ||
    lower.includes("bahasa arab") ||
    lower.includes("oba") ||
    lower.includes("islamic") ||
    lower.includes("tartil") ||
    lower.includes("adzan")
  ) {
    return "Keagamaan & Al-Qur'an";
  }

  if (
    lower.includes("sains") ||
    lower.includes("matematika") ||
    lower.includes("ipa") ||
    lower.includes("ips") ||
    lower.includes("osn") ||
    lower.includes("osmn") ||
    lower.includes("olympiad") ||
    lower.includes("olimpiade") ||
    lower.includes("robotik") ||
    lower.includes("science")
  ) {
    return "Akademik & Sains";
  }

  if (
    lower.includes("panahan") ||
    lower.includes("futsal") ||
    lower.includes("renang") ||
    lower.includes("silat") ||
    lower.includes("taekwondo") ||
    lower.includes("catur") ||
    lower.includes("olahraga")
  ) {
    return "Olahraga";
  }

  if (
    lower.includes("puisi") ||
    lower.includes("gambar") ||
    lower.includes("mewarnai") ||
    lower.includes("pidato") ||
    lower.includes("story") ||
    lower.includes("seni")
  ) {
    return "Seni & Bahasa";
  }

  return "Lainnya";
}
