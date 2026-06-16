import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const quizzes = await prisma.quiz.findMany({
      where: { groupId: id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        _count: { select: { questions: true, attempts: true } },
        attempts: {
          where: { userId: session.user.id },
          select: { id: true, score: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
