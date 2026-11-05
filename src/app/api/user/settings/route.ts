import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTelegramInitData } from "@/lib/telegram/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-telegram-init-data");
    const { user: tgUser, isValid } = validateTelegramInitData(authHeader);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const telegramId = String(tgUser.id);
    const body = await req.json();
    const { dailyTarget, reminderTime, selectedGoalIds, timezone, timezoneOffset } = body;

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Update user fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyTarget: typeof dailyTarget === "number" ? dailyTarget : undefined,
        reminderTime: typeof reminderTime === "string" ? reminderTime : undefined,
        timezone: typeof timezone === "string" && timezone.trim() ? timezone : undefined,
        timezoneOffset: typeof timezoneOffset === "number" ? timezoneOffset : undefined,
      },
    });

    // 2. Update selected goals if provided
    if (Array.isArray(selectedGoalIds)) {
      // Clear existing goals
      await prisma.userGoal.deleteMany({
        where: { userId: user.id },
      });

      // Insert new goals
      if (selectedGoalIds.length > 0) {
        await prisma.userGoal.createMany({
          data: selectedGoalIds.map((goalId: string) => ({
            userId: user.id,
            goalId,
          })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/user/settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
