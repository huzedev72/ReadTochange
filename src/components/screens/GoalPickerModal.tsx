import React, { useState } from "react";
import { INITIAL_GOALS, UserGoal } from "@/data/mockData";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/ui/Logo";

interface GoalPickerModalProps {
  selectedGoalIds: string[];
  onSaveGoals: (goalIds: string[]) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const GoalPickerModal: React.FC<GoalPickerModalProps> = ({
  selectedGoalIds,
  onSaveGoals,
  isOpen,
  onClose,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string[]>(
    selectedGoalIds.length > 0 ? selectedGoalIds : ["discipline", "productivity"]
  );

  if (!isOpen) return null;

  const toggleGoal = (id: string) => {
    if (currentSelected.includes(id)) {
      if (currentSelected.length > 1) {
        setCurrentSelected(currentSelected.filter((g) => g !== id));
      }
    } else {
      if (currentSelected.length < 3) {
        setCurrentSelected([...currentSelected, id]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#141414] text-white rounded-[36px] border border-white/20 p-6 flex flex-col items-center text-center shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <Logo ground="ink" size="sm" markOnly={true} className="mb-2" />
        <Mascot state="curious" ground="ink" size="md" className="my-2" />

        <span className="text-[11px] font-poppins font-extrabold uppercase tracking-widest text-[#FFA83A] mt-2">
          Step 1 of Transformation
        </span>
        <h2 className="font-poppins font-extrabold text-2xl tracking-tight mt-1 text-white">
          What do you want to improve?
        </h2>
        <p className="font-poppins text-xs font-semibold text-neutral-400 mt-1 max-w-xs leading-relaxed">
          Select 1 to 3 growth areas. We tailor your book feed and daily actions to what you choose.
        </p>

        {/* Goals Chips Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
          {INITIAL_GOALS.map((g) => {
            const isSelected = currentSelected.includes(g.id);
            return (
              <Chip
                key={g.id}
                ground="ink"
                label={g.label}
                selected={isSelected}
                onClick={() => toggleGoal(g.id)}
                className="w-full text-center"
              />
            );
          })}
        </div>

        <Button
          variant="sun"
          size="default"
          className="w-full mt-6 shadow-xl"
          onClick={() => onSaveGoals(currentSelected)}
        >
          Save Goals & Discover Books →
        </Button>
      </div>
    </div>
  );
};
