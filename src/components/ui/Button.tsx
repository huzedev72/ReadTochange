import React from "react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "sun" | "ink" | "glass" | "white";
  size?: "default" | "sm" | "icon";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "sun",
  size = "default",
  className,
  onClick,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-poppins font-extrabold select-none transition-transform duration-[90ms] ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeStyles = {
    default: "h-14 px-7 rounded-full text-base",
    sm: "h-10 px-5 rounded-full text-sm",
    icon: "w-11 h-11 rounded-full p-0 flex items-center justify-center",
  }[size];

  const variantStyles = {
    sun: "bg-[#FFA83A] text-[#0E0E0E] hover:brightness-105",
    ink: "bg-[#0E0E0E] text-[#FFA83A] hover:bg-[#1a1a1a]",
    white: "bg-white text-[#0E0E0E] hover:bg-neutral-100 shadow-sm",
    glass:
      "bg-white/15 text-white border border-white/30 backdrop-blur-md hover:bg-white/25",
  }[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    hapticLight();
    if (onClick) onClick(e);
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
