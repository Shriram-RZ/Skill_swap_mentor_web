import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

// Toggle the current user's completion of a roadmap task.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;
    const task = await prisma.roadmapTask.findUnique({
      where: { id: taskId },
      include: { week: { select: { roadmap: { select: { groupId: true } } } } },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const check = await requireGroupMember(task.week.roadmap.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const existing = await prisma.roadmapTaskCompletion.findUnique({
      where: { taskId_userId: { taskId, userId: session.user.id } },
    });

    let completed: boolean;
    if (existing) {
      await prisma.roadmapTaskCompletion.delete({ where: { id: existing.id } });
      completed = false;
    } else {
      await prisma.roadmapTaskCompletion.create({
        data: { taskId, userId: session.user.id },
      });
      completed = true;
    }

    return NextResponse.json({ completed, xp: task.xp });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
