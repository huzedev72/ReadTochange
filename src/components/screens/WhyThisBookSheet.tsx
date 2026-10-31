import React from "react";
import { Book } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { X, Sparkles, Clock, Calendar, Target, CheckCircle2 } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { parseBookTitle } from "@/lib/utils";

interface WhyThisBookSheetProps {
  book: Book | null;
  onClose: () => void;
  onStartReading: (book: Book) => void;
}

export const WhyThisBookSheet: React.FC<WhyThisBookSheetProps> = ({
  book,
  onClose,
  onStartReading,
}) => {
  if (!book) return null;

  const { mainTitle, subtitle } = parseBookTitle(book.title);

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const handleCommit = () => {
    hapticSuccess();
    onClose();
    onStartReading(book);
  };

  // Estimated days at 20-25 pages/day or 15 mins/day
  const estimatedDays = Math.max(7, Math.round(book.totalPages / 22));

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md transition-opacity duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[90vh] bg-[#0E0E0E] text-white rounded-t-[38px] border-t-[3.5px] border-[#FFA83A] p-6 pb-9 overflow-y-auto no-scrollbar shadow-[0_-12px_40px_rgba(0,0,0,0.9)] flex flex-col animate-sheet-slide"
      >
        {/* Tactile drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-3 flex-shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="px-3.5 py-1 rounded-full text-[10px] font-poppins font-extrabold uppercase tracking-wider bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E]"
              style={{ boxShadow: "2px 2px 0px #FFFFFF" }}
            >
              ⚡ For {book.growthCategory}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Book Title & Playfair Hook */}
        <div className="mt-2 mb-4 text-left">
          <h2 className="font-poppins font-extrabold text-[24px] leading-[1.1] text-white tracking-tight line-clamp-2">
            Why {mainTitle}?
          </h2>
          {subtitle && (
            <p className="font-poppins text-xs font-medium text-neutral-300 mt-0.5 line-clamp-1 opacity-90">
              {subtitle}
            </p>
          )}
          <p className="font-playfair italic text-sm text-[#FFA83A] mt-1">
            “{book.aiHook}”
          </p>
        </div>

        {/* Short Summary Card */}
        {book.summary && (
          <div className="mb-4 bg-white/[0.07] border border-white/15 backdrop-blur-md rounded-[20px] p-3.5 text-left">
            <span className="text-[9.5px] font-poppins font-extrabold uppercase tracking-widest text-[#FFA83A] block mb-1">
              📖 WHAT THIS BOOK IS ABOUT
            </span>
            <p className="font-poppins text-xs text-neutral-200 leading-relaxed font-normal">
              {book.summary}
            </p>
          </div>
        )}

        {/* 1. Mascot’s Hand-Drawn Speech Bubble (Authentic Doodle Glass) */}
        <div className="relative mb-5 flex items-start gap-3">
          {/* Hand-drawn Mascot */}
          <div className="flex-shrink-0 mt-2">
            <Mascot state="curious" ground="ink" size="sm" />
          </div>

          {/* Tactile Speech Bubble in Creamy Paper */}
          <div
            className="relative flex-1 bg-[#FFFDF9] text-[#0E0E0E] rounded-[24px] p-4 border-[2.5px] border-[#0E0E0E] text-left"
            style={{
              boxShadow: "4px 4px 0px #FFA83A",
            }}
          >
            {/* SVG speech bubble tail pointing to the mascot */}
            <svg
              className="absolute -left-[11px] top-6 w-[12px] h-[16px]"
              viewBox="0 0 12 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0L0 8L12 16V0Z"
                fill="#FFFDF9"
              />
              <path
                d="M12 0L0 8L12 16"
                stroke="#0E0E0E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <span className="text-[9.5px] font-poppins font-black uppercase tracking-widest text-[#FFA83A] flex items-center gap-1 mb-1">
              <Sparkles size={11} className="stroke-[2.5]" /> WHY READ THIS FOR {book.growthCategory.toUpperCase()}
            </span>

            <p className="font-poppins font-semibold text-xs text-[#0E0E0E] leading-relaxed">
              {book.whyThisBook}
            </p>

            {book.mascotTake && book.mascotTake !== book.whyThisBook && (
              <p className="font-poppins text-[11px] text-neutral-700 leading-relaxed mt-2 pt-2 border-t border-neutral-200 italic">
                “{book.mascotTake}”
              </p>
            )}
          </div>
        </div>

        {/* 2. Three Core Mindset Shifts (Tactile Doodle Glass Cards) */}
        <div className="text-left mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-300">
              What will shift in you:
            </span>
            <span className="text-[9px] font-poppins font-bold text-[#FFA83A] tracking-wider uppercase">
              14-Day Transformation
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {book.keyIdeas.slice(0, 3).map((idea, idx) => (
              <div
                key={idx}
                className="bg-[#181818] rounded-[20px] p-3.5 border-2 border-white/10 flex items-start gap-3 transition-transform hover:translate-x-0.5"
                style={{
                  boxShadow: "3px 3px 0px rgba(255, 168, 58, 0.25)",
                }}
              >
                {/* Tactile Doodle Number Badge */}
                <span
                  className="w-7 h-7 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#0E0E0E]"
                  style={{ boxShadow: "2px 2px 0px #0E0E0E" }}
                >
                  {idx + 1}
                </span>

                <p className="font-poppins font-medium text-xs text-neutral-100 leading-snug">
                  {idea}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Daily Investment Bento Row (Sun, Paper, Ink Triad) */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {/* Card 1: Ink Bento */}
          <div
            className="bg-[#161616] text-white rounded-[20px] p-3 border-2 border-white/15 text-center flex flex-col items-center justify-center"
            style={{ boxShadow: "3px 3px 0px rgba(255, 168, 58, 0.4)" }}
          >
            <Clock size={16} className="text-[#FFA83A] mb-1 stroke-[2.5]" />
            <span className="font-poppins font-black text-sm text-[#FFA83A] leading-none">
              15 min
            </span>
            <span className="font-poppins font-bold text-[8.5px] uppercase tracking-wider text-neutral-400 mt-1">
              Daily input
            </span>
          </div>

          {/* Card 2: Paper Bento */}
          <div
            className="bg-[#FFFDF9] text-[#0E0E0E] rounded-[20px] p-3 border-2 border-[#0E0E0E] text-center flex flex-col items-center justify-center"
            style={{ boxShadow: "3px 3px 0px #0E0E0E" }}
          >
            <Calendar size={16} className="text-[#0E0E0E] mb-1 stroke-[2.5]" />
            <span className="font-poppins font-black text-sm text-[#0E0E0E] leading-none">
              ~{estimatedDays} days
            </span>
            <span className="font-poppins font-bold text-[8.5px] uppercase tracking-wider text-neutral-600 mt-1">
              To finish
            </span>
          </div>

          {/* Card 3: Sun Bento */}
          <div
            className="bg-[#FFA83A] text-[#0E0E0E] rounded-[20px] p-3 border-2 border-[#0E0E0E] text-center flex flex-col items-center justify-center"
            style={{ boxShadow: "3px 3px 0px #0E0E0E" }}
          >
            <Target size={16} className="text-[#0E0E0E] mb-1 stroke-[2.5]" />
            <span className="font-poppins font-black text-sm text-[#0E0E0E] leading-none">
              1 action
            </span>
            <span className="font-poppins font-bold text-[8.5px] uppercase tracking-wider text-[#0E0E0E]/80 mt-1">
              Every day
            </span>
          </div>
        </div>

        {/* 4. Tactile Primary Action Button with Hard Shadow */}
        <button
          type="button"
          onClick={handleCommit}
          className="w-full h-14 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-base flex items-center justify-center border-[2.5px] border-[#0E0E0E] active:scale-[0.98] transition-transform duration-[90ms] cursor-pointer"
          style={{
            boxShadow: "4px 4px 0px #FFFFFF",
          }}
        >
          I’m convinced — Start reading →
        </button>
      </div>
    </div>
  );
};
