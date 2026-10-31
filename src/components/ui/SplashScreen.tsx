import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 1.1s total presentation matching the motion spec
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onComplete, 250);
    }, 1100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      onClick={() => {
        setFadingOut(true);
        setTimeout(onComplete, 150);
      }}
      className={cn(
        "fixed inset-0 z-[9999] bg-[#0E0E0E] text-white flex flex-col items-center justify-center select-none transition-opacity duration-300",
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated Mark: drops from -28px with 6 deg tilt, settles at -4 deg */}
        <div className="animate-mark-drop">
          <svg
            width="80"
            height="80"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-xl"
          >
            {/* White offset shadow */}
            <path
              d="M16 6H48V58L32 42L16 58Z"
              transform="translate(4 4)"
              fill="#FFFFFF"
            />
            {/* Sun Bookmark */}
            <path
              d="M16 6H48V58L32 42L16 58Z"
              fill="#FFA83A"
              stroke="#0E0E0E"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Upward Chevron */}
            <polyline
              points="24,28 32,19 40,28"
              fill="none"
              stroke="#0E0E0E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark and Tagline: rises 12px with 250ms delay */}
        <div className="animate-wordmark-rise text-center flex flex-col items-center">
          <span className="font-poppins font-extrabold text-[36px] tracking-tight leading-none text-white">
            Read
            <span className="font-playfair italic font-normal text-[40px] text-[#FFA83A] px-1">
              to
            </span>
            Change
          </span>
          <p className="mt-2 text-xs font-poppins font-bold tracking-widest uppercase text-neutral-400">
            Turn what you read into who you become
          </p>
        </div>
      </div>
    </div>
  );
};
