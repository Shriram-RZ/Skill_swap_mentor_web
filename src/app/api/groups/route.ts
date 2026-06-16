import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

const memberSelect = {
  id: true,
  name: true,
  avatar: true,
  email: true,
} as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.groupMembership.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            owner: { select: memberSelect },
            memberships: {
              where: { status: "ACTIVE" },
              include: { user: { select: memberSelect } },
            },
            _count: { select: { roadmaps: true, resources: true, quizzes: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const groups = memberships
      .filter((m) => m.status === "ACTIVE")
      .map((m) => ({ ...m.group, myRole: m.role }));

    const invites = memberships
      .filter((m) => m.status === "INVITED")
      .map((m) => ({ membershipId: m.id, group: m.group }));

    return NextResponse.json({ groups, invites });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = createSchema.parse(await req.json());

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: session.user.id,
        memberships: {
          create: { userId: session.user.id, role: "OWNER", status: "ACTIVE" },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
