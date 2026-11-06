export interface StreakEvaluation {
  effectiveStreak: number;
  flameState: "idle" | "at_risk" | "lost";
  hasReadToday: boolean;
  dayDiff: number;
  todayStr: string;
  lastReadStr: string | null;
}

/**
 * Calculates user's effective streak and flame state in their local timezone.
 *
 * Rules (Option A - Strict Daily Habit):
 * - dayDiff === 0: Read today. Streak active. Flame idle.
 * - dayDiff === 1: Read yesterday, haven't read yet today. Streak alive. Flame at_risk (read today to preserve).
 * - dayDiff >= 2: Missed at least 1 full calendar day. Streak broken -> resets to 0. Flame lost (extinguished ember).
 */
export function evaluateUserStreak(
  lastReadAt: Date | string | null,
  recordedStreak: number,
  userTimezone: string = "UTC",
  now: Date = new Date()
): StreakEvaluation {
  if (!lastReadAt) {
    return {
      effectiveStreak: 0,
      flameState: "lost",
      hasReadToday: false,
      dayDiff: 999,
      todayStr: getLocalDateString(now, userTimezone),
      lastReadStr: null,
    };
  }

  const lastDate = new Date(lastReadAt);
  const todayStr = getLocalDateString(now, userTimezone);
  const lastReadStr = getLocalDateString(lastDate, userTimezone);

  if (todayStr === lastReadStr) {
    return {
      effectiveStreak: Math.max(1, recordedStreak),
      flameState: "idle",
      hasReadToday: true,
      dayDiff: 0,
      todayStr,
      lastReadStr,
    };
  }

  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const [lY, lM, lD] = lastReadStr.split("-").map(Number);
  const todayMidnight = Date.UTC(tY, tM - 1, tD);
  const lastReadMidnight = Date.UTC(lY, lM - 1, lD);

  const dayDiff = Math.max(0, Math.round((todayMidnight - lastReadMidnight) / (24 * 60 * 60 * 1000)));

  if (dayDiff === 1) {
    // Read yesterday: streak is alive, flame is at risk until today's session is logged
    return {
      effectiveStreak: Math.max(1, recordedStreak),
      flameState: "at_risk",
      hasReadToday: false,
      dayDiff: 1,
      todayStr,
      lastReadStr,
    };
  }

  // dayDiff >= 2: Missed at least 1 day. Streak is lost (0).
  return {
    effectiveStreak: 0,
    flameState: "lost",
    hasReadToday: false,
    dayDiff,
    todayStr,
    lastReadStr,
  };
}

export function getLocalDateString(date: Date, timezone: string = "UTC"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (e) {
    return date.toISOString().split("T")[0];
  }
}
