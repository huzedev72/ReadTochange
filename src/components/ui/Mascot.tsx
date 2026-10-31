import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

export type MascotMood =
  | "idle"
  | "happy"
  | "curious"
  | "thinking"
  | "proud"
  | "celebrate"
  | "sleepy";

// Backwards-compatible type alias
export type MascotState = MascotMood;

interface MascotProps {
  state?: MascotMood;
  ground?: "ink" | "sun" | "paper";
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  state = "happy",
  ground = "ink",
  size = "md",
  interactive = true,
  className,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPoked, setIsPoked] = useState(false);
  const [showOh, setShowOh] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [bodyLean, setBodyLean] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Normalize mood aliases
  const mood = state === "idle" ? "happy" : state === "celebrate" ? "proud" : state;

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

  // Pointer & Finger Tracking: "It looks at you"
  // Eyes follow finger/cursor and body leans a few degrees towards it (±3°)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

      const dx = clientX - mascotCenterX;
      const dy = clientY - mascotCenterY;
      const dist = Math.hypot(dx, dy) || 1;

      // Max eye travel: 3.5px
      const maxEyeTravel = 3.5;
      const factor = Math.min(dist / 200, 1) * maxEyeTravel;
      const eyeX = (dx / dist) * factor;
      const eyeY = (dy / dist) * factor;

      // Max body lean: ±3 degrees
      const lean = Math.max(-3.5, Math.min(3.5, (dx / 300) * 3.5));

      setPupilOffset({ x: eyeX, y: eyeY });
      setBodyLean(lean);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [prefersReducedMotion]);

  // Handle poke reaction: squash & stretch jump, haptic feedback, and "oh!" comic bubble
  const handlePoke = () => {
    if (!interactive || prefersReducedMotion) {
      onClick?.();
      return;
    }

    hapticLight();
    setIsPoked(true);
    setShowOh(true);

    // Reset after jump completes
    setTimeout(() => {
      setIsPoked(false);
    }, 580);

    setTimeout(() => {
      setShowOh(false);
    }, 850);

    onClick?.();
  };

  const scale = {
    sm: 0.7,
    md: 1.0,
    lg: 1.35,
  }[size];

  // Ground shadow styling based on surface
  const shadowColor =
    ground === "ink"
      ? "#FFA83A"
      : ground === "sun"
      ? "rgba(14, 14, 14, 0.75)"
      : "#0E0E0E";

  return (
    <div
      ref={containerRef}
      onClick={handlePoke}
      className={cn(
        "relative inline-block select-none transform-gpu",
        interactive && "cursor-pointer",
        className
      )}
      style={{
        width: `${140 * scale}px`,
        height: `${125 * scale}px`,
      }}
      aria-label={`ReadToChange mascot - ${state}. Tap to poke.`}
    >
      <div
        className="relative"
        style={{
          width: "120px",
          height: "104px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Comic "oh!" Pop Bubble on Poke */}
        {showOh && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-[#0E0E0E] border-2 border-[#0E0E0E] rounded-full px-2.5 py-0.5 text-[11px] font-poppins font-black shadow-[2px_2px_0px_#0E0E0E] animate-curious-pop pointer-events-none z-30 flex items-center gap-1">
            <span>oh!</span>
          </div>
        )}

        {/* 1. Ground Shadow (Shrinks when jumping / poked) */}
        <div
          className={cn(
            "absolute bottom-0 left-[20px] w-[88px] h-[10px] rounded-[50%] transition-opacity duration-200 pointer-events-none",
            isPoked && "animate-mascot-shadow-shrink"
          )}
          style={{
            backgroundColor: shadowColor,
            opacity: ground === "ink" ? 0.35 : 0.22,
            filter: "blur(2px)",
          }}
        />

        {/* 2. Mascot Body Wrapper: Applies Lean, Poke Jump, and Natural Breathing */}
        <div
          className={cn(
            "relative w-full h-full transform-gpu",
            !isPoked && !prefersReducedMotion && "animate-mascot-breathe",
            isPoked && "animate-mascot-poke",
            mood === "thinking" && !isPoked && "animate-thinking-sway",
            mood === "proud" && !isPoked && "animate-chest-puff"
          )}
          style={{
            transform: !prefersReducedMotion && !isPoked ? `rotate(${bodyLean}deg)` : undefined,
            transition: "transform 0.15s ease-out",
          }}
        >
          {/* Book Body: Tactile Doodle Glass aesthetic */}
          <div
            className="absolute inset-0 bg-white border-[3px] border-[#0E0E0E] box-border"
            style={{
              borderRadius: "27px 20px 24px 22px",
              boxShadow: `5px 5px 0px ${shadowColor}`,
            }}
          />

          {/* Spine line */}
          <div className="absolute left-[17px] top-[8px] bottom-[8px] w-[3px] bg-[#0E0E0E]" />

          {/* 3. Eyes Section: Natural Blinking & Pupil Tracking */}
          <div className="absolute left-[13px] right-0 top-[26px] flex justify-center gap-2">
            {mood === "happy" && (
              <>
                <span className="relative w-7 h-7 rounded-full bg-white border-[3px] border-[#0E0E0E] overflow-hidden animate-mascot-blink">
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full bg-[#0E0E0E] transition-transform duration-75"
                    style={{
                      left: "7px",
                      top: "7px",
                      transform: !prefersReducedMotion
                        ? `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
                        : undefined,
                    }}
                  />
                </span>
                <span className="relative w-7 h-7 rounded-full bg-white border-[3px] border-[#0E0E0E] overflow-hidden animate-mascot-blink">
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full bg-[#0E0E0E] transition-transform duration-75"
                    style={{
                      left: "7px",
                      top: "7px",
                      transform: !prefersReducedMotion
                        ? `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
                        : undefined,
                    }}
                  />
                </span>
              </>
            )}

            {mood === "curious" && (
              <>
                <span className="relative w-8 h-8 rounded-full bg-white border-[3px] border-[#0E0E0E] overflow-hidden animate-mascot-blink">
                  <span
                    className="absolute w-2 h-2 rounded-full bg-[#0E0E0E] transition-transform duration-75"
                    style={{
                      left: "9px",
                      top: "9px",
                      transform: !prefersReducedMotion
                        ? `translate(${pupilOffset.x * 0.7}px, ${pupilOffset.y * 0.7}px)`
                        : undefined,
                    }}
                  />
                </span>
                <span className="relative w-8 h-8 rounded-full bg-white border-[3px] border-[#0E0E0E] overflow-hidden animate-mascot-blink">
                  <span
                    className="absolute w-2 h-2 rounded-full bg-[#0E0E0E] transition-transform duration-75"
                    style={{
                      left: "9px",
                      top: "9px",
                      transform: !prefersReducedMotion
                        ? `translate(${pupilOffset.x * 0.7}px, ${pupilOffset.y * 0.7}px)`
                        : undefined,
                    }}
                  />
                </span>
              </>
            )}

            {mood === "thinking" && (
              <>
                <span className="relative w-7 h-7 rounded-full bg-white border-[3px] border-[#0E0E0E] overflow-hidden animate-mascot-blink">
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full bg-[#0E0E0E] transition-transform duration-100"
                    style={{
                      right: "3px",
                      top: "2px",
                      transform: !prefersReducedMotion
                        ? `translate(${pupilOffset.x * 0.4}px, ${pupilOffset.y * 0.4}px)`
                        : undefined,
                    }}
                  />
                </span>
                <span className="relative w-7 h-7 rounded-full bg-white border-[3px] border-[#0E0E0E] overflow-hidden animate-mascot-blink">
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full bg-[#0E0E0E] transition-transform duration-100"
                    style={{
                      right: "3px",
                      top: "2px",
                      transform: !prefersReducedMotion
                        ? `translate(${pupilOffset.x * 0.4}px, ${pupilOffset.y * 0.4}px)`
                        : undefined,
                    }}
                  />
                </span>
              </>
            )}

            {mood === "proud" && (
              <>
                <span className="w-6 h-3 border-t-[5px] border-[#0E0E0E] rounded-t-full mt-2" />
                <span className="w-6 h-3 border-t-[5px] border-[#0E0E0E] rounded-t-full mt-2" />
              </>
            )}

            {mood === "sleepy" && (
              <>
                <span className="w-6 h-0 border-b-[4px] border-[#0E0E0E] mt-3" />
                <span className="w-6 h-0 border-b-[4px] border-[#0E0E0E] mt-3" />
              </>
            )}
          </div>

          {/* 4. Mouth Section */}
          <div className="absolute left-[13px] right-0 top-[67px] flex justify-center">
            {mood === "happy" && (
              <span className="w-8 h-4 bg-[#0E0E0E] rounded-b-full" />
            )}

            {mood === "curious" && (
              <span className="w-3.5 h-3.5 border-[3.5px] border-[#0E0E0E] rounded-full" />
            )}

            {mood === "thinking" && (
              <span className="w-5 h-0 border-b-[3.5px] border-[#0E0E0E] rotate-[-4deg]" />
            )}

            {mood === "proud" && (
              <span className="w-9 h-4 bg-[#0E0E0E] rounded-b-full" />
            )}

            {mood === "sleepy" && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E0E0E]" />
            )}
          </div>

          {/* 5. Secondary Motion Overlays (Per Mood Spec) */}

          {/* Curious: Head-tilt "?" popping in & bobbing */}
          {mood === "curious" && (
            <span className="absolute -right-3 -top-4 font-poppins font-extrabold text-[28px] text-[#FFA83A] animate-curious-pop animate-curious-bob drop-shadow-[2px_2px_0px_#0E0E0E] select-none">
              ?
            </span>
          )}

          {/* Thinking: Staggered rising thought bubbles */}
          {mood === "thinking" && (
            <div className="absolute -right-5 -top-6 pointer-events-none">
              <span className="absolute right-6 top-7 w-2 h-2 rounded-full bg-[#FFA83A] border border-[#0E0E0E] animate-thought-1" />
              <span className="absolute right-3 top-3 w-3 h-3 rounded-full bg-[#FFA83A] border border-[#0E0E0E] animate-thought-2" />
              <span className="absolute right-0 -top-2 w-4 h-4 rounded-full bg-[#FFA83A] border border-[#0E0E0E] animate-thought-3" />
            </div>
          )}

          {/* Proud / Celebrate: Sparkles & Star burst */}
          {mood === "proud" && (
            <div className="pointer-events-none">
              <span className="absolute -left-3 -top-2 w-3.5 h-3.5 bg-[#FFA83A] border border-[#0E0E0E] rotate-45 animate-sparkle" />
              <span
                className="absolute left-[116px] -top-3 w-4 h-4 bg-[#FFA83A] border border-[#0E0E0E] rotate-45 animate-sparkle"
                style={{ animationDelay: "0.4s" }}
              />
              <span
                className="absolute left-[122px] top-7 w-3 h-3 bg-[#FFA83A] border border-[#0E0E0E] rotate-45 animate-sparkle"
                style={{ animationDelay: "0.8s" }}
              />
            </div>
          )}

          {/* Sleepy: Floating Zs */}
          {mood === "sleepy" && (
            <div className="pointer-events-none">
              <span className="absolute -right-3 -top-1 font-poppins font-black text-xl text-[#FFA83A] animate-floating-z1 select-none">
                Z
              </span>
              <span className="absolute -right-1 -top-3 font-poppins font-black text-sm text-[#FFA83A] animate-floating-z2 select-none">
                z
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
