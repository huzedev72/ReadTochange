import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

export type FlameState = "idle" | "ignite" | "at_risk" | "lost";

export interface StreakFlameProps {
  days: number;
  state?: FlameState;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  ground?: "ink" | "sun" | "paper";
  interactive?: boolean;
  onIgniteComplete?: () => void;
  className?: string;
}

export interface FlameGeometry {
  outer: string;
  core: string;
  heart?: string;
  faceY: number;
  faceSpacing: number;
}

export const FLAME_GEOMETRIES: Record<string, FlameGeometry> = {
  // Day 0: Extinguished Ember (resting low, squat, asleep)
  ember: {
    outer: "M32 32C40 32 50 40 52 52C54 64 44 72 32 72C20 72 10 64 12 52C14 40 24 32 32 32Z",
    core: "M32 42C37 42 43 47 44 55C45 62 40 67 32 67C24 67 19 62 20 55C21 47 27 42 32 42Z",
    faceY: 54,
    faceSpacing: 8,
  },

  // Day 1: Spark (slender, quiet, single candle teardrop)
  spark_1: {
    outer: "M32 14C34 22 43 32 45 44C47 56 42 72 32 72C22 72 17 56 19 44C21 32 30 22 32 14Z",
    core: "M32 30C34 36 39 44 39 52C39 60 36 66 32 66C28 66 25 60 25 52C25 44 30 36 32 30Z",
    heart: "M32 44C33 48 35 52 35 56C35 60 34 62 32 62C30 62 29 60 29 56C29 52 31 48 32 44Z",
    faceY: 53,
    faceSpacing: 7.5,
  },

  // Day 2: Spark (fuller candle flame)
  spark_2: {
    outer: "M32 10C35 18 45 28 47 42C49 56 43 72 32 72C21 72 15 56 17 42C19 28 29 18 32 10Z",
    core: "M32 28C34 34 40 42 40 52C40 62 36 67 32 67C28 67 24 62 24 52C24 42 30 34 32 28Z",
    heart: "M32 42C33 46 36 50 36 55C36 60 34 63 32 63C30 63 28 60 28 55C28 50 31 46 32 42Z",
    faceY: 52,
    faceSpacing: 8,
  },

  // Day 3: Kindle (Level Up! first side tongue bud appears on the right)
  kindle_day3: {
    outer: "M30 8C32 17 38 23 40 28C43 25 47 26 50 32C53 38 52 45 50 50C52 58 47 72 32 72C17 72 13 58 14 46C15 35 22 24 26 18C28 14 29 11 30 8Z",
    core: "M30 22C32 28 37 32 38 37C41 35 44 37 45 42C46 47 44 53 42 57C42 63 38 67 31 67C22 67 20 58 21 50C22 43 25 35 28 29C29 25 30 23 30 22Z",
    heart: "M30 37C32 41 35 45 36 49C37 54 35 58 31 58C26 58 25 54 26 49C27 45 29 41 30 37Z",
    faceY: 50,
    faceSpacing: 9,
  },

  // Day 4: Kindle (pronounced curling side flame, visibly taller and wider than Day 1 & Day 3)
  kindle_day4: {
    outer: "M28 5C31 15 37 20 40 25C44 20 50 21 53 28C56 35 54 44 52 50C54 59 48 73 32 73C16 73 11 59 13 46C14 33 21 21 25 15C27 10 27 7 28 5Z",
    core: "M28 18C30 25 35 29 37 34C41 31 45 33 46 39C48 45 45 52 43 56C43 63 38 68 30 68C21 68 18 58 19 49C20 41 23 33 26 26C27 21 28 19 28 18Z",
    heart: "M28 34C30 38 33 42 34 47C35 52 33 57 29 57C24 57 23 52 24 47C25 43 27 38 28 34Z",
    faceY: 49,
    faceSpacing: 10,
  },

  // Day 5: Kindle (soaring dual tongues split into two dynamic dancing flames)
  kindle_day5: {
    outer: "M25 4C28 13 30 18 32 23C34 16 39 12 43 15C48 18 52 25 52 35C55 43 54 55 48 65C42 74 24 74 16 66C10 56 10 42 14 30C17 20 22 12 25 4Z",
    core: "M26 18C28 24 30 28 32 33C34 27 37 24 41 26C44 28 45 35 45 42C46 48 44 56 40 62C35 70 24 69 19 63C15 56 16 46 18 36C21 28 24 22 26 18Z",
    heart: "M27 32C29 36 31 40 32 44C34 40 36 38 38 40C39 42 40 46 39 51C38 57 34 60 29 60C24 60 23 55 24 49C25 44 26 38 27 32Z",
    faceY: 48,
    faceSpacing: 11,
  },

  // Day 6: Kindle (maximum pre-Blaze campfire: broad waist, energetic twin dancing tongues, side licks)
  kindle_day6: {
    outer: "M23 2C27 12 30 17 33 22C35 14 41 9 46 12C51 15 55 24 55 35C58 45 56 57 49 67C43 76 23 76 14 67C8 56 8 40 12 28C16 17 21 9 23 2Z",
    core: "M25 15C28 22 30 26 33 31C35 24 39 20 43 23C47 26 48 33 48 42C49 49 47 58 42 64C36 71 24 70 18 64C13 56 14 45 17 34C20 26 23 20 25 15Z",
    heart: "M26 28C28 33 30 37 32 41C34 37 37 34 39 37C41 40 42 44 41 49C40 56 35 59 29 59C24 59 23 54 24 47C25 42 26 35 26 28Z",
    faceY: 47,
    faceSpacing: 11.5,
  },

  // Day 7-29: Blaze (roaring 3-tongued crowned fire with wide energetic base)
  blaze: {
    outer: "M32 2C34 10 37 16 40 20C44 14 49 14 52 20C55 26 55 36 54 44C57 52 54 66 44 72C34 78 16 76 10 66C4 54 8 38 13 28C16 22 20 22 23 28C26 22 30 12 32 2Z",
    core: "M32 16C33 22 36 26 38 29C41 25 44 25 46 30C48 35 47 42 46 48C48 54 45 64 38 67C30 70 19 69 16 61C12 52 14 41 18 34C20 30 23 30 25 34C28 29 30 22 32 16Z",
    heart: "M32 30C34 35 37 38 38 42C40 39 42 40 43 44C43 49 41 54 37 57C32 60 26 59 24 54C22 48 24 42 27 38C28 36 30 36 31 38C32 36 32 33 32 30Z",
    faceY: 48,
    faceSpacing: 12,
  },

  // Day 30+: Inferno (crowned solar blaze, multi-crested royal fire, spinning celestial halo)
  inferno: {
    outer: "M32 0C35 8 38 14 42 16C46 10 52 10 55 16C58 22 56 32 58 40C62 48 60 64 50 72C38 80 14 78 6 68C0 56 4 40 10 30C14 22 18 24 21 30C24 22 27 16 29 16C30 10 31 4 32 0Z",
    core: "M32 14C34 20 37 24 39 26C42 21 46 21 48 26C50 31 49 38 50 44C52 50 50 62 42 67C32 72 17 71 12 62C8 53 10 42 15 34C18 29 20 30 22 35C24 29 26 25 28 24C29 20 30 16 32 14Z",
    heart: "M32 26C34 31 36 34 38 36C40 32 43 33 44 37C45 42 44 47 42 52C38 58 27 58 22 52C19 46 21 39 24 35C26 32 27 33 28 36C29 32 30 28 32 26Z",
    faceY: 47,
    faceSpacing: 13,
  },
};

export function getFlameStageInfo(days: number, state?: FlameState) {
  if (state === "lost" || days <= 0) {
    return { stageKey: "ember", name: "Extinguished", scale: 0.82, sparks: 0, halo: false };
  }
  if (days === 1) {
    return { stageKey: "spark_1", name: "Spark", scale: 0.92, sparks: 2, halo: false };
  }
  if (days === 2) {
    return { stageKey: "spark_2", name: "Spark", scale: 0.98, sparks: 2, halo: false };
  }
  if (days === 3) {
    return { stageKey: "kindle_day3", name: "Kindle", scale: 1.06, sparks: 3, halo: false };
  }
  if (days === 4) {
    return { stageKey: "kindle_day4", name: "Kindle", scale: 1.14, sparks: 3, halo: false };
  }
  if (days === 5) {
    return { stageKey: "kindle_day5", name: "Kindle", scale: 1.20, sparks: 4, halo: false };
  }
  if (days === 6) {
    return { stageKey: "kindle_day6", name: "Kindle", scale: 1.28, sparks: 4, halo: false };
  }
  if (days < 30) {
    const scale = days >= 14 ? 1.44 : 1.36;
    return { stageKey: "blaze", name: "Blaze", scale, sparks: 5, halo: false };
  }
  return { stageKey: "inferno", name: "Inferno", scale: 1.55, sparks: 6, halo: true };
}

export const StreakFlame: React.FC<StreakFlameProps> = ({
  days,
  state = "idle",
  size = "md",
  showBadge = true,
  ground = "ink",
  interactive = true,
  onIgniteComplete,
  className,
}) => {
  const [animState, setAnimState] = useState<FlameState>(state);
  const [isPoked, setIsPoked] = useState(false);
  const [displayedDays, setDisplayedDays] = useState(days);
  const [showLevelUpBanner, setShowLevelUpBanner] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const info = getFlameStageInfo(days, animState);
  const geo = FLAME_GEOMETRIES[info.stageKey] || FLAME_GEOMETRIES.spark_1;
  const isLevelUpDay = days === 3 || days === 7 || days === 30;

  // React to prop state changes
  useEffect(() => {
    setAnimState(state);

    if (state === "ignite") {
      hapticSuccess();
      if (days > 1) {
        setDisplayedDays(days - 1);
        setTimeout(() => setDisplayedDays(days), 350);
      } else {
        setDisplayedDays(days);
      }

      if (isLevelUpDay) {
        setShowLevelUpBanner(true);
      }

      const timer = setTimeout(() => {
        setAnimState("idle");
        setShowLevelUpBanner(false);
        onIgniteComplete?.();
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setDisplayedDays(days);
    }
  }, [state, days, isLevelUpDay, onIgniteComplete]);

  // Size dimensions for flame body
  const dims = {
    sm: { width: 28, height: 36, containerW: 34, containerH: 38, text: "text-xs" },
    md: { width: 54, height: 66, containerW: 76, containerH: 86, text: "text-base" },
    lg: { width: 88, height: 106, containerW: 130, containerH: 132, text: "text-2xl" },
  }[size];

  // Handle tap / press: trigger interactive ignition burst
  const handlePress = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    hapticSuccess();
    setIsPoked(true);
    setAnimState("ignite");

    if (days > 1) {
      setDisplayedDays(days - 1);
      setTimeout(() => setDisplayedDays(days), 350);
    }

    if (isLevelUpDay) {
      setShowLevelUpBanner(true);
    }

    setTimeout(() => {
      setIsPoked(false);
    }, 450);

    const timer = setTimeout(() => {
      setAnimState("idle");
      setShowLevelUpBanner(false);
      onIgniteComplete?.();
    }, 1200);
  };

  const isIgniting = animState === "ignite" && !prefersReducedMotion;
  const isAtRisk = animState === "at_risk";
  const isLost = animState === "lost" || days <= 0;

  // Badge text color based on ground
  const badgeTextColor =
    isLost
      ? "text-neutral-500"
      : ground === "sun"
      ? "text-[#0E0E0E]"
      : "text-white";

  const leftEyeX = 32 - geo.faceSpacing / 2;
  const rightEyeX = 32 + geo.faceSpacing / 2;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center select-none overflow-visible",
        interactive && "cursor-pointer",
        className
      )}
      aria-label={`${days} day streak - ${info.name}. Flame state: ${animState}`}
    >
      {/* 1. Dedicated Flame Stage: perfectly bounds flame, shockwaves, halo, and sparks */}
      <div
        onClick={handlePress}
        className="relative flex items-center justify-center overflow-visible"
        style={{
          width: `${dims.containerW}px`,
          height: `${dims.containerH}px`,
        }}
      >
        {/* Level Up Banner Overlay */}
        {showLevelUpBanner && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E] rounded-full px-3 py-0.5 text-[10px] font-poppins font-black uppercase tracking-wider shadow-[2px_2px_0px_#FFFFFF] animate-curious-pop pointer-events-none z-30 whitespace-nowrap">
            ⭐ Level Up: {info.name}!
          </div>
        )}

        {/* Primary Shockwave Expanding Burst Ring (Centered directly on flame) */}
        {isIgniting && (
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#FFA83A] pointer-events-none animate-flame-shockwave"
            style={{ width: dims.width * 1.5, height: dims.height * 1.5 }}
          />
        )}

        {/* Secondary Shockwave Ring for Milestone Level Up Days */}
        {isIgniting && isLevelUpDay && (
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none animate-flame-shockwave"
            style={{
              width: dims.width * 1.85,
              height: dims.height * 1.85,
              animationDelay: "0.15s",
            }}
          />
        )}

        {/* Solar Halo (Day 30+ Inferno level) */}
        {info.halo && !isLost && !prefersReducedMotion && (
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-flame-halo"
            width={dims.width * 1.65}
            height={dims.height * 1.65}
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#FFA83A"
              strokeWidth="2.8"
              strokeDasharray="6 8"
              opacity="0.65"
            />
          </svg>
        )}

        {/* Rising Sparks (Natural idle secondary motion scaled with flame level) */}
        {!isLost && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            <span className="absolute left-[35%] bottom-[58%] w-1.5 h-1.5 rounded-full bg-[#FFA83A] animate-spark-float-1" />
            <span className="absolute left-[62%] bottom-[48%] w-1 h-1 rounded-full bg-[#FFE3A8] animate-spark-float-2" />
            {info.sparks >= 3 && (
              <span className="absolute left-[44%] bottom-[74%] w-1.5 h-1.5 rounded-full bg-[#FFA83A] animate-spark-float-3" />
            )}
            {info.sparks >= 4 && (
              <span className="absolute left-[25%] bottom-[50%] w-1 h-1 rounded-full bg-[#FFD285] animate-spark-float-1" style={{ animationDelay: "0.8s" }} />
            )}
            {info.sparks >= 5 && (
              <span className="absolute left-[70%] bottom-[65%] w-1.5 h-1.5 rounded-full bg-[#FFA83A] animate-spark-float-2" style={{ animationDelay: "1.2s" }} />
            )}
          </div>
        )}

        {/* Thin Smoke Curls (When streak is lost) */}
        {isLost && !prefersReducedMotion && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="block w-2.5 h-2.5 rounded-full bg-neutral-500/50 animate-smoke-rise-1" />
            <span className="block w-2 h-2 rounded-full bg-neutral-400/40 animate-smoke-rise-2 -mt-1 ml-1.5" />
          </div>
        )}

        {/* Hand-Drawn Doodle SVG Flame Body */}
        <div
          className={cn(
            "relative transition-all duration-300 transform-gpu overflow-visible",
            !isLost && !prefersReducedMotion && !isIgniting && "animate-flame-flicker",
            isPoked && "scale-125 -rotate-6",
            isIgniting && "animate-flame-ignite",
            isAtRisk && "opacity-75 scale-90 filter saturate-75",
            isLost && "opacity-45 scale-75 grayscale"
          )}
          style={{
            width: `${dims.width}px`,
            height: `${dims.height}px`,
            transform:
              !prefersReducedMotion && !isPoked && !isIgniting
                ? `scale(${info.scale})`
                : undefined,
          }}
        >
          <svg
            viewBox="-8 -8 80 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "w-full h-full overflow-visible filter",
              days >= 7
                ? "drop-shadow-[0_4px_18px_rgba(255,168,58,0.65)]"
                : "drop-shadow-[0_4px_14px_rgba(255,168,58,0.45)]"
            )}
          >
            {/* Outer Flame Shadow / Hard doodle contour */}
            <path
              d={geo.outer}
              transform="translate(3 3)"
              fill="#0E0E0E"
              opacity={0.85}
            />

            {/* Outer Sun Flame Body */}
            <path
              d={geo.outer}
              fill={isLost ? "#4A4A4A" : isAtRisk ? "#E08518" : "#FFA83A"}
              stroke="#0E0E0E"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Inner Golden Core */}
            {!isLost && (
              <path
                d={geo.core}
                fill={isAtRisk ? "#FFA83A" : "#FFD285"}
              />
            )}

            {/* White Hot Living Heart */}
            {!isLost && !isAtRisk && geo.heart && (
              <path
                d={geo.heart}
                fill="#FFFFFF"
              />
            )}

            {/* Doodle Face details in flame */}
            {isLost ? (
              /* Sleeping / lost face (drooped lines) */
              <>
                <path
                  d={`M${leftEyeX - 2} ${geo.faceY} Q${leftEyeX} ${geo.faceY - 2} ${leftEyeX + 2} ${geo.faceY}`}
                  stroke="#0E0E0E"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={`M${rightEyeX - 2} ${geo.faceY} Q${rightEyeX} ${geo.faceY - 2} ${rightEyeX + 2} ${geo.faceY}`}
                  stroke="#0E0E0E"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={`M29 ${geo.faceY + 7} C31 ${geo.faceY + 5} 33 ${geo.faceY + 5} 35 ${geo.faceY + 7}`}
                  stroke="#0E0E0E"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              /* Cheerful living flame eyes & smile */
              <>
                <circle cx={leftEyeX} cy={geo.faceY} r="2.2" fill="#0E0E0E" />
                <circle cx={rightEyeX} cy={geo.faceY} r="2.2" fill="#0E0E0E" />
                <path
                  d={`M29 ${geo.faceY + 6} Q32 ${geo.faceY + 9} 35 ${geo.faceY + 6}`}
                  stroke="#0E0E0E"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* 2. Streak Number Badge / Level Tag */}
      {showBadge && (
        <div className="mt-1 flex flex-col items-center select-none">
          <span
            className={cn(
              "font-poppins font-black leading-none flex items-center justify-center transition-all duration-300",
              dims.text,
              badgeTextColor
            )}
          >
            {displayedDays}
          </span>
          {size !== "sm" && (
            <span
              className={cn(
                "font-poppins font-extrabold text-[9px] uppercase tracking-widest mt-1",
                isLost ? "text-neutral-500" : "text-[#FFA83A]"
              )}
            >
              {isLost ? "Extinguished" : isAtRisk ? "At Risk" : info.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
