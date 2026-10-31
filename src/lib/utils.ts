import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a book title into a clean main title and optional subtitle.
 * Solves messy formatting when Google Books returns 100+ character titles.
 */
export function parseBookTitle(rawTitle: string): { mainTitle: string; subtitle?: string } {
  if (!rawTitle) return { mainTitle: "Untitled" };

  // 1. Colon split: "Main Title: Subtitle"
  if (rawTitle.includes(":")) {
    const [main, ...rest] = rawTitle.split(":");
    const sub = rest.join(":").trim();
    if (main.trim().length >= 3) {
      return { mainTitle: main.trim(), subtitle: sub || undefined };
    }
  }

  // 2. Dash split: "Main Title - Subtitle"
  if (rawTitle.includes(" - ")) {
    const [main, ...rest] = rawTitle.split(" - ");
    const sub = rest.join(" - ").trim();
    if (main.trim().length >= 3) {
      return { mainTitle: main.trim(), subtitle: sub || undefined };
    }
  }

  // 3. Em-dash split: "Main Title — Subtitle"
  if (rawTitle.includes(" — ")) {
    const [main, ...rest] = rawTitle.split(" — ");
    const sub = rest.join(" — ").trim();
    if (main.trim().length >= 3) {
      return { mainTitle: main.trim(), subtitle: sub || undefined };
    }
  }

  // 4. Parentheses at end: "Main Title (Subtitle)"
  const parenMatch = rawTitle.match(/^(.+?)\s*\((.+)\)$/);
  if (parenMatch && parenMatch[1].trim().length >= 3) {
    return { mainTitle: parenMatch[1].trim(), subtitle: parenMatch[2].trim() };
  }

  // 5. Common subtitle phrases without colons: "The Habit Blueprint A Practical Guide to..."
  const commonSubtitleMatch = rawTitle.match(
    /^(.{3,40}?)\s+((?:A Practical Guide|How to|A Guide to|A Step-by-Step|The Proven System|The Simple Guide|A Simple Guide|The Art of)\b.+)$/i
  );
  if (commonSubtitleMatch && commonSubtitleMatch[1].trim().length >= 3) {
    return {
      mainTitle: commonSubtitleMatch[1].trim(),
      subtitle: commonSubtitleMatch[2].trim(),
    };
  }

  return { mainTitle: rawTitle.trim() };
}
