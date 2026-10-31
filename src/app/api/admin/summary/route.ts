import { NextResponse } from "next/server";
import { getAdminCumulativeStats, formatAdminStatsTelegram } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || req.headers.get("x-admin-secret");
    const expectedSecret = process.env.CRON_SECRET || "readtochange_local_cron_secret_2026";

    // Allow in local dev or if valid secret provided
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getAdminCumulativeStats();
    const accept = req.headers.get("accept") || "";

    if (accept.includes("text/html")) {
      const hoursRead = (stats.totalMinutes / 60).toFixed(1);
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ReadToChange · Founder Pulse</title>
  <style>
    body {
      background-color: #0E0E0E;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .card {
      max-width: 600px;
      width: 100%;
      background: #181818;
      border: 2px solid #282828;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1 {
      margin: 0 0 6px 0;
      color: #FFA83A;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #A0A0A0;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric {
      background: #202020;
      border: 1.5px solid #2D2D2D;
      border-radius: 16px;
      padding: 16px;
    }
    .metric-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888888;
      margin-bottom: 6px;
    }
    .metric-value {
      font-size: 26px;
      font-weight: 900;
      color: #FFFFFF;
    }
    .highlight {
      color: #FFA83A;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #FFA83A;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .feedbacks {
      background: #202020;
      border-radius: 16px;
      padding: 14px;
      border: 1px solid #2D2D2D;
    }
    .feedback-item {
      padding: 10px 0;
      border-bottom: 1px solid #2A2A2A;
      font-size: 13px;
    }
    .feedback-item:last-child {
      border-bottom: none;
    }
    .user-badge {
      font-weight: 800;
      color: #FFA83A;
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>ReadToChange · Founder Pulse</h1>
    <div class="subtitle">Cumulative impact & habit health metrics</div>

    <div class="grid">
      <div class="metric">
        <div class="metric-title">Total Users Joined</div>
        <div class="metric-value highlight">${stats.totalUsers}</div>
      </div>
      <div class="metric">
        <div class="metric-title">Active (7 Days)</div>
        <div class="metric-value">${stats.activeThisWeek}</div>
      </div>
      <div class="metric">
        <div class="metric-title">Hours Read</div>
        <div class="metric-value">${hoursRead} hrs</div>
      </div>
      <div class="metric">
        <div class="metric-title">Pages Turned</div>
        <div class="metric-value">${stats.totalPages}</div>
      </div>
      <div class="metric">
        <div class="metric-title">Actions Completed</div>
        <div class="metric-value highlight">${stats.completedActions} / ${stats.totalActions}</div>
      </div>
      <div class="metric">
        <div class="metric-title">Action Execution Rate</div>
        <div class="metric-value">${stats.actionCompletionRate}%</div>
      </div>
    </div>

    <div class="section-title">Latest User Feedback (${stats.totalFeedback} total)</div>
    <div class="feedbacks">
      ${
        stats.recentFeedbacks.length === 0
          ? '<div style="color: #666; font-size: 13px;">No feedback received yet.</div>'
          : stats.recentFeedbacks
              .map(
                (fb) => `
        <div class="feedback-item">
          <span class="user-badge">${fb.username ? "@" + fb.username : fb.firstName || "Reader"}:</span>
          <span>"${fb.message}"</span>
        </div>`
              )
              .join("")
      }
    </div>
  </div>
</body>
</html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error("Admin summary error:", err);
    return NextResponse.json({ error: "Failed to generate admin summary" }, { status: 500 });
  }
}
