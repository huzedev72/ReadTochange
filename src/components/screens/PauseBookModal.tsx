import React from "react";
import { Book, ReadingSession } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { BookCover } from "@/components/ui/BookCover";
import { X, PauseCircle } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { parseBookTitle } from "@/lib/utils";

interface PauseBookModalProps {
  isOpen: boolean;
  incomingBook: Book | null;
  readingBooks: Book[];
  sessions: ReadingSession[];
  onClose: () => void;
  onPauseAndProceed: (bookToPause: Book) => void;
}

export const PauseBookModal: React.FC<PauseBookModalProps> = ({
  isOpen,
  incomingBook,
  readingBooks,
  sessions,
  onClose,
  onPauseAndProceed,
}) => {
  if (!isOpen || !incomingBook) return null;

  const handlePause = (book: Book) => {
    hapticSuccess();
    onPauseAndProceed(book);
  };

  const handleDismiss = () => {
    hapticLight();
    onClose();
  };

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/85 backdrop-blur-md transition-opacity duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[92vh] bg-[#0E0E0E] text-white rounded-t-[38px] border-t-[3.5px] border-[#FFA83A] p-6 pb-10 overflow-y-auto no-scrollbar shadow-[0_-12px_40px_rgba(0,0,0,0.95)] flex flex-col animate-sheet-slide text-left"
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-3 flex-shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 flex-shrink-0">
          <span
            className="px-3.5 py-1 rounded-full text-[10px] font-poppins font-extrabold uppercase tracking-wider bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E]"
            style={{ boxShadow: "2px 2px 0px #FFFFFF" }}
          >
            📚 Reading Cap (3 Books)
          </span>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Mascot & Gentle Prompt */}
        <div className="my-3 rounded-[28px] bg-[#181818] border-2 border-white/10 p-5 flex flex-col items-center text-center shadow-xl">
          <Mascot state="curious" ground="ink" size="md" />
          <h3 className="font-poppins font-black text-xl text-white mt-3">
            That’s a lot of books at once.
          </h3>
          <p className="font-poppins font-medium text-xs text-neutral-300 mt-1.5 leading-relaxed max-w-[290px]">
            To stay deeply focused and build real habits, you can read up to 3 books in parallel. Pause one to start{" "}
            <span className="text-[#FFA83A] font-bold">“{incomingBook.title}”</span>.
          </p>
        </div>

        {/* Currently Reading List to Pause */}
        <div className="mt-1 mb-4 flex flex-col gap-2.5">
          <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 block px-1">
            Pick a book to pause (all progress is preserved):
          </span>

          {readingBooks.map((b) => {
            const { mainTitle } = parseBookTitle(b.title);
            const bookSessions = sessions.filter((s) => s.bookId === b.id);
            const totalPages = bookSessions.reduce((acc, curr) => acc + curr.pagesRead, 0);
            const progress = Math.min(100, Math.round((totalPages / b.totalPages) * 100) || 10);

            return (
              <div
                key={b.id}
                className="bg-[#181818] rounded-[22px] p-3 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookCover
                    title={b.title}
                    author={b.author}
                    coverUrl={b.coverUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h4 className="font-poppins font-bold text-sm text-white truncate max-w-[170px]">
                      {mainTitle}
                    </h4>
                    <p className="text-[11px] font-poppins text-neutral-400 truncate">
                      {b.author}
                    </p>
                    <span className="text-[10px] font-poppins font-bold text-[#FFA83A] mt-0.5 inline-block">
                      {progress}% completed
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePause(b)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-[#FFA83A] hover:text-[#0E0E0E] text-white border border-white/20 font-poppins font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                >
                  <PauseCircle size={14} />
                  <span>Pause</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Dismiss CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-3.5 rounded-full bg-transparent hover:bg-white/5 text-neutral-300 font-poppins font-bold text-xs flex items-center justify-center border border-white/15 active:scale-98 transition-all cursor-pointer"
        >
          Not now, keep reading my current books
        </button>
      </div>
    </div>
  );
};
