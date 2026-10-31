import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

function getAdminTelegramId(): string {
  if (process.env.ADMIN_TELEGRAM_ID) return process.env.ADMIN_TELEGRAM_ID.trim();
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, "utf-8").match(/ADMIN_TELEGRAM_ID="?([^"\r\n]+)"?/);
      if (match && match[1]) return match[1].trim();
    }
  } catch (e) {}
  return "1594689197"; // Fallback to Huzeyfa
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, source = "webapp", telegramId, username, firstName } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const cleanMessage = message.trim();

    // 1. Persist feedback to database
    const feedback = await prisma.feedback.create({
      data: {
        message: cleanMessage,
        source,
        telegramId: telegramId ? String(telegramId) : null,
        username: username || null,
        firstName: firstName || null,
      },
    });

    // 2. Alert founder via Telegram bot
    const adminId = getAdminTelegramId();
    if (adminId) {
      try {
        const { bot } = await import("@/lib/telegram/bot");
        if (bot) {
          const userIdentifier = username
            ? `@${escapeHtml(username)} (${escapeHtml(firstName || "Reader")})`
            : escapeHtml(firstName || (telegramId ? `User ${telegramId}` : "Anonymous Reader"));

          const htmlMessage =
            `📬 <b>New User Feedback!</b>\n\n` +
            `<b>From:</b> ${userIdentifier}\n` +
            `<b>Source:</b> <code>${escapeHtml(source)}</code>\n\n` +
            `"${escapeHtml(cleanMessage)}"`;

          try {
            await bot.api.sendMessage(adminId, htmlMessage, { parse_mode: "HTML" });
          } catch (htmlErr) {
            // Safe plain-text fallback
            const plainMessage =
              `📬 New User Feedback!\n\n` +
              `From: ${username ? "@" + username : firstName || "Anonymous"}\n` +
              `Source: ${source}\n\n` +
              `Note:\n"${cleanMessage}"`;
            await bot.api.sendMessage(adminId, plainMessage);
          }
        }
      } catch (notifyErr) {
        console.warn("Could not forward feedback to admin Telegram chat:", notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your feedback has been delivered to the creator.",
      id: feedback.id,
    });
  } catch (err: any) {
    console.error("Feedback error:", err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}


