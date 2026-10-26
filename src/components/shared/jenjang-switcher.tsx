"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { School, Layers, Sparkles } from "lucide-react";
import { switchJenjangAction } from "@/actions/jenjang";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JenjangSwitcherProps {
  userJenjang?: "SD" | "SMP" | "ALL" | null;
  activeJenjang?: "SD" | "SMP" | "ALL" | null;
  className?: string;
}

export function JenjangSwitcher({
  userJenjang,
  activeJenjang: initialActive = "ALL",
  className,
}: JenjangSwitcherProps) {
  const router = useRouter();
  const [current, setCurrent] = useState<"SD" | "SMP" | "ALL">(initialActive || "ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialActive) {
      setCurrent(initialActive);
    }
  }, [initialActive]);

  // Switcher hanya muncul untuk pengguna dengan akses multi-jenjang (ALL)
  if (userJenjang !== "ALL") {
    return null;
  }

  const handleSwitch = (target: "SD" | "SMP" | "ALL") => {
    if (isPending) return;

    setCurrent(target);
    startTransition(async () => {
      const res = await switchJenjangAction(target);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
        setCurrent(initialActive || "ALL");
      }
    });
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 dark:bg-slate-900/60 border border-white/50 dark:border-white/10 backdrop-blur-md shadow-xs select-none",
        className
      )}
      title="Beralih lingkup jenjang data"
    >
      {/* SD Button */}
      <button
        type="button"
        onClick={() => handleSwitch("SD")}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
          current === "SD"
            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500/50 scale-[1.02]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
      >
        <span className="text-[11px]">🏫</span>
        <span>SD</span>
      </button>

      {/* SMP Button */}
      <button
        type="button"
        onClick={() => handleSwitch("SMP")}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
          current === "SMP"
            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 ring-1 ring-blue-500/50 scale-[1.02]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
      >
        <span className="text-[11px]">📐</span>
        <span>SMP</span>
      </button>

      {/* ALL Button */}
      <button
        type="button"
        onClick={() => handleSwitch("ALL")}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
          current === "ALL"
            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm shadow-amber-600/30 ring-1 ring-amber-500/50 scale-[1.02]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
      >
        <Layers className="h-3 w-3" />
        <span>Semua</span>
      </button>
    </div>
  );
}
