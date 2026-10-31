import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bot } from "@/lib/telegram/bot";
import { InputFile } from "grammy";
import * as path from "path";
import * as fs from "fs";

export const dynamic = "force-dynamic";

function makeBtn(text: string, url: string) {
  if (url.startsWith("https://") && !url.includes("t.me")) {
    return { text, web_app: { url } };
  }
  return { text, url };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (
      cronSecret &&
      authHeader !== `Bearer ${cronSecret}` &&
      req.headers.get("x-cron-secret") !== cronSecret
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!bot) {
      return NextResponse.json(
        { message: "Bot not initialized (TELEGRAM_BOT_TOKEN missing)" },
        { status: 200 }
      );
    }

    // Get current UTC time formatted as HH:mm
    const now = new Date();
    const currentHours = String(now.getUTCHours()).padStart(2, "0");
    const currentMinutes = String(now.getUTCMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // Find users who have reminder set and haven't read today
    const users = await prisma.user.findMany({
      where: {
        reminderTime: {
          not: "",
        },
      },
      include: {
        userBooks: {
          where: { status: "READING" },
          include: { book: true },
        },
      },
    });

    let sentCount = 0;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const u of users) {
      // Check if user has already read today
      if (u.lastReadAt && u.lastReadAt >= startOfToday) {
        continue;
      }

      // Check focus book (prefer activeBookId)
      const activeUserBook =
        (u.activeBookId && u.userBooks.find((ub) => ub.bookId === u.activeBookId)) ||
        u.userBooks[0];
      const activeBook = activeUserBook?.book;
      const bookTitle = activeBook ? activeBook.title : "your focus book";
      const dailyTarget = u.dailyTarget || 15;

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        "https://t.me/ReadToChangeBot/app";

      // Evaluate if missed yesterday (over 34 hours since last read) -> Screen T3 Missed Day
      const isMissedDay = u.lastReadAt
        ? now.getTime() - u.lastReadAt.getTime() > 34 * 60 * 60 * 1000
        : false;

      const stickerPath = path.resolve(
        process.cwd(),
        "public",
        "stickers",
        isMissedDay ? "mascot_sleepy.webp" : "mascot_curious.webp"
      );
      if (fs.existsSync(stickerPath)) {
        try {
          await bot.api.sendSticker(u.telegramId, new InputFile(stickerPath));
        } catch (e) {}
      }

      try {
        if (isMissedDay) {
          // Screen T3 · Missed Day
          await bot.api.sendMessage(
            u.telegramId,
            `<b>Missed yesterday?</b>\n` +
              `That’s okay. Even 5 minutes counts.`,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    makeBtn("Read 5 minutes ⏱️", `${appUrl}?action=timer&target=5`),
                    makeBtn("Log a session 📝", `${appUrl}?action=log`),
                  ],
                  [
                    { text: "Change my reminder ⚙️", callback_data: "change_time" },
                  ],
                ],
              },
            }
          );
        } else {
          // Screen T2 · Daily Reminder
          await bot.api.sendMessage(
            u.telegramId,
            `<b>Time to read.</b>\n` +
              `${dailyTarget} minutes with ${bookTitle}. That’s all.`,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    makeBtn("I’m reading now ⏱️", `${appUrl}?action=timer`),
                  ],
                  [
                    { text: "Snooze 30 min ⏰", callback_data: "snooze:30" },
                    { text: "Change time ⚙️", callback_data: "change_time" },
                  ],
                  [
                    makeBtn("Open Library ↗", `${appUrl}?tab=library`),
                  ],
                ],
              },
            }
          );
        }
        sentCount++;
      } catch (sendErr) {
        console.error(`Failed to send reminder to telegramId ${u.telegramId}:`, sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      timeChecked: currentTimeStr,
      remindersSent: sentCount,
    });
  } catch (error) {
    console.error("Error in GET /api/cron/reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
