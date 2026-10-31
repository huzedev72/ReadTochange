import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!bot) {
    return new Response(JSON.stringify({ error: "Bot token not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    const handleWebhook = secretToken
      ? webhookCallback(bot, "std/http", { secretToken })
      : webhookCallback(bot, "std/http");
    return await handleWebhook(req);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ status: "ok", service: "ReadToChange Telegram Webhook" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
