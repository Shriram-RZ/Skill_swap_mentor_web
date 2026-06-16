import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember, requireGroupOwner } from "@/lib/groups";

const memberSelect = { id: true, name: true, avatar: true, email: true } as const;

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        owner: { select: memberSelect },
        memberships: {
          include: { user: { select: memberSelect } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { roadmaps: true, resources: true, quizzes: true, reports: true } },
      },
    });

    return NextResponse.json({ ...group, myRole: check.role });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupOwner(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const data = updateSchema.parse(await req.json());
    const group = await prisma.group.update({ where: { id }, data });
    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupOwner(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
