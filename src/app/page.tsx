"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Book, INITIAL_BOOKS, INITIAL_GOALS, ReadingSession } from "@/data/mockData";
import { GlassNav, NavTab } from "@/components/ui/GlassNav";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { HomeView } from "@/components/screens/HomeView";
import { DiscoverView } from "@/components/screens/DiscoverView";
import { LibraryView } from "@/components/screens/LibraryView";
import { ProgressView } from "@/components/screens/ProgressView";
import { CommitView } from "@/components/screens/CommitView";
import { LogSessionView } from "@/components/screens/LogSessionView";
import { BookDetailsSheet } from "@/components/screens/BookDetailsSheet";
import { WhyThisBookSheet } from "@/components/screens/WhyThisBookSheet";
import { OnboardingView } from "@/components/screens/OnboardingView";
import { StreakModal } from "@/components/screens/StreakModal";
import { GoalPickerModal } from "@/components/screens/GoalPickerModal";
import { TrackOwnBookModal } from "@/components/screens/TrackOwnBookModal";
import { FocusTimerModal } from "@/components/screens/FocusTimerModal";
import { SettingsDrawer } from "@/components/screens/SettingsDrawer";
import { BookFinishedModal } from "@/components/screens/BookFinishedModal";
import { PauseBookModal } from "@/components/screens/PauseBookModal";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import {
  syncUserData,
  saveUserSettings,
  commitActiveBook,
  trackCustomBook,
  logReadingSession,
  fetchBooks,
  setFocusBook,
  pauseReadingBook,
  toggleActionItem,
} from "@/lib/api/client";

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<NavTab>("home");
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [readingBooks, setReadingBooks] = useState<Book[]>([]);
  const [pauseCandidateBook, setPauseCandidateBook] = useState<Book | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(15);
  const [reminderTime, setReminderTime] = useState<string>("20:30");
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [finishedBookIds, setFinishedBookIds] = useState<string[]>([]);
  const [finishedBooks, setFinishedBooks] = useState<Book[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [completedActionIds, setCompletedActionIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("readtochange_completed_actions");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return [];
  });
  const [lastActionItem, setLastActionItem] = useState<string>("");
  const [discoveryBooks, setDiscoveryBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [loadingGoalLabel, setLoadingGoalLabel] = useState<string>("");
  // Incrementing this key forces a re-fetch on every Discover tap
  const [discoverRefreshKey, setDiscoverRefreshKey] = useState<number>(0);

  // Overlays & flow states
  const [committingBook, setCommittingBook] = useState<Book | null>(null);
  const [isLoggingSession, setIsLoggingSession] = useState<boolean>(false);
  const [detailsBook, setDetailsBook] = useState<Book | null>(null);
  const [whyThisBook, setWhyThisBook] = useState<Book | null>(null);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isGoalPickerOpen, setIsGoalPickerOpen] = useState<boolean>(false);
  const [isTrackOwnBookOpen, setIsTrackOwnBookOpen] = useState<boolean>(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [finishedCelebrationBook, setFinishedCelebrationBook] = useState<Book | null>(null);

  // Real user sessions (clean state: empty until user actually logs)
  const [sessions, setSessions] = useState<ReadingSession[]>([]);

  // Expand Telegram WebApp if loaded inside Telegram
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor("#0E0E0E");
      if (tg.setBackgroundColor) tg.setBackgroundColor("#0E0E0E");
    }
  }, []);

  // Hydrate user from Backend & Telegram URL parameters
  useEffect(() => {
    async function initUser() {
      try {
        // 1. Check if goals were passed in URL (from Telegram Bot "Show me my books →")
        let urlGoals: string[] = [];
        if (typeof window !== "undefined") {
          try {
            const params = new URLSearchParams(window.location.search);
            const goalsParam = params.get("goals");
            if (goalsParam) {
              urlGoals = goalsParam
                .split(",")
                .map((g) => g.trim().toLowerCase())
                .filter(Boolean);
            }
          } catch (e) {
            // ignore
          }
        }

        const sync = await syncUserData();

        // 2. Hydrate clean real state from database FIRST
        if (sync) {
          if (sync.user) {
            setDailyTarget(sync.user.dailyTarget ?? 15);
            setReminderTime(sync.user.reminderTime ?? "20:30");
            setStreakDays(sync.user.streakDays ?? 0);
          }

          if (sync.activeBook) {
            setActiveBook(sync.activeBook);
          } else {
            setActiveBook(null);
          }

          setReadingBooks(sync.readingBooks ?? []);
          setSavedBookIds(sync.savedBookIds ?? []);
          setSavedBooks(sync.savedBooks ?? []);
          setFinishedBookIds(sync.finishedBookIds ?? []);
          setFinishedBooks(sync.finishedBooks ?? []);
          setSessions(sync.sessions ?? []);

          const lastWithAction = (sync.sessions ?? []).find((s: any) => s.actionItem);
          if (lastWithAction?.actionItem) {
            setLastActionItem(lastWithAction.actionItem);
          }

          if (sync.actions && sync.actions.length > 0) {
            const completedActions = sync.actions.filter((a: any) => a.completedAt !== null);
            const serverCompletedIds = completedActions.map((a: any) => a.id);
            const serverCompletedDesc = completedActions.map((a: any) => a.description);
            setCompletedActionIds((prev) => {
              const merged = Array.from(new Set([...prev, ...serverCompletedIds, ...serverCompletedDesc]));
              if (typeof window !== "undefined") {
                localStorage.setItem("readtochange_completed_actions", JSON.stringify(merged));
              }
              return merged;
            });
          }
        }

        // 3. Determine Onboarding & Initial Tab:
        // If user has an active book in DB, they are active -> ALWAYS start on Home tab!
        const hasActiveBook = Boolean(sync?.activeBook || (sync?.readingBooks && sync.readingBooks.length > 0));

        if (urlGoals.length > 0) {
          setHasCompletedOnboarding(true);
          setSelectedGoalIds(urlGoals);
          if (typeof window !== "undefined") {
            localStorage.setItem("readtochange_onboarded", "true");
          }
          saveUserSettings({ selectedGoalIds: urlGoals });
          loadDiscoveryBooks(urlGoals);
          if (!hasActiveBook) {
            setCurrentTab("discover");
          } else {
            setCurrentTab("home");
          }
        } else if (sync?.selectedGoalIds && sync.selectedGoalIds.length > 0) {
          setHasCompletedOnboarding(true);
          setSelectedGoalIds(sync.selectedGoalIds);
          if (typeof window !== "undefined") {
            localStorage.setItem("readtochange_onboarded", "true");
          }
          loadDiscoveryBooks(sync.selectedGoalIds);
          setCurrentTab("home");
        } else if (hasActiveBook) {
          setHasCompletedOnboarding(true);
          if (typeof window !== "undefined") {
            localStorage.setItem("readtochange_onboarded", "true");
          }
          setCurrentTab("home");
        } else {
          const onboarded = typeof window !== "undefined" ? localStorage.getItem("readtochange_onboarded") : null;
          if (!onboarded) {
            setHasCompletedOnboarding(false);
          }
        }
      } catch (err) {
        console.error("Error during initUser:", err);
      } finally {
        setIsHydrated(true);
      }
    }

    initUser();
  }, []);

  // ── Fetch books for ALL selected goals in parallel, merge & shuffle ───────
  const loadDiscoveryBooks = useCallback(async (goalIds: string[]) => {
    const activeGoals = goalIds.length > 0 ? goalIds : ["discipline"];

    // Build a readable label like "Discipline & Focus" or "Discipline, Focus & Leadership"
    const goalLabels = activeGoals
      .map((id) => INITIAL_GOALS.find((g) => g.id === id)?.label ?? id)
      .slice(0, 3);
    const goalLabel =
      goalLabels.length === 1
        ? goalLabels[0]
        : goalLabels.slice(0, -1).join(", ") + " & " + goalLabels[goalLabels.length - 1];

    setIsLoadingBooks(true);
    setLoadingGoalLabel(goalLabel);

    const excluded = [
      activeBook?.id,
      ...readingBooks.map((b) => b.id),
      ...finishedBookIds,
    ].filter(Boolean) as string[];

    try {
      // Fetch all goals in parallel with refresh and dynamic angle rotation
      const perGoalLimit = Math.max(5, Math.ceil(15 / activeGoals.length));
      const results = await Promise.allSettled(
        activeGoals.map((goalId) =>
          fetchBooks({
            category: goalId,
            limit: perGoalLimit,
            refresh: true,
            excludeIds: excluded,
          })
        )
      );

      // Merge all successful results
      const merged: Book[] = results.flatMap((r) =>
        r.status === "fulfilled" && r.value?.books ? r.value.books : []
      );

      // Deduplicate by book id and normalized title
      const seenIds = new Set<string>();
      const seenTitles = new Set<string>();
      const unique = merged.filter((b) => {
        const titleKey = b.title.trim().toLowerCase();
        if (seenIds.has(b.id) || seenTitles.has(titleKey)) return false;
        seenIds.add(b.id);
        seenTitles.add(titleKey);
        return true;
      });

      // Interleave books from different goals so feed feels varied & alive
      const shuffled = [...unique].sort(() => Math.random() - 0.5);

      if (shuffled.length > 0) {
        setDiscoveryBooks(shuffled);
      }
    } catch (e) {
      console.error("Failed to load discovery books:", e);
    } finally {
      setIsLoadingBooks(false);
    }
  }, [activeBook?.id, readingBooks, finishedBookIds]);

  // Trigger: goals changed OR discover tab tapped (discoverRefreshKey bumped)
  useEffect(() => {
    loadDiscoveryBooks(selectedGoalIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoalIds, discoverRefreshKey, loadDiscoveryBooks]);

  const handleCompleteOnboarding = (goals: string[], minutes: number, time: string) => {
    hapticSuccess();
    setSelectedGoalIds(goals);
    setDailyTarget(minutes);
    setReminderTime(time);
    setHasCompletedOnboarding(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("readtochange_onboarded", "true");
    }
    saveUserSettings({ selectedGoalIds: goals, dailyTarget: minutes, reminderTime: time });
    setCurrentTab("home");
  };

  const primaryGoalLabel =
    INITIAL_GOALS.find((g) => selectedGoalIds.includes(g.id))?.label || "Discipline";

  const handleToggleSave = async (bookOrId: Book | string) => {
    hapticLight();
    const bookId = typeof bookOrId === "string" ? bookOrId : bookOrId.id;
    const isSaved = savedBookIds.includes(bookId);

    if (isSaved) {
      setSavedBookIds((prev) => prev.filter((id) => id !== bookId));
      setSavedBooks((prev) => prev.filter((b) => b.id !== bookId));
      await commitActiveBook({ bookId, status: "UNSAVED" });
    } else {
      setSavedBookIds((prev) => [...prev, bookId]);
      const fullBook =
        typeof bookOrId !== "string"
          ? bookOrId
          : discoveryBooks.find((b) => b.id === bookId) ||
            INITIAL_BOOKS.find((b) => b.id === bookId);

      if (fullBook) {
        setSavedBooks((prev) => {
          if (prev.some((b) => b.id === bookId)) return prev;
          return [fullBook, ...prev];
        });
      }
      await commitActiveBook({ bookId, status: "WANT_TO_READ" });
    }
  };

  const handleSetFocusBook = async (book: Book) => {
    hapticSuccess();
    setActiveBook(book);
    await setFocusBook(book.id);
  };

  const handlePauseBook = async (book: Book) => {
    hapticLight();
    const remaining = readingBooks.filter((b) => b.id !== book.id);
    setReadingBooks(remaining);
    if (!savedBookIds.includes(book.id)) {
      setSavedBookIds([book.id, ...savedBookIds]);
      setSavedBooks([book, ...savedBooks]);
    }
    if (activeBook?.id === book.id) {
      setActiveBook(remaining.length > 0 ? remaining[0] : null);
    }
    await pauseReadingBook(book.id);
  };

  const handleStartCommit = (book: Book) => {
    hapticLight();
    const isAlreadyReading = readingBooks.some((b) => b.id === book.id);
    if (!isAlreadyReading && readingBooks.length >= 3) {
      setPauseCandidateBook(book);
      return;
    }
    setCommittingBook(book);
  };

  const handlePauseAndProceed = async (bookToPause: Book) => {
    await handlePauseBook(bookToPause);
    const incoming = pauseCandidateBook;
    setPauseCandidateBook(null);
    if (incoming) {
      setCommittingBook(incoming);
    }
  };

  const handleConfirmCommit = async (minutes: number, time: string) => {
    hapticSuccess();
    if (committingBook) {
      const bookToCommit = committingBook;
      setActiveBook(bookToCommit);
      if (!readingBooks.some((b) => b.id === bookToCommit.id)) {
        setReadingBooks([bookToCommit, ...readingBooks]);
      }
      setSavedBookIds(savedBookIds.filter((id) => id !== bookToCommit.id));
      setSavedBooks(savedBooks.filter((b) => b.id !== bookToCommit.id));
      setDailyTarget(minutes);
      setReminderTime(time);
      setCommittingBook(null);
      setCurrentTab("home");

      const res = await commitActiveBook({
        bookId: bookToCommit.id,
        status: "READING",
        dailyTarget: minutes,
        title: bookToCommit.title,
        author: bookToCommit.author,
        totalPages: bookToCommit.totalPages,
        coverUrl: bookToCommit.coverUrl,
        growthCategory: bookToCommit.growthCategory,
        aiHook: bookToCommit.aiHook,
        whyThisBook: bookToCommit.whyThisBook,
        mascotTake: bookToCommit.mascotTake,
        summary: bookToCommit.summary,
        keyIdeas: bookToCommit.keyIdeas,
      });

      if (res && res.book) {
        setActiveBook(res.book);
      }
      if (res && res.maxReached) {
        setPauseCandidateBook(bookToCommit);
      }
      await saveUserSettings({ dailyTarget: minutes, reminderTime: time });
    }
  };

  const handleTrackOwnBook = async (newBook: Book, startingPage: number) => {
    hapticSuccess();
    setCurrentTab("home");

    // Persist custom book to database first so we have its permanent database ID
    const res = await trackCustomBook({
      title: newBook.title,
      author: newBook.author,
      totalPages: newBook.totalPages,
      currentPage: startingPage,
      coverUrl: newBook.coverUrl,
      growthCategory: newBook.growthCategory,
      aiHook: newBook.aiHook,
      whyThisBook: newBook.whyThisBook,
    });

    const realBook: Book = res?.book || newBook;
    setActiveBook(realBook);
    setReadingBooks((prev) => [realBook, ...prev.filter((b) => b.id !== realBook.id)]);
    if (!savedBookIds.includes(realBook.id)) {
      setSavedBookIds((prev) => [realBook.id, ...prev]);
    }

    if (startingPage > 0) {
      const initialProgressSession: ReadingSession = {
        id: `s-initial-${Date.now()}`,
        bookId: realBook.id,
        bookTitle: realBook.title,
        durationMinutes: 0,
        pagesRead: startingPage,
        takeaway: "Carried over from personal physical reading progress.",
        reflectionQuestion: "What stood out so far?",
        actionItem: "Continue daily reading streak.",
        createdAt: "Started earlier",
      };
      setSessions((prev) => [initialProgressSession, ...prev]);

      // Persist initial reading session to database
      const sessionRes = await logReadingSession({
        bookId: realBook.id,
        durationMinutes: 5,
        pagesRead: startingPage,
        takeaway: "Carried over from personal physical reading progress.",
        reflectionQuestion: "What stood out so far?",
        actionItem: "Continue daily reading streak.",
      });

      if (sessionRes?.session && typeof sessionRes.streakDays === "number") {
        setStreakDays(sessionRes.streakDays);
      }
    }
  };

  const handleFinishFocusTimer = (minutesSpent: number) => {
    setIsFocusTimerOpen(false);
    setIsLoggingSession(true);
  };

  const handleSaveSession = async (data: {
    durationMinutes: number;
    pagesRead: number;
    takeaway: string;
    actionItem: string;
  }) => {
    hapticSuccess();
    if (activeBook) {
      const newSession: ReadingSession = {
        id: `s-${Date.now()}`,
        bookId: activeBook.id,
        bookTitle: activeBook.title,
        durationMinutes: data.durationMinutes,
        pagesRead: data.pagesRead,
        takeaway: data.takeaway,
        reflectionQuestion: "What stood out to you in today's reading?",
        actionItem: data.actionItem,
        createdAt: new Date().toISOString(),
      };

      setSessions([newSession, ...sessions]);
      if (data.actionItem) {
        setLastActionItem(data.actionItem);
      }

      // Check if book has been completed
      const totalPagesReadSoFar = sessions
        .filter((s) => s.bookId === activeBook.id)
        .reduce((sum, s) => sum + s.pagesRead, 0);

      if (totalPagesReadSoFar + data.pagesRead >= activeBook.totalPages) {
        if (!finishedBookIds.includes(activeBook.id)) {
          setFinishedBookIds([...finishedBookIds, activeBook.id]);
        }
        setFinishedCelebrationBook(activeBook);
      }

      setStreakDays((prev) => prev + 1);
      setIsLoggingSession(false);
      setCurrentTab("home");

      // Save to backend database
      const res = await logReadingSession({
        bookId: activeBook.id,
        durationMinutes: data.durationMinutes,
        pagesRead: data.pagesRead,
        takeaway: data.takeaway,
        reflectionQuestion: "What stood out to you in today's reading?",
        actionItem: data.actionItem,
      });

      if (res && res.success && typeof res.streakDays === "number") {
        setStreakDays(res.streakDays);
      }
    } else {
      setIsLoggingSession(false);
      setCurrentTab("home");
    }
  };

  const handleToggleAction = useCallback((actionOrSessionId: string) => {
    setCompletedActionIds((prev) => {
      const isCompleted = prev.includes(actionOrSessionId);
      const next = isCompleted
        ? prev.filter((id) => id !== actionOrSessionId)
        : [...prev, actionOrSessionId];

      if (typeof window !== "undefined") {
        localStorage.setItem("readtochange_completed_actions", JSON.stringify(next));
      }

      if (isCompleted) {
        hapticLight();
      } else {
        hapticSuccess();
      }

      toggleActionItem(actionOrSessionId, !isCompleted).catch((err) =>
        console.error("Failed to toggle action item on backend:", err)
      );

      return next;
    });
  }, []);

  const handleTabChange = (tab: NavTab) => {
    hapticLight();
    setCurrentTab(tab);
    // Bump the key every time Discover is tapped — forces re-fetch even if already on it
    if (tab === "discover") {
      setDiscoverRefreshKey((k) => k + 1);
    }
  };

  return (
    <main className="w-full min-h-[100dvh] bg-[#0A0A0A] flex justify-center items-center">
      {/* 1. Motion Spec Splash Screen (plays on app launch) */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isReady={isHydrated} />}

      {/* 2. Mobile-First Phone Container */}
      <div className="relative w-full max-w-[420px] h-[100dvh] bg-[#0E0E0E] text-white overflow-hidden shadow-2xl flex flex-col">
        {/* Onboarding Flow: Screen E9 & Daily Commitment (for first-time users) */}
        {!hasCompletedOnboarding ? (
          <OnboardingView onComplete={handleCompleteOnboarding} />
        ) : committingBook ? (
          /* If committing, show full-screen Commit flow E6 */
          <CommitView
            book={committingBook}
            onConfirmCommitment={handleConfirmCommit}
            onCancel={() => setCommittingBook(null)}
          />
        ) : isLoggingSession && activeBook ? (
          /* If logging session, show E7 log + E3 reflect flow */
          <LogSessionView
            book={activeBook}
            onSaveSession={handleSaveSession}
            onCancel={() => setIsLoggingSession(false)}
          />
        ) : (
          <>
            {/* Active Tab Screen */}
            {currentTab === "home" && (
              <HomeView
                activeBook={activeBook}
                dailyTargetMinutes={dailyTarget}
                daysReadThisWeek={Math.min(7, streakDays)}
                streakDays={streakDays}
                primaryGoalLabel={primaryGoalLabel}
                lastActionItem={lastActionItem}
                onLogSession={() => {
                  hapticLight();
                  setIsLoggingSession(true);
                }}
                onExploreBooks={() => handleTabChange("discover")}
                onOpenMenu={() => setIsSettingsOpen(true)}
                onOpenStreakModal={() => {
                  hapticLight();
                  setIsStreakModalOpen(true);
                }}
                onOpenTrackOwnBook={() => {
                  hapticLight();
                  setIsTrackOwnBookOpen(true);
                }}
                onOpenFocusTimer={() => {
                  hapticLight();
                  setIsFocusTimerOpen(true);
                }}
                sessions={sessions}
              />
            )}

            {currentTab === "discover" && (
              <DiscoverView
                books={discoveryBooks}
                isLoading={isLoadingBooks}
                loadingGoalLabel={loadingGoalLabel}
                onSelectBookToCommit={handleStartCommit}
                onOpenDetails={(book) => {
                  hapticLight();
                  setDetailsBook(book);
                }}
                onOpenWhyThisBook={(book) => {
                  hapticLight();
                  setWhyThisBook(book);
                }}
                savedBookIds={savedBookIds}
                onToggleSave={handleToggleSave}
                onOpenMenu={() => setIsSettingsOpen(true)}
                onOpenTrackOwnBook={() => {
                  hapticLight();
                  setIsTrackOwnBookOpen(true);
                }}
              />
            )}

            {currentTab === "library" && (
              <div className="h-full overflow-y-auto no-scrollbar">
                <LibraryView
                  activeBook={activeBook}
                  readingBooks={readingBooks}
                  savedBookIds={savedBookIds}
                  savedBooks={savedBooks}
                  finishedBookIds={finishedBookIds}
                  finishedBooks={finishedBooks}
                  sessions={sessions}
                  onSelectBook={(book) => {
                    hapticLight();
                    setDetailsBook(book);
                  }}
                  onExplore={() => handleTabChange("discover")}
                  onOpenTrackOwnBook={() => {
                    hapticLight();
                    setIsTrackOwnBookOpen(true);
                  }}
                  onSetFocusBook={handleSetFocusBook}
                  onPauseBook={handlePauseBook}
                />
              </div>
            )}

            {currentTab === "progress" && (
              <div className="h-full overflow-y-auto no-scrollbar">
                <ProgressView
                  sessions={sessions}
                  completedBooksCount={finishedBookIds.length}
                  finishedBooks={finishedBooks}
                  completedActionIds={completedActionIds}
                  onToggleAction={handleToggleAction}
                />
              </div>
            )}

            {/* Floating Glass Navigation (Only shown when splash & onboarding are completed) */}
            {!showSplash && hasCompletedOnboarding && (
              <GlassNav currentTab={currentTab} onTabChange={handleTabChange} />
            )}

            {/* Details Sheet Modal (Screen E10) */}
            <BookDetailsSheet
              book={detailsBook}
              onClose={() => setDetailsBook(null)}
              onStartReading={(book) => {
                setDetailsBook(null);
                handleStartCommit(book);
              }}
            />

            {/* Why This Book Transformation Sheet (Combination of Option 1 & 3) */}
            <WhyThisBookSheet
              book={whyThisBook}
              onClose={() => setWhyThisBook(null)}
              onStartReading={(book) => {
                setWhyThisBook(null);
                handleStartCommit(book);
              }}
            />

            {/* Goal Picker Modal (Screen E9) */}
            <GoalPickerModal
              selectedGoalIds={selectedGoalIds}
              isOpen={isGoalPickerOpen}
              onSaveGoals={(goals) => {
                hapticSuccess();
                setSelectedGoalIds(goals);
                setIsGoalPickerOpen(false);
                saveUserSettings({ selectedGoalIds: goals });
              }}
              onClose={() => setIsGoalPickerOpen(false)}
            />

            {/* Streak & Consistency Modal (Replaces static notification bell) */}
            <StreakModal
              isOpen={isStreakModalOpen}
              onClose={() => setIsStreakModalOpen(false)}
              daysReadThisWeek={Math.min(7, streakDays)}
              currentStreak={streakDays}
              reminderTime={reminderTime}
              onUpdateReminderTime={(time) => {
                setReminderTime(time);
                saveUserSettings({ reminderTime: time });
              }}
              sessions={sessions}
            />

            {/* Track Own Book Modal (Search & Manual Fallback) */}
            <TrackOwnBookModal
              isOpen={isTrackOwnBookOpen}
              onClose={() => setIsTrackOwnBookOpen(false)}
              onTrackBook={handleTrackOwnBook}
            />

            {/* Quiet Focus Timer Modal */}
            <FocusTimerModal
              isOpen={isFocusTimerOpen}
              book={activeBook}
              targetMinutes={dailyTarget}
              onClose={() => setIsFocusTimerOpen(false)}
              onFinishReading={handleFinishFocusTimer}
            />

            {/* Settings & Preferences Drawer */}
            <SettingsDrawer
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              selectedGoalIds={selectedGoalIds}
              onOpenGoalPicker={() => setIsGoalPickerOpen(true)}
              dailyTarget={dailyTarget}
              onUpdateDailyTarget={(mins) => {
                setDailyTarget(mins);
                saveUserSettings({ dailyTarget: mins });
              }}
              reminderTime={reminderTime}
              onUpdateReminderTime={(time) => {
                setReminderTime(time);
                saveUserSettings({ reminderTime: time });
              }}
            />

            {/* Book Finished Celebration Sheet */}
            <BookFinishedModal
              isOpen={Boolean(finishedCelebrationBook)}
              book={finishedCelebrationBook}
              sessions={sessions}
              onClose={() => setFinishedCelebrationBook(null)}
              onPickNextBook={() => {
                setFinishedCelebrationBook(null);
                setCurrentTab("discover");
              }}
            />

            {/* Reading Cap & Pause Sheet (When user tries to start > 3 active books) */}
            <PauseBookModal
              isOpen={Boolean(pauseCandidateBook)}
              incomingBook={pauseCandidateBook}
              readingBooks={readingBooks}
              sessions={sessions}
              onClose={() => setPauseCandidateBook(null)}
              onPauseAndProceed={handlePauseAndProceed}
            />
          </>
        )}
      </div>
    </main>
  );
}
