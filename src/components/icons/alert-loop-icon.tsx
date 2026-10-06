"use client";

import { useState, useEffect, useRef, useCallback, type SVGProps } from "react";
import { cn } from "@/lib/utils";

interface AlertLoopIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  isHovered?: boolean;
  isAnimated?: boolean;
}

export function AlertLoopIcon({
  size = 24,
  className,
  isHovered,
  isAnimated = true,
  ...props
}: AlertLoopIconProps) {
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
        <path strokeDasharray="60" d="M12 3l9 17h-18l9 -17Z">
          {isAnimated && (
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              dur="0.6s"
              values="60;0"
            />
          )}
        </path>
        <path strokeDasharray="6" strokeDashoffset={isAnimated ? 6 : 0} d="M12 10v4">
          {isAnimated && (
            <>
              <animate
                attributeName="stroke-width"
                begin="0.7s"
                dur="3s"
                keyTimes="0;0.1;0.2;0.3;1"
                repeatCount="indefinite"
                values="2;3;3;2;2"
              />
              <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                begin="0.7s"
                dur="0.2s"
                to="0"
              />
            </>
          )}
        </path>
        <path
          strokeDasharray="4"
          strokeDashoffset={isAnimated ? 4 : 0}
          d="M12 17v0.01"
        >
          {isAnimated && (
            <>
              <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                begin="0.7s"
                dur="0.2s"
                to="0"
              />
              <animate
                attributeName="stroke-width"
                begin="1s"
                dur="3s"
                keyTimes="0;0.1;0.2;0.3;1"
                repeatCount="indefinite"
                values="2;3;3;2;2"
              />
            </>
          )}
        </path>
      </g>
    </svg>
  );
}
