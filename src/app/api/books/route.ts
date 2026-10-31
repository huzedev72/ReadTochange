import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTelegramInitData } from "@/lib/telegram/auth";
import { searchBooks } from "@/lib/books/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const goal = searchParams.get("goal") || category || undefined;
    const query = searchParams.get("query") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;
    const refresh = searchParams.get("refresh") === "true";
    const excludeIdsParam = searchParams.get("excludeIds");
    const excludeIds = excludeIdsParam
      ? excludeIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    // Fetch real books by goal and search title using unified search engine
    const books = await searchBooks({
      query,
      goal: goal && goal !== "all" ? goal : undefined,
      limit,
      offset,
      refresh,
      excludeIds,
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error in GET /api/books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      title,
      author,
      totalPages,
      currentPage = 0,
      coverUrl,
      growthCategory = "Personal Growth",
      aiHook,
      whyThisBook,
    } = body;

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and Author are required" },
        { status: 400 }
      );
    }

    const bookId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Create Book
    const newBook = await prisma.book.create({
      data: {
        id: bookId,
        title,
        author,
        totalPages: totalPages ? parseInt(String(totalPages), 10) : 250,
        coverUrl: coverUrl || null,
        growthCategory,
        aiHook: aiHook || `Read ${title} to transform your habits and thinking.`,
        whyThisBook: whyThisBook || "A book chosen by you to fuel your personal growth journey.",
        mascotTake: "Tracking your own book? Excellent choice. Let's make every single page count.",
        summary: `Tracking ${title} by ${author}.`,
        keyIdeasJson: JSON.stringify([]),
        isCustom: true,
        createdByUserId: user.id,
      },
    });

    // 2. Clear any existing active READING book to avoid conflicts
    await prisma.userBook.updateMany({
      where: { userId: user.id, status: "READING" },
      data: { status: "WANT_TO_READ" },
    });

    // 3. Connect to UserBook as READING
    const userBook = await prisma.userBook.create({
      data: {
        userId: user.id,
        bookId: newBook.id,
        status: "READING",
        currentPage: Math.max(0, parseInt(String(currentPage), 10) || 0),
        startedAt: new Date(),
      },
    });

    // 4. Update user activeBookId
    await prisma.user.update({
      where: { id: user.id },
      data: { activeBookId: newBook.id },
    });

    return NextResponse.json({
      book: {
        ...newBook,
        keyIdeas: [],
        currentPage: userBook.currentPage,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
