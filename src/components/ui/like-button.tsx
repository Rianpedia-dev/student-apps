"use client";

import React, { useId, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface LikeButtonProps {
  id?: string;
  initialLiked?: boolean;
  liked?: boolean;
  count?: number;
  text?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
  disabled?: boolean;
  onLikeToggle?: (liked: boolean) => void | Promise<void>;
}

export function LikeButton({
  id,
  initialLiked = false,
  liked: controlledLiked,
  count = 68,
  text = "Likes",
  size = "default",
  className,
  disabled = false,
  onLikeToggle,
}: LikeButtonProps) {
  const generatedId = useId();
  const inputId = id || `heart-${generatedId}`;

  const isControlled = controlledLiked !== undefined;
  const [internalLiked, setInternalLiked] = useState(initialLiked);
  const isLiked = isControlled ? controlledLiked : internalLiked;

  // Sync internal state if controlledLiked changes
  useEffect(() => {
    if (isControlled) {
      setInternalLiked(controlledLiked);
    }
  }, [isControlled, controlledLiked]);

  // Number animation calculation:
  // When unliked, counter "one" shows baseCount (at y: 0) and counter "two" shows baseCount + 1 (at y: 32px / 40px).
  // When liked, counter "one" slides up to -32px and counter "two" slides to 0.
  const baseCount = isLiked ? Math.max(0, count - 1) : count;
  const unlikedCount = baseCount;
  const likedCount = baseCount + 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const nextLiked = e.target.checked;
    if (!isControlled) {
      setInternalLiked(nextLiked);
    }
    onLikeToggle?.(nextLiked);
  };

  return (
    <div
      className={cn(
        "like-button",
        size === "sm" && "size-sm",
        size === "lg" && "size-lg",
        disabled && "opacity-60 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <input
        className="on"
        id={inputId}
        type="checkbox"
        checked={isLiked}
        onChange={handleChange}
        disabled={disabled}
      />
      <label className="like" htmlFor={inputId}>
        <svg
          className="like-icon"
          fillRule="nonzero"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
        <span className="like-text">{text}</span>
      </label>
      <label className="like-count one" htmlFor={inputId}>
        {unlikedCount}
      </label>
      <label className="like-count two" htmlFor={inputId}>
        {likedCount}
      </label>
    </div>
  );
}

export function DemoOne() {
  return <LikeButton />;
}

export default LikeButton;
