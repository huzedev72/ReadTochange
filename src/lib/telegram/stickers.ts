import { Bot, InputFile } from "grammy";
import * as path from "path";
import * as fs from "fs";

export function getPublicStickerUrl(stickerName: string, customAppUrl?: string): string {
  let base = customAppUrl || process.env.NEXT_PUBLIC_APP_URL || "";
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
  return `${base}/stickers/${stickerName}`;
}

export async function sendMascotSticker(
  bot: Bot,
  chatId: string | number,
  stickerName: string,
  appUrl?: string
): Promise<boolean> {
  // 1. Try local filesystem path first
  try {
    const localPath = path.resolve(process.cwd(), "public", "stickers", stickerName);
    if (fs.existsSync(localPath)) {
      await bot.api.sendSticker(chatId, new InputFile(localPath));
      return true;
    }
  } catch (e) {
    // Fallback to remote URL
  }

  // 2. Stream from production CDN / Web URL (works seamlessly in Vercel serverless)
  try {
    const remoteUrl = getPublicStickerUrl(stickerName, appUrl);
    await bot.api.sendSticker(chatId, new InputFile({ url: remoteUrl }));
    return true;
  } catch (urlErr) {
    console.warn(`Failed to send sticker ${stickerName} to ${chatId}:`, urlErr);
    return false;
  }
}
