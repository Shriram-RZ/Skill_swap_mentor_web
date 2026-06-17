import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const reviews = await prisma.roadmapReview.findMany({
      where: { roadmapId: id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    const count = reviews.length;
    const average = count ? reviews.reduce((a, r) => a + r.rating, 0) / count : 0;
    return NextResponse.json({ reviews, count, average });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { rating, comment } = reviewSchema.parse(await req.json());

    // Only allow reviewing a roadmap you have fully completed.
    const tasks = await prisma.roadmapTask.findMany({
      where: { week: { roadmapId: id } },
      select: { id: true },
    });
    if (tasks.length === 0) {
      return NextResponse.json({ error: "Roadmap has no tasks" }, { status: 400 });
    }
    const done = await prisma.roadmapTaskCompletion.count({
      where: { userId: session.user.id, taskId: { in: tasks.map((t) => t.id) } },
    });
    if (done < tasks.length) {
      return NextResponse.json({ error: "Complete the roadmap before reviewing it" }, { status: 403 });
    }

    const review = await prisma.roadmapReview.upsert({
      where: { roadmapId_userId: { roadmapId: id, userId: session.user.id } },
      create: { roadmapId: id, userId: session.user.id, rating, comment },
      update: { rating, comment },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
