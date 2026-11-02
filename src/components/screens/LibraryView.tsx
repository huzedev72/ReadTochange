import React, { useState } from "react";
import { Book, INITIAL_BOOKS, ReadingSession } from "@/data/mockData";
import { BookCover } from "@/components/ui/BookCover";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Mascot } from "@/components/ui/Mascot";
import { Plus, ArrowUpRight, Star, Target, PauseCircle } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { parseBookTitle } from "@/lib/utils";

interface LibraryViewProps {
  activeBook: Book | null;
  readingBooks?: Book[];
  savedBookIds: string[];
  savedBooks?: Book[];
  finishedBookIds: string[];
  finishedBooks?: Book[];
  sessions: ReadingSession[];
  onSelectBook: (book: Book) => void;
  onExplore: () => void;
  onOpenTrackOwnBook?: () => void;
  onSetFocusBook?: (book: Book) => void;
  onPauseBook?: (book: Book) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  activeBook,
  readingBooks = [],
  savedBookIds,
  savedBooks = [],
  finishedBookIds,
  finishedBooks = [],
  sessions,
  onSelectBook,
  onExplore,
  onOpenTrackOwnBook,
  onSetFocusBook,
  onPauseBook,
}) => {
  const [activeTab, setActiveTab] = useState<"reading" | "want" | "finished">("reading");

  // Pool reading books: activeBook + readingBooks (deduplicated by id)
  const readingMap = new Map<string, Book>();
  if (activeBook) {
    readingMap.set(activeBook.id, activeBook);
  }
  for (const b of readingBooks) {
    if (!readingMap.has(b.id)) {
      readingMap.set(b.id, b);
    }
  }
  const readingList = Array.from(readingMap.values());

  // Pool saved books from server/state + INITIAL_BOOKS, deduplicated by id
  const savedPool = [...savedBooks, ...INITIAL_BOOKS];
  const savedMap = new Map<string, Book>();
  for (const b of savedPool) {
    if (savedBookIds.includes(b.id) && !savedMap.has(b.id)) {
      savedMap.set(b.id, b);
    }
  }
  const wantToReadBooks = Array.from(savedMap.values());

  // Pool finished books from server/state + INITIAL_BOOKS, deduplicated by id
  const finishedPool = [...finishedBooks, ...INITIAL_BOOKS];
  const finishedMap = new Map<string, Book>();
  for (const b of finishedPool) {
    if (finishedBookIds.includes(b.id) && !finishedMap.has(b.id)) {
      finishedMap.set(b.id, b);
    }
  }
  const finishedList = Array.from(finishedMap.values());

  const currentList =
    activeTab === "reading"
      ? readingList
      : activeTab === "want"
      ? wantToReadBooks
      : finishedList;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 pt-4 pb-3 bg-[#0E0E0E]/90 backdrop-blur-md flex items-center justify-between border-b border-white/10">
        <Logo ground="ink" size="sm" animatedRetract={true} />
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onOpenTrackOwnBook?.();
          }}
          className="px-3.5 py-1.5 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-xs flex items-center gap-1 border border-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF] active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>Track Book</span>
        </button>
      </header>

      <main className="px-5 pt-6 max-w-md mx-auto">
        {/* Segmented Filter Control */}
        <div className="flex bg-[#1E1E1E] p-1 rounded-full border border-white/10 mb-6">
          <button
            onClick={() => setActiveTab("reading")}
            className={`flex-1 py-2 rounded-full text-xs font-poppins font-extrabold transition-all ${
              activeTab === "reading"
                ? "bg-[#FFA83A] text-[#0E0E0E] shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Reading ({readingList.length})
          </button>
          <button
            onClick={() => setActiveTab("want")}
            className={`flex-1 py-2 rounded-full text-xs font-poppins font-extrabold transition-all ${
              activeTab === "want"
                ? "bg-[#FFA83A] text-[#0E0E0E] shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Want to Read ({wantToReadBooks.length})
          </button>
          <button
            onClick={() => setActiveTab("finished")}
            className={`flex-1 py-2 rounded-full text-xs font-poppins font-extrabold transition-all ${
              activeTab === "finished"
                ? "bg-[#FFA83A] text-[#0E0E0E] shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Finished ({finishedBooks.length})
          </button>
        </div>

        {/* Content list or Empty State */}
        {currentList.length === 0 ? (
          /* Screen E12: Library Empty */
          <div className="rounded-[32px] bg-[#161616] border border-white/10 p-8 text-center flex flex-col items-center mt-6">
            <Mascot state="curious" ground="ink" size="md" />
            <h3 className="font-poppins font-extrabold text-xl mt-4">
              {activeTab === "reading"
                ? "No active book right now"
                : activeTab === "want"
                ? "Your reading list is empty"
                : "No finished books yet"}
            </h3>
            <p className="font-poppins text-xs font-medium text-neutral-400 mt-2 max-w-xs leading-relaxed">
              Find a book that connects directly to what you want to improve in your life, or track one you already own.
            </p>
            <div className="flex flex-col gap-2.5 w-full mt-6">
              <Button
                variant="sun"
                size="default"
                className="w-full"
                onClick={onExplore}
              >
                Find books →
              </Button>
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onOpenTrackOwnBook?.();
                }}
                className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-poppins font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/15 cursor-pointer"
              >
                <span>Track your own book ↗</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {currentList.map((book) => {
              const bookSessions = sessions.filter((s) => s.bookId === book.id);
              const sessionPages = bookSessions.reduce(
                (acc, curr) => acc + curr.pagesRead,
                0
              );
              const effectivePage = Math.max(
                typeof book.currentPage === "number" ? book.currentPage : 0,
                sessionPages
              );
              const progress = Math.min(
                100,
                Math.round((effectivePage / Math.max(1, book.totalPages)) * 100)
              );

              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  className="bg-[#181818] rounded-[28px] p-4 border border-white/10 flex gap-4 items-center cursor-pointer hover:bg-[#202020] transition-colors text-left"
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-poppins font-bold uppercase tracking-wider text-[#FFA83A] block">
                      {book.growthCategory}
                    </span>
                    {(() => {
                      const { mainTitle, subtitle } = parseBookTitle(book.title);
                      return (
                        <>
                          <h4 className="font-poppins font-extrabold text-base leading-tight text-white truncate" title={book.title}>
                            {mainTitle}
                          </h4>
                          {subtitle && (
                            <p className="text-[10.5px] text-neutral-400 font-poppins truncate mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </>
                      );
                    })()}
                    <p className="text-xs text-[#FFA83A] font-poppins font-semibold mt-0.5 truncate">
                      {book.author}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-poppins font-bold text-neutral-300">
                      <span>Page {effectivePage} of {book.totalPages} ({bookSessions.length} logged)</span>
                      <span className="text-[#FFA83A] font-extrabold">{progress}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#FFA83A] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Active Reading Focus & Pause Controls */}
                    {activeTab === "reading" && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                        {activeBook?.id === book.id ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 border border-[#0E0E0E] shadow-[1px_1px_0px_#FFFFFF]">
                            <Star size={11} className="fill-[#0E0E0E]" /> Focus Book
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              hapticSuccess();
                              onSetFocusBook?.(book);
                            }}
                            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#FFA83A] hover:text-[#0E0E0E] text-white border border-white/20 font-poppins font-bold text-[9.5px] uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            <Target size={11} /> Make this my focus
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticLight();
                            onPauseBook?.(book);
                          }}
                          className="text-neutral-400 hover:text-white font-poppins text-[10px] flex items-center gap-1 transition-colors px-1 py-0.5 cursor-pointer"
                        >
                          <PauseCircle size={12} />
                          <span>Pause</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
