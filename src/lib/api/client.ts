/**
 * API client for ReadToChange frontend.
 * Automatically attaches Telegram WebApp initData header.
 */

export async function waitForTelegramInitData(maxWaitMs = 1500): Promise<string> {
  if (typeof window === "undefined") return "";

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const initData = (window as any).Telegram?.WebApp?.initData;
    if (initData && typeof initData === "string" && initData.trim() !== "") {
      return initData;
    }

    // Check Telegram hash fallback (#tgWebAppData=...)
    if (window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const fromHash = hashParams.get("tgWebAppData");
        if (fromHash && fromHash.trim() !== "") {
          return fromHash;
        }
      } catch (e) {}
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  let finalData = (window as any).Telegram?.WebApp?.initData || "";
  if (!finalData && typeof window !== "undefined" && window.location.hash) {
    try {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      finalData = hashParams.get("tgWebAppData") || "";
    } catch (e) {}
  }
  return finalData;
}

export function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    let initData = (window as any).Telegram?.WebApp?.initData;
    if (!initData && window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        initData = hashParams.get("tgWebAppData") || "";
      } catch (e) {}
    }
    if (initData) {
      return { "x-telegram-init-data": initData };
    }
  }
  return {};
}

export interface SyncResponse {
  user: {
    id: string;
    telegramId: string;
    firstName: string | null;
    username: string | null;
    dailyTarget: number;
    reminderTime: string;
    streakDays: number;
    flameState?: "idle" | "at_risk" | "lost";
    hasReadToday?: boolean;
    lastReadAt: string | null;
  };
  activeBook: any | null;
  readingBooks?: any[];
  savedBookIds: string[];
  savedBooks?: any[];
  finishedBookIds: string[];
  finishedBooks?: any[];
  selectedGoalIds: string[];
  sessions: any[];
  actions: Array<{
    id: string;
    description: string;
    completedAt: string | null;
    createdAt: string;
  }>;
}

export async function syncUserData(): Promise<SyncResponse | null> {
  try {
    // Gracefully ensure Telegram WebApp initData is ready before dispatching sync
    const initData = await waitForTelegramInitData(1500);
    const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
    const headers: Record<string, string> = {
      ...(initData ? { "x-telegram-init-data": initData } : getAuthHeader()),
      "x-timezone": tz,
    };

    const res = await fetch("/api/user/sync", { headers });
    if (!res.ok) throw new Error("Sync failed");
    return await res.json();
  } catch (err) {
    console.warn("API syncUserData error (using offline state):", err);
    return null;
  }
}

export async function saveUserSettings(settings: {
  dailyTarget?: number;
  reminderTime?: string;
  selectedGoalIds?: string[];
  timezone?: string;
  timezoneOffset?: number;
}) {
  try {
    const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
    const tzOffset = typeof Date !== "undefined" ? new Date().getTimezoneOffset() : 0;

    const res = await fetch("/api/user/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        timezone: tz,
        timezoneOffset: tzOffset,
        ...settings,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("saveUserSettings error:", err);
    return null;
  }
}

export async function fetchBooks(params?: {
  category?: string;
  query?: string;
  limit?: number;
  offset?: number;
  refresh?: boolean;
  excludeIds?: string[];
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set("category", params.category);
    if (params?.query) queryParams.set("query", params.query);
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset !== undefined) queryParams.set("offset", String(params.offset));
    if (params?.refresh) queryParams.set("refresh", "true");
    if (params?.excludeIds && params.excludeIds.length > 0) {
      queryParams.set("excludeIds", params.excludeIds.join(","));
    }

    const res = await fetch(`/api/books?${queryParams.toString()}`);
    if (!res.ok) throw new Error("Fetch books failed");
    return await res.json();
  } catch (err) {
    console.error("fetchBooks error:", err);
    return { books: [] };
  }
}

export async function commitActiveBook(payload: {
  bookId: string;
  status?: "READING" | "WANT_TO_READ" | "FINISHED" | "UNSAVED" | "SET_FOCUS" | "PAUSED" | "PAUSE";
  dailyTarget?: number;
  currentPage?: number;
  title?: string;
  author?: string;
  totalPages?: number;
  coverUrl?: string;
  growthCategory?: string;
  aiHook?: string;
  whyThisBook?: string;
  mascotTake?: string;
  summary?: string;
  keyIdeas?: string[];
}) {
  try {
    const res = await fetch("/api/books/commit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error("commitActiveBook error:", err);
    return null;
  }
}

export async function setFocusBook(bookId: string) {
  return commitActiveBook({ bookId, status: "SET_FOCUS" });
}

export async function pauseReadingBook(bookId: string) {
  return commitActiveBook({ bookId, status: "PAUSED" });
}

export async function trackCustomBook(book: {
  title: string;
  author: string;
  totalPages: number;
  currentPage?: number;
  coverUrl?: string;
  growthCategory?: string;
  aiHook?: string;
  whyThisBook?: string;
}) {
  try {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(book),
    });
    return await res.json();
  } catch (err) {
    console.error("trackCustomBook error:", err);
    return null;
  }
}

export async function logReadingSession(data: {
  bookId: string;
  durationMinutes: number;
  pagesRead: number;
  takeaway?: string;
  reflectionQuestion?: string;
  reflectionAnswer?: string;
  actionItem?: string;
}) {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("logReadingSession error:", err);
    return null;
  }
}

export async function toggleActionItem(id: string, completed: boolean) {
  try {
    const res = await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ completed }),
    });
    return await res.json();
  } catch (err) {
    console.error("toggleActionItem error:", err);
    return null;
  }
}
