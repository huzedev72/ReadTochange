import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTelegramInitData } from "@/lib/telegram/auth";
import { evaluateUserStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-telegram-init-data");
    const { user: tgUser, isValid } = validateTelegramInitData(authHeader);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const telegramId = String(tgUser.id);
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      bookId,
      durationMinutes,
      pagesRead,
      takeaway,
      reflectionQuestion,
      reflectionAnswer,
      actionItem,
    } = body;

    if (!bookId || !durationMinutes || !pagesRead) {
      return NextResponse.json(
        { error: "Missing required fields: bookId, durationMinutes, pagesRead" },
        { status: 400 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // 1. Create reading session record
    const session = await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId,
        durationMinutes: parseInt(String(durationMinutes), 10),
        pagesRead: parseInt(String(pagesRead), 10),
        takeaway: takeaway || null,
        reflectionQuestion:
          reflectionQuestion || "What stood out to you in today's reading?",
        reflectionAnswer: reflectionAnswer || null,
        actionItem: actionItem || null,
      },
    });

    // 2. If actionItem was provided, add to UserAction checklist
    let newAction = null;
    if (actionItem && actionItem.trim() !== "") {
      newAction = await prisma.userAction.create({
        data: {
          userId: user.id,
          bookId,
          description: actionItem.trim(),
        },
      });
    }

    // 3. Update UserBook current page and check for completion
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
    });

    const previousPage = existingUserBook ? existingUserBook.currentPage : 0;
    const newPage = Math.min(book.totalPages, previousPage + parseInt(String(pagesRead), 10));
    const isFinished = newPage >= book.totalPages;

    const updatedUserBook = await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
      update: {
        currentPage: newPage,
        status: isFinished ? "FINISHED" : "READING",
        ...(isFinished ? { finishedAt: new Date() } : {}),
      },
      create: {
        userId: user.id,
        bookId,
        status: isFinished ? "FINISHED" : "READING",
        currentPage: newPage,
        startedAt: new Date(),
        ...(isFinished ? { finishedAt: new Date() } : {}),
      },
    });

    // 4. Calculate reading streak with Option A (Strict Habit in user's timezone)
    const now = new Date();
    const userTz = user.timezone || "UTC";
    const streakEval = evaluateUserStreak(user.lastReadAt, user.streakDays, userTz, now);

    let newStreak = 1;
    let isIgnite = false;

    if (streakEval.hasReadToday) {
      // Already read today: streak remains at today's achieved count
      newStreak = Math.max(1, user.streakDays);
      isIgnite = false;
    } else if (streakEval.dayDiff === 1) {
      // Read yesterday: consecutive day reading! Streak increments
      newStreak = Math.max(1, user.streakDays) + 1;
      isIgnite = true;
    } else {
      // Missed 2+ days or first time reading: fresh restart at Day 1
      newStreak = 1;
      isIgnite = true;
    }

    let nextActiveBookId = user.activeBookId;
    if (isFinished && user.activeBookId === bookId) {
      const nextBook = await prisma.userBook.findFirst({
        where: {
          userId: user.id,
          status: "READING",
          bookId: { not: bookId },
        },
        orderBy: { updatedAt: "desc" },
      });
      nextActiveBookId = nextBook ? nextBook.bookId : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastReadAt: now,
        streakDays: newStreak,
        activeBookId: nextActiveBookId,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        bookId: session.bookId,
        bookTitle: book.title,
        durationMinutes: session.durationMinutes,
        pagesRead: session.pagesRead,
        takeaway: session.takeaway,
        reflectionQuestion: session.reflectionQuestion,
        reflectionAnswer: session.reflectionAnswer,
        actionItem: session.actionItem,
        createdAt: session.createdAt.toISOString(),
      },
      action: newAction
        ? {
            id: newAction.id,
            description: newAction.description,
            completedAt: null,
            createdAt: newAction.createdAt.toISOString(),
          }
        : null,
      streakDays: updatedUser.streakDays,
      isIgnite,
      flameState: "idle",
      currentPage: updatedUserBook.currentPage,
      isFinished,
    });
  } catch (error) {
    console.error("Error in POST /api/sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
