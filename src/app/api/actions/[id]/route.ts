import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTelegramInitData } from "@/lib/telegram/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("x-telegram-init-data");
    const { user: tgUser, isValid } = validateTelegramInitData(authHeader);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const telegramId = String(tgUser.id);
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = params;
    const body = await req.json();
    const { completed } = body;

    // 1. Try finding UserAction by direct id
    let action = await prisma.userAction.findFirst({
      where: { id, userId: user.id },
    });

    // 2. If not found, id might be a ReadingSession id
    if (!action) {
      const session = await prisma.readingSession.findFirst({
        where: { id, userId: user.id },
      });

      if (session && session.actionItem) {
        action = await prisma.userAction.findFirst({
          where: {
            userId: user.id,
            description: session.actionItem,
          },
        });

        if (!action) {
          action = await prisma.userAction.create({
            data: {
              userId: user.id,
              bookId: session.bookId,
              description: session.actionItem,
              completedAt: completed ? new Date() : null,
            },
          });
          return NextResponse.json({
            success: true,
            action: {
              id: action.id,
              description: action.description,
              completedAt: action.completedAt?.toISOString() || null,
              createdAt: action.createdAt.toISOString(),
            },
          });
        }
      }
    }

    // 3. Fallback: match by description if id was passed as text
    if (!action) {
      action = await prisma.userAction.findFirst({
        where: { description: id, userId: user.id },
      });
    }

    // 4. Fallback for mock sessions (e.g. s1, s2) if user clicked on initial cards
    if (!action) {
      action = await prisma.userAction.create({
        data: {
          id: id.startsWith("s") ? undefined : id,
          userId: user.id,
          description: id,
          completedAt: completed ? new Date() : null,
        },
      });
      return NextResponse.json({
        success: true,
        action: {
          id: action.id,
          description: action.description,
          completedAt: action.completedAt?.toISOString() || null,
          createdAt: action.createdAt.toISOString(),
        },
      });
    }

    const updated = await prisma.userAction.update({
      where: { id: action.id },
      data: {
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      action: {
        id: updated.id,
        description: updated.description,
        completedAt: updated.completedAt?.toISOString() || null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/actions/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
