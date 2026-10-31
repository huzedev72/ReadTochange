import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

interface ChipProps {
  label: string;
  selected?: boolean;
  ground?: "ink" | "sun";
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  ground = "ink",
  onClick,
  className,
}) => {
  const [isPopping, setIsPopping] = useState(false);
  const isInk = ground === "ink";

  const handleClick = () => {
    setIsPopping(true);
    hapticLight();
    setTimeout(() => setIsPopping(false), 180);
    if (onClick) onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "h-11 px-5 rounded-full font-poppins text-sm transition-colors duration-[120ms] select-none cursor-pointer flex items-center justify-center",
        isPopping && "pop",
        isInk
          ? selected
            ? "bg-[#FFA83A] text-[#0E0E0E] font-extrabold border-2 border-[#FFA83A]"
            : "bg-transparent text-white border-2 border-[#FFA83A] font-semibold hover:bg-[#FFA83A]/10"
          : selected
          ? "bg-[#0E0E0E] text-white font-extrabold border-2 border-[#0E0E0E]"
          : "bg-transparent text-[#0E0E0E] border-2 border-[#0E0E0E] font-semibold hover:bg-black/5",
        className
      )}
    >
      {label}
    </button>
  );
};
