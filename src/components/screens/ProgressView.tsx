import React, { useState } from "react";
import { Book, ReadingSession } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { BentoCard } from "@/components/ui/BentoCard";
import { Logo } from "@/components/ui/Logo";
import { CheckCircle2, Clock, Calendar, BookOpen, Check, Trophy, BookCheck } from "lucide-react";
import { hapticSuccess, hapticLight } from "@/lib/haptics";
import { toggleActionItem } from "@/lib/api/client";

interface ProgressViewProps {
  sessions: ReadingSession[];
  completedBooksCount?: number;
  finishedBooks?: Book[];
  completedActionIds?: string[];
  onToggleAction?: (sessionIdOrDescription: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  sessions,
  completedBooksCount,
  finishedBooks = [],
  completedActionIds: externalCompletedActionIds,
  onToggleAction,
}) => {
  // If controlled from parent, use externalCompletedActionIds; otherwise keep local fallback
  const [internalCompletedActionIds, setInternalCompletedActionIds] = useState<string[]>([]);
  const completedActionIds = externalCompletedActionIds ?? internalCompletedActionIds;

  const booksCompleted =
    completedBooksCount !== undefined ? completedBooksCount : finishedBooks.length;
  const totalMinutes = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalPages = sessions.reduce((acc, curr) => acc + curr.pagesRead, 0);
  const totalReflections = sessions.filter((s) => s.takeaway?.trim()).length;
  const completedActionsCount = completedActionIds.length;

  const toggleAction = (sessionId: string) => {
    if (onToggleAction) {
      onToggleAction(sessionId);
    } else {
      if (completedActionIds.includes(sessionId)) {
        hapticLight();
        setInternalCompletedActionIds(completedActionIds.filter((id) => id !== sessionId));
        toggleActionItem(sessionId, false);
      } else {
        hapticSuccess();
        setInternalCompletedActionIds([...completedActionIds, sessionId]);
        toggleActionItem(sessionId, true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 px-5 pt-4 pb-3 bg-[#0E0E0E]/90 backdrop-blur-md flex items-center justify-between border-b border-white/10">
        <Logo ground="ink" size="sm" animatedRetract={true} />
        <span className="text-xs font-poppins font-bold uppercase tracking-widest text-[#FFA83A]">
          Progress
        </span>
      </header>

      <main className="px-5 pt-6 max-w-md mx-auto flex flex-col gap-5">
        {/* Proud Mascot Hero */}
        <div className="rounded-[32px] bg-[#181818] border border-white/10 p-6 flex flex-col items-center text-center">
          <Mascot state="proud" ground="ink" size="md" />
          <h2 className="font-poppins font-extrabold text-2xl mt-4 text-white">
            Look how far you&apos;ve come
          </h2>
          <p className="font-poppins text-xs font-semibold text-neutral-400 mt-1">
            Every session moves you closer to your goal.
          </p>
        </div>

        {/* Books Completed Milestone Card */}
        <BentoCard
          variant="ink"
          className="relative overflow-hidden bg-gradient-to-br from-[#1F1708] via-[#161616] to-[#0E0E0E] border-[#FFA83A]/30 p-5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 text-[#FFA83A] mb-1">
                <Trophy size={16} className="text-[#FFA83A]" />
                <span className="text-[10px] font-poppins font-bold uppercase tracking-wider">
                  Books Completed
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-poppins font-black text-3xl text-white">
                  {booksCompleted}
                </span>
                <span className="text-xs font-poppins font-semibold text-neutral-400">
                  {booksCompleted === 1 ? "book finished" : "books finished"}
                </span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#FFA83A]/15 border border-[#FFA83A]/30 flex items-center justify-center text-[#FFA83A] shadow-[0_0_24px_rgba(255,168,58,0.2)]">
              <BookCheck size={24} />
            </div>
          </div>
        </BentoCard>

        {/* 4-Bento Metrics Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <BentoCard variant="ink">
            <div className="flex items-center gap-1.5 text-[#FFA83A] mb-1">
              <Clock size={15} />
              <span className="text-[10px] font-poppins font-bold uppercase tracking-wider">
                Total Time
              </span>
            </div>
            <span className="font-poppins font-extrabold text-2xl text-white">
              {totalMinutes} <small className="text-xs text-neutral-400 font-semibold">min</small>
            </span>
          </BentoCard>

          <BentoCard variant="ink">
            <div className="flex items-center gap-1.5 text-[#FFA83A] mb-1">
              <BookOpen size={15} />
              <span className="text-[10px] font-poppins font-bold uppercase tracking-wider">
                Pages Read
              </span>
            </div>
            <span className="font-poppins font-extrabold text-2xl text-white">
              {totalPages} <small className="text-xs text-neutral-400 font-semibold">pages</small>
            </span>
          </BentoCard>

          <BentoCard variant="ink">
            <div className="flex items-center gap-1.5 text-[#FFA83A] mb-1">
              <Calendar size={15} />
              <span className="text-[10px] font-poppins font-bold uppercase tracking-wider">
                Notes Saved
              </span>
            </div>
            <span className="font-poppins font-extrabold text-2xl text-white">
              {totalReflections} <small className="text-xs text-neutral-400 font-semibold">notes</small>
            </span>
          </BentoCard>

          <BentoCard variant="ink">
            <div className="flex items-center gap-1.5 text-[#FFA83A] mb-1">
              <CheckCircle2 size={15} />
              <span className="text-[10px] font-poppins font-bold uppercase tracking-wider">
                Actions Done
              </span>
            </div>
            <span className="font-poppins font-extrabold text-2xl text-white">
              {completedActionsCount} <small className="text-xs text-neutral-400 font-semibold">done</small>
            </span>
          </BentoCard>
        </div>

        {/* Reflection & Action History */}
        <section className="mt-2 text-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-poppins font-extrabold text-lg text-white">
              Recent Sessions
            </h3>
            <span className="text-[10px] font-poppins font-bold text-neutral-400 uppercase">
              Tap action to mark done
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-[#181818] rounded-[24px] p-6 text-center text-neutral-400 text-xs font-poppins border border-white/10">
              No sessions logged yet. Complete a reading session to build your history!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => {
                const isCompleted =
                  completedActionIds.includes(s.id) ||
                  (s.actionItem ? completedActionIds.includes(s.actionItem) : false) ||
                  Boolean(s.actionCompleted);

                return (
                  <div
                    key={s.id}
                    className="bg-[#181818] rounded-[24px] p-4 border border-white/10 text-left transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] font-poppins font-bold text-neutral-400 mb-1">
                      <span className="text-[#FFA83A]">{s.bookTitle}</span>
                      <span>
                        {s.durationMinutes} min • {s.pagesRead} pages
                      </span>
                    </div>

                    {s.takeaway && (
                      <p className="font-playfair italic text-sm text-neutral-200 mt-1">
                        “{s.takeaway}”
                      </p>
                    )}

                    {s.actionItem && (
                      <div
                        onClick={() => toggleAction(s.id)}
                        className={`mt-2.5 flex items-center justify-between gap-2 rounded-[18px] p-3 text-xs font-poppins cursor-pointer border-2 transition-all select-none ${
                          isCompleted
                            ? "bg-[#FFA83A]/15 border-[#FFA83A] text-white"
                            : "bg-[#222222] border-white/10 text-neutral-300 hover:border-white/20 active:scale-[0.99]"
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0 pr-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                              isCompleted
                                ? "bg-[#FFA83A] border-[#FFA83A] text-[#0E0E0E]"
                                : "bg-white/10 border-white/30 text-transparent"
                            }`}
                          >
                            <Check size={12} className="stroke-[3]" />
                          </span>
                          <span
                            className={
                              isCompleted ? "line-through text-neutral-400" : "font-medium"
                            }
                          >
                            {s.actionItem}
                          </span>
                        </div>

                        <span
                          className={`text-[9.5px] font-poppins font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                            isCompleted
                              ? "bg-[#FFA83A] text-[#0E0E0E]"
                              : "bg-white/10 text-neutral-400"
                          }`}
                        >
                          {isCompleted ? "Done" : "Mark done"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
