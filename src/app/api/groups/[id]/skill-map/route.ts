import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

// Computes a "who teaches what to whom" graph from members' TEACH/LEARN skills.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId: id, status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            skills: { include: { skill: { select: { name: true } } } },
          },
        },
      },
    });

    const nodes = memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      avatar: m.user.avatar,
      teaches: m.user.skills.filter((s) => s.type === "TEACH").map((s) => s.skill.name),
      learns: m.user.skills.filter((s) => s.type === "LEARN").map((s) => s.skill.name),
    }));

    // Edge: teacher -> learner for each skill one teaches and another wants.
    const edges: { from: string; to: string; skill: string }[] = [];
    for (const teacher of nodes) {
      for (const skill of teacher.teaches) {
        for (const learner of nodes) {
          if (learner.id !== teacher.id && learner.learns.includes(skill)) {
            edges.push({ from: teacher.id, to: learner.id, skill });
          }
        }
      }
    }

    // Gaps: skills members want to learn that nobody in the group teaches.
    const taughtSkills = new Set(nodes.flatMap((n) => n.teaches));
    const gaps = [
      ...new Set(
        nodes.flatMap((n) => n.learns).filter((s) => !taughtSkills.has(s))
      ),
    ];

    return NextResponse.json({ nodes, edges, gaps });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
