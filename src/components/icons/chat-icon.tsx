"use client";

import { useState, useEffect, useRef, useCallback, type SVGProps } from "react";
import { cn } from "@/lib/utils";

interface ChatIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  isHovered?: boolean;
  isAnimated?: boolean;
}

export function ChatIcon({
  size = 24,
  className,
  isHovered,
  isAnimated = true,
  ...props
}: ChatIconProps) {
  const [animKey, setAnimKey] = useState(0);
  const lastTriggerRef = useRef(0);

  const replay = useCallback(() => {
    if (!isAnimated) return;
    setAnimKey((prev) => prev + 1);
  }, [isAnimated]);

  useEffect(() => {
    if (isHovered && isAnimated) {
      replay();
    }
  }, [isHovered, isAnimated, replay]);

  const handleMouseEnter = () => {
    if (!isAnimated) return;
    const now = Date.now();
    if (now - lastTriggerRef.current > 1000) {
      lastTriggerRef.current = now;
      replay();
    }
  };

  return (
    <svg
      key={animKey}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("h-full w-full", className)}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path
          strokeDasharray="70"
          strokeDashoffset={isAnimated ? undefined : 0}
          d="M3 19.5v-15.5c0 -0.55 0.45 -1 1 -1h16c0.55 0 1 0.45 1 1v12c0 0.55 -0.45 1 -1 1h-14.5Z"
        >
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.6s"
              values="70;0"
            />
          )}
        </path>
        <g strokeDasharray="10" strokeDashoffset={isAnimated ? 10 : 0}>
          <path d="M8 7h8">
            {isAnimated && (
              <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                begin="0.7s"
                dur="0.2s"
                to="0"
              />
            )}
          </path>
          <path d="M8 10h8">
            {isAnimated && (
              <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                begin="0.8s"
                dur="0.2s"
                to="0"
              />
            )}
          </path>
        </g>
        <path
          strokeDasharray="6"
          strokeDashoffset={isAnimated ? 6 : 0}
          d="M8 13h4"
        >
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.9s"
              dur="0.2s"
              to="0"
            />
          )}
        </path>
      </g>
    </svg>
  );
}
