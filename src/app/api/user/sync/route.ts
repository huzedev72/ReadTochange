import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTelegramInitData } from "@/lib/telegram/auth";
import { evaluateUserStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("x-telegram-init-data");
    const { user: tgUser, isValid } = validateTelegramInitData(authHeader);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const telegramId = String(tgUser.id);
    const firstName = tgUser.first_name || "Reader";
    const username = tgUser.username || null;
    const clientTimezone = req.headers.get("x-timezone");

    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName: firstName || undefined,
        username: username || undefined,
        timezone: clientTimezone && typeof clientTimezone === "string" ? clientTimezone : undefined,
      },
      create: {
        telegramId,
        firstName,
        username,
        dailyTarget: 15,
        reminderTime: "20:30",
        timezone: clientTimezone && typeof clientTimezone === "string" ? clientTimezone : "UTC",
        streakDays: 0,
      },
      include: {
        userGoals: true,
        userBooks: {
          include: { book: true },
        },
        readingSessions: {
          include: { book: true },
          orderBy: { createdAt: "desc" },
        },
        actions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // 2. Format book helper
    const formatBook = (b: any, currentPage?: number) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      totalPages: b.totalPages,
      coverUrl: b.coverUrl || undefined,
      growthCategory: b.growthCategory,
      aiHook: b.aiHook,
      whyThisBook: b.whyThisBook,
      mascotTake: b.mascotTake,
      summary: b.summary,
      keyIdeas: JSON.parse(b.keyIdeasJson || "[]"),
      previewUrl: b.previewUrl || undefined,
      isPublicDomain: b.isPublicDomain,
      isCustom: b.isCustom,
      ...(typeof currentPage === "number" ? { currentPage } : {}),
    });

    // 3. Partition reading, saved, and finished books
    const readingBooks = user.userBooks
      .filter((ub) => ub.status === "READING")
      .map((ub) => formatBook(ub.book, ub.currentPage));

    // Active focus book: prefer user.activeBookId, otherwise top reading book
    let activeBook = null;
    if (user.activeBookId) {
      activeBook = readingBooks.find((b) => b.id === user.activeBookId) || null;
    }
    if (!activeBook && readingBooks.length > 0) {
      activeBook = readingBooks[0];
    }

    const savedBookIds = user.userBooks
      .filter((ub) => ub.status === "WANT_TO_READ")
      .map((ub) => ub.bookId);

    const savedBooks = user.userBooks
      .filter((ub) => ub.status === "WANT_TO_READ")
      .map((ub) => formatBook(ub.book, ub.currentPage));

    const finishedBookIds = user.userBooks
      .filter((ub) => ub.status === "FINISHED")
      .map((ub) => ub.bookId);

    const finishedBooks = user.userBooks
      .filter((ub) => ub.status === "FINISHED")
      .map((ub) => formatBook(ub.book, ub.currentPage));

    // 4. Format sessions
    const completedActionDescriptions = new Set(
      user.actions
        .filter((a) => a.completedAt !== null)
        .map((a) => a.description.trim().toLowerCase())
    );

    const formattedSessions = user.readingSessions.map((s) => ({
      id: s.id,
      bookId: s.bookId,
      bookTitle: s.book.title,
      durationMinutes: s.durationMinutes,
      pagesRead: s.pagesRead,
      takeaway: s.takeaway || undefined,
      reflectionQuestion: s.reflectionQuestion,
      reflectionAnswer: s.reflectionAnswer || undefined,
      actionItem: s.actionItem || undefined,
      actionCompleted: s.actionItem
        ? completedActionDescriptions.has(s.actionItem.trim().toLowerCase())
        : false,
      createdAt: s.createdAt.toISOString(),
    }));

    // 5. Evaluate live streak decay in user timezone (Option A: Strict Daily Habit)
    const userTz = clientTimezone || user.timezone || "UTC";
    const streakEval = evaluateUserStreak(user.lastReadAt, user.streakDays, userTz);

    // If streak has expired (missed >= 2 days) and DB still has non-zero streak, persist decay
    if (streakEval.dayDiff >= 2 && user.streakDays > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { streakDays: 0 },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        dailyTarget: user.dailyTarget,
        reminderTime: user.reminderTime,
        streakDays: streakEval.effectiveStreak,
        flameState: streakEval.flameState,
        hasReadToday: streakEval.hasReadToday,
        lastReadAt: user.lastReadAt?.toISOString() || null,
      },
      activeBook,
      readingBooks,
      savedBookIds,
      savedBooks,
      finishedBookIds,
      finishedBooks,
      selectedGoalIds: user.userGoals.map((ug) => ug.goalId),
      sessions: formattedSessions,
      actions: user.actions.map((a) => ({
        id: a.id,
        description: a.description,
        completedAt: a.completedAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in /api/user/sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
