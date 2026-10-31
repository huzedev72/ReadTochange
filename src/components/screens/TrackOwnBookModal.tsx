import React, { useState, useEffect } from "react";
import { Book, INITIAL_BOOKS } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { BookCover } from "@/components/ui/BookCover";
import { X, Search, Plus, BookOpen, Check, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { fetchBooks } from "@/lib/api/client";

interface TrackOwnBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackBook: (book: Book, startingPage: number) => void;
}

export const TrackOwnBookModal: React.FC<TrackOwnBookModalProps> = ({
  isOpen,
  onClose,
  onTrackBook,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [startingPage, setStartingPage] = useState<number>(1);
  const [isManualMode, setIsManualMode] = useState(false);

  // Manual fallback form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPages, setManualPages] = useState<number>(240);

  // Initial popular growth books as starter recommendations
  const popularReads = INITIAL_BOOKS.slice(0, 5);

  // Debounced live search querying Google Books and local database
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetchBooks({ query: searchQuery.trim(), limit: 6 });
        if (res && res.books) {
          setSearchResults(res.books);
        }
      } catch (err) {
        console.error("Live book search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const handleSelectBook = (book: Book) => {
    hapticLight();
    setSelectedBook(book);
    setStartingPage(1);
  };

  const handleConfirmTrack = () => {
    if (isManualMode) {
      if (!manualTitle.trim()) return;
      hapticSuccess();
      const customBook: Book = {
        id: `manual-${Date.now()}`,
        title: manualTitle.trim(),
        author: manualAuthor.trim() || "Unknown Author",
        totalPages: Math.max(10, manualPages),
        growthCategory: "Personal Growth",
        summary: `Your custom tracked physical copy.`,
        keyIdeas: ["Daily progress", "Applied learning", "Habit momentum"],
        aiHook: `Turn reading into real life transformation.`,
        whyThisBook: `Your chosen companion for your growth goals.`,
      };
      onTrackBook(customBook, Math.min(startingPage, manualPages));
      onClose();
    } else if (selectedBook) {
      hapticSuccess();
      onTrackBook(selectedBook, startingPage);
      onClose();
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/85 backdrop-blur-md transition-opacity duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[92vh] bg-[#0E0E0E] text-white rounded-t-[38px] border-t-[3.5px] border-[#FFA83A] p-6 pb-12 overflow-y-auto no-scrollbar shadow-[0_-12px_40px_rgba(0,0,0,0.95)] flex flex-col animate-sheet-slide"
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-3 flex-shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 flex-shrink-0">
          <span
            className="px-3.5 py-1 rounded-full text-[10px] font-poppins font-extrabold uppercase tracking-wider bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E]"
            style={{ boxShadow: "2px 2px 0px #FFFFFF" }}
          >
            📚 Track Physical or Kindle Book
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

        {/* Mode Selector Tab (Search vs Manual Entry) */}
        <div className="grid grid-cols-2 gap-2 bg-[#181818] p-1.5 rounded-[20px] border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setIsManualMode(false);
            }}
            className={`py-2 rounded-[16px] text-xs font-poppins font-bold transition-all ${
              !isManualMode
                ? "bg-[#FFA83A] text-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            🔍 Instant Search
          </button>
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setIsManualMode(true);
            }}
            className={`py-2 rounded-[16px] text-xs font-poppins font-bold transition-all ${
              isManualMode
                ? "bg-[#FFA83A] text-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            ✍️ Add Manually
          </button>
        </div>

        {!isManualMode ? (
          /* MODE 1: SEARCH DATABASE (Google Books & Global Index) */
          <div>
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, or ISBN (any language)..."
                className="w-full bg-[#181818] border-2 border-white/15 focus:border-[#FFA83A] rounded-[22px] pl-11 pr-4 py-3 text-sm font-poppins text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Quick Suggestions / Popular Physical Books */}
            {!searchQuery && (
              <div className="mb-4">
                <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 block mb-2 text-left">
                  Popular Reads to Add
                </span>
                <div className="flex flex-col gap-2">
                  {popularReads.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectBook(item)}
                      className={`p-3 rounded-[20px] border-2 transition-all flex items-center justify-between cursor-pointer ${
                        selectedBook?.id === item.id
                          ? "bg-[#FFA83A] text-[#0E0E0E] border-[#0E0E0E] shadow-[3px_3px_0px_#FFFFFF]"
                          : "bg-[#161616] text-white border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left min-w-0 pr-2">
                        {item.coverUrl ? (
                          <img
                            src={item.coverUrl}
                            alt=""
                            className="w-9 h-12 rounded object-cover flex-shrink-0 bg-neutral-800"
                          />
                        ) : (
                          <div className="w-9 h-12 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0 text-xs">
                            📖
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-poppins font-extrabold text-sm truncate">
                            {item.title}
                          </h4>
                          <p
                            className={`font-poppins text-xs truncate mt-0.5 ${
                              selectedBook?.id === item.id
                                ? "text-neutral-800 font-semibold"
                                : "text-neutral-400"
                            }`}
                          >
                            {item.author} · {item.totalPages} pages
                          </p>
                        </div>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                        {selectedBook?.id === item.id ? (
                          <Check size={16} className="stroke-[3]" />
                        ) : (
                          <Plus size={16} />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Search Results */}
            {searchQuery && (
              <div className="mb-4">
                {isSearching ? (
                  <div className="py-8 flex flex-col items-center justify-center text-neutral-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-[#FFA83A]" />
                    <span className="text-xs font-poppins font-semibold">
                      Searching Google Books...
                    </span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectBook(item)}
                        className={`p-3 rounded-[20px] border-2 transition-all flex items-center justify-between cursor-pointer ${
                          selectedBook?.id === item.id || selectedBook?.title === item.title
                            ? "bg-[#FFA83A] text-[#0E0E0E] border-[#0E0E0E] shadow-[3px_3px_0px_#FFFFFF]"
                            : "bg-[#161616] text-white border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left min-w-0 pr-2">
                          {item.coverUrl ? (
                            <img
                              src={item.coverUrl}
                              alt=""
                              className="w-9 h-12 rounded object-cover flex-shrink-0 bg-neutral-800"
                            />
                          ) : (
                            <div className="w-9 h-12 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0 text-xs">
                              📖
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-poppins font-extrabold text-sm truncate">
                              {item.title}
                            </h4>
                            <p
                              className={`font-poppins text-xs truncate mt-0.5 ${
                                selectedBook?.id === item.id || selectedBook?.title === item.title
                                  ? "text-neutral-800 font-semibold"
                                  : "text-neutral-400"
                              }`}
                            >
                              {item.author} · {item.totalPages} pages
                            </p>
                          </div>
                        </div>
                        <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                          {selectedBook?.id === item.id || selectedBook?.title === item.title ? (
                            <Check size={16} className="stroke-[3]" />
                          ) : (
                            <Plus size={16} />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 0 Results Found -> Graceful Fallback Card with Curious Mascot */
                  <div className="bg-[#181818] border-2 border-dashed border-white/20 rounded-[26px] p-5 text-center flex flex-col items-center">
                    <Mascot state="curious" ground="ink" size="sm" />
                    <h4 className="font-poppins font-extrabold text-base mt-2 text-white">
                      Couldn't find “{searchQuery}”
                    </h4>
                    <p className="font-poppins font-semibold text-xs text-neutral-400 mt-1 max-w-[260px]">
                      Don't worry! You can add your book manually in 10 seconds.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setManualTitle(searchQuery);
                        setIsManualMode(true);
                      }}
                      className="mt-3 px-4 py-2 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-xs shadow-[2px_2px_0px_#FFFFFF] cursor-pointer"
                    >
                      ✍️ Add Manually Now →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* MODE 2: MANUAL ENTRY WITH DOODLE GLASS PREVIEW */
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 mb-2">
              Book Information
            </span>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-poppins font-bold text-neutral-300 block mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Can't Hurt Me or عادات ذرية..."
                  className="w-full bg-[#181818] border-2 border-white/15 focus:border-[#FFA83A] rounded-[18px] px-4 py-2.5 text-sm font-poppins text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-poppins font-bold text-neutral-300 block mb-1">
                  Author (Optional)
                </label>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  placeholder="e.g. David Goggins"
                  className="w-full bg-[#181818] border-2 border-white/15 focus:border-[#FFA83A] rounded-[18px] px-4 py-2.5 text-sm font-poppins text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-poppins font-bold text-neutral-300 block mb-1">
                  Total Book Pages
                </label>
                <input
                  type="number"
                  value={manualPages}
                  onChange={(e) => setManualPages(Math.max(1, parseInt(e.target.value) || 100))}
                  className="w-full bg-[#181818] border-2 border-white/15 focus:border-[#FFA83A] rounded-[18px] px-4 py-2.5 text-sm font-poppins text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Generated Signature Doodle Glass Cover Live Preview */}
            <div className="bg-[#181818] rounded-[24px] p-4 border border-white/10 mb-4 flex items-center gap-4">
              <div className="w-[72px] h-[108px] rounded-[12px] bg-[#FFA83A] border-[2.5px] border-[#0E0E0E] shadow-[4px_4px_0px_#FFFFFF] p-2 flex flex-col justify-between relative flex-shrink-0">
                <span className="w-1.5 absolute left-1.5 top-1.5 bottom-1.5 bg-[#0E0E0E] rounded-full" />
                <span className="font-poppins font-black text-[10px] text-[#0E0E0E] leading-tight line-clamp-3 ml-2">
                  {manualTitle || "Your Book Title"}
                </span>
                <span className="font-playfair italic text-[9px] text-[#0E0E0E] truncate ml-2">
                  {manualAuthor || "Author"}
                </span>
              </div>
              <div className="flex-1 text-left">
                <span className="text-[10px] font-poppins font-extrabold uppercase tracking-wider text-[#FFA83A] flex items-center gap-1 mb-1">
                  <Sparkles size={12} /> Auto-Generated Doodle Cover
                </span>
                <p className="font-poppins font-medium text-xs text-neutral-300 leading-snug">
                  Your book will look beautiful on your Home screen and Library shelf.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Starting Progress Selector (e.g. "What page are you on right now?") */}
        {(selectedBook || (isManualMode && manualTitle.trim())) && (
          <div className="bg-[#181818] rounded-[24px] p-4 border-2 border-[#FFA83A] mb-5 text-left animate-pop">
            <span className="text-[11px] font-poppins font-black uppercase tracking-wider text-[#FFA83A] block mb-1">
              Current Reading Progress
            </span>
            <p className="font-poppins text-xs text-neutral-300 mb-3">
              Already started reading? Set your current page so you don't start from zero:
            </p>

            <div className="flex items-center justify-between gap-3 bg-[#222222] p-2 rounded-[18px]">
              <span className="font-poppins font-bold text-xs text-neutral-400 pl-2">
                I am currently on page:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={startingPage}
                  onChange={(e) =>
                    setStartingPage(
                      Math.max(
                        1,
                        Math.min(
                          isManualMode ? manualPages : selectedBook?.totalPages || 300,
                          parseInt(e.target.value) || 1
                        )
                      )
                    )
                  }
                  className="w-16 bg-white text-[#0E0E0E] font-poppins font-black text-center py-1.5 rounded-[12px] border border-black/10 text-sm focus:outline-none"
                />
                <span className="font-poppins font-bold text-xs text-neutral-400 pr-2">
                  of {isManualMode ? manualPages : selectedBook?.totalPages}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          disabled={!selectedBook && (!isManualMode || !manualTitle.trim())}
          onClick={handleConfirmTrack}
          className={`w-full h-14 rounded-full font-poppins font-black text-base flex items-center justify-center border-[2.5px] border-[#0E0E0E] transition-all duration-[90ms] cursor-pointer ${
            selectedBook || (isManualMode && manualTitle.trim())
              ? "bg-[#FFA83A] text-[#0E0E0E] shadow-[4px_4px_0px_#FFFFFF] active:scale-[0.98]"
              : "bg-white/10 text-neutral-500 border-white/10 cursor-not-allowed"
          }`}
        >
          <span>Start Tracking This Book →</span>
        </button>
      </div>
    </div>
  );
};
