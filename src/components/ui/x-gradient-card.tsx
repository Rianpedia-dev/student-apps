import React from "react";
import { VerifiedIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface ReplyProps {
  authorName: string;
  authorHandle: string;
  authorImage: string;
  content: string;
  isVerified?: boolean;
  timestamp: string;
}

export interface XCardProps {
  link?: string;
  authorName?: string;
  authorHandle?: string;
  authorImage?: string;
  content?: string[] | string;
  isVerified?: boolean;
  timestamp?: string;
  reply?: ReplyProps;
  children?: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export function XCard({
  link,
  authorName = "Dorian",
  authorHandle = "dorian_baffier",
  authorImage = "https://cdn.21st.dev/assets/localized/48105a02b5748bd2d7c738bc9b4b9ec468fe09c6f69f59d947eed2fdf03dc234.jpg",
  content = [
    "All components from KokonutUI can now be open in @v0 🎉",
    "1. Click on 'Open in V0'",
    "2. Customize with prompts",
    "3. Deploy to your app",
  ],
  isVerified = true,
  timestamp = "Jan 18, 2025",
  reply,
  children,
  className,
  headerAction,
  footer,
}: XCardProps) {
  const contentArray = Array.isArray(content)
    ? content
    : content
    ? [content]
    : [];

  const cardInner = (
    <div
      className={cn(
        "w-full min-w-0 p-1.5 rounded-2xl relative isolate overflow-hidden group transition-all duration-300",
        "bg-white/80 dark:bg-black/90",
        "bg-gradient-to-br from-black/5 to-black/[0.02] dark:from-white/5 dark:to-white/[0.02]",
        "backdrop-blur-xl backdrop-saturate-[180%]",
        "border border-black/10 dark:border-white/10",
        "shadow-[0_8px_16px_rgb(0_0_0_/_0.08)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]",
        "hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.12)] dark:hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.35)]",
        "will-change-transform translate-z-0",
        className
      )}
    >
      <div
        className={cn(
          "w-full p-4 sm:p-5 rounded-xl relative",
          "bg-white/40 dark:bg-zinc-900/30",
          "bg-gradient-to-br from-black/[0.03] to-transparent dark:from-white/[0.08] dark:to-transparent",
          "backdrop-blur-md backdrop-saturate-150",
          "border border-black/[0.05] dark:border-white/[0.08]",
          "text-black/90 dark:text-white",
          "shadow-xs",
          "will-change-transform translate-z-0",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-black/[0.02] before:to-black/[0.01] dark:before:from-white/[0.03] dark:before:to-white/[0.01] before:opacity-0 before:transition-opacity before:pointer-events-none",
          "hover:before:opacity-100"
        )}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-muted/60">
              <img
                src={authorImage}
                alt={authorName}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-black dark:text-white/90 hover:underline cursor-pointer truncate">
                    {authorName}
                  </span>
                  {isVerified && (
                    <VerifiedIcon className="h-4 w-4 text-blue-400 shrink-0" />
                  )}
                </div>
                {authorHandle && (
                  <span className="text-black/60 dark:text-white/60 text-sm truncate">
                    @{authorHandle}
                  </span>
                )}
              </div>
              {headerAction ? (
                headerAction
              ) : (
                <button
                  type="button"
                  aria-label="X post link"
                  className="h-8 w-8 text-black/70 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-1 flex items-center justify-center shrink-0 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1200"
                    height="1227"
                    fill="none"
                    viewBox="0 0 1200 1227"
                    className="w-4 h-4"
                  >
                    <title>X</title>
                    <path
                      fill="currentColor"
                      d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {children ? (
          children
        ) : (
          <div className="mt-2.5">
            {contentArray.map((item, index) => (
              <p
                key={index}
                className="text-black dark:text-white/90 text-base"
              >
                {item}
              </p>
            ))}
            {timestamp && (
              <span className="text-black/50 dark:text-white/50 text-sm mt-2 block">
                {timestamp}
              </span>
            )}
          </div>
        )}

        {/* Footer if provided */}
        {footer && <div className="mt-3">{footer}</div>}

        {/* Reply section */}
        {reply && (
          <div className="mt-4 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-muted/60">
                  <img
                    src={reply.authorImage}
                    alt={reply.authorName}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-semibold text-black dark:text-white/90 hover:underline cursor-pointer">
                    {reply.authorName}
                  </span>
                  {reply.isVerified && (
                    <VerifiedIcon className="h-4 w-4 text-blue-400 shrink-0" />
                  )}
                  <span className="text-black/60 dark:text-white/60 text-sm">
                    @{reply.authorHandle}
                  </span>
                  <span className="text-black/60 dark:text-white/60 text-sm">
                    ·
                  </span>
                  <span className="text-black/60 dark:text-white/60 text-sm">
                    {reply.timestamp}
                  </span>
                </div>
                <p className="text-black/80 dark:text-white/80 text-sm mt-1">
                  {reply.content}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        href={link}
        target="_blank"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
      >
        {cardInner}
      </Link>
    );
  }

  return cardInner;
}

// --- Demos from KokonutUI / 21st.dev ---
export const XCardDummyData = {
  authorName: "Dorian",
  authorHandle: "dorian_baffier",
  authorImage:
    "https://cdn.21st.dev/assets/localized/48105a02b5748bd2d7c738bc9b4b9ec468fe09c6f69f59d947eed2fdf03dc234.jpg",
  content: [
    "All components from KokonutUI can now be open in @v0 🎉",
    "1. Click on 'Open in V0'",
    "2. Customize with prompts",
    "3. Deploy to your app",
  ],
  isVerified: true,
  timestamp: "Jan 18, 2025",
  reply: {
    authorName: "shadcn",
    authorHandle: "shadcn",
    authorImage:
      "https://cdn.21st.dev/assets/mirror/e9/e941f86e0ca2b1c9eefd47618a92040443f85598470bad47399cee7f259c0756.jpg",
    content: "Awesome.",
    isVerified: true,
    timestamp: "Jan 18",
  },
};

export function XCardDemoDefault() {
  return <XCard {...XCardDummyData} />;
}

export const XCardDummyDataTwo = {
  authorName: "serafim",
  authorHandle: "serafimcloud",
  authorImage:
    "https://cdn.21st.dev/assets/localized/bc101e2880df0fbc2fc8a6e3528c23ec6762cf97b25ef1ec3e381da80017db95.jpg",
  content: [
    "I spent 70 days full-time curating the ultimate library of @shadcn/ui-like components.",
    "And today, I'm launching it publicly.",
    "Here's what it is:",
    "• 730+ production-ready components from 50+ top design engineers",
    "• Each component is yours to own - just like shadcn/ui",
    "• Install everything with shadcn CLI: code, dependencies, hooks, global css and tailwind config extensions",
    "It's also optimized for AI code editors like @lovable_dev, @stackblitz's bolt. new, and @vercel's @v0, with tailored prompts for effortless integration.",
    "👉 http://21st.dev is live now. Build faster, own your code, and never struggle with UI setup again.",
  ],
  isVerified: true,
  timestamp: "Apr 6",
  reply: {
    authorName: "shadcn",
    authorHandle: "shadcn",
    authorImage:
      "https://cdn.21st.dev/assets/mirror/e9/e941f86e0ca2b1c9eefd47618a92040443f85598470bad47399cee7f259c0756.jpg",
    content: "Great work. CLI support is a nice touch.",
    isVerified: true,
    timestamp: "Jan 9",
  },
};

export function XCardDemoTwo() {
  return <XCard {...XCardDummyDataTwo} />;
}

export default XCard;
