import React from "react";
import { cn } from "@/lib/utils";
import { Home, Compass, BookMarked, BarChart3, LucideIcon } from "lucide-react";

export type NavTab = "home" | "discover" | "library" | "progress";

interface GlassNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  className?: string;
}

export const GlassNav: React.FC<GlassNavProps> = ({
  currentTab,
  onTabChange,
  className,
}) => {
  const tabs: { id: NavTab; label: string; icon: LucideIcon }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "discover", label: "Find", icon: Compass },
    { id: "library", label: "Lib", icon: BookMarked },
    { id: "progress", label: "Prog", icon: BarChart3 },
  ];

  const isSunGround = currentTab === "home";

  return (
    <nav
      className={cn(
        "fixed z-50 left-6 right-6 bottom-6 max-w-[340px] mx-auto",
        "h-16 rounded-[32px] px-2 flex justify-around items-center select-none shadow-2xl",
        isSunGround
          ? "bg-[#0E0E0E]/85 border border-white/30 backdrop-blur-xl"
          : "bg-white/16 border border-white/35 backdrop-blur-xl",
        className
      )}
      role="navigation"
      aria-label="Main Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer",
              isActive
                ? "bg-[#FFA83A] text-[#0E0E0E] shadow-md"
                : "bg-white/14 text-white hover:bg-white/25"
            )}
            title={tab.label}
            aria-label={tab.label}
          >
            <Icon
              size={20}
              className={isActive ? "stroke-[2.5]" : "stroke-2"}
            />
          </button>
        );
      })}
    </nav>
  );
};
