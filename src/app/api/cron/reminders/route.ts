import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bot, getAppUrl } from "@/lib/telegram/bot";
import { sendMascotSticker } from "@/lib/telegram/stickers";

export const dynamic = "force-dynamic";

function makeBtn(text: string, url: string) {
  if (url.startsWith("https://") && !url.includes("t.me")) {
    return { text, web_app: { url } };
  }
  return { text, url };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    const isForce = url.searchParams.get("force") === "true";
    const targetTelegramId = url.searchParams.get("target");

    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "readtochange_local_cron_secret_2026";

    // Allow Vercel CRON, GitHub Actions, manual ?secret=..., or matching header
    const isAuthorized =
      !cronSecret ||
      authHeader === `Bearer ${cronSecret}` ||
      req.headers.get("x-cron-secret") === cronSecret ||
      querySecret === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!bot) {
      return NextResponse.json(
        { message: "Bot not initialized (TELEGRAM_BOT_TOKEN missing)" },
        { status: 200 }
      );
    }

    const now = new Date();
    const appUrl = getAppUrl();

    // Find users who have reminders set
    const users = await prisma.user.findMany({
      where: {
        reminderTime: { not: "" },
        ...(targetTelegramId ? { telegramId: targetTelegramId } : {}),
      },
      include: {
        userBooks: {
          where: { status: "READING" },
          include: { book: true },
        },
      },
    });

    let sentCount = 0;
    const details: any[] = [];

    for (const u of users) {
      const userTz = u.timezone && u.timezone.trim() ? u.timezone : "UTC";
      let userTimeStr = "20:30";
      let userDateStr = "2026-11-05";

      try {
        userTimeStr = new Intl.DateTimeFormat("en-GB", {
          timeZone: userTz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now);
        userDateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: userTz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now);
      } catch (e) {
        const currentHours = String(now.getUTCHours()).padStart(2, "0");
        const currentMinutes = String(now.getUTCMinutes()).padStart(2, "0");
        userTimeStr = `${currentHours}:${currentMinutes}`;
        userDateStr = now.toISOString().split("T")[0];
      }

      // Check if snoozed reminder is due
      const isSnoozedDue = Boolean(u.snoozedUntil && new Date(u.snoozedUntil) <= now);

      // Check if user has read today in their local timezone date
      let hasReadToday = false;
      if (u.lastReadAt) {
        try {
          const lastReadDateStr = new Intl.DateTimeFormat("en-CA", {
            timeZone: userTz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(u.lastReadAt));
          if (lastReadDateStr === userDateStr) {
            hasReadToday = true;
          }
        } catch (e) {}
      }

      // If user already read today and not snoozed/forced, no reminder needed!
      if (hasReadToday && !isSnoozedDue && !isForce) {
        details.push({ telegramId: u.telegramId, status: "skipped_already_read_today", userDateStr });
        continue;
      }

      // If not snoozed and not forced: evaluate daily reminder window
      if (!isSnoozedDue && !isForce) {
        // Prevent duplicate reminders for the same calendar date
        if (u.lastReminderDate === userDateStr) {
          details.push({ telegramId: u.telegramId, status: "skipped_already_reminded_today", userDateStr });
          continue;
        }

        // Compare local time against reminder time (e.g. 07:30)
        const [curH, curM] = userTimeStr.split(":").map(Number);
        const curMinutes = (isNaN(curH) ? 0 : curH) * 60 + (isNaN(curM) ? 0 : curM);

        const [remH, remM] = (u.reminderTime || "20:30").split(":").map(Number);
        const remMinutes = (isNaN(remH) ? 20 : remH) * 60 + (isNaN(remM) ? 30 : remM);

        const diff = Math.abs(curMinutes - remMinutes);
        const minDiff = Math.min(diff, 1440 - diff);

        // Window match: within 25 minutes of selected reminder time
        if (minDiff > 25) {
          details.push({
            telegramId: u.telegramId,
            status: "skipped_outside_time_window",
            userTimeStr,
            reminderTime: u.reminderTime,
            userTz,
          });
          continue;
        }
      }

      // Check focus book (prefer activeBookId)
      const activeUserBook =
        (u.activeBookId && u.userBooks.find((ub) => ub.bookId === u.activeBookId)) ||
        u.userBooks[0];
      const activeBook = activeUserBook?.book;
      const bookTitle = activeBook ? activeBook.title : "your focus book";
      const dailyTarget = u.dailyTarget || 15;

      // Evaluate if missed yesterday (over 34 hours since last read) -> Screen T3 Missed Day
      const isMissedDay = u.lastReadAt
        ? now.getTime() - new Date(u.lastReadAt).getTime() > 34 * 60 * 60 * 1000
        : false;

      // 1. Send Sticker
      const stickerName = isMissedDay ? "mascot_sleepy.webp" : "mascot_curious.webp";
      await sendMascotSticker(bot, u.telegramId, stickerName, appUrl);

      // 2. Send Message
      try {
        if (isMissedDay && !isSnoozedDue) {
          // Screen T3 · Missed Day
          await bot.api.sendMessage(
            u.telegramId,
            `<b>Missed yesterday?</b>\n` +
              `That’s okay. Even 5 minutes counts.\n\n` +
              `Never miss twice — show up for just 5 minutes today.`,
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
          // Screen T2 · Daily Reminder (or Snoozed Reminder)
          const headline = isSnoozedDue
            ? `<b>⏰ Snooze Complete — Time to read!</b>\n`
            : `<b>Time to read.</b>\n`;

          await bot.api.sendMessage(
            u.telegramId,
            `${headline}${dailyTarget} minutes with <i>${bookTitle}</i>. That’s all.`,
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

        // 3. Mark as sent in DB & clear any pending snooze
        await prisma.user.update({
          where: { id: u.id },
          data: {
            lastReminderDate: userDateStr,
            snoozedUntil: null,
          },
        });

        sentCount++;
        details.push({
          telegramId: u.telegramId,
          status: "sent",
          type: isSnoozedDue ? "snooze" : isMissedDay ? "missed_day" : "daily_reminder",
          userTimeStr,
          userTz,
        });
      } catch (sendErr: any) {
        console.error(`Failed to send reminder to telegramId ${u.telegramId}:`, sendErr?.message || sendErr);
        details.push({ telegramId: u.telegramId, status: "error", error: sendErr?.message });
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
      nowUtc: now.toISOString(),
      details,
    });
  } catch (error) {
    console.error("Error in GET /api/cron/reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
