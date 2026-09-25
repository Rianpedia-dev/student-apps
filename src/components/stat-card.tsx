import React from "react";
import { LucideIcon } from "lucide-react";
import { FolderCard, FolderCardVariant } from "@/components/ui/folder-card";

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  imageSrc?: string;
  description?: string;
  variant?: FolderCardVariant;
  href?: string;
  valueClassName?: string;
  showWatermark?: boolean;
  meta?: string;
  count?: React.ReactNode;
  countLabel?: string;
  className?: string;
}

/**
 * Helper to intelligently split compound values like "0 Hari", "5 Kegiatan", "12 Siswa"
 * into separate count figure and countLabel for the folder card footer.
 */
function parseValue(value: React.ReactNode): { count: React.ReactNode; countLabel: string } {
  if (typeof value === "number") {
    return { count: value.toLocaleString("id-ID"), countLabel: "" };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    // Check pattern: "10 Hari", "5 Kegiatan", "100%", "3.5 Jam"
    const match = trimmed.match(/^(\d+(?:[.,]\d+)?%?)\s+(.+)$/);
    if (match) {
      return {
        count: match[1],
        countLabel: match[2],
      };
    }

    // Check special case like "45m" (minutes)
    const minMatch = trimmed.match(/^(\d+)m$/i);
    if (minMatch) {
      return {
        count: minMatch[1],
        countLabel: "Menit",
      };
    }

    return { count: trimmed, countLabel: "" };
  }

  return { count: value, countLabel: "" };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  imageSrc,
  description,
  variant = "primary",
  href,
  meta,
  count: propCount,
  countLabel: propCountLabel,
  className,
}: StatCardProps) {
  const parsed = parseValue(value);
  const count = propCount !== undefined ? propCount : parsed.count;
  const countLabel = propCountLabel !== undefined ? propCountLabel : parsed.countLabel;

  const renderedIcon = Icon ? (
    <Icon className="h-full w-full stroke-[2.2]" />
  ) : null;

  return (
    <FolderCard
      title={title}
      subtitle={description}
      count={count}
      countLabel={countLabel}
      meta={meta}
      cover={imageSrc}
      variant={variant}
      icon={renderedIcon}
      href={href}
      className={className}
    />
  );
}

export default StatCard;
