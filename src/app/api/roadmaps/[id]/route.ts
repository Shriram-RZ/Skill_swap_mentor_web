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
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        group: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        weeks: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                completions: {
                  include: { user: { select: { id: true, name: true, avatar: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const check = await requireGroupMember(roadmap.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    return NextResponse.json(roadmap);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const roadmap = await prisma.roadmap.findUnique({ where: { id }, select: { groupId: true } });
    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const check = await requireGroupMember(roadmap.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    await prisma.roadmap.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
