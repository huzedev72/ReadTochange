import React, { useState } from "react";
import { Book } from "@/data/mockData";
import { BookCover } from "@/components/ui/BookCover";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/ui/Logo";
import { Clock, ArrowLeft } from "lucide-react";

interface CommitViewProps {
  book: Book;
  onConfirmCommitment: (minutes: number, reminderTime: string) => void;
  onCancel: () => void;
}

export const CommitView: React.FC<CommitViewProps> = ({
  book,
  onConfirmCommitment,
  onCancel,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [selectedTime, setSelectedTime] = useState<string>("20:30");

  const minuteOptions = [10, 15, 20, 30];
  const timeOptions = [
    { label: "07:30 Morning", value: "07:30" },
    { label: "13:00 Lunch", value: "13:00" },
    { label: "20:30 Evening", value: "20:30" },
    { label: "22:00 Bedtime", value: "22:00" },
  ];

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[#FFA83A] text-[#0E0E0E] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 pt-12 pb-3 bg-[#FFA83A]/95 backdrop-blur-md flex items-center justify-between border-b border-black/10">
        <button
          onClick={onCancel}
          className="h-10 w-10 rounded-full bg-black/10 flex items-center justify-center text-[#0E0E0E] hover:bg-black/20 cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <Logo ground="sun" size="sm" markOnly={true} />
        <div className="w-10" />
      </header>

      <main className="px-5 pt-6 max-w-md mx-auto flex flex-col items-center text-center">
        {/* Book Cover with -4 deg tilt */}
        <div className="my-2">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            size="md"
            tilt={true}
          />
        </div>

        <span className="text-[11px] font-poppins font-extrabold uppercase tracking-widest text-neutral-800 mt-4">
          Set your daily target
        </span>
        <h1 className="font-poppins font-extrabold text-3xl tracking-tight leading-tight mt-1">
          Make reading a habit
        </h1>
        <p className="font-poppins text-xs font-semibold text-neutral-900 mt-1 max-w-xs leading-relaxed">
          Pick a small daily goal for <span className="font-extrabold">{book.title}</span>. You can always read more.
        </p>

        {/* Minutes Selector */}
        <section className="w-full mt-6 text-left bg-white rounded-[28px] p-5 border border-black/10 shadow-md">
          <span className="text-xs font-poppins font-extrabold uppercase tracking-wider text-neutral-700 block mb-3">
            1. Daily Target
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {minuteOptions.map((min) => (
              <Chip
                key={min}
                ground="sun"
                label={`${min} min / day`}
                selected={selectedMinutes === min}
                onClick={() => setSelectedMinutes(min)}
              />
            ))}
          </div>
        </section>

        {/* Reminder Time Selector */}
        <section className="w-full mt-4 text-left bg-white rounded-[28px] p-5 border border-black/10 shadow-md">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock size={16} className="text-[#0E0E0E]" />
            <span className="text-xs font-poppins font-extrabold uppercase tracking-wider text-neutral-700">
              2. Reminder Time
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {timeOptions.map((item) => (
              <Chip
                key={item.value}
                ground="sun"
                label={item.label}
                selected={selectedTime === item.value}
                onClick={() => setSelectedTime(item.value)}
              />
            ))}
          </div>
        </section>

        {/* Action button */}
        <Button
          variant="ink"
          size="default"
          className="w-full mt-6 shadow-xl"
          onClick={() => onConfirmCommitment(selectedMinutes, selectedTime)}
        >
          Commit to {selectedMinutes} min/day →
        </Button>
      </main>
    </div>
  );
};
