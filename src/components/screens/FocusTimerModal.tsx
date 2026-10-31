import React, { useState, useEffect } from "react";
import { Book } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { X, Play, Pause, Plus, Minus, RotateCcw, Check, Sparkles } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

interface FocusTimerModalProps {
  isOpen: boolean;
  book: Book | null;
  targetMinutes?: number;
  onClose: () => void;
  onFinishReading: (minutesSpent: number) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  book,
  targetMinutes = 15,
  onClose,
  onFinishReading,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(targetMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(targetMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Sync initial target
  useEffect(() => {
    setTotalSeconds(targetMinutes * 60);
    setRemainingSeconds(targetMinutes * 60);
    setIsRunning(false);
  }, [targetMinutes, isOpen]);

  // Countdown timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      hapticSuccess();
    }
    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

  if (!isOpen) return null;

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const togglePlay = () => {
    hapticLight();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    hapticLight();
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const handleAdjustMinutes = (delta: number) => {
    hapticLight();
    const newTotal = Math.max(60, totalSeconds + delta * 60);
    setTotalSeconds(newTotal);
    setRemainingSeconds(newTotal);
  };

  const handleComplete = () => {
    hapticSuccess();
    const elapsedMinutes = Math.max(
      1,
      Math.round((totalSeconds - remainingSeconds) / 60) || targetMinutes
    );
    onFinishReading(elapsedMinutes);
    onClose();
  };

  // Format mm:ss
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Progress percentage
  const progressPercent = Math.min(
    100,
    Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)
  );

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/85 backdrop-blur-md transition-opacity duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[92vh] bg-[#0E0E0E] text-white rounded-t-[38px] border-t-[3.5px] border-[#FFA83A] p-6 pb-12 overflow-y-auto no-scrollbar shadow-[0_-12px_40px_rgba(0,0,0,0.95)] flex flex-col items-center text-center animate-sheet-slide"
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-3 flex-shrink-0" />

        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-2 flex-shrink-0">
          <span
            className="px-3.5 py-1 rounded-full text-[10px] font-poppins font-extrabold uppercase tracking-wider bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E]"
            style={{ boxShadow: "2px 2px 0px #FFFFFF" }}
          >
            ⏱️ Quiet Focus Mode
          </span>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Current Book Info */}
        <div className="mt-3 text-center">
          <span className="text-[11px] font-poppins font-bold uppercase tracking-widest text-[#FFA83A]">
            Reading Session
          </span>
          <h2 className="font-poppins font-black text-xl text-white mt-0.5 line-clamp-1">
            {book ? book.title : "Your Book"}
          </h2>
          <p className="font-playfair italic text-sm text-neutral-400 mt-1">
            “Quiet the noise. One page at a time.”
          </p>
        </div>

        {/* Live Circular Countdown & Mascot Stage */}
        <div className="relative my-6 flex flex-col items-center justify-center">
          {/* Subtle Outer Glow Aura */}
          <div
            className="w-56 h-56 rounded-full border-4 border-white/10 bg-[#141414] shadow-[0_0_50px_rgba(255,168,58,0.15)] flex flex-col items-center justify-center relative"
          >
            {/* SVG Ring Progress */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#FFA83A"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * progressPercent) / 100}
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Living Mascot inside the Circle */}
            <div className="scale-75 -mt-3">
              <Mascot state={isRunning ? "thinking" : "happy"} ground="ink" size="sm" />
            </div>

            {/* Digital Timer */}
            <div className="font-poppins font-black text-3xl tracking-tight text-[#FFA83A] -mt-1">
              {timeFormatted}
            </div>

            <span className="font-poppins font-extrabold text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">
              {isRunning ? "Deep in focus..." : remainingSeconds === 0 ? "Session Complete!" : "Ready to read"}
            </span>
          </div>
        </div>

        {/* Timer Controls: +5m, Play/Pause, -5m, Reset */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleAdjustMinutes(-5)}
            className="w-11 h-11 rounded-full bg-[#181818] border border-white/15 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Minus 5 minutes"
          >
            <span className="font-poppins font-bold text-xs">-5m</span>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#FFA83A] text-[#0E0E0E] flex items-center justify-center font-bold border-2 border-[#0E0E0E] shadow-[3px_3px_0px_#FFFFFF] active:scale-95 transition-transform cursor-pointer"
            aria-label={isRunning ? "Pause" : "Play"}
          >
            {isRunning ? (
              <Pause size={24} className="stroke-[3] fill-current" />
            ) : (
              <Play size={24} className="stroke-[3] fill-current ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleAdjustMinutes(5)}
            className="w-11 h-11 rounded-full bg-[#181818] border border-white/15 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Plus 5 minutes"
          >
            <span className="font-poppins font-bold text-xs">+5m</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-11 h-11 rounded-full bg-[#181818] border border-white/15 text-neutral-400 hover:text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Reset timer"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Primary CTA: Done reading? Log Session */}
        <button
          type="button"
          onClick={handleComplete}
          className="w-full h-14 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-base flex items-center justify-center border-[2.5px] border-[#0E0E0E] shadow-[4px_4px_0px_#FFFFFF] active:scale-[0.98] transition-transform duration-[90ms] cursor-pointer"
        >
          <span>Done Reading? Log Session →</span>
        </button>

        <p className="font-poppins text-[11px] text-neutral-400 mt-2.5">
          You don't have to keep your screen on. You can lock your phone and read.
        </p>
      </div>
    </div>
  );
};
