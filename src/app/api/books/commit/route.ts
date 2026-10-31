import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTelegramInitData } from "@/lib/telegram/auth";

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
    const { bookId, status = "READING", dailyTarget } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    // Verify book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Handle Unsave / Remove from saved
    if (status === "UNSAVED" || status === "REMOVED") {
      await prisma.userBook.deleteMany({
        where: {
          userId: user.id,
          bookId,
        },
      });

      // If removed book was the active focus, switch to another reading book
      if (user.activeBookId === bookId) {
        const nextActive = await prisma.userBook.findFirst({
          where: { userId: user.id, status: "READING", bookId: { not: bookId } },
          orderBy: { updatedAt: "desc" },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { activeBookId: nextActive ? nextActive.bookId : null },
        });
      }

      return NextResponse.json({
        success: true,
        removed: true,
        bookId,
      });
    }

    // Handle Set Focus Book (sets activeBookId without modifying other books)
    if (status === "SET_FOCUS") {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeBookId: bookId },
      });

      // Ensure this book has READING status
      const ub = await prisma.userBook.upsert({
        where: {
          userId_bookId: { userId: user.id, bookId },
        },
        update: { status: "READING" },
        create: {
          userId: user.id,
          bookId,
          status: "READING",
          currentPage: 0,
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        setFocus: true,
        activeBookId: bookId,
        userBook: ub,
      });
    }

    // Handle Pausing an Active Book (moves to WANT_TO_READ preserving progress)
    if (status === "PAUSED" || status === "PAUSE") {
      const updatedUb = await prisma.userBook.update({
        where: {
          userId_bookId: { userId: user.id, bookId },
        },
        data: { status: "WANT_TO_READ" },
      });

      // If paused book was the active focus, shift focus to next active reading book
      if (user.activeBookId === bookId) {
        const nextActive = await prisma.userBook.findFirst({
          where: { userId: user.id, status: "READING", bookId: { not: bookId } },
          orderBy: { updatedAt: "desc" },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { activeBookId: nextActive ? nextActive.bookId : null },
        });
      }

      return NextResponse.json({
        success: true,
        paused: true,
        bookId,
        userBook: updatedUb,
      });
    }

    // If starting or committing to READING: check cap of 3 active books
    if (status === "READING") {
      const currentReadingCount = await prisma.userBook.count({
        where: {
          userId: user.id,
          status: "READING",
          bookId: { not: bookId },
        },
      });

      if (currentReadingCount >= 3) {
        const currentReading = await prisma.userBook.findMany({
          where: { userId: user.id, status: "READING" },
          include: { book: true },
          orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({
          success: false,
          maxReached: true,
          limit: 3,
          currentReadingBooks: currentReading.map((ub) => ({
            ...ub.book,
            keyIdeas: JSON.parse(ub.book.keyIdeasJson || "[]"),
            currentPage: ub.currentPage,
          })),
        });
      }

      // Set active focus on user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeBookId: bookId,
          dailyTarget: typeof dailyTarget === "number" ? dailyTarget : undefined,
        },
      });
    }

    // If moving active book to WANT_TO_READ, shift focus if needed
    if (status === "WANT_TO_READ" && user.activeBookId === bookId) {
      const nextActive = await prisma.userBook.findFirst({
        where: { userId: user.id, status: "READING", bookId: { not: bookId } },
        orderBy: { updatedAt: "desc" },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { activeBookId: nextActive ? nextActive.bookId : null },
      });
    }

    // Upsert the UserBook record (progress and history preserved)
    const userBook = await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
      update: {
        status,
        ...(status === "FINISHED" ? { finishedAt: new Date() } : {}),
      },
      create: {
        userId: user.id,
        bookId,
        status,
        currentPage: 0,
        startedAt: new Date(),
        ...(status === "FINISHED" ? { finishedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      userBook,
      book: {
        ...book,
        keyIdeas: JSON.parse(book.keyIdeasJson || "[]"),
        currentPage: userBook.currentPage,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/books/commit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
