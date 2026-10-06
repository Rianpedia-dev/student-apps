"use client";

import { useState, useEffect, useRef, useCallback, type SVGProps } from "react";

export function ClipboardCheckIcon({
  size = 24,
  className,
  isHovered,
  isAnimated = true,
  onMouseEnter,
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

  // Replay when parent menu item is hovered (icon or name)
  useEffect(() => {
    if (isHovered && isAnimated) {
      replay();
    }
  }, [isHovered, isAnimated, replay]);

  const handleMouseEnter = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isAnimated) {
      const now = Date.now();
      if (now - lastTriggerRef.current > 1200) {
        lastTriggerRef.current = now;
        replay();
      }
    }
    onMouseEnter?.(e);
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
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          strokeDasharray="66"
          strokeDashoffset={isAnimated ? 66 : 0}
          strokeWidth="2"
          d="M12 3h7v18h-14v-18h7Z"
        >
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.6s"
              values="66;0"
            />
          )}
        </path>
        <path
          strokeDasharray="14"
          strokeDashoffset={isAnimated ? 14 : 0}
          d="M14.5 3.5v3h-5v-3"
        >
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
        <path
          strokeDasharray="12"
          strokeDashoffset={isAnimated ? 12 : 0}
          strokeWidth="2"
          d="M9 13l2 2l4 -4"
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
