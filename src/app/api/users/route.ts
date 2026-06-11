import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const skillId = searchParams.get("skillId");
    const type = searchParams.get("type"); // TEACH or LEARN

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { bio: { contains: query, mode: "insensitive" } },
                  { location: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          skillId
            ? {
                skills: {
                  some: {
                    skillId,
                    ...(type ? { type: type as "TEACH" | "LEARN" } : {}),
                  },
                },
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        skills: {
          include: { skill: true },
        },
        receivedReviews: {
          select: { rating: true },
        },
      },
      take: 50,
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
