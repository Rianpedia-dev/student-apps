import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge relative inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full font-semibold whitespace-nowrap transition-all duration-300 ease-out select-none border border-transparent shadow-[0_3px_10px_-2px_rgba(0,0,0,0.14),0_1px_3px_-1px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.35)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.22),inset_0_1.5px_3px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-emerald-400 to-teal-500 text-white border-emerald-300/30 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] hover:from-emerald-500 hover:to-teal-600",
        secondary:
          "bg-gradient-to-b from-slate-100 to-slate-200/90 text-slate-800 border-slate-300/50 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100 dark:border-slate-700/60 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-750 dark:hover:to-slate-850",
        destructive:
          "bg-gradient-to-b from-rose-500 to-red-600 text-white border-rose-400/40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] hover:from-rose-600 hover:to-red-700",
        outline:
          "bg-gradient-to-b from-background/95 to-muted/60 text-foreground border-border/90 shadow-2xs hover:shadow-xs hover:border-border hover:from-muted/40 hover:to-muted/70",
        success:
          "bg-gradient-to-b from-emerald-400 to-teal-500 text-white border-emerald-300/40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] hover:from-emerald-500 hover:to-teal-600",
        warning:
          "bg-gradient-to-b from-amber-300 to-yellow-400 text-slate-800 border-amber-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-amber-400 hover:to-yellow-500",
        info:
          "bg-gradient-to-b from-sky-300 to-sky-400 text-slate-800 border-sky-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-sky-400 hover:to-sky-500",
        amber:
          "bg-gradient-to-b from-amber-300 to-yellow-400 text-slate-800 border-amber-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-amber-400 hover:to-yellow-500",
        yellow:
          "bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-800 border-yellow-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-amber-500 hover:to-yellow-600",
        orange:
          "bg-gradient-to-b from-orange-400 to-orange-500 text-white border-orange-300/50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)] hover:from-orange-500 hover:to-orange-600",
        pink:
          "bg-gradient-to-b from-pink-300 to-pink-400 text-slate-800 border-pink-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-pink-400 hover:to-pink-500",
        rose:
          "bg-gradient-to-b from-pink-400 to-rose-500 text-white border-rose-300/50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)] hover:from-pink-500 hover:to-rose-600",
        blue:
          "bg-gradient-to-b from-blue-300 to-blue-500 text-black font-bold border-blue-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-blue-400 hover:to-blue-600",
        smp:
          "bg-gradient-to-b from-blue-300 to-blue-500 text-black font-bold border-blue-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-blue-400 hover:to-blue-600",
        sky:
          "bg-gradient-to-b from-sky-300 to-sky-400 text-slate-800 border-sky-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-sky-400 hover:to-sky-500",
        cyan:
          "bg-gradient-to-b from-cyan-300 to-sky-400 text-slate-800 border-cyan-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-cyan-400 hover:to-sky-500",
        teal:
          "bg-gradient-to-b from-teal-300 to-emerald-400 text-slate-800 border-teal-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-teal-400 hover:to-emerald-500",
        emerald:
          "bg-gradient-to-b from-emerald-300 to-teal-400 text-slate-800 border-emerald-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-emerald-400 hover:to-teal-500",
        lime:
          "bg-gradient-to-b from-lime-300 to-emerald-400 text-slate-800 border-lime-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-lime-400 hover:to-emerald-500",
        purple:
          "bg-gradient-to-b from-purple-300 to-indigo-400 text-slate-800 border-purple-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-purple-400 hover:to-indigo-500",
        violet:
          "bg-gradient-to-b from-violet-400 to-purple-500 text-white border-violet-300/50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] hover:from-violet-500 hover:to-purple-600",
        indigo:
          "bg-gradient-to-b from-indigo-400 to-indigo-600 text-white border-indigo-300/50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] hover:from-indigo-500 hover:to-indigo-700",
        fuchsia:
          "bg-gradient-to-b from-fuchsia-300 to-pink-400 text-slate-800 border-fuchsia-300/60 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] hover:from-fuchsia-400 hover:to-pink-500",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 shadow-none hover:shadow-none hover:translate-y-0",
        link:
          "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none hover:translate-y-0",
      },
      size: {
        xs: "h-4.5 px-2 py-0 text-[10px]",
        sm: "h-5.5 px-2.5 py-0 text-[11px]",
        default: "h-6.5 px-3 py-0.5 text-xs",
        lg: "h-8 px-4 py-1 text-sm",
        xl: "h-9.5 px-5 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  children,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const showHighlight = variant !== "ghost" && variant !== "link"

  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
      {showHighlight && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full select-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.06) 55%, rgba(0,0,0,0.04) 100%)",
          }}
        />
      )}
    </>
  )

  return useRender({
    defaultTagName: "span",
    props: {
      ...mergeProps<"span">(
        {
          className: cn(badgeVariants({ variant, size }), className),
        },
        props
      ),
      children: content,
    },
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  })
}

export { Badge, badgeVariants }
