import React, { useEffect } from "react";
import { Book, ReadingSession } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { BookCover } from "@/components/ui/BookCover";
import { X, Sparkles, CheckCircle2, ArrowRight, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

interface BookFinishedModalProps {
  isOpen: boolean;
  book: Book | null;
  sessions: ReadingSession[];
  onClose: () => void;
  onPickNextBook: () => void;
}

export const BookFinishedModal: React.FC<BookFinishedModalProps> = ({
  isOpen,
  book,
  sessions,
  onClose,
  onPickNextBook,
}) => {
  useEffect(() => {
    if (isOpen) {
      hapticSuccess();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFA83A", "#FFFFFF", "#0E0E0E"],
        });
      } catch (e) {
        // safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !book) return null;

  const bookSessions = sessions.filter((s) => s.bookId === book.id);
  const totalMinutes = bookSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const actionItems = bookSessions.filter((s) => s.actionItem).map((s) => s.actionItem);

  const handleNext = () => {
    hapticSuccess();
    onClose();
    onPickNextBook();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/85 backdrop-blur-md transition-opacity duration-200 select-none"
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
            🏆 Book Completed
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Mascot in Celebrate / Proud state */}
        <div className="my-3">
          <Mascot state="proud" ground="ink" size="lg" />
        </div>

        <h1 className="font-poppins font-black text-2xl tracking-tight text-white mt-1">
          You Finished It!
        </h1>
        <p className="font-playfair italic text-base text-[#FFA83A] mt-0.5">
          “Books are the input. You are the outcome.”
        </p>

        {/* Book Card Completed Badge */}
        <div className="w-full bg-[#181818] rounded-[26px] p-4 border border-white/10 mt-4 flex items-center gap-3.5 text-left">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-poppins font-bold uppercase tracking-wider text-[#FFA83A]">
              100% Completed
            </span>
            <h3 className="font-poppins font-extrabold text-base text-white truncate">
              {book.title}
            </h3>
            <p className="font-poppins text-xs text-neutral-400 truncate">
              {book.author}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-poppins font-bold text-neutral-300">
              <span>{bookSessions.length || 3} reading sessions</span>
              <span>•</span>
              <span>{totalMinutes || 45} mins total</span>
            </div>
          </div>
        </div>

        {/* Key Action applied */}
        {actionItems.length > 0 && (
          <div className="w-full mt-3 bg-[#FFA83A] text-[#0E0E0E] rounded-[24px] p-4 text-left border-2 border-white shadow-lg">
            <span className="text-[10px] font-poppins font-black uppercase tracking-wider flex items-center gap-1 text-[#0E0E0E]">
              <CheckCircle2 size={13} /> The Real Transformation
            </span>
            <p className="font-poppins font-bold text-xs text-[#0E0E0E] mt-1">
              “{actionItems[0]}”
            </p>
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full h-14 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-base mt-6 flex items-center justify-center border-[2.5px] border-[#0E0E0E] shadow-[4px_4px_0px_#FFFFFF] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Choose Your Next Book →</span>
        </button>
      </div>
    </div>
  );
};
