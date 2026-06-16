import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  xp: z.number().int().min(0).max(1000).optional(),
});
const weekSchema = z.object({
  weekNumber: z.number().int().min(1),
  title: z.string().min(1),
  tasks: z.array(taskSchema).default([]),
});
const createSchema = z.object({
  title: z.string().min(2).max(120),
  skillName: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  weeks: z.array(weekSchema).min(1),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const roadmaps = await prisma.roadmap.findMany({
      where: { groupId: id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        weeks: { include: { _count: { select: { tasks: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(roadmaps);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const data = createSchema.parse(await req.json());

    const roadmap = await prisma.roadmap.create({
      data: {
        groupId: id,
        title: data.title,
        skillName: data.skillName,
        description: data.description,
        source: "MANUAL",
        createdById: session.user.id,
        weeks: {
          create: data.weeks.map((w, wi) => ({
            weekNumber: w.weekNumber,
            title: w.title,
            order: wi,
            tasks: {
              create: w.tasks.map((t, ti) => ({
                title: t.title,
                description: t.description,
                xp: t.xp ?? 10,
                order: ti,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json(roadmap, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
