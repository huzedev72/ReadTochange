import * as fs from "fs";
import * as path from "path";

// Load .env variables without external dotenv package
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env file directly:", e);
}

import { bot } from "../src/lib/telegram/bot";

async function main() {
  if (!bot) {
    console.error("❌ Bot instance not created. Verify TELEGRAM_BOT_TOKEN in .env");
    process.exit(1);
  }

  // Delete any existing webhook to ensure getUpdates (polling) works cleanly
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    console.log("🧹 Telegram Webhook cleared. Polling mode enabled.");
  } catch (err) {
    console.warn("⚠️ Note on clearing webhook:", err);
  }

  const me = await bot.api.getMe();

  // Set global Telegram chat menu button to the current active tunnel URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (appUrl.startsWith("https://") && !appUrl.includes("t.me")) {
    try {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "Open ReadToChange 📖",
          web_app: { url: appUrl },
        },
      });
      console.log("🌐 Global Telegram Chat Menu Button synced to:", appUrl);
    } catch (e) {
      console.warn("Could not set global chat menu button:", e);
    }
  }

  console.log("==================================================");
  console.log(`🤖 READTOCHANGE BOT IS LIVE & POLLING`);
  console.log(`👤 Name: ${me.first_name}`);
  console.log(`🔗 Username: @${me.username}`);
  console.log(`📲 Open in Telegram: https://t.me/${me.username}`);
  console.log(`👑 Admin Telegram ID: ${process.env.ADMIN_TELEGRAM_ID || "1594689197"}`);
  console.log("==================================================");
  console.log("Waiting for /start or messages from Telegram...\n");

  bot.catch((err) => {
    console.error("🚨 Telegram Bot Error:", err);
  });

  await bot.start({
    onStart: (info) => {
      console.log(`✅ Polling successfully started for @${info.username}`);
    },
  });
}

main().catch((err) => {
  console.error("Fatal bot startup error:", err);
  process.exit(1);
});
