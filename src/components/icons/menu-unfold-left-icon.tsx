"use client";

import { useState, useRef, useCallback, type SVGProps } from "react";

export function MenuUnfoldLeftIcon({
  size = 24,
  strokeWidth = 2.2,
  className,
  isAnimated = true,
  onMouseEnter,
  ...props
}: SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number | string;
  isAnimated?: boolean;
}) {
  const [animKey, setAnimKey] = useState(0);
  const lastTriggerRef = useRef(0);

  const replay = useCallback(() => {
    if (!isAnimated) return;
    setAnimKey((prev) => prev + 1);
  }, [isAnimated]);

  const handleMouseEnter = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isAnimated) {
      const now = Date.now();
      if (now - lastTriggerRef.current > 1000) {
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
        strokeWidth={strokeWidth}
      >
        <path strokeDasharray="12" strokeDashoffset={isAnimated ? 12 : 0} d="M21 9l-3 3l3 3">
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.2s"
              values="12;0"
            />
          )}
        </path>
        <path strokeDasharray="16" strokeDashoffset={isAnimated ? 16 : 0} d="M19 5h-14">
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.2s"
              dur="0.3s"
              to="0"
            />
          )}
        </path>
        <path strokeDasharray="12" strokeDashoffset={isAnimated ? 12 : 0} d="M14 12h-9">
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.5s"
              dur="0.2s"
              to="0"
            />
          )}
        </path>
        <path strokeDasharray="16" strokeDashoffset={isAnimated ? 16 : 0} d="M19 19h-14">
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.7s"
              dur="0.3s"
              to="0"
            />
          )}
        </path>
      </g>
    </svg>
  );
}
