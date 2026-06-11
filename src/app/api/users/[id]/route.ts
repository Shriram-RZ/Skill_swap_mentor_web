import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        location: true,
        website: true,
        createdAt: true,
        skills: {
          include: { skill: true },
        },
        receivedReviews: {
          include: {
            reviewer: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
