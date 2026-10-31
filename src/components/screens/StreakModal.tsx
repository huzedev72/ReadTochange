import React, { useState } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { StreakFlame, FlameState } from "@/components/ui/StreakFlame";
import { X, Bell, Check, Clock, ShieldCheck, Zap, Flame } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { ReadingSession } from "@/data/mockData";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysReadThisWeek?: number;
  currentStreak: number;
  reminderTime: string;
  onUpdateReminderTime: (time: string) => void;
  sessions?: ReadingSession[];
}

function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchesSessionDate(s: ReadingSession, targetDateKey: string, today: Date): boolean {
  if (!s.createdAt) return false;
  const todayKey = toLocalDateKey(today);

  const raw = s.createdAt.trim();
  const lower = raw.toLowerCase();

  if (lower === "just now" || lower === "today") {
    return targetDateKey === todayKey;
  }

  if (lower === "yesterday") {
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    return targetDateKey === toLocalDateKey(yest);
  }

  if (lower.includes("days ago")) {
    const match = lower.match(/(\d+)\s+days?\s+ago/);
    const count = match ? parseInt(match[1], 10) : 2;
    const past = new Date(today);
    past.setDate(today.getDate() - count);
    return targetDateKey === toLocalDateKey(past);
  }

  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return targetDateKey === toLocalDateKey(parsed);
    }
  } catch {
    // ignore
  }

  return false;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  daysReadThisWeek,
  currentStreak = 3,
  reminderTime = "20:30",
  onUpdateReminderTime,
  sessions = [],
}) => {
  const [activeFlameState, setActiveFlameState] = useState<FlameState>("idle");

  if (!isOpen) return null;

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const handleTriggerIgnite = () => {
    hapticSuccess();
    setActiveFlameState("ignite");
  };

  const reminderOptions = [
    { label: "07:30 Morning", value: "07:30" },
    { label: "13:00 Lunch", value: "13:00" },
    { label: "20:30 Evening", value: "20:30" },
    { label: "22:00 Bedtime", value: "22:00" },
  ];

  // Dynamically calculate 7-day consistency consistent with streak & sessions
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const currentDayIndex = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday

  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayIndex);
  monday.setHours(0, 0, 0, 0);

  // Check if today was already read
  const hasReadToday = sessions.some((s) => matchesSessionDate(s, todayKey, now));

  // If user read today, streak covers [today - (currentStreak-1) ... today]
  // If user hasn't read today yet, streak covers [yesterday - (currentStreak-1) ... yesterday]
  const streakEndOffset = hasReadToday ? 0 : 1;
  const streakKeys = new Set<string>();
  if (currentStreak > 0) {
    for (let s = 0; s < currentStreak; s++) {
      const d = new Date(now);
      d.setDate(now.getDate() - (streakEndOffset + s));
      streakKeys.add(toLocalDateKey(d));
    }
  }

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const daysOfWeek = dayLabels.map((label, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    const dayKey = toLocalDateKey(dayDate);
    const dateNumber = dayDate.getDate();

    const isToday = idx === currentDayIndex;
    const isPast = idx < currentDayIndex;
    const isFuture = idx > currentDayIndex;

    const hasSession = sessions.some((s) => matchesSessionDate(s, dayKey, now));
    const isInStreak = streakKeys.has(dayKey);
    const isRead = hasSession || isInStreak || (isToday && hasReadToday);

    let status: "read" | "missed" | "today-pending" | "future" = "future";
    if (isRead) {
      status = "read";
    } else if (isToday) {
      status = "today-pending";
    } else if (isPast) {
      status = "missed";
    } else {
      status = "future";
    }

    return {
      label,
      fullDay: dayNames[idx],
      dateNumber,
      dateKey: dayKey,
      isToday,
      isPast,
      isFuture,
      status,
    };
  });

  const readDaysCount = daysOfWeek.filter((d) => d.status === "read").length;
  const missedDaysCount = daysOfWeek.filter((d) => d.status === "missed").length;

  // Authentic status copy based on streak & today's progress
  const streakTitle = currentStreak > 0 ? `${currentStreak}-Day Flame` : "Spark Ignited";
  const streakSubtitle = hasReadToday
    ? "You read today! Your flame is burning strong. Keep it up tomorrow."
    : currentStreak > 0
    ? `Read 10 minutes today to keep your ${currentStreak}-day momentum burning.`
    : "Start your first reading session to ignite your flame!";

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
        <div className="flex items-center justify-between pb-2 flex-shrink-0">
          <span
            className="px-3.5 py-1 rounded-full text-[10px] font-poppins font-extrabold uppercase tracking-wider bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E]"
            style={{ boxShadow: "2px 2px 0px #FFFFFF" }}
          >
            🔥 Your Reading Streak
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

        {/* Hero Interactive Flame Showcase */}
        <div className="mt-3 mb-5 rounded-[28px] bg-[#181818] border-2 border-white/10 p-6 flex flex-col items-center text-center shadow-xl relative overflow-visible">
          {/* Living Flame: unconstrained stage so full flame, banner, shockwave & halo are fully visible */}
          <div className="py-2 flex items-center justify-center overflow-visible cursor-pointer" onClick={handleTriggerIgnite}>
            <StreakFlame
              days={currentStreak}
              state={activeFlameState}
              size="lg"
              showBadge={true}
              ground="ink"
              interactive={true}
              onIgniteComplete={() => setActiveFlameState("idle")}
            />
          </div>

          {/* Clean Authentic Copy */}
          <div className="mt-3">
            <h3 className="font-poppins font-black text-xl text-white">
              {streakTitle}
            </h3>
            <p className="font-poppins font-medium text-xs text-neutral-300 mt-1 leading-snug max-w-[280px]">
              {streakSubtitle}
            </p>
          </div>
        </div>

        {/* 1. Weekly Habit Tracker (Doodle Glass) */}
        <div className="mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 block">
              This Week’s Consistency
            </span>
            <span className="text-[11px] font-poppins font-bold text-[#FFA83A]">
              {readDaysCount} of 7 days read
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 bg-[#161616] border-2 border-white/10 rounded-[22px] p-3 shadow-inner">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span
                  className={`font-poppins font-bold text-[10px] uppercase ${
                    day.isToday ? "text-[#FFA83A]" : "text-neutral-400"
                  }`}
                >
                  {day.label}
                </span>
                <span
                  className={`font-poppins text-[9px] ${
                    day.isToday ? "font-bold text-white" : "text-neutral-500"
                  }`}
                >
                  {day.dateNumber}
                </span>

                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-poppins font-black text-xs transition-transform ${
                    day.status === "read"
                      ? "bg-[#FFA83A] text-[#0E0E0E] border-2 border-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF]"
                      : day.status === "missed"
                      ? "bg-red-500/15 border-2 border-red-500/40 text-red-400"
                      : day.status === "today-pending"
                      ? "bg-[#FFA83A]/15 border-2 border-[#FFA83A] text-[#FFA83A] animate-pulse shadow-[0_0_12px_rgba(255,168,58,0.25)]"
                      : "bg-white/5 border border-white/15 text-neutral-600"
                  }`}
                  title={`${day.fullDay} ${day.dateNumber}: ${
                    day.status === "read"
                      ? "Read"
                      : day.status === "missed"
                      ? "Missed"
                      : day.status === "today-pending"
                      ? "Today (Read to keep streak)"
                      : "Upcoming"
                  }`}
                >
                  {day.status === "read" && <Check size={16} className="stroke-[3]" />}
                  {day.status === "missed" && <X size={15} className="stroke-[2.5]" />}
                  {day.status === "today-pending" && <Flame size={15} className="fill-[#FFA83A]" />}
                  {day.status === "future" && "·"}
                </div>
              </div>
            ))}
          </div>

          {/* Clarity Legend Bar */}
          <div className="mt-2.5 px-1 flex items-center justify-between text-[10px] font-poppins text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FFA83A] inline-block" /> Read
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Missed
              </span>
              <span className="flex items-center gap-1 text-[#FFA83A]">
                <span className="w-2 h-2 rounded-full border border-[#FFA83A] inline-block" /> Today
              </span>
            </div>
            {missedDaysCount > 0 ? (
              <span className="text-neutral-400 font-medium">Never miss twice!</span>
            ) : (
              <span className="text-emerald-400 font-medium">Flawless week!</span>
            )}
          </div>
        </div>

        {/* 2. Telegram Bot Reminder Settings */}
        <div className="mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Bell size={12} className="text-[#FFA83A]" /> Telegram Reminder Time
            </span>
            <span className="font-poppins font-bold text-xs text-[#FFA83A]">
              Currently: {reminderTime}
            </span>
          </div>

          <p className="text-[11px] font-poppins text-neutral-300 mb-2.5">
            Your bot pings you directly in Telegram so you never miss a day. Pick your best reading window:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {reminderOptions.map((opt) => {
              const isSelected = reminderTime === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    hapticSuccess();
                    onUpdateReminderTime(opt.value);
                  }}
                  className={`py-2.5 px-3 rounded-[16px] text-xs font-poppins font-bold flex items-center justify-between border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FFA83A] text-[#0E0E0E] border-[#0E0E0E] shadow-[3px_3px_0px_#FFFFFF]"
                      : "bg-[#181818] text-white border-white/10 hover:border-white/20 active:scale-95"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} className="stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Atomic Habit Rule Card */}
        <div className="rounded-[20px] bg-[#FFFDF9] text-[#0E0E0E] p-3.5 border-2 border-[#0E0E0E] text-left shadow-[4px_4px_0px_#FFA83A] mb-5">
          <div className="flex items-center gap-1.5 text-[#0E0E0E] font-poppins font-black text-[10px] uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> The Atomic Rule: Never Miss Twice
          </div>
          <p className="font-poppins font-medium text-xs text-[#0E0E0E] leading-relaxed">
            Missing one day happens to everyone. But missing two days is the start of a new habit of skipping. Keep the momentum alive today!
          </p>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full h-14 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-base flex items-center justify-center border-[2.5px] border-[#0E0E0E] active:scale-[0.98] transition-transform duration-[90ms] cursor-pointer"
          style={{
            boxShadow: "4px 4px 0px #FFFFFF",
          }}
        >
          Got it, keep the streak alive →
        </button>
      </div>
    </div>
  );
};
