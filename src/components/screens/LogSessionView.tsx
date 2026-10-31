import React, { useState } from "react";
import { Book } from "@/data/mockData";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft, Plus, Minus, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface LogSessionViewProps {
  book: Book;
  onSaveSession: (data: {
    durationMinutes: number;
    pagesRead: number;
    takeaway: string;
    actionItem: string;
  }) => void;
  onCancel: () => void;
}

export const LogSessionView: React.FC<LogSessionViewProps> = ({
  book,
  onSaveSession,
  onCancel,
}) => {
  const [step, setStep] = useState<"log" | "reflect">("log");
  const [minutes, setMinutes] = useState<number>(15);
  const [pages, setPages] = useState<number>(10);
  const [takeaway, setTakeaway] = useState<string>("");
  const [actionItem, setActionItem] = useState<string>("");

  const handleNextToReflect = () => {
    setStep("reflect");
  };

  const handleFinalSubmit = () => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#FFA83A", "#FFFFFF", "#0E0E0E"],
      });
    } catch (e) {
      // safe fallback
    }

    onSaveSession({
      durationMinutes: minutes,
      pagesRead: pages,
      takeaway,
      actionItem: actionItem.trim() || "Put key takeaway into practice tomorrow morning.",
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[#0E0E0E] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 pt-4 pb-3 bg-[#0E0E0E]/90 backdrop-blur-md flex items-center justify-between border-b border-white/10">
        <button
          onClick={step === "reflect" ? () => setStep("log") : onCancel}
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <Logo ground="ink" size="sm" markOnly={true} />
        <span className="text-xs font-poppins font-bold text-[#FFA83A]">
          {step === "log" ? "Step 1 of 2" : "Step 2 of 2"}
        </span>
      </header>

      <main className="px-5 pt-6 max-w-md mx-auto">
        {step === "log" ? (
          /* SCREEN E7: LOG SESSION */
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-poppins font-bold uppercase tracking-widest text-[#FFA83A]">
              Reading Session
            </span>
            <h1 className="font-poppins font-extrabold text-3xl tracking-tight mt-1 text-white">
              Log Your Reading
            </h1>
            <p className="text-xs font-semibold text-neutral-400 font-poppins mt-1">
              For <span className="text-white font-bold">{book.title}</span>
            </p>

            {/* Stepper: Time spent */}
            <div className="w-full bg-[#181818] rounded-[28px] p-5 border border-white/10 mt-6 text-left">
              <span className="text-xs font-poppins font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Time Spent Reading
              </span>
              <div className="flex items-center justify-between bg-[#222222] rounded-[20px] p-2.5">
                <button
                  type="button"
                  onClick={() => setMinutes((m) => Math.max(5, m - 5))}
                  className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Minus size={18} />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-poppins font-extrabold text-[#FFA83A]">
                    {minutes}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400 block font-poppins -mt-1">
                    minutes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMinutes((m) => m + 5)}
                  className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Stepper: Pages read */}
            <div className="w-full bg-[#181818] rounded-[28px] p-5 border border-white/10 mt-4 text-left">
              <span className="text-xs font-poppins font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Pages Read
              </span>
              <div className="flex items-center justify-between bg-[#222222] rounded-[20px] p-2.5">
                <button
                  type="button"
                  onClick={() => setPages((p) => Math.max(1, p - 2))}
                  className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Minus size={18} />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-poppins font-extrabold text-white">
                    {pages}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400 block font-poppins -mt-1">
                    pages
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPages((p) => p + 2)}
                  className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <Button
              variant="sun"
              size="default"
              className="w-full mt-6 shadow-xl"
              onClick={handleNextToReflect}
            >
              Next: Add an action →
            </Button>
          </div>
        ) : (
          /* SCREEN E3: REFLECT & APPLY */
          <div className="flex flex-col items-center text-center">
            <Mascot state="happy" ground="ink" size="md" className="my-2" />

            <span className="text-[11px] font-poppins font-bold uppercase tracking-widest text-[#FFA83A] mt-2">
              Step 2: Takeaway
            </span>
            <h1 className="font-poppins font-extrabold text-2xl tracking-tight mt-1 text-white">
              Turn this into action
            </h1>

            {/* Reflection question prompt in Playfair italic */}
            <div className="w-full bg-[#181818] rounded-[28px] p-5 border border-white/10 mt-5 text-left">
              <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#FFA83A] block mb-1">
                Today&apos;s question
              </span>
              <p className="font-playfair italic text-lg leading-snug text-white mb-3">
                &ldquo;What stood out to you in today&apos;s reading?&rdquo;
              </p>
              <textarea
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                placeholder="Write a quick thought or takeaway (optional)..."
                rows={3}
                className="w-full bg-[#222222] text-white placeholder-neutral-500 rounded-[18px] p-3 text-sm font-poppins focus:outline-none focus:ring-2 focus:ring-[#FFA83A] border border-white/10 resize-none"
              />
            </div>

            {/* Signature Tilted "One Action" Card */}
            <div className="w-full mt-4 transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="bg-[#FFA83A] text-[#0E0E0E] rounded-[28px] p-5 text-left border-2 border-white shadow-xl">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={16} className="text-[#0E0E0E]" />
                  <span className="text-xs font-poppins font-extrabold uppercase tracking-widest text-[#0E0E0E]">
                    Your Action Today
                  </span>
                </div>
                <input
                  type="text"
                  value={actionItem}
                  onChange={(e) => setActionItem(e.target.value)}
                  placeholder="e.g. Put book on pillow / Delete 1 distracting app..."
                  className="w-full bg-white text-[#0E0E0E] placeholder-neutral-500 rounded-full px-4 py-2.5 text-sm font-poppins font-semibold focus:outline-none focus:ring-2 focus:ring-[#0E0E0E] border border-black/10 mt-1"
                />
              </div>
            </div>

            <Button
              variant="sun"
              size="default"
              className="w-full mt-6 shadow-xl"
              onClick={handleFinalSubmit}
            >
              Save session →
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
