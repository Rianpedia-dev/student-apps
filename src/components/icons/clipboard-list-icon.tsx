"use client";

import { useState, useEffect, useRef, useCallback, type SVGProps } from "react";

export function ClipboardListIcon({
  size = 24,
  className,
  isHovered,
  isAnimated = true,
  ...props
}: SVGProps<SVGSVGElement> & {
  size?: number;
  isHovered?: boolean;
  isAnimated?: boolean;
}) {
  const [animKey, setAnimKey] = useState(0);
  const lastTriggerRef = useRef(0);

  const replay = useCallback(() => {
    if (!isAnimated) return;
    setAnimKey((prev) => prev + 1);
  }, [isAnimated]);

  // Replay when parent menu item is hovered
  useEffect(() => {
    if (isHovered && isAnimated) {
      replay();
    }
  }, [isHovered, isAnimated, replay]);

  useEffect(() => {
    if (!isAnimated) return;
    // Replay animation every 2 minutes (120,000ms)
    const interval = setInterval(() => {
      replay();
    }, 120000);

    return () => clearInterval(interval);
  }, [isAnimated, replay]);

  const handleMouseEnter = () => {
    if (!isAnimated) return;
    const now = Date.now();
    if (now - lastTriggerRef.current > 2500) {
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
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          strokeDasharray="66"
          strokeDashoffset={isAnimated ? undefined : 0}
          strokeWidth="2"
          d="M12 3h7v18h-14v-18h7Z"
        >
          {isAnimated && (
            <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="66;0" />
          )}
        </path>
        <path
          strokeDasharray="14"
          strokeDashoffset={isAnimated ? 14 : 0}
          d="M14.5 3.5v3h-5v-3"
        >
          {isAnimated && (
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" to="0" />
          )}
        </path>
        <g strokeWidth="2">
          <path
            strokeDasharray="6"
            strokeDashoffset={isAnimated ? 6 : 0}
            d="M9 10h3"
          >
            {isAnimated && (
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.9s" dur="0.2s" to="0" />
            )}
          </path>
          <g strokeDasharray="8" strokeDashoffset={isAnimated ? 8 : 0}>
            <path d="M9 13h5">
              {isAnimated && (
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.1s" dur="0.2s" to="0" />
              )}
            </path>
            <path d="M9 16h6">
              {isAnimated && (
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.3s" dur="0.2s" to="0" />
              )}
            </path>
          </g>
        </g>
      </g>
    </svg>
  );
}
