import * as fs from "fs";
import * as path from "path";
import { bot, getAppUrl } from "../src/lib/telegram/bot";
import { prisma } from "../src/lib/db";
import { InlineKeyboard, InputFile } from "grammy";
import { generateBookCoverSticker } from "../src/lib/telegram/book_sticker";

// Load .env variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}

async function sendAllPreviews() {
  if (!bot) {
    console.error("Bot not ready");
    return;
  }

  const appUrl = getAppUrl();
  const targetTelegramIds = ["1594689197", "7028565969"];

  for (const telegramId of targetTelegramIds) {
    console.log(`Sending updated preview stickers to ${telegramId}...`);

    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        userBooks: {
          where: { status: "READING" },
          include: { book: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    const activeBook =
      (user?.activeBookId && user.userBooks.find((ub) => ub.bookId === user.activeBookId)?.book) ||
      user?.userBooks[0]?.book;

    const bookTitle = activeBook?.title || "Emotional Intelligence Basics";
    const author = activeBook?.author ? `by ${activeBook.author}` : "";
    const dailyTarget = user?.dailyTarget || 10;
    const coverUrl = activeBook?.coverUrl;
    const bookId = activeBook?.id || "focus_book";

    // 1. Time to Read with CURIOUS Mascot Sticker
    try {
      const curiousPath = path.resolve(process.cwd(), "public", "stickers", "mascot_curious.webp");
      if (fs.existsSync(curiousPath)) {
        await bot.api.sendSticker(telegramId, new InputFile(curiousPath));
      }

      const kb1 = new InlineKeyboard();
      const timerUrl = `${appUrl}?action=timer`;
      const libraryUrl = `${appUrl}?tab=library`;

      if (timerUrl.startsWith("https://") && !timerUrl.includes("t.me")) {
        kb1.webApp("I’m reading now ⏱️", timerUrl);
      } else {
        kb1.url("I’m reading now ⏱️", timerUrl);
      }
      kb1.row();
      kb1.text("Snooze 30 min ⏰", "snooze:30");
      kb1.text("Change time ⚙️", "change_time");
      kb1.row();
      if (libraryUrl.startsWith("https://") && !libraryUrl.includes("t.me")) {
        kb1.webApp("Open Library ↗", libraryUrl);
      } else {
        kb1.url("Open Library ↗", libraryUrl);
      }

      await bot.api.sendMessage(
        telegramId,
        `<b>Time to read.</b>\n` +
          `<b>${dailyTarget} minutes</b> with <i>${bookTitle}</i>. That’s all.`,
        {
          parse_mode: "HTML",
          reply_markup: kb1,
        }
      );
      console.log(`✅ Sent 'Time to Read' (Curious Mascot) to ${telegramId}`);
    } catch (e) {
      console.error("Error 1:", e);
    }

    await new Promise((r) => setTimeout(r, 1200));

    // 2. Poster Reminder as TRANSPARENT BOOK STICKER ONLY (No background!)
    try {
      const stickerBuffer = await generateBookCoverSticker({
        bookId,
        title: bookTitle,
        author,
        coverUrl,
      });

      await bot.api.sendSticker(telegramId, new InputFile(stickerBuffer, `${bookId}_sticker.webp`));

      const kb2 = new InlineKeyboard();
      const timerUrl = `${appUrl}?action=timer`;
      if (timerUrl.startsWith("https://") && !timerUrl.includes("t.me")) {
        kb2.webApp("Start Session Now 🚀", timerUrl);
      } else {
        kb2.url("Start Session Now 🚀", timerUrl);
      }

      await bot.api.sendMessage(
        telegramId,
        `📖 <b>${bookTitle}</b> ${author}\n\n` +
          `<i>"Books are the input. Change is the outcome."</i>\n\n` +
          `⏱ <b>Daily Target:</b> ${dailyTarget} minutes\n` +
          `⚡ Keep your habit alive today — small daily sessions compound!`,
        {
          parse_mode: "HTML",
          reply_markup: kb2,
        }
      );
      console.log(`✅ Sent 'Book Cover Sticker Poster' to ${telegramId}`);
    } catch (e) {
      console.error("Error 2:", e);
    }

    await new Promise((r) => setTimeout(r, 1200));

    // 3. Gentle Missed Day with SLEEPY Mascot Sticker
    try {
      const sleepyPath = path.resolve(process.cwd(), "public", "stickers", "mascot_sleepy.webp");
      if (fs.existsSync(sleepyPath)) {
        await bot.api.sendSticker(telegramId, new InputFile(sleepyPath));
      }

      const kb3 = new InlineKeyboard();
      const fiveMinUrl = `${appUrl}?action=timer&target=5`;
      const logUrl = `${appUrl}?action=log`;

      if (fiveMinUrl.startsWith("https://") && !fiveMinUrl.includes("t.me")) {
        kb3.webApp("Read 5 minutes ⏱️", fiveMinUrl);
      } else {
        kb3.url("Read 5 minutes ⏱️", fiveMinUrl);
      }

      if (logUrl.startsWith("https://") && !logUrl.includes("t.me")) {
        kb3.webApp("Log a session 📝", logUrl);
      } else {
        kb3.url("Log a session 📝", logUrl);
      }
      kb3.row().text("Change my reminder ⚙️", "change_time");

      await bot.api.sendMessage(
        telegramId,
        `<b>Missed yesterday?</b>\n` +
          `That’s okay. Even 5 minutes counts.\n\n` +
          `Never miss twice — show up for just 5 minutes today.`,
        {
          parse_mode: "HTML",
          reply_markup: kb3,
        }
      );
      console.log(`✅ Sent 'Missed Day' (Sleepy Mascot) to ${telegramId}`);
    } catch (e) {
      console.error("Error 3:", e);
    }

    await new Promise((r) => setTimeout(r, 1200));

    // 4. Action Item Reminder with THINKING Mascot Sticker
    try {
      const thinkingPath = path.resolve(process.cwd(), "public", "stickers", "mascot_thinking.webp");
      if (fs.existsSync(thinkingPath)) {
        await bot.api.sendSticker(telegramId, new InputFile(thinkingPath));
      }

      const kb4 = new InlineKeyboard();
      const progressUrl = `${appUrl}?tab=progress`;

      if (progressUrl.startsWith("https://") && !progressUrl.includes("t.me")) {
        kb4.webApp("Open Progress & Actions 🎯", progressUrl);
      } else {
        kb4.url("Open Progress & Actions 🎯", progressUrl);
      }

      await bot.api.sendMessage(
        telegramId,
        `⚡ <b>Turn Insight Into Action</b>\n\n` +
          `<i>"Reading without action is just entertainment."</i>\n\n` +
          `Did you complete your daily action step today?\n` +
          `Check off your completed action item or review your saved notes in the app.`,
        {
          parse_mode: "HTML",
          reply_markup: kb4,
        }
      );
      console.log(`✅ Sent 'Action Follow-up' (Thinking Mascot) to ${telegramId}`);
    } catch (e) {
      console.error("Error 4:", e);
    }

    await new Promise((r) => setTimeout(r, 1200));

    // 5. Streak / Momentum with PROUD Mascot Sticker
    try {
      const proudPath = path.resolve(process.cwd(), "public", "stickers", "mascot_proud.webp");
      if (fs.existsSync(proudPath)) {
        await bot.api.sendSticker(telegramId, new InputFile(proudPath));
      }

      const kb5 = new InlineKeyboard();
      if (appUrl.startsWith("https://") && !appUrl.includes("t.me")) {
        kb5.webApp("🚀 Open ReadToChange", appUrl);
      } else {
        kb5.url("🚀 Open ReadToChange", appUrl);
      }

      await bot.api.sendMessage(
        telegramId,
        `🔥 <b>Reading Momentum: ${user?.streakDays || 0}-Day Flame</b>\n\n` +
          `📖 Currently Reading: <b>${bookTitle}</b>\n` +
          `🎯 Daily Target: <b>${dailyTarget} mins</b>\n\n` +
          `🛡 <b>The Atomic Rule:</b> Never miss twice.\nKeep your flame burning today!`,
        {
          parse_mode: "HTML",
          reply_markup: kb5,
        }
      );
      console.log(`✅ Sent 'Streak Celebration' (Proud Mascot) to ${telegramId}`);
    } catch (e) {
      console.error("Error 5:", e);
    }
  }
}

sendAllPreviews()
  .then(() => {
    console.log("All expression stickers and book poster delivered!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  });
