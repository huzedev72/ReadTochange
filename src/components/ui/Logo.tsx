import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

interface LogoProps {
  ground?: "paper" | "ink" | "sun";
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  animatedRetract?: boolean;
  retractDelayMs?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  ground = "ink",
  size = "md",
  markOnly = false,
  animatedRetract = false,
  retractDelayMs = 1800,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(!markOnly);

  // Dimension scales
  const markDimensions = {
    sm: { width: 26, height: 26 },
    md: { width: 36, height: 36 },
    lg: { width: 56, height: 56 },
  }[size];

  const textSizes = {
    sm: "text-[16px]",
    md: "text-[22px]",
    lg: "text-[34px]",
  }[size];

  const toSizes = {
    sm: "text-[17px]",
    md: "text-[24px]",
    lg: "text-[38px]",
  }[size];

  // Auto-retract animation logic
  useEffect(() => {
    if (animatedRetract && !markOnly) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, retractDelayMs);
      return () => clearTimeout(timer);
    }
  }, [animatedRetract, markOnly, retractDelayMs]);

  // Handle tap on icon to toggle/expand temporarily
  const handleToggle = () => {
    if (animatedRetract) {
      hapticLight();
      setIsExpanded((prev) => !prev);
      if (!isExpanded) {
        // Retract again after 3 seconds
        setTimeout(() => setIsExpanded(false), 3000);
      }
    }
  };

  // Ground adaptive colors (Strictly honoring 10:1 contrast rule)
  // On sun: White mark, Ink shadow. Text Ink, "to" Ink
  // On ink: Sun mark, White shadow. Text White, "to" Sun
  // On paper: Sun mark, Ink shadow. Text Ink, "to" Sun
  const isSun = ground === "sun";
  const isPaper = ground === "paper";

  const markBodyFill = isSun ? "#FFFFFF" : "#FFA83A";
  const markShadowFill = isSun ? "#0E0E0E" : isPaper ? "#0E0E0E" : "#FFFFFF";
  const strokeColor = "#0E0E0E";
  const chevronStroke = "#0E0E0E";

  const wordmarkTextColor = isSun ? "#0E0E0E" : isPaper ? "#0E0E0E" : "#FFFFFF";
  const toColor = isSun ? "#0E0E0E" : "#FFA83A";

  return (
    <div
      onClick={animatedRetract ? handleToggle : undefined}
      className={cn(
        "inline-flex items-center select-none",
        animatedRetract && "cursor-pointer group",
        className
      )}
      aria-label="ReadToChange"
    >
      {/* 1. Bookmark Mark */}
      <svg
        width={markDimensions.width}
        height={markDimensions.height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "flex-shrink-0 transition-transform duration-200",
          animatedRetract && "group-hover:scale-105 active:scale-95"
        )}
      >
        {/* Drop shadow */}
        <path
          d="M16 6H48V58L32 42L16 58Z"
          transform="translate(4 4)"
          fill={markShadowFill}
        />
        {/* Main bookmark */}
        <path
          d="M16 6H48V58L32 42L16 58Z"
          fill={markBodyFill}
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Upward notch chevron: "Reading that lifts you up" */}
        <polyline
          points="24,28 32,19 40,28"
          fill="none"
          stroke={chevronStroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* 2. Retracting Wordmark */}
      {!markOnly && (
        <div
          className={cn(
            "overflow-hidden flex items-center transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] whitespace-nowrap",
            isExpanded
              ? "max-w-[180px] opacity-100 ml-2"
              : "max-w-0 opacity-0 ml-0 pointer-events-none"
          )}
        >
          <span
            className={cn(
              "font-extrabold tracking-tight font-poppins leading-none flex items-center",
              textSizes
            )}
            style={{ color: wordmarkTextColor }}
          >
            Read
            <span
              className="font-playfair italic font-normal px-0.5"
              style={{ color: toColor, fontSize: toSizes }}
            >
              to
            </span>
            Change
          </span>
        </div>
      )}
    </div>
  );
};
