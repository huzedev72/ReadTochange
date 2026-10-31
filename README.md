# ReadToChange 📖⚡

> **Turn what you read into who you become.**
> Telegram-first reading and personal transformation platform designed around action, habit retention, and clean aesthetics.

---

## 🌟 Features

- **Living Mascot Companion**:
  - Interactive SVG mascot with natural idle breathing, random blinks, touch wobble, squash-and-stretch jumps, and responsive emotions (`idle`, `curious`, `thinking`, `celebrate`, `proud`, `sleepy`).
- **Progressive Streak Flame**:
  - Hand-drawn doodle SVG fire that grows and evolves across habit stages:
    - `Day 0`: Extinguished ember with rising smoke curls.
    - `Day 1–2`: Slender single-tongue candle flame (**Spark**).
    - `Day 3–6`: Dynamic dual-tongue campfire flame (**Kindle**).
    - `Day 7–29`: 3-crowned roaring fire (**Blaze**).
    - `Day 30+`: Majestic crowned solar blaze with spinning dashed halo (**Inferno**).
- **The Core Value Loop**:
  - **15-Minute Focus Timer**: Distraction-free reading with animated progress ring.
  - **Single Page Turn Logging**: Easy tracking of progress across catalog and custom personal books.
  - **Action Reflection**: Converts key takeaways into 1 concrete, actionable step for tomorrow.
- **Telegram Native Integration**:
  - Bot companion (`@Read_To_changebot`) for daily reminders, streak recovery, book stickers, and interactive poster reminders.
  - Integrated Telegram WebApp authentication with biometric haptic feedback.
- **Founder & Admin Features**:
  - Private `/stats` command providing real-time audience, cumulative volume, and action completion rates.
  - Direct 1-tap user feedback loop (`/feedback` and in-app form) forwarding reader notes straight to founder chat.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Design Tokens (`Ink #0E0E0E`, `Sun #FFA83A`, `Gold #FFE3A8`)
- **Database & ORM**: PostgreSQL / SQLite via Prisma ORM
- **Telegram Bot**: grammY
- **Graphics & Rendering**: Dynamic SVG vectors & `@resvg/resvg-js` for stickers

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` (or configure `.env`):
```env
DATABASE_URL="postgresql://..."
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_BOT_USERNAME="your_bot_username"
TELEGRAM_WEBHOOK_SECRET="your_webhook_secret"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
ADMIN_TELEGRAM_ID="your_telegram_id"
GOOGLE_BOOKS_API_KEY="your_api_key"
CRON_SECRET="your_cron_secret"
```

### 3. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📦 Production Deployment (Vercel)

1. Connect this repository to **Vercel**.
2. Provision a PostgreSQL database (e.g., Neon or Vercel Postgres).
3. Set your environment variables in the Vercel project settings.
4. Set the Telegram webhook:
   ```text
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_DOMAIN/api/bot&secret_token=YOUR_WEBHOOK_SECRET
   ```
