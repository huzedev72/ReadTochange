import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string;
  size?: "sm" | "md" | "lg";
  tilt?: boolean;
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  author,
  coverUrl,
  size = "md",
  tilt = false,
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    sm: "w-[62px] h-[90px] text-[9px]",
    md: "w-[96px] h-[140px] text-xs",
    lg: "w-[160px] h-[235px] text-sm",
  }[size];

  return (
    <div
      className={cn(
        "relative flex-shrink-0 select-none overflow-hidden transition-transform duration-200",
        "border-[3px] border-[#0E0E0E] bg-white text-[#0E0E0E]",
        "rounded-l-[4px] rounded-r-[12px]",
        tilt && "-rotate-[4deg] hover:rotate-0",
        dimensions,
        className
      )}
      style={{
        boxShadow: size === "sm" ? "4px 4px 0px #0E0E0E" : "8px 8px 0px #0E0E0E",
      }}
    >
      {/* Spine strip simulation */}
      <div className="absolute left-0 top-0 bottom-0 w-[12px] border-r-[2px] border-[#0E0E0E] bg-black/15 z-20 pointer-events-none" />

      {coverUrl && !imgError ? (
        <img
          src={coverUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover z-10"
        />
      ) : (
        /* Stylized Doodle Glass Typographic Fallback */
        <div className="relative w-full h-full p-2 pl-4 flex flex-col justify-between font-poppins font-extrabold leading-tight z-10 bg-[#FFF8EE]">
          <span className="text-[7px] uppercase tracking-wider text-[#5B5348] line-clamp-1">
            {author}
          </span>

          {/* Geometric decorative dots */}
          <div className="flex flex-wrap gap-1 w-9">
            <span className="w-2 h-2 rounded-full bg-[#FFA83A]" />
            <span className="w-2 h-2 rounded-full bg-[#0E0E0E]" />
            <span className="w-2 h-2 rounded-full bg-[#FFA83A]" />
            <span className="w-2 h-2 rounded-full bg-[#0E0E0E]" />
          </div>

          <span className="text-[10px] leading-tight line-clamp-2 text-[#0E0E0E]">
            {title}
          </span>
        </div>
      )}
    </div>
  );
};
