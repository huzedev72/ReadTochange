import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

const cloudflaredPath = path.resolve(process.cwd(), "cloudflared.exe");

console.log("Starting cloudflared from:", cloudflaredPath);

const cf = spawn(cloudflaredPath, ["tunnel", "--url", "http://localhost:3000"], {
  stdio: ["ignore", "pipe", "pipe"]
});

let botStarted = false;

function handleOutput(data: Buffer) {
  const text = data.toString();
  process.stdout.write(text);
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !botStarted) {
    botStarted = true;
    const url = match[0];
    console.log("\n=======================================================");
    console.log("🌟 OFFICIAL CLOUDFLARE TUNNEL LIVE:", url);
    console.log("=======================================================\n");

    const envPath = path.resolve(process.cwd(), ".env");
    let env = fs.readFileSync(envPath, "utf8");
    env = env.replace(/NEXT_PUBLIC_APP_URL="[^"]*"/, `NEXT_PUBLIC_APP_URL="${url}"`);
    fs.writeFileSync(envPath, env);
    console.log("✅ Updated .env with:", url);

    // Launch bot
    console.log("🤖 Launching Telegram bot with new URL...");
    const bot = spawn("npx", ["tsx", "scripts/run_bot.ts"], { shell: true, stdio: "inherit" });
    bot.on("exit", (c) => console.log("Bot exited with code:", c));
  }
}

cf.stdout.on("data", handleOutput);
cf.stderr.on("data", handleOutput);

cf.on("exit", (code) => {
  console.log("cloudflared exited with code:", code);
});
