import React, { useState } from "react";
import { INITIAL_GOALS, UserGoal } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { Clock, Bell, Check, ArrowRight, Sparkles } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

interface OnboardingViewProps {
  onComplete: (selectedGoals: string[], dailyMinutes: number, reminderTime: string) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["discipline", "productivity"]);
  const [dailyMinutes, setDailyMinutes] = useState<number>(15);
  const [reminderTime, setReminderTime] = useState<string>("20:30");

  const goals = INITIAL_GOALS;

  const toggleGoal = (id: string) => {
    hapticLight();
    if (selectedGoals.includes(id)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter((g) => g !== id));
      }
    } else {
      if (selectedGoals.length < 3) {
        setSelectedGoals([...selectedGoals, id]);
      }
    }
  };

  const handleNext = () => {
    hapticLight();
    if (step === 1) {
      setStep(2);
    } else {
      hapticSuccess();
      onComplete(selectedGoals, dailyMinutes, reminderTime);
    }
  };

  const handleSkip = () => {
    hapticLight();
    onComplete(selectedGoals, dailyMinutes, reminderTime);
  };

  const minuteOptions = [
    { label: "10 min", value: 10, note: "Gentle start" },
    { label: "15 min", value: 15, note: "Recommended" },
    { label: "20 min", value: 20, note: "Solid habit" },
    { label: "30 min", value: 30, note: "Deep momentum" },
  ];

  const reminderOptions = [
    { label: "07:30 Morning", value: "07:30" },
    { label: "13:00 Lunch", value: "13:00" },
    { label: "20:30 Evening", value: "20:30" },
    { label: "22:00 Bedtime", value: "22:00" },
  ];

  return (
    <div className="w-full h-full min-h-[100dvh] bg-[#0E0E0E] text-white px-6 pt-12 pb-8 flex flex-col justify-between select-none overflow-y-auto no-scrollbar">
      {/* 1. Header with 3 Pagination Dots + SKIP */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step === 1 ? "bg-[#FFA83A] scale-110" : "bg-white/40"
            }`}
          />
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step === 2 ? "bg-[#FFA83A] scale-110" : "bg-white/40"
            }`}
          />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-[#FFA83A] font-poppins font-bold text-xs uppercase tracking-wider py-2 px-1 hover:text-white transition-colors cursor-pointer"
        >
          SKIP
        </button>
      </div>

      {/* 2. Step 1: Goals Picker (Exact Screen E9 from Design Spec) */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center my-3 animate-in fade-in duration-200">
          {/* Sun Mascot Banner with Doodle "?" */}
          <div className="bg-[#FFA83A] rounded-[32px] p-5 flex items-center justify-center relative shadow-lg mb-4">
            <Mascot state="curious" ground="sun" size="sm" />
            <span className="absolute right-4 top-3 font-poppins font-black text-2xl text-[#0E0E0E]">
              ?
            </span>
          </div>

          <h1 className="font-poppins font-black text-[32px] sm:text-[36px] leading-[1.08] text-[#FFA83A] tracking-tight text-left">
            What do you want to change?
          </h1>
          <p className="font-playfair italic font-normal text-[17px] text-white text-left mt-1.5 mb-4">
            Pick up to three. We’ll find the books.
          </p>

          {/* Goal Chips matching e_goal_picker.html */}
          <div className="flex flex-wrap gap-2.5 my-1">
            {goals.map((g) => {
              const isSelected = selectedGoals.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`min-h-[46px] px-5 rounded-full text-sm font-poppins transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#FFA83A] text-[#0E0E0E] font-black border-2 border-[#FFA83A] shadow-[2px_2px_0px_#FFFFFF] scale-[1.02]"
                      : "bg-transparent text-white font-semibold border-2 border-white/25 hover:border-white/50 active:scale-95"
                  }`}
                >
                  {isSelected && <Check size={14} className="stroke-[3]" />}
                  {g.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-poppins font-bold text-neutral-400 text-left mt-3">
            Selected ({selectedGoals.length}/3)
          </span>
        </div>
      )}

      {/* 3. Step 2: Daily Reading Commitment & Telegram Reminder */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center my-3 animate-in fade-in duration-200">
          {/* Thinking Mascot Banner */}
          <div className="bg-[#FFA83A] rounded-[32px] p-5 flex items-center justify-center relative shadow-lg mb-4">
            <Mascot state="thinking" ground="sun" size="sm" />
            <span className="absolute right-4 top-3 text-[#0E0E0E]">
              <Sparkles size={20} className="stroke-[2.5]" />
            </span>
          </div>

          <h1 className="font-poppins font-black text-[32px] sm:text-[36px] leading-[1.08] text-[#FFA83A] tracking-tight text-left">
            How much will you read?
          </h1>
          <p className="font-playfair italic font-normal text-[17px] text-white text-left mt-1.5 mb-4">
            Small daily inputs compound into who you become.
          </p>

          {/* Daily Minutes Selection */}
          <div className="mb-4 text-left">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 flex items-center gap-1 mb-2">
              <Clock size={12} className="text-[#FFA83A]" /> Daily Reading Target
            </span>
            <div className="grid grid-cols-2 gap-2">
              {minuteOptions.map((opt) => {
                const isSelected = dailyMinutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setDailyMinutes(opt.value);
                    }}
                    className={`p-3 rounded-[18px] border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FFA83A] text-[#0E0E0E] border-[#0E0E0E] shadow-[3px_3px_0px_#FFFFFF]"
                        : "bg-[#181818] text-white border-white/10 hover:border-white/25 active:scale-95"
                    }`}
                  >
                    <span className="font-poppins font-black text-lg block leading-none">
                      {opt.label}
                    </span>
                    <span
                      className={`text-[10px] font-poppins font-semibold mt-1 block ${
                        isSelected ? "text-[#0E0E0E]/80" : "text-neutral-400"
                      }`}
                    >
                      {opt.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telegram Reminder Time */}
          <div className="text-left">
            <span className="text-[10px] font-poppins font-extrabold uppercase tracking-widest text-neutral-400 flex items-center gap-1 mb-2">
              <Bell size={12} className="text-[#FFA83A]" /> Telegram Bot Ping Time
            </span>
            <div className="grid grid-cols-2 gap-2">
              {reminderOptions.map((opt) => {
                const isSelected = reminderTime === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setReminderTime(opt.value);
                    }}
                    className={`py-2 px-3 rounded-[16px] border-2 text-xs font-poppins font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FFA83A] text-[#0E0E0E] border-[#0E0E0E] shadow-[2px_2px_0px_#FFFFFF]"
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
        </div>
      )}

      {/* 4. Bottom Action CTA */}
      <button
        type="button"
        onClick={handleNext}
        className="w-full h-14 rounded-full bg-[#FFA83A] text-[#0E0E0E] font-poppins font-black text-base flex items-center justify-center border-[2.5px] border-[#0E0E0E] shadow-[4px_4px_0px_#FFFFFF] active:scale-[0.98] transition-transform duration-[90ms] cursor-pointer flex-shrink-0 mt-4"
      >
        {step === 1 ? "Set Daily Target →" : "Show me my books →"}
      </button>
    </div>
  );
};
