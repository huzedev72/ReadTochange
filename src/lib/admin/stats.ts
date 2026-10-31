import { prisma } from "@/lib/db";

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  totalSessions: number;
  totalMinutes: number;
  totalPages: number;
  totalActions: number;
  completedActions: number;
  actionCompletionRate: number;
  activeStreaks: number;
  topStreak: number;
  totalFeedback: number;
  recentFeedbacks: Array<{
    id: string;
    username: string | null;
    firstName: string | null;
    message: string;
    source: string;
    createdAt: Date;
  }>;
}

export async function getAdminCumulativeStats(): Promise<AdminStats> {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [
    totalUsers,
    activeToday,
    activeThisWeek,
    totalSessions,
    sessionAgg,
    totalActions,
    completedActions,
    activeStreaks,
    topUserStreak,
    totalFeedback,
    recentFeedbacks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastReadAt: { gte: todayStart },
      },
    }),
    prisma.user.count({
      where: {
        lastReadAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.readingSession.count(),
    prisma.readingSession.aggregate({
      _sum: {
        durationMinutes: true,
        pagesRead: true,
      },
    }),
    prisma.userAction.count(),
    prisma.userAction.count({
      where: {
        completedAt: { not: null },
      },
    }),
    prisma.user.count({
      where: {
        streakDays: { gt: 0 },
      },
    }),
    prisma.user.findFirst({
      orderBy: { streakDays: "desc" },
      select: { streakDays: true },
    }),
    prisma.feedback.count(),
    prisma.feedback.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        firstName: true,
        message: true,
        source: true,
        createdAt: true,
      },
    }),
  ]);

  const totalMinutes = sessionAgg._sum.durationMinutes || 0;
  const totalPages = sessionAgg._sum.pagesRead || 0;
  const actionCompletionRate =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const topStreak = topUserStreak?.streakDays || 0;

  return {
    totalUsers,
    activeToday,
    activeThisWeek,
    totalSessions,
    totalMinutes,
    totalPages,
    totalActions,
    completedActions,
    actionCompletionRate,
    activeStreaks,
    topStreak,
    totalFeedback,
    recentFeedbacks,
  };
}

export function formatAdminStatsTelegram(stats: AdminStats): string {
  const hoursRead = (stats.totalMinutes / 60).toFixed(1);

  let msg = `📊 *ReadToChange · Founder Pulse*\n\n`;
  msg += `👥 *Audience:*\n`;
  msg += `• Total Users Joined: *${stats.totalUsers}*\n`;
  msg += `• Active Today: *${stats.activeToday}*\n`;
  msg += `• Active This Week (WAU): *${stats.activeThisWeek}*\n\n`;

  msg += `📖 *Cumulative Impact:*\n`;
  msg += `• Total Focus Sessions: *${stats.totalSessions}*\n`;
  msg += `• Total Time Read: *${stats.totalMinutes} min* (~${hoursRead} hrs)\n`;
  msg += `• Pages Turned: *${stats.totalPages} pages*\n\n`;

  msg += `⚡ *Behavior Change (The Core Value):*\n`;
  msg += `• Action Items Created: *${stats.totalActions}*\n`;
  msg += `• Action Items Completed: *${stats.completedActions}*\n`;
  msg += `• Execution Rate: *${stats.actionCompletionRate}%*\n\n`;

  msg += `🔥 *Habit Retention:*\n`;
  msg += `• Active Flames: *${stats.activeStreaks}*\n`;
  msg += `• Longest Streak: *${stats.topStreak} days*\n\n`;

  msg += `💬 *Direct Feedback (${stats.totalFeedback} total):*\n`;
  if (stats.recentFeedbacks.length === 0) {
    msg += `_No feedback received yet. Encourage users with /feedback._\n`;
  } else {
    stats.recentFeedbacks.slice(0, 3).forEach((fb, idx) => {
      const userTag = fb.username ? `@${fb.username}` : fb.firstName || "Anonymous";
      msg += `${idx + 1}. *${userTag}*: "${fb.message}"\n`;
    });
  }

  return msg;
}
