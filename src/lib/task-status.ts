import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type TaskSubmissionStatus =
  | "belum_mengumpulkan"
  | "sedang_mengerjakan"
  | "menunggu_penilaian"
  | "terlambat"
  | "sudah_dinilai"
  | "selesai"
  | "perlu_revisi";

export interface TaskStatusConfig {
  label: string;
  /** Badge variant — limited to shadcn/ui defaults to keep colors neutral */
  variant: "default" | "secondary" | "outline" | "destructive";
  icon: LucideIcon;
}

const STATUS_MAP: Record<TaskSubmissionStatus, TaskStatusConfig> = {
  belum_mengumpulkan: {
    label: "Belum Dikerjakan",
    variant: "secondary",
    icon: Play,
  },
  sedang_mengerjakan: {
    label: "Sedang Dikerjakan",
    variant: "outline",
    icon: RotateCw,
  },
  menunggu_penilaian: {
    label: "Sedang Diperiksa",
    variant: "outline",
    icon: Clock,
  },
  terlambat: {
    label: "Terlambat",
    variant: "destructive",
    icon: AlertCircle,
  },
  sudah_dinilai: {
    label: "Sudah Dinilai",
    variant: "default",
    icon: CheckCircle2,
  },
  selesai: {
    label: "Selesai",
    variant: "default",
    icon: Sparkles,
  },
  perlu_revisi: {
    label: "Perlu Revisi",
    variant: "destructive",
    icon: AlertCircle,
  },
};

/**
 * Returns a consistent status config (label, badge variant, icon) for a given
 * task submission status string. Falls back to "secondary" for unknown status.
 */
export function getStatusConfig(status: string): TaskStatusConfig {
  return (
    STATUS_MAP[status as TaskSubmissionStatus] ?? {
      label: status,
      variant: "secondary" as const,
      icon: Clock,
    }
  );
}

/**
 * Returns a human-readable relative deadline label and whether the deadline has passed.
 */
export function getDeadlineInfo(dateStr: string): {
  label: string;
  isLate: boolean;
} {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isLate = diffMs < 0;
    const formatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    let label = formatted;
    if (isLate) {
      label = `Berakhir (${formatted})`;
    } else if (diffDays === 0) {
      label = `Hari ini (${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`;
    } else if (diffDays === 1) {
      label = `Besok (${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`;
    } else if (diffDays <= 7) {
      label = `${diffDays} hari lagi`;
    }

    return { label, isLate };
  } catch {
    return { label: dateStr, isLate: false };
  }
}
