import React from "react";
import { Book, ReadingSession } from "@/data/mockData";
import { Logo } from "@/components/ui/Logo";
import { Mascot } from "@/components/ui/Mascot";
import { BookCover } from "@/components/ui/BookCover";
import { StreakFlame } from "@/components/ui/StreakFlame";
import { Menu, Bell, ArrowUpRight } from "lucide-react";

interface HomeViewProps {
  activeBook: Book | null;
  dailyTargetMinutes: number;
  daysReadThisWeek: number;
  streakDays?: number;
  primaryGoalLabel?: string;
  lastActionItem: string;
  onLogSession: () => void;
  onExploreBooks: () => void;
  onOpenMenu?: () => void;
  onOpenStreakModal?: () => void;
  onOpenTrackOwnBook?: () => void;
  onOpenFocusTimer?: () => void;
  sessions: ReadingSession[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  activeBook,
  dailyTargetMinutes,
  daysReadThisWeek,
  streakDays = 0,
  primaryGoalLabel = "Discipline",
  lastActionItem,
  onLogSession,
  onExploreBooks,
  onOpenMenu,
  onOpenStreakModal,
  onOpenTrackOwnBook,
  onOpenFocusTimer,
  sessions,
}) => {
  // If no book active yet: Screen E13 Home Empty (Exact from e_home_empty.html)
  if (!activeBook) {
    return (
      <div className="relative w-full min-h-[100dvh] bg-[#FFA83A] text-[#0E0E0E] px-6 pt-12 pb-32 flex flex-col select-none overflow-y-auto no-scrollbar">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="w-11 h-11 rounded-full bg-white/60 border border-white flex items-center justify-center text-[#0E0E0E] active:scale-95 transition-all shadow-sm cursor-pointer"
            aria-label="Menu"
          >
            <Menu size={20} className="stroke-[2.5]" />
          </button>

          <Logo ground="sun" size="sm" animatedRetract={true} />

          <button
            type="button"
            onClick={onOpenStreakModal}
            className="px-2.5 h-11 rounded-full bg-white/70 hover:bg-white/90 border border-white flex items-center gap-1.5 text-[#0E0E0E] active:scale-95 transition-all shadow-sm cursor-pointer"
            aria-label="Reading streak"
          >
            <StreakFlame days={streakDays} size="sm" showBadge={false} ground="sun" interactive={false} />
            <span className="font-poppins font-black text-sm">{streakDays}</span>
          </button>
        </header>

        {/* Headline */}
        <div className="mt-5 text-left">
          <h1 className="font-poppins font-extrabold text-[36px] leading-[1.05] tracking-tight text-[#0E0E0E]">
            What should I do right now?
          </h1>
          <p className="mt-2 font-playfair italic font-normal text-[19px] text-[#0E0E0E]">
            Start with one book.
          </p>
        </div>

        {/* Card 1: White Bento Card (Mascot + Pick first book) */}
        <div
          onClick={onExploreBooks}
          className="mt-6 bg-white text-[#0E0E0E] rounded-[28px] p-5 flex items-center gap-4 border border-black/5 shadow-xl cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="w-[100px] flex-shrink-0 flex justify-center">
            <Mascot state="curious" ground="paper" size="sm" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <h2 className="font-poppins font-extrabold text-[20px] leading-[1.1] text-[#0E0E0E]">
              Pick your first book
            </h2>
            <p className="font-poppins font-semibold text-xs text-neutral-600 mt-1.5 leading-snug">
              We chose a few for {primaryGoalLabel}.
            </p>
          </div>
        </div>

        {/* Card 2: Black Bento Card (Your Goal + Diagonal Arrow CTA) */}
        <div
          onClick={onExploreBooks}
          className="mt-3 bg-[#0E0E0E] text-white rounded-[28px] p-5 flex items-center justify-between shadow-2xl cursor-pointer active:scale-[0.98] transition-all text-left"
        >
          <div>
            <span className="font-poppins font-bold text-[11px] uppercase tracking-widest text-[#FFA83A] block">
              YOUR GOAL
            </span>
            <p className="font-playfair italic text-xl text-white mt-1">
              Become more {primaryGoalLabel.toLowerCase()}
            </p>
          </div>

          <button
            type="button"
            aria-label="Discover books"
            className="w-13 h-13 rounded-full bg-[#FFA83A] text-[#0E0E0E] flex items-center justify-center font-bold shadow-lg flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowUpRight size={22} className="stroke-[3]" />
          </button>
        </div>

        {/* Card 3: Track Physical Copy / Own Book */}
        <div
          onClick={onOpenTrackOwnBook}
          className="mt-3 bg-white/75 hover:bg-white text-[#0E0E0E] rounded-[24px] p-4 flex items-center justify-between border-2 border-[#0E0E0E] shadow-[3px_3px_0px_#0E0E0E] cursor-pointer active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <span className="font-poppins font-extrabold text-sm text-[#0E0E0E] block leading-tight">
                Already reading a book?
              </span>
              <span className="font-poppins font-semibold text-[11px] text-neutral-700">
                Track your physical copy or Kindle ↗
              </span>
            </div>
          </div>
          <ArrowUpRight size={18} className="stroke-[2.5]" />
        </div>
      </div>
    );
  }

  // Calculate current book progress
  const currentBookSessions = sessions.filter((s) => s.bookId === activeBook.id);
  const totalPagesRead = currentBookSessions.reduce(
    (acc, curr) => acc + curr.pagesRead,
    0
  );
  const progressPercent = Math.min(
    100,
    Math.round((totalPagesRead / activeBook.totalPages) * 100) || 26
  );

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#FFA83A] text-[#0E0E0E] px-6 pt-12 pb-32 flex flex-col select-none overflow-y-auto no-scrollbar">
      {/* 1. Top Header */}
      <header className="flex items-center justify-between pb-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-11 h-11 rounded-full bg-white/60 border border-white flex items-center justify-center text-[#0E0E0E] active:scale-95 transition-all shadow-sm cursor-pointer"
          aria-label="Menu"
        >
          <Menu size={20} className="stroke-[2.5]" />
        </button>

        <Logo ground="sun" size="sm" animatedRetract={true} />

        {/* Streak Pill Button (Living StreakFlame) */}
        <button
          type="button"
          onClick={onOpenStreakModal}
          className="px-2.5 h-11 rounded-full bg-white/70 hover:bg-white/90 border border-white flex items-center gap-1.5 text-[#0E0E0E] active:scale-95 transition-all shadow-sm cursor-pointer"
          aria-label="Reading streak"
        >
          <StreakFlame days={streakDays} size="sm" showBadge={false} ground="sun" interactive={false} />
          <span className="font-poppins font-black text-sm">{streakDays}</span>
        </button>
      </header>

      {/* 2. Headline & Voice */}
      <div className="mt-5">
        <h1 className="font-poppins font-extrabold text-[36px] leading-[1.05] tracking-tight text-[#0E0E0E]">
          What should I do right now?
        </h1>
        <p className="mt-2 font-playfair italic font-normal text-[19px] text-[#0E0E0E]">
          Read {dailyTargetMinutes} minutes. That’s all.
        </p>
      </div>

      {/* 3. Bento Metrics Row */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {/* Left: Black Bento Card */}
        <div className="h-[130px] rounded-[28px] bg-[#0E0E0E] text-white p-4 flex flex-col justify-between shadow-lg">
          <span className="font-poppins font-extrabold text-[32px] leading-none text-[#FFA83A]">
            {dailyTargetMinutes}
            <span className="text-white text-sm font-semibold ml-1">min</span>
          </span>
          <span className="font-poppins font-bold text-xs text-neutral-300">
            Today’s target
          </span>
        </div>

        {/* Right: White Bento Card */}
        <div className="h-[130px] rounded-[28px] bg-white text-[#0E0E0E] p-4 flex flex-col justify-between border border-black/5 shadow-lg">
          <span className="font-poppins font-extrabold text-[32px] leading-none text-[#0E0E0E]">
            {daysReadThisWeek}
            <span className="text-neutral-500 text-sm font-semibold ml-1">days</span>
          </span>
          <span className="font-poppins font-bold text-xs text-neutral-600">
            Read this week
          </span>
        </div>
      </div>

      {/* 4. Active Reading Card (Signature Diagonal Texture) */}
      <div
        className="mt-3.5 min-h-[132px] rounded-[28px] p-4 flex items-center justify-between border border-black/10 shadow-lg"
        style={{
          background:
            "repeating-linear-gradient(135deg, #ffffff 0 6px, #FFEBD0 6px 12px)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <BookCover
            title={activeBook.title}
            author={activeBook.author}
            coverUrl={activeBook.coverUrl}
            size="sm"
          />
          <div className="flex flex-col text-left">
            <span className="font-poppins font-bold text-[10px] tracking-wider uppercase text-neutral-800">
              CURRENTLY READING
            </span>
            <h3 className="font-poppins font-extrabold text-lg text-[#0E0E0E] leading-tight line-clamp-1">
              {activeBook.title}
            </h3>
            {/* Progress track */}
            <div className="mt-2.5 w-28 h-2 rounded-full bg-white overflow-hidden shadow-inner">
              <div
                className="h-full bg-[#0E0E0E] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Log Session Action Arrow Button */}
        <button
          type="button"
          onClick={onLogSession}
          className="w-13 h-13 rounded-full bg-[#0E0E0E] flex items-center justify-center text-[#FFA83A] shadow-md active:scale-95 transition-all cursor-pointer p-3"
          aria-label="Log reading session"
          title="Log session"
        >
          <ArrowUpRight size={24} className="stroke-[2.5]" />
        </button>
      </div>

      {/* 5. Signature -1.5° Tilted "YOUR ONE ACTION" Card */}
      <div className="mt-3.5 rounded-[28px] bg-[#0E0E0E] text-white p-5 -rotate-[1.5deg] hover:rotate-0 transition-transform shadow-xl">
        <span className="font-poppins font-bold text-[11px] tracking-widest uppercase text-[#FFA83A] block">
          YOUR ONE ACTION
        </span>
        <blockquote className="mt-1.5 font-playfair italic font-normal text-[18px] leading-[1.35] text-white">
          “{lastActionItem || "Put your book on your pillow before you leave the room."}”
        </blockquote>
      </div>

      {/* 6. Dual Action Buttons: Focus Timer & Log Session */}
      <div className="grid grid-cols-5 gap-2.5 mt-4">
        <button
          type="button"
          onClick={onOpenFocusTimer}
          className="col-span-2 h-14 rounded-full bg-white text-[#0E0E0E] font-poppins font-black text-xs flex items-center justify-center gap-1.5 border-2 border-[#0E0E0E] shadow-[3px_3px_0px_#0E0E0E] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>⏱️ Focus 15m</span>
        </button>

        <button
          type="button"
          onClick={onLogSession}
          className="col-span-3 h-14 rounded-full bg-[#0E0E0E] text-[#FFA83A] font-poppins font-extrabold text-sm shadow-2xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center border-2 border-white/10"
        >
          <span>Log session →</span>
        </button>
      </div>
    </div>
  );
};
