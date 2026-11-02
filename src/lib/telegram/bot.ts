import { Bot, InlineKeyboard, InputFile } from "grammy";
import { prisma } from "@/lib/db";
import * as path from "path";
import * as fs from "fs";

const token = process.env.TELEGRAM_BOT_TOKEN;

// Create bot instance if token is provided
export const bot = token ? new Bot(token) : null;

// T1 Goal definitions matching ReadToChange UI Direction
export const T1_GOALS = [
  { id: "discipline", label: "Discipline" },
  { id: "productivity", label: "Productivity" },
  { id: "communication", label: "Communication" },
  { id: "business", label: "Business" },
  { id: "finance", label: "Finance" },
  { id: "psychology", label: "Psychology" },
  { id: "leadership", label: "Leadership" },
  { id: "learning", label: "Learning" },
];

export function getAppUrl(path = ""): string {
  let base = process.env.NEXT_PUBLIC_APP_URL || "";

  // In production / on Vercel, ignore any leftover local tunnel URLs or deployment-specific hash URLs
  if (
    !base ||
    base.includes("trycloudflare.com") ||
    base.includes("localtunnel.me") ||
    base.includes("-huze2.vercel.app") ||
    base.includes("-projects.vercel.app")
  ) {
    base = "https://readtochange.vercel.app";
  }

  base = base.replace(/\/+$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("?") ? path : "/" + path}`;
}

export function getAdminTelegramId(): string {
  if (process.env.ADMIN_TELEGRAM_ID) return process.env.ADMIN_TELEGRAM_ID.trim();
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, "utf-8").match(/ADMIN_TELEGRAM_ID="?([^"\r\n]+)"?/);
      if (match && match[1]) return match[1].trim();
    }
  } catch (e) {}
  return "1594689197";
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildGoalKeyboard(selectedGoalIds: string[], appUrl: string): InlineKeyboard {
  const kb = new InlineKeyboard();

  for (let i = 0; i < T1_GOALS.length; i += 2) {
    const g1 = T1_GOALS[i];
    const g2 = T1_GOALS[i + 1];

    const label1 = selectedGoalIds.includes(g1.id) ? `✓ ${g1.label}` : g1.label;
    kb.text(label1, `toggle_goal:${g1.id}`);

    if (g2) {
      const label2 = selectedGoalIds.includes(g2.id) ? `✓ ${g2.label}` : g2.label;
      kb.text(label2, `toggle_goal:${g2.id}`);
    }
    kb.row();
  }

  // Row 5: Show me my books ->
  const deepUrl =
    selectedGoalIds.length > 0
      ? getAppUrl(`?goals=${selectedGoalIds.join(",")}`)
      : appUrl;

  // Telegram Bot API only allows webApp buttons on HTTPS domains that do NOT contain t.me
  // For t.me links or standard web URLs, use kb.url()
  if (deepUrl.startsWith("https://") && !deepUrl.includes("t.me")) {
    kb.webApp("Show me my books →", deepUrl);
  } else {
    kb.url("Show me my books →", deepUrl);
  }
  return kb;
}

if (bot) {
  // Screen T1 · Welcome (/start)
  bot.command("start", async (ctx) => {
    const telegramId = String(ctx.from?.id);
    const firstName = ctx.from?.first_name || "Reader";
    const username = ctx.from?.username;

    let user = null;
    try {
      user = await prisma.user.upsert({
        where: { telegramId },
        update: { firstName, username },
        create: {
          telegramId,
          firstName,
          username,
          dailyTarget: 15,
          reminderTime: "20:30",
          userGoals: {
            create: [
              { goalId: "discipline" },
              { goalId: "communication" },
            ],
          },
        },
        include: {
          userGoals: true,
        },
      });
    } catch (e) {
      console.error("Failed to upsert user on /start:", e);
    }

    const appUrl = getAppUrl();

    // Set persistent bottom-left chat menu button to 'Read' (if valid https webapp URL)
    if (ctx.chat?.id) {
      try {
        if (appUrl.startsWith("https://") && !appUrl.includes("t.me")) {
          await bot.api.setChatMenuButton({
            chat_id: ctx.chat.id,
            menu_button: {
              type: "web_app",
              text: "Read",
              web_app: { url: appUrl },
            },
          });
        }
      } catch (e) {
        // Safe fallback if bot has restricted permissions
      }
    }

    const currentGoals = user?.userGoals ? user.userGoals.map((ug) => ug.goalId) : ["discipline", "communication"];
    const keyboard = buildGoalKeyboard(currentGoals, appUrl);
    const welcomeHtml =
      `<b>Welcome to ReadToChange.</b>\n` +
      `Books are the input. Change is the outcome.\n\n` +
      `What do you want to improve? Pick up to 3.`;

    const stickerPath = path.resolve(process.cwd(), "public", "stickers", "mascot_happy.webp");
    if (fs.existsSync(stickerPath)) {
      try {
        // Send the Happy mascot sticker (Welcome)
        await ctx.replyWithSticker(new InputFile(stickerPath));
      } catch (e) {
        console.error("replyWithSticker error:", e);
      }
    }

    await ctx.reply(welcomeHtml, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  });

  // T1 Interactive Goal Toggle Callback
  bot.callbackQuery(/^toggle_goal:(.+)$/, async (ctx) => {
    const goalId = ctx.match[1];
    const telegramId = String(ctx.from?.id);
    const appUrl = getAppUrl();

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: { userGoals: true },
      });

      if (!user) {
        await ctx.answerCallbackQuery({ text: "Please send /start first." });
        return;
      }

      const currentGoalIds = user.userGoals.map((ug) => ug.goalId);
      const isAlreadySelected = currentGoalIds.includes(goalId);

      let updatedGoals: string[] = [];
      if (isAlreadySelected) {
        // Remove
        await prisma.userGoal.deleteMany({
          where: {
            userId: user.id,
            goalId,
          },
        });
        updatedGoals = currentGoalIds.filter((id) => id !== goalId);
        await ctx.answerCallbackQuery();
      } else {
        // Check cap of 3 goals
        if (currentGoalIds.length >= 3) {
          await ctx.answerCallbackQuery({
            text: "You can pick up to 3 goals. Uncheck one first to choose another.",
            show_alert: true,
          });
          return;
        }

        // Ensure goal exists in Goal table
        await prisma.goal.upsert({
          where: { id: goalId },
          update: {},
          create: {
            id: goalId,
            label: T1_GOALS.find((g) => g.id === goalId)?.label || goalId,
            description: "Personal Growth Goal",
          },
        });

        // Add to userGoals
        await prisma.userGoal.upsert({
          where: {
            userId_goalId: { userId: user.id, goalId },
          },
          update: {},
          create: {
            userId: user.id,
            goalId,
          },
        });
        updatedGoals = [...currentGoalIds, goalId];
        await ctx.answerCallbackQuery();
      }

      // Re-render keyboard in place
      const newKeyboard = buildGoalKeyboard(updatedGoals, appUrl);
      await ctx.editMessageReplyMarkup({
        reply_markup: newKeyboard,
      });
    } catch (e) {
      console.error("Error toggling goal in Telegram:", e);
      await ctx.answerCallbackQuery();
    }
  });

  // T2 Snooze Callback
  bot.callbackQuery("snooze:30", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Snoozed for 30 min!" });
    await ctx.reply("⏰ *Snoozed for 30 minutes.* We’ll ping you then to keep your reading flame burning!", {
      parse_mode: "Markdown",
    });
  });

  // T2 & T3 Change Reminder Time
  bot.callbackQuery("change_time", async (ctx) => {
    await ctx.answerCallbackQuery();

    const timeKb = new InlineKeyboard()
      .text("07:30 Morning", "set_time:07:30")
      .text("13:00 Lunch", "set_time:13:00")
      .row()
      .text("20:30 Evening", "set_time:20:30")
      .text("22:00 Bedtime", "set_time:22:00");

    await ctx.reply("⏰ *Choose your ideal daily reading time:*", {
      parse_mode: "Markdown",
      reply_markup: timeKb,
    });
  });

  // Save selected reminder time
  bot.callbackQuery(/^set_time:(.+)$/, async (ctx) => {
    const chosenTime = ctx.match[1];
    const telegramId = String(ctx.from?.id);

    try {
      await prisma.user.updateMany({
        where: { telegramId },
        data: { reminderTime: chosenTime },
      });
      await ctx.answerCallbackQuery({ text: `Reminder set to ${chosenTime}!` });
      await ctx.reply(`✅ Your daily reading reminder is now set to *${chosenTime}*.`, {
        parse_mode: "Markdown",
      });
    } catch (e) {
      console.error("Error setting reminder time:", e);
      await ctx.answerCallbackQuery();
    }
  });

  // /streak command
  bot.command("streak", async (ctx) => {
    const telegramId = String(ctx.from?.id);
    try {
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

      if (!user) {
        return ctx.reply("Start your reading journey first! Use /start.");
      }

      const activeBook = user.userBooks[0]?.book;
      const streak = user.streakDays;
      const appUrl = getAppUrl();

      const kb = new InlineKeyboard();
      if (appUrl.startsWith("https://") && !appUrl.includes("t.me")) {
        kb.webApp("🚀 Open ReadToChange", appUrl);
      } else {
        kb.url("🚀 Open ReadToChange", appUrl);
      }

      // Send Proud mascot sticker (Momentum & Streak)
      const proudStickerPath = path.resolve(process.cwd(), "public", "stickers", "mascot_proud.webp");
      if (fs.existsSync(proudStickerPath)) {
        try {
          await ctx.replyWithSticker(new InputFile(proudStickerPath));
        } catch (e) {}
      }

      await ctx.reply(
        `🔥 *Reading Momentum: ${streak}-Day Flame*\n\n` +
          (activeBook
            ? `📖 Currently Reading: *${activeBook.title}*\n🎯 Daily Target: *${user.dailyTarget} mins*\n\n`
            : "No active book yet. Open the app to pick your first book!\n\n") +
          `🛡 *The Atomic Rule:* Never miss twice.\nKeep your flame burning today!`,
        {
          parse_mode: "Markdown",
          reply_markup: kb,
        }
      );
    } catch (e) {
      console.error("Error retrieving streak:", e);
      ctx.reply("Could not check streak right now. Please try again later.");
    }
  });

  // /help command
  bot.command("help", async (ctx) => {
    const appUrl = getAppUrl();
    const kb = new InlineKeyboard();
    if (appUrl.startsWith("https://") && !appUrl.includes("t.me")) {
      kb.webApp("Read", appUrl);
    } else {
      kb.url("Read", appUrl);
    }

    await ctx.reply(
      `*ReadToChange Bot Commands:*\n\n` +
        `/start - Launch your reading sanctuary & pick goals\n` +
        `/remind - Preview daily "Time to Read" notification (with mascot)\n` +
        `/poster - Preview visual "Book Poster" reminder\n` +
        `/missed - Preview "Missed Yesterday" gentle reminder\n` +
        `/action - Preview "Put Insight into Action" follow-up\n` +
        `/streak - Check your flame streak & consistency\n` +
        `/help - View this help menu`,
      {
        parse_mode: "Markdown",
        reply_markup: kb,
      }
    );
  });

  // /remind - Screen T2 Daily Reminder (Time to read) with Curious Mascot Sticker
  bot.command("remind", async (ctx) => {
    const telegramId = String(ctx.from?.id);
    const appUrl = getAppUrl();
    const stickerPath = path.resolve(process.cwd(), "public", "stickers", "mascot_curious.webp");

    try {
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

      const bookTitle = activeBook?.title || "your focus book";
      const dailyTarget = user?.dailyTarget || 15;

      // 1. Send Curious Mascot Sticker (Design System: Curious expression with floating gold '?')
      if (fs.existsSync(stickerPath)) {
        try {
          await ctx.replyWithSticker(new InputFile(stickerPath));
        } catch (e) {
          console.error("Mascot sticker error:", e);
        }
      }

      // 2. Build Interactive Keyboard
      const kb = new InlineKeyboard();
      const timerUrl = `${appUrl}?action=timer`;
      const libraryUrl = `${appUrl}?tab=library`;

      if (timerUrl.startsWith("https://") && !timerUrl.includes("t.me")) {
        kb.webApp("I’m reading now ⏱️", timerUrl);
      } else {
        kb.url("I’m reading now ⏱️", timerUrl);
      }
      kb.row();
      kb.text("Snooze 30 min ⏰", "snooze:30");
      kb.text("Change time ⚙️", "change_time");
      kb.row();
      if (libraryUrl.startsWith("https://") && !libraryUrl.includes("t.me")) {
        kb.webApp("Open Library ↗", libraryUrl);
      } else {
        kb.url("Open Library ↗", libraryUrl);
      }

      // 3. Send Notification Body
      await ctx.reply(
        `<b>Time to read.</b>\n` +
          `<b>${dailyTarget} minutes</b> with <i>${bookTitle}</i>. That’s all.`,
        {
          parse_mode: "HTML",
          reply_markup: kb,
        }
      );
    } catch (e) {
      console.error("Error in /remind command:", e);
      await ctx.reply("Could not generate reminder right now. Try again soon!");
    }
  });

  // /poster - Visual Book Sticker Reminder (Transparent sticker with ONLY the book cover)
  bot.command("poster", async (ctx) => {
    const telegramId = String(ctx.from?.id);
    const appUrl = getAppUrl();

    try {
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

      const dailyTarget = user?.dailyTarget || 15;
      const title = activeBook?.title || "Emotional Intelligence Basics";
      const author = activeBook?.author ? `by ${activeBook.author}` : "";
      const coverUrl = activeBook?.coverUrl;
      const bookId = activeBook?.id || "default_focus_book";

      // 1. Generate & send transparent Book Cover Sticker (no background except the cover itself)
      try {
        const { generateBookCoverSticker } = await import("./book_sticker");
        const stickerBuffer = await generateBookCoverSticker({
          bookId,
          title,
          author,
          coverUrl,
        });
        await ctx.replyWithSticker(new InputFile(stickerBuffer, `${bookId}_sticker.webp`));
      } catch (stickerErr) {
        console.error("Failed to generate book sticker:", stickerErr);
      }

      // 2. Send the accompanying poster reminder card with CTA
      const kb = new InlineKeyboard();
      const timerUrl = `${appUrl}?action=timer`;
      if (timerUrl.startsWith("https://") && !timerUrl.includes("t.me")) {
        kb.webApp("Start Session Now 🚀", timerUrl);
      } else {
        kb.url("Start Session Now 🚀", timerUrl);
      }

      await ctx.reply(
        `📖 <b>${title}</b> ${author}\n\n` +
          `<i>"Books are the input. Change is the outcome."</i>\n\n` +
          `⏱ <b>Daily Target:</b> ${dailyTarget} minutes\n` +
          `⚡ Keep your habit alive today — even small sessions compound!`,
        {
          parse_mode: "HTML",
          reply_markup: kb,
        }
      );
    } catch (e) {
      console.error("Error in /poster command:", e);
      await ctx.reply("Could not generate poster reminder right now.");
    }
  });

  // /missed - Gentle recovery notification (Screen T3) with Sleepy Mascot Sticker
  bot.command("missed", async (ctx) => {
    const appUrl = getAppUrl();
    const stickerPath = path.resolve(process.cwd(), "public", "stickers", "mascot_sleepy.webp");

    if (fs.existsSync(stickerPath)) {
      try {
        // Send Sleepy mascot with gold 'Z z'
        await ctx.replyWithSticker(new InputFile(stickerPath));
      } catch (e) {}
    }

    const kb = new InlineKeyboard();
    const fiveMinUrl = `${appUrl}?action=timer&target=5`;
    const logUrl = `${appUrl}?action=log`;

    if (fiveMinUrl.startsWith("https://") && !fiveMinUrl.includes("t.me")) {
      kb.webApp("Read 5 minutes ⏱️", fiveMinUrl);
    } else {
      kb.url("Read 5 minutes ⏱️", fiveMinUrl);
    }

    if (logUrl.startsWith("https://") && !logUrl.includes("t.me")) {
      kb.webApp("Log a session 📝", logUrl);
    } else {
      kb.url("Log a session 📝", logUrl);
    }

    kb.row().text("Change my reminder ⚙️", "change_time");

    await ctx.reply(
      `<b>Missed yesterday?</b>\n` +
        `That’s okay. Even 5 minutes counts.\n\n` +
        `Never miss twice — show up for just 5 minutes today.`,
      {
        parse_mode: "HTML",
        reply_markup: kb,
      }
    );
  });

  // /action - Action Item Reminder with Thinking Mascot Sticker
  bot.command("action", async (ctx) => {
    const appUrl = getAppUrl();
    const stickerPath = path.resolve(process.cwd(), "public", "stickers", "mascot_thinking.webp");

    if (fs.existsSync(stickerPath)) {
      try {
        // Send Thinking mascot with 3 gold thought bubbles
        await ctx.replyWithSticker(new InputFile(stickerPath));
      } catch (e) {}
    }

    const kb = new InlineKeyboard();
    const progressUrl = `${appUrl}?tab=progress`;

    if (progressUrl.startsWith("https://") && !progressUrl.includes("t.me")) {
      kb.webApp("Open Progress & Actions 🎯", progressUrl);
    } else {
      kb.url("Open Progress & Actions 🎯", progressUrl);
    }

    await ctx.reply(
      `⚡ <b>Turn Insight Into Action</b>\n\n` +
        `<i>"Reading without action is just entertainment."</i>\n\n` +
        `Did you complete your daily action step today?\n` +
        `Check off your completed action item or review your saved notes in the app.`,
      {
        parse_mode: "HTML",
        reply_markup: kb,
      }
    );
  });

  // /stats - Founder Pulse & Cumulative Impact (Admin only or displays current ID)
  bot.command("stats", async (ctx) => {
    try {
      const senderId = String(ctx.from?.id || "");
      const adminId = getAdminTelegramId();

      // If ADMIN_TELEGRAM_ID is configured, protect it
      if (adminId && senderId !== adminId) {
        await ctx.reply("🔒 This command is reserved for the founder/admin.");
        return;
      }

      const { getAdminCumulativeStats, formatAdminStatsTelegram } = await import("@/lib/admin/stats");
      const stats = await getAdminCumulativeStats();
      const text = formatAdminStatsTelegram(stats);

      await ctx.reply(text, { parse_mode: "Markdown" });
    } catch (e) {
      console.error("Error in /stats command:", e);
      await ctx.reply("❌ Could not compute stats right now.");
    }
  });

  // /feedback - Direct User Feedback (Stores in DB & alerts founder)
  bot.command("feedback", async (ctx) => {
    try {
      const fullText = ctx.message?.text || "";
      const feedbackContent = fullText.replace(/^\/feedback(@\w+)?/i, "").trim();

      if (!feedbackContent) {
        await ctx.reply(
          `💬 <b>Tell the Maker</b>\n\n` +
            `Have a feature idea, book request, or feedback on V1?\n\n` +
            `Simply reply with:\n` +
            `<code>/feedback Your thoughts here...</code>\n\n` +
            `<i>Example:</i>\n` +
            `<code>/feedback Loving the streak flame! Could you add more psychology books?</code>`,
          { parse_mode: "HTML" }
        );
        return;
      }

      const senderId = String(ctx.from?.id || "");
      const username = ctx.from?.username || null;
      const firstName = ctx.from?.first_name || null;

      // 1. Store in database
      await prisma.feedback.create({
        data: {
          telegramId: senderId,
          username,
          firstName,
          message: feedbackContent,
          source: "telegram",
        },
      });

      // 2. Alert founder directly
      const adminId = getAdminTelegramId();
      if (adminId && bot) {
        try {
          const userTag = username ? `@${escapeHtml(username)}` : escapeHtml(firstName || senderId);
          const htmlMsg =
            `📬 <b>New User Feedback!</b>\n\n` +
            `<b>From:</b> ${userTag} (<code>${escapeHtml(senderId)}</code>)\n` +
            `<b>Source:</b> <code>telegram</code>\n\n` +
            `"${escapeHtml(feedbackContent)}"`;

          try {
            await bot.api.sendMessage(adminId, htmlMsg, { parse_mode: "HTML" });
          } catch (htmlErr) {
            // Fallback to plain text
            await bot.api.sendMessage(
              adminId,
              `📬 New User Feedback!\n\nFrom: ${username ? "@" + username : firstName || senderId}\nSource: telegram\n\nNote:\n"${feedbackContent}"`
            );
          }
        } catch (alertErr) {
          console.warn("Could not alert admin:", alertErr);
        }
      }

      await ctx.reply(
        `✨ <b>Note received!</b>\n\n` +
          `Thank you for helping shape ReadToChange. Your feedback went straight to the creator.\n\n` +
          `Keep your flame burning! 🔥`,
        { parse_mode: "HTML" }
      );
    } catch (e) {
      console.error("Error in /feedback command:", e);
      await ctx.reply("Could not save feedback right now. Please try again.");
    }
  });
}
