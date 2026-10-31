import React, { useState, useEffect, useRef } from "react";
import { Book, INITIAL_BOOKS } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { Logo } from "@/components/ui/Logo";
import { Bookmark, Info, ExternalLink, Menu, Check, ChevronsUp } from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import { cn, parseBookTitle } from "@/lib/utils";

// ── Motivational quotes pool ────────────────────────────────────────────────
const LOADING_QUOTES = [
  { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin" },
  { text: "Books are the quietest and most constant of friends.", author: "Charles W. Eliot" },
  { text: "Not all readers are leaders, but all leaders are readers.", author: "Harry S. Truman" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "A book is a gift you can open again and again.", author: "Garrison Keillor" },
  { text: "Today a reader, tomorrow a leader.", author: "Margaret Fuller" },
];

interface DiscoverViewProps {
  books?: Book[];
  isLoading?: boolean;
  loadingGoalLabel?: string;
  onSelectBookToCommit: (book: Book) => void;
  onOpenDetails: (book: Book) => void;
  onOpenWhyThisBook: (book: Book) => void;
  savedBookIds: string[];
  onToggleSave: (book: Book) => void;
  onOpenMenu?: () => void;
  onOpenTrackOwnBook?: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  books,
  isLoading = false,
  loadingGoalLabel = "Growth",
  onSelectBookToCommit,
  onOpenDetails,
  onOpenWhyThisBook,
  savedBookIds,
  onToggleSave,
  onOpenMenu,
  onOpenTrackOwnBook,
}) => {
  const displayBooks = books && books.length > 0 ? books : INITIAL_BOOKS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * LOADING_QUOTES.length)
  );
  const [dotCount, setDotCount] = useState(1);

  // First-time user scroll instruction indicator
  const [showScrollHint, setShowScrollHint] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("readtochange_has_scrolled_discover");
    }
    return true;
  });

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleScroll = () => {
    if (showScrollHint) {
      setShowScrollHint(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("readtochange_has_scrolled_discover", "true");
      }
    }
  };

  // Reset scroll to top whenever loading finishes or new books arrive
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isLoading, books]);

  // Cycle through quotes every 3 s while loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % LOADING_QUOTES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Animate trailing dots: 1 → 2 → 3 → 1 …
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDotCount((d) => (d % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const quote = LOADING_QUOTES[quoteIndex];

  // ── 1. STANDALONE UN-SCROLLABLE LOADING SCREEN ─────────────────────────────
  // While loading data, render a dedicated full-height screen so user CANNOT scroll past the mascot!
  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-[#0E0E0E] text-white flex flex-col items-center justify-center px-8 text-center overflow-hidden select-none">
        {/* Ambient golden radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(255,168,58,0.13) 0%, rgba(14,14,14,0.98) 68%, #0E0E0E 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Thinking mascot */}
          <Mascot state="thinking" ground="ink" size="lg" interactive={false} />

          {/* Goal label + animated dots */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-poppins font-bold text-[10px] tracking-widest uppercase text-[#FFA83A]">
              Finding books for
            </span>
            <h2 className="font-poppins font-extrabold text-2xl text-white leading-tight">
              {loadingGoalLabel}
              <span className="text-[#FFA83A]">{"·".repeat(dotCount)}</span>
            </h2>
          </div>

          {/* Rotating motivational quote */}
          <div className="max-w-[300px] bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl px-5 py-4 flex flex-col gap-1.5">
            <blockquote
              key={quoteIndex}
              className="font-playfair italic text-sm text-neutral-200 leading-snug"
              style={{ animation: "rtcFadeIn 0.6s ease" }}
            >
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <p className="font-poppins font-bold text-[10px] tracking-wider text-[#FFA83A] uppercase text-right">
              — {quote.author}
            </p>
          </div>

          {/* Shimmer loading bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFA83A] to-[#FFD08A] rounded-full"
              style={{ animation: "rtcLoadingBar 1.8s ease-in-out infinite" }}
            />
          </div>
        </div>

        {/* Scoped keyframe animations */}
        <style>{`
          @keyframes rtcFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes rtcLoadingBar {
            0%   { width: 0%;   margin-left: 0%;   }
            50%  { width: 70%;  margin-left: 15%;  }
            100% { width: 0%;   margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ── 2. VERTICAL SNAP FEED (Only renders after loading finishes) ───────────
  return (
    <div className="relative w-full h-full bg-[#0E0E0E] text-white overflow-hidden">
      {/* ── First-time user visual scroll cue (No text, pure fluid motion) ── */}
      {showScrollHint && displayBooks.length > 1 && (
        <div
          onClick={() => {
            setShowScrollHint(false);
            if (typeof window !== "undefined") {
              localStorage.setItem("readtochange_has_scrolled_discover", "true");
            }
          }}
          className="absolute left-1/2 -translate-x-1/2 bottom-[158px] z-30 pointer-events-auto cursor-pointer select-none"
          title="Scroll up"
          aria-label="Scroll cue"
        >
          {/* Tactile glowing glass pill */}
          <div className="relative w-8 h-13 rounded-full bg-[#0E0E0E]/85 border-[1.5px] border-[#FFA83A]/70 backdrop-blur-xl shadow-[0_0_20px_rgba(255,168,58,0.35)] flex flex-col items-center justify-between py-2 overflow-hidden hover:border-[#FFA83A] active:scale-95 transition-all">
            {/* Ambient gold glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFA83A]/20 via-transparent to-transparent pointer-events-none" />

            {/* Upward gliding chevrons */}
            <div className="relative z-10 flex flex-col items-center -space-y-2 rtc-swipe-wave">
              <ChevronsUp size={16} className="text-[#FFA83A] stroke-[2.5]" />
            </div>

            {/* Subtle gesture dot */}
            <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#FFA83A] shadow-[0_0_8px_#FFA83A]" />
          </div>
        </div>
      )}

      {/* TikTok-style full height vertical scroll-snap container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory overscroll-contain touch-pan-y no-scrollbar scroll-smooth"
      >
        {/* Scoped CSS for gesture animation */}
        <style>{`
          .rtc-swipe-wave {
            animation: rtcSwipeWave 1.8s ease-in-out infinite;
          }
          @keyframes rtcSwipeWave {
            0% {
              opacity: 0.2;
              transform: translateY(6px);
            }
            45% {
              opacity: 1;
              transform: translateY(-2px);
            }
            85%, 100% {
              opacity: 0.1;
              transform: translateY(-10px);
            }
          }
        `}</style>
        {/* ── BOOK CARDS ────────────────────────────────────────────────── */}
        {displayBooks.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const hasImageError = failedImages[book.id];
          const { mainTitle, subtitle } = parseBookTitle(book.title);

          return (
            <section
              key={book.id}
              className="relative w-full h-full min-h-full snap-start snap-always overflow-hidden flex flex-col justify-between select-none"
            >
              {/* 1. Ambient Background */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {book.coverUrl && !hasImageError ? (
                  <img
                    src={book.coverUrl}
                    alt=""
                    onError={() => handleImageError(book.id)}
                    className="w-full h-full object-cover filter blur-[64px] opacity-25 scale-125"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2a1a08] via-[#161616] to-[#0E0E0E]" />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 32%, rgba(255,168,58,0.12) 0%, rgba(14,14,14,0.92) 65%, #0E0E0E 100%)",
                  }}
                />
              </div>

              {/* 2. Top Header Navigation Bar */}
              <header className="relative z-20 px-6 pt-12 pb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    if (onOpenMenu) onOpenMenu();
                  }}
                  className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-md cursor-pointer"
                  aria-label="Menu"
                >
                  <Menu size={20} className="stroke-[2.5]" />
                </button>

                <div className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl shadow-md flex items-center gap-2">
                  <Logo ground="ink" size="sm" markOnly={true} />
                  <span className="font-poppins font-bold text-xs tracking-wide text-white">
                    For {book.growthCategory.toLowerCase()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSave(book)}
                  className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-md cursor-pointer"
                  aria-label="Save book"
                >
                  {isSaved ? (
                    <Check size={20} className="text-[#FFA83A] stroke-[2.5]" />
                  ) : (
                    <Bookmark size={20} className="stroke-[2.5]" />
                  )}
                </button>
              </header>

              {/* 3. Hero Book Cover */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-1 px-6 min-h-0">
                <div
                  onClick={() => {
                    hapticLight();
                    onOpenDetails(book);
                  }}
                  className="relative cursor-pointer group active:scale-95 transition-all duration-300 flex flex-col items-center"
                >
                  <div
                    className="absolute -inset-5 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, #FFA83A 0%, rgba(255,168,58,0) 70%)",
                    }}
                  />

                  <div
                    className="relative w-[132px] h-[192px] sm:w-[145px] sm:h-[212px] rounded-l-[3px] rounded-r-[14px] overflow-hidden border-[2.5px] border-white/25 bg-neutral-900 transition-transform duration-300 group-hover:-rotate-1"
                    style={{
                      boxShadow:
                        "0 20px 40px -10px rgba(0,0,0,0.85), 5px 5px 0px rgba(0,0,0,0.6)",
                    }}
                  >
                    {/* Spine */}
                    <div className="absolute left-0 top-0 bottom-0 w-[10px] border-r border-black/40 bg-black/30 z-20 pointer-events-none" />
                    <div className="absolute left-[9px] top-0 bottom-0 w-[1px] bg-white/20 z-20 pointer-events-none" />

                    {book.coverUrl && !hasImageError ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        onError={() => handleImageError(book.id)}
                        className="w-full h-full object-cover z-10"
                      />
                    ) : (
                      <div className="w-full h-full p-3 pl-4 flex flex-col justify-between font-poppins font-extrabold bg-[#FFF8EE] text-[#0E0E0E]">
                        <span className="text-[9px] uppercase tracking-wider text-[#5B5348] line-clamp-1">
                          {book.author}
                        </span>
                        <div className="flex flex-wrap gap-1 w-9">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFA83A]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0E0E0E]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFA83A]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0E0E0E]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs leading-tight line-clamp-2">
                            {mainTitle}
                          </span>
                          {subtitle && (
                            <span className="text-[8.5px] font-medium text-neutral-600 line-clamp-1 mt-0.5">
                              {subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="mt-1.5 text-[10px] font-poppins font-semibold text-neutral-400 group-hover:text-[#FFA83A] transition-colors">
                    Tap to inspect ↗
                  </span>
                </div>
              </div>

              {/* 4. Right Action Rail */}
              <aside className="absolute right-4 top-[32%] z-20 flex flex-col items-center gap-2.5">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleSave(book)}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg cursor-pointer"
                    aria-label="Save"
                  >
                    <Bookmark
                      size={17}
                      className={isSaved ? "fill-[#FFA83A] text-[#FFA83A]" : "text-white"}
                    />
                  </button>
                  <span className="font-poppins font-bold text-[9px] text-neutral-300 drop-shadow">
                    {isSaved ? "Saved" : "Save"}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(book)}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg cursor-pointer"
                    aria-label="Details"
                  >
                    <Info size={17} className="stroke-[2.5]" />
                  </button>
                  <span className="font-poppins font-bold text-[9px] text-neutral-300 drop-shadow">
                    Details
                  </span>
                </div>

                {book.previewUrl && (
                  <div className="flex flex-col items-center gap-1">
                    <a
                      href={book.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg cursor-pointer"
                      aria-label="Read Free Sample"
                    >
                      <ExternalLink size={17} className="text-[#FFA83A] stroke-[2.5]" />
                    </a>
                    <span className="font-poppins font-bold text-[9px] text-[#FFA83A] drop-shadow">
                      Sample
                    </span>
                  </div>
                )}
              </aside>

              {/* 5. Bottom Footer CTA */}
              <footer className="relative z-20 px-6 pb-[98px] flex flex-col gap-1.5 flex-shrink-0">
                <div className="w-[calc(100%-48px)] flex flex-col gap-0.5 text-left">
                  {/* Clean title display with dynamic scaling & 2-line clamp */}
                  <h2
                    className={cn(
                      "font-poppins font-extrabold leading-[1.1] text-white tracking-tight drop-shadow-md line-clamp-2",
                      mainTitle.length > 32
                        ? "text-[18px]"
                        : mainTitle.length > 20
                        ? "text-[20px]"
                        : "text-[22px]"
                    )}
                    title={book.title}
                  >
                    {mainTitle}
                  </h2>

                  {/* Informative subtitle displayed in a clean, smaller font */}
                  {subtitle && (
                    <p className="font-poppins text-[10.5px] font-medium text-neutral-300/90 leading-tight line-clamp-1">
                      {subtitle}
                    </p>
                  )}

                  <p className="font-poppins font-bold text-xs text-[#FFA83A] tracking-wide mt-0.5">
                    {book.author}
                  </p>

                  <blockquote className="font-playfair italic text-sm text-neutral-200 leading-snug line-clamp-1 drop-shadow mt-0.5">
                    &ldquo;{book.aiHook}&rdquo;
                  </blockquote>

                  <button
                    type="button"
                    onClick={() => {
                      hapticLight();
                      onOpenWhyThisBook(book);
                    }}
                    className="mt-1 w-full bg-white/10 hover:bg-white/16 border border-white/20 backdrop-blur-xl rounded-[16px] px-3 py-1.5 flex gap-2.5 items-center shadow-lg active:scale-[0.98] transition-all text-left group cursor-pointer"
                    aria-label="Why this book?"
                  >
                    <span className="w-6 h-6 flex-none rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-extrabold text-[11px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      ?
                    </span>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-poppins font-bold text-[8.5px] tracking-widest text-[#FFA83A] block uppercase">
                          WHY THIS BOOK?
                        </span>
                        <span className="text-[9.5px] font-poppins font-semibold text-neutral-400 group-hover:text-[#FFA83A] transition-colors pr-1">
                          Full take ↗
                        </span>
                      </div>
                      <p className="font-poppins font-semibold text-[11px] text-neutral-200 leading-tight line-clamp-1">
                        {book.whyThisBook}
                      </p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectBookToCommit(book)}
                  className="w-full h-12 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-extrabold text-sm flex items-center justify-center shadow-xl active:scale-[0.97] transition-transform duration-[90ms] cursor-pointer mt-1"
                >
                  Start reading →
                </button>
              </footer>
            </section>
          );
        })}

        {/* ── END OF FEED CARD (Only reached after scrolling through all books) ── */}
        <section className="relative w-full h-full min-h-full snap-start snap-always bg-[#FFA83A] text-[#0E0E0E] p-6 pb-28 flex flex-col items-center justify-center text-center select-none">
          <Mascot state="thinking" ground="sun" size="lg" />
          <h2 className="font-poppins font-extrabold text-3xl mt-6 tracking-tight leading-tight">
            Stop browsing.<br />Start one book.
          </h2>
          <p className="font-poppins font-semibold text-xs text-neutral-900 mt-3 max-w-[280px] leading-relaxed">
            Collecting books doesn&apos;t create change. Pick the one that calls to your goal,
            commit to 15 minutes today, and see what happens.
          </p>
          {/* Top Pick Recommendation Preview */}
          {displayBooks.length > 0 && (
            <div className="w-full max-w-xs mt-6 px-3.5 py-2 rounded-xl bg-[#0E0E0E]/8 border border-[#0E0E0E]/15 flex items-center justify-center gap-2">
              <span className="text-[10px] uppercase font-poppins font-extrabold tracking-wider bg-[#0E0E0E] text-[#FFA83A] px-2 py-0.5 rounded-md">
                Top Pick
              </span>
              <span className="font-poppins font-bold text-xs text-[#0E0E0E] truncate max-w-[190px]">
                &ldquo;{parseBookTitle(displayBooks[0].title).mainTitle}&rdquo;
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelectBookToCommit(displayBooks[0])}
            className="w-full max-w-xs h-14 rounded-full bg-[#0E0E0E] text-[#FFA83A] font-poppins font-extrabold text-base mt-3 shadow-2xl active:scale-[0.97] transition-transform duration-[90ms] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Start with this book</span>
            <span className="text-lg">→</span>
          </button>

          <button
            type="button"
            onClick={onOpenTrackOwnBook}
            className="w-full max-w-xs h-12 rounded-full bg-white text-[#0E0E0E] font-poppins font-black text-xs mt-3 border-2 border-[#0E0E0E] shadow-[3px_3px_0px_#0E0E0E] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>📖 Already have a book? Track it here ↗</span>
          </button>
        </section>
      </div>
    </div>
  );
};
