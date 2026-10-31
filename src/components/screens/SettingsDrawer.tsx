import React, { useState } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { INITIAL_GOALS } from "@/data/mockData";
import { X, Bell, Target, Sparkles, Send, RotateCcw, Check, ArrowRight, MessageSquareHeart } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGoalIds: string[];
  onOpenGoalPicker: () => void;
  dailyTarget: number;
  onUpdateDailyTarget: (minutes: number) => void;
  reminderTime: string;
  onUpdateReminderTime: (time: string) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  selectedGoalIds,
  onOpenGoalPicker,
  dailyTarget,
  onUpdateDailyTarget,
  reminderTime,
  onUpdateReminderTime,
}) => {
  if (!isOpen) return null;

  const [feedbackText, setFeedbackText] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || isSendingFeedback) return;
    hapticSuccess();
    setIsSendingFeedback(true);
    try {
      const tgUser = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackText.trim(),
          source: "webapp_settings",
          telegramId: tgUser?.id ? String(tgUser.id) : null,
          username: tgUser?.username || null,
          firstName: tgUser?.first_name || null,
        }),
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackText("");
        setTimeout(() => setFeedbackSuccess(false), 4000);
      }
    } catch (e) {
      console.error("Failed to send feedback:", e);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const reminderOptions = [
    { label: "07:30 Morning", value: "07:30" },
    { label: "13:00 Lunch", value: "13:00" },
    { label: "20:30 Evening", value: "20:30" },
    { label: "22:00 Bedtime", value: "22:00" },
  ];

  const targetOptions = [10, 15, 20, 30];

  const activeGoals = INITIAL_GOALS.filter((g) => selectedGoalIds.includes(g.id));

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
            ⚙️ Preferences & Settings
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

        {/* Profile Card */}
        <div className="mt-2 mb-4 bg-[#181818] rounded-[26px] p-4 border border-white/10 flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 rounded-full bg-[#FFA83A] border-2 border-[#0E0E0E] flex items-center justify-center text-[#0E0E0E] font-poppins font-black text-xl shadow-[2px_2px_0px_#FFFFFF] flex-shrink-0">
            📖
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-poppins font-extrabold text-base text-white truncate">
              Telegram Reader
            </h3>
            <p className="font-poppins text-xs text-neutral-400">
              ReadToChange Personal Growth Edition
            </p>
          </div>
        </div>

        {/* 1. Growth Goals Section */}
        <div className="mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Target size={12} className="text-[#FFA83A]" /> Your Growth Goals
            </span>
            <button
              type="button"
              onClick={() => {
                hapticLight();
                onClose();
                onOpenGoalPicker();
              }}
              className="text-xs font-poppins font-bold text-[#FFA83A] hover:underline cursor-pointer"
            >
              Edit Goals ↗
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-[#161616] p-3 rounded-[20px] border border-white/10">
            {activeGoals.map((g) => (
              <span
                key={g.id}
                className="px-3 py-1 rounded-full text-xs font-poppins font-bold bg-[#FFA83A] text-[#0E0E0E] border border-[#0E0E0E] shadow-[1px_1px_0px_#FFFFFF]"
              >
                {g.label}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Daily Reading Target */}
        <div className="mb-4 text-left">
          <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 block mb-2">
            Daily Reading Commitment
          </span>
          <div className="grid grid-cols-4 gap-2">
            {targetOptions.map((mins) => {
              const isSelected = dailyTarget === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    hapticSuccess();
                    onUpdateDailyTarget(mins);
                  }}
                  className={`py-2.5 rounded-[18px] text-xs font-poppins font-black transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FFA83A] text-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF] border-2 border-[#0E0E0E]"
                      : "bg-[#161616] text-neutral-400 border border-white/10 hover:text-white"
                  }`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Telegram Reminder Time */}
        <div className="mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Bell size={12} className="text-[#FFA83A]" /> Telegram Reminder Time
            </span>
            <span className="font-poppins font-bold text-xs text-[#FFA83A]">
              {reminderTime}
            </span>
          </div>

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
                      ? "bg-[#FFA83A] text-[#0E0E0E] border-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF]"
                      : "bg-[#181818] text-white border-white/10 hover:border-white/20"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} className="stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Telegram Bot Status Banner */}
        <div className="bg-[#181818] rounded-[22px] p-3.5 border border-white/10 mb-4 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2AABEE]/20 flex items-center justify-center text-[#2AABEE]">
              <Send size={15} />
            </div>
            <div>
              <span className="font-poppins font-bold text-xs text-white block">
                Telegram Bot Connected
              </span>
              <span className="font-poppins text-[10px] text-neutral-400">
                Pings you daily at {reminderTime}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-poppins font-black text-[10px]">
            ACTIVE
          </span>
        </div>

        {/* 5. Direct Maker Feedback & Requests */}
        <div className="bg-[#181818] rounded-[24px] p-4 border border-white/10 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-poppins font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
              <MessageSquareHeart size={14} className="text-[#FFA83A]" /> Talk to the Creator
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFA83A]/20 text-[#FFA83A] text-[9px] font-poppins font-black uppercase">
              V1 Feedback
            </span>
          </div>
          <p className="font-poppins text-xs text-neutral-400 mb-3 leading-snug">
            Found a bug, want a specific book, or have an idea? Your note goes straight to the maker.
          </p>

          {feedbackSuccess ? (
            <div className="py-3 px-4 rounded-[16px] bg-[#FFA83A]/15 border border-[#FFA83A]/40 text-[#FFA83A] text-xs font-poppins font-bold text-center animate-curious-pop">
              ✨ Note received! Thank you for helping shape ReadToChange.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                placeholder="What's one thing we can make better?"
                className="w-full bg-[#121212] border border-white/15 focus:border-[#FFA83A] rounded-[16px] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                maxLength={280}
              />
              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={!feedbackText.trim() || isSendingFeedback}
                className="w-full py-2.5 rounded-[16px] bg-[#FFA83A] text-[#0E0E0E] text-xs font-poppins font-black uppercase tracking-wider border-2 border-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF] active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSendingFeedback ? "Sending note..." : "Send Note to Creator 🚀"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
