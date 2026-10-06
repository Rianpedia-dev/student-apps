"use client";

import { useState, useEffect, useRef, useCallback, type SVGProps } from "react";

export function AccountIcon({
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
    if (now - lastTriggerRef.current > 1200) {
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
      <g
        fill="none"
        stroke="currentColor"
        strokeDasharray="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path strokeDashoffset={isAnimated ? "28" : "0"} d="M4 21v-1c0 -3.31 2.69 -6 6 -6h4c3.31 0 6 2.69 6 6v1">
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.4s"
              values="28;0"
            />
          )}
        </path>
        <path
          strokeDashoffset={isAnimated ? "28" : "0"}
          d="M12 11c-2.21 0 -4 -1.79 -4 -4c0 -2.21 1.79 -4 4 -4c2.21 0 4 1.79 4 4c0 2.21 -1.79 4 -4 4Z"
        >
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.4s"
              dur="0.4s"
              to="0"
            />
          )}
        </path>
      </g>
    </svg>
  );
}
