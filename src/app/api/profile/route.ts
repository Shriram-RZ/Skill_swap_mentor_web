import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  avatar: z.string().optional(),
  skills: z
    .array(
      z.object({
        skillId: z.string(),
        type: z.enum(["TEACH", "LEARN"]),
        level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        location: true,
        website: true,
        createdAt: true,
        skills: { include: { skill: true } },
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { skills, ...profileData } = profileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: profileData,
    });

    if (skills !== undefined) {
      await prisma.userSkill.deleteMany({ where: { userId: session.user.id } });
      if (skills.length > 0) {
        await prisma.userSkill.createMany({
          data: skills.map((s) => ({ ...s, userId: session.user.id })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
