import React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface DashboardBreadcrumbProps {
  items?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  className?: string;
  rightAction?: React.ReactNode;
}

export function DashboardBreadcrumb({
  items = [],
  backHref = "/guru",
  backLabel = "Kembali",
  className,
  rightAction,
}: DashboardBreadcrumbProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 py-1.5 px-0.5 select-none",
        className
      )}
    >
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Back Button */}
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98] mr-1"
            title={backLabel}
          >
            <ArrowLeft className="h-3.5 w-3.5 text-primary" />
            <span>{backLabel}</span>
          </Link>
        )}

        {/* Breadcrumb Trail */}
        {items && items.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1 || item.isCurrent;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}

                {isLast || !item.href ? (
                  <span className="font-bold text-foreground truncate max-w-[220px] sm:max-w-[320px]">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="font-medium hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
        )}
      </div>

      {rightAction && (
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {rightAction}
        </div>
      )}
    </div>
  );
}
