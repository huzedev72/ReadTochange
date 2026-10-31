import React from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: React.ReactNode;
  variant?: "ink" | "paper" | "sun";
  isActionCard?: boolean;
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  variant = "ink",
  isActionCard = false,
  className,
}) => {
  const variantStyles = {
    ink: "bg-[#0E0E0E] text-white border border-white/10",
    paper: "bg-white text-[#0E0E0E] border border-[#E6DCCB]",
    sun: "bg-[#FFA83A] text-[#0E0E0E] border border-black/10",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-[28px] p-5 transition-transform",
        isActionCard && "-rotate-[1.5deg] hover:rotate-0 shadow-md",
        variantStyles,
        className
      )}
    >
      {children}
    </div>
  );
};
