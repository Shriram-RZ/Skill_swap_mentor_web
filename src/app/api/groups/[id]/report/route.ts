import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";
import { groqText, GroqConfigError } from "@/lib/groq";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const reports = await prisma.weeklyReport.findMany({
      where: { groupId: id },
      include: { generatedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const group = await prisma.group.findUnique({ where: { id }, select: { name: true } });
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId: id, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true } } },
    });
    const memberIds = memberships.map((m) => m.userId);
    const nameOf = new Map(memberships.map((m) => [m.userId, m.user.name]));

    // Sessions taught in the period (per mentor).
    const sessions = await prisma.session.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: periodStart, lte: periodEnd },
        mentorId: { in: memberIds },
      },
      select: { mentorId: true, duration: true },
    });

    // Task completions in the period.
    const completions = await prisma.roadmapTaskCompletion.findMany({
      where: {
        userId: { in: memberIds },
        completedAt: { gte: periodStart, lte: periodEnd },
        task: { week: { roadmap: { groupId: id } } },
      },
      select: { userId: true, task: { select: { title: true } } },
    });

    // Total tasks available in the group's roadmaps (for completion %).
    const totalTasks = await prisma.roadmapTask.count({
      where: { week: { roadmap: { groupId: id } } },
    });

    const roadmaps = await prisma.roadmap.findMany({
      where: { groupId: id },
      select: { skillName: true },
    });

    // Quiz attempts in the period.
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: { in: memberIds },
        createdAt: { gte: periodStart, lte: periodEnd },
        quiz: { groupId: id },
      },
      select: { userId: true, score: true },
    });

    // Build a per-member digest for the model.
    const lines = memberships.map((m) => {
      const taught = sessions.filter((s) => s.mentorId === m.userId).length;
      const done = completions.filter((c) => c.userId === m.userId).length;
      const pct = totalTasks ? Math.round((done / totalTasks) * 100) : 0;
      const memberAttempts = attempts.filter((a) => a.userId === m.userId);
      const avg = memberAttempts.length
        ? Math.round(
            memberAttempts.reduce((acc, a) => acc + (a.score ?? 0), 0) / memberAttempts.length
          )
        : null;
      return `- ${m.user.name}: conducted ${taught} teaching session(s); completed ${done} task(s) (${pct}% of all roadmap tasks); ${
        avg === null ? "no quiz attempts" : `avg quiz score ${avg}%`
      }.`;
    });

    const digest =
      `Group: ${group?.name}\n` +
      `Period: ${periodStart.toDateString()} to ${periodEnd.toDateString()}\n` +
      `Roadmap skills in progress: ${roadmaps.map((r) => r.skillName).join(", ") || "none"}\n` +
      `Members (${memberships.length}):\n${lines.join("\n")}`;

    let content: string;
    try {
      content = await groqText({
        system:
          "You are a learning coach writing a concise weekly progress report for a friend study group. " +
          "Use the provided data only. Output GitHub-flavored markdown with three sections: " +
          "## Highlights (per-member bullets like 'B completed 80% of assigned tasks', 'A conducted 3 teaching sessions'), " +
          "## Group Momentum (1-2 sentences), and ## Recommended Next Topic (one specific topic to study next, with a one-line reason). " +
          "Keep it under 250 words and encouraging.",
        user: digest,
      });
    } catch (error) {
      if (error instanceof GroqConfigError) {
        return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
      }
      throw error;
    }

    const report = await prisma.weeklyReport.create({
      data: {
        groupId: id,
        generatedById: session.user.id,
        periodStart,
        periodEnd,
        content,
      },
      include: { generatedBy: { select: { id: true, name: true } } },
    });

    const others = memberIds.filter((uid) => uid !== session.user.id);
    if (others.length) {
      await prisma.notification.createMany({
        data: others.map((uid) => ({
          userId: uid,
          type: "REPORT_READY" as const,
          title: "Weekly report ready",
          message: `${nameOf.get(session.user.id) ?? "A member"} generated this week's report for "${group?.name}"`,
          relatedId: id,
        })),
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
