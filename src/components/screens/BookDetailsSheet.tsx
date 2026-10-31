import React from "react";
import { Book } from "@/data/mockData";
import { BookCover } from "@/components/ui/BookCover";
import { Button } from "@/components/ui/Button";
import { X, ExternalLink, Lightbulb, Check } from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import { parseBookTitle } from "@/lib/utils";

interface BookDetailsSheetProps {
  book: Book | null;
  onClose: () => void;
  onStartReading: (book: Book) => void;
}

export const BookDetailsSheet: React.FC<BookDetailsSheetProps> = ({
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

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[85vh] bg-[#141414] text-white rounded-t-[36px] border-t border-white/20 p-6 overflow-y-auto no-scrollbar shadow-2xl flex flex-col animate-sheet-slide"
      >
        {/* Close Button Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-[#FFA83A]">
            Book Details
          </span>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Top */}
        <div className="flex gap-5 my-3 items-center">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <span className="px-3 py-1 rounded-full text-[10px] font-poppins font-bold bg-[#FFA83A]/20 text-[#FFA83A] inline-block mb-1.5">
              {book.growthCategory}
            </span>
            <h2 className="font-poppins font-extrabold text-lg leading-tight line-clamp-2">
              {mainTitle}
            </h2>
            {subtitle && (
              <p className="font-poppins text-[10.5px] font-medium text-neutral-400 line-clamp-1 mt-0.5">
                {subtitle}
              </p>
            )}
            <p className="font-poppins text-xs font-semibold text-neutral-400 mt-1">
              {book.author} • {book.totalPages} pages
            </p>
          </div>
        </div>

        {/* Playfair Hook */}
        <blockquote className="my-3 font-playfair italic text-base text-neutral-200 border-l-2 border-[#FFA83A] pl-3 py-0.5">
          “{book.aiHook}”
        </blockquote>

        {/* Book Summary */}
        {book.summary && (
          <div className="bg-[#1A1A1A] rounded-[24px] p-4 border border-white/10 mt-2 text-left">
            <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#FFA83A] block mb-1">
              About The Book
            </span>
            <p className="text-xs font-normal text-neutral-200 font-poppins leading-relaxed">
              {book.summary}
            </p>
          </div>
        )}

        {/* Why this book matters */}
        <div className="bg-[#202020] rounded-[24px] p-4 border border-white/10 mt-2 text-left">
          <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#FFA83A] block mb-1">
            Why Read For {book.growthCategory}
          </span>
          <p className="text-xs font-medium text-neutral-300 font-poppins leading-relaxed">
            {book.whyThisBook}
          </p>
        </div>

        {/* Key Ideas */}
        <div className="mt-4 text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={16} className="text-[#FFA83A]" />
            <span className="text-xs font-poppins font-extrabold uppercase tracking-wider text-white">
              Key Transformations
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {book.keyIdeas.map((idea, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs font-poppins font-medium text-neutral-300 bg-[#1E1E1E] p-3 rounded-2xl border border-white/5"
              >
                <Check size={14} className="text-[#FFA83A] flex-shrink-0 mt-0.5" />
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Access Links & Actions */}
        <div className="mt-5 flex flex-col gap-2.5 pt-2">
          <Button
            variant="sun"
            size="default"
            className="w-full shadow-lg"
            onClick={() => {
              handleClose();
              onStartReading(book);
            }}
          >
            Start Reading Now →
          </Button>

          {book.previewUrl && (
            <a
              href={book.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-full px-5 text-xs font-poppins font-bold bg-white/10 text-white border border-white/20 flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink size={15} className="text-[#FFA83A]" />
              <span>
                {book.isPublicDomain ? "Read Full Text on Gutenberg" : "Open Free Google Books Preview"}
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
