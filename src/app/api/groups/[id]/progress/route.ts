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

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId: id, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    const memberIds = memberships.map((m) => m.userId);

    // Completed sessions involving group members (counts both directions).
    const sessions = await prisma.session.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ mentorId: { in: memberIds } }, { menteeId: { in: memberIds } }],
      },
      select: { mentorId: true, menteeId: true, duration: true },
    });

    // Group roadmaps -> tasks + completions.
    const roadmaps = await prisma.roadmap.findMany({
      where: { groupId: id },
      include: {
        weeks: {
          include: {
            tasks: { include: { completions: { select: { userId: true } } } },
          },
        },
      },
    });

    type Stat = {
      userId: string;
      name: string;
      avatar: string | null;
      hoursTaught: number;
      hoursLearned: number;
      tasksCompleted: number;
      skillsCompleted: number;
      xp: number;
    };

    const stats = new Map<string, Stat>();
    for (const m of memberships) {
      stats.set(m.userId, {
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
        hoursTaught: 0,
        hoursLearned: 0,
        tasksCompleted: 0,
        skillsCompleted: 0,
        xp: 0,
      });
    }

    let teachMinutes = 0;
    for (const s of sessions) {
      const mentor = stats.get(s.mentorId);
      if (mentor) {
        mentor.hoursTaught += s.duration / 60;
        teachMinutes += s.duration;
      }
      const mentee = stats.get(s.menteeId);
      if (mentee) mentee.hoursLearned += s.duration / 60;
    }

    for (const r of roadmaps) {
      const allTasks = r.weeks.flatMap((w) => w.tasks);
      for (const t of allTasks) {
        for (const c of t.completions) {
          const stat = stats.get(c.userId);
          if (stat) {
            stat.tasksCompleted += 1;
            stat.xp += t.xp;
          }
        }
      }
      // A "skill completed" = a member completed every task in this roadmap.
      if (allTasks.length > 0) {
        for (const userId of memberIds) {
          const completedAll = allTasks.every((t) =>
            t.completions.some((c) => c.userId === userId)
          );
          if (completedAll) {
            const stat = stats.get(userId);
            if (stat) stat.skillsCompleted += 1;
          }
        }
      }
    }

    const leaderboard = [...stats.values()]
      .map((s) => ({
        ...s,
        hoursTaught: Math.round(s.hoursTaught * 10) / 10,
        hoursLearned: Math.round(s.hoursLearned * 10) / 10,
      }))
      .sort((a, b) => b.xp - a.xp);

    const totals = {
      members: memberships.length,
      hoursTaught: Math.round((teachMinutes / 60) * 10) / 10,
      tasksCompleted: leaderboard.reduce((acc, s) => acc + s.tasksCompleted, 0),
      skillsCompleted: leaderboard.reduce((acc, s) => acc + s.skillsCompleted, 0),
      totalXp: leaderboard.reduce((acc, s) => acc + s.xp, 0),
      roadmaps: roadmaps.length,
    };

    return NextResponse.json({ totals, leaderboard });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
