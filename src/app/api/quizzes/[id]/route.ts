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
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        questions: { orderBy: { order: "asc" } },
        attempts: {
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const check = await requireGroupMember(quiz.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    // Hide answers/explanations until the user has attempted (or is the creator).
    const reveal = quiz.createdById === session.user.id || quiz.attempts.length > 0;
    const questions = quiz.questions.map((q) =>
      reveal ? q : { ...q, answer: "", explanation: null }
    );

    return NextResponse.json({ ...quiz, questions, reveal });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { groupId: true, createdById: true },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const check = await requireGroupMember(quiz.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
    if (quiz.createdById !== session.user.id && check.role !== "OWNER") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
