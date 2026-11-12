"use client";

import React from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "w-[150px]",
  default: "w-[196px]",
  lg: "w-[300px]",
} as const;

interface PerspectiveBookProps {
  size?: keyof typeof sizeMap;
  bookClassName?: string;
  className?: string;
  children: React.ReactNode;
  textured?: boolean;
}

const PAPER_TEXTURE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E\")";

/**
 * Menampilkan sampul buku 3D interaktif dengan efek perspektif dan ketebalan halaman saat di-hover.
 */
export function PerspectiveBook({
  size = "default",
  bookClassName,
  className = "",
  children,
  textured = false,
}: PerspectiveBookProps) {
  const defaultColorClasses =
    'bg-neutral-100 dark:bg-[#1f1f1f] dark:before:content-[""] dark:before:bg-gradient-to-b dark:before:from-[#ffffff1a] dark:before:to-transparent dark:before:absolute dark:before:inset-0 dark:before:rounded-[inherit] text-primary';

  return (
    <div className="z-10 group [perspective:900px] w-min h-min">
      <div
        style={{
          borderRadius: "6px 4px 4px 6px",
        }}
        className={cn(
          "transition-transform duration-300 ease-out relative [transform-style:preserve-3d] [transform:rotateY(0deg)] group-hover:[transform:rotateY(-20deg)] group-hover:scale-[1.066] group-hover:-translate-x-1 aspect-[49/60]",
          bookClassName || sizeMap[size]
        )}
      >
        {/* Front Side */}
        <div
          className={cn(
            "absolute inset-y-0 overflow-hidden size-full left-0 flex flex-col p-[12%] after:content-[''] after:absolute after:inset-0 after:shadow-[0_1.8px_3.6px_#0000000d,_0_10.8px_21.6px_#00000014,_inset_0_-.9px_#0000001a,_inset_0_1.8px_1.8px_#ffffff1a,_inset_3.6px_0_3.6px_#0000001a] after:pointer-events-none after:rounded-[inherit] after:border-[#00000014] after:border after:border-solid",
            className || defaultColorClasses
          )}
          style={{
            transform: "translateZ(20px)",
            borderRadius: "6px 4px 4px 6px",
          }}
        >
          <div
            className="absolute left-0 top-0 h-full opacity-40"
            style={{
              minWidth: "8.2%",
              background:
                "linear-gradient(90deg, hsla(0, 0%, 100%, 0), hsla(0, 0%, 100%, 0) 12%, hsla(0, 0%, 100%, .25) 29.25%, hsla(0, 0%, 100%, 0) 50.5%, hsla(0, 0%, 100%, 0) 75.25%, hsla(0, 0%, 100%, .25) 91%, hsla(0, 0%, 100%, 0)), linear-gradient(90deg, rgba(0, 0, 0, .03), rgba(0, 0, 0, .1) 12%, transparent 30%, rgba(0, 0, 0, .02) 50%, rgba(0, 0, 0, .2) 73.5%, rgba(0, 0, 0, .5) 75.25%, rgba(0, 0, 0, .15) 85.25%, transparent)",
            }}
          />
          <div className="pl-1 h-full relative z-10">{children}</div>
          {textured && (
            <div
              className="absolute inset-0 mix-blend-overlay opacity-45 pointer-events-none"
              style={{
                borderRadius: "6px 4px 4px 6px",
                backgroundImage: PAPER_TEXTURE_SVG,
              }}
            />
          )}
        </div>

        {/* Pages Edge (Fore-Edge Spine Side) */}
        <div
          aria-hidden="true"
          className="absolute border-y border-neutral-200/80"
          style={{
            top: "3px",
            right: "4px",
            width: "38px",
            height: "calc(100% - 6px)",
            transform: "translateX(19px) rotateY(90deg)",
            background:
              "repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 1px, #e5e7eb 1px, #e5e7eb 3px)",
          }}
        />

        {/* Back Side */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-full after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:shadow-[0_10.8px_21.6px_#00000024]",
            className || defaultColorClasses
          )}
          style={{
            transform: "translateZ(-20px)",
            borderRadius: "6px 4px 4px 6px",
          }}
        />
      </div>
    </div>
  );
}

