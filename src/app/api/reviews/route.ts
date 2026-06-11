import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  sessionId: z.string(),
  revieweeId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? session.user.id;
    const type = searchParams.get("type") ?? "received"; // given | received

    const reviews = await prisma.review.findMany({
      where:
        type === "given" ? { reviewerId: userId } : { revieweeId: userId },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        reviewee: { select: { id: true, name: true, avatar: true } },
        session: { select: { scheduledAt: true, duration: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { sessionId, revieweeId, rating, comment } = reviewSchema.parse(body);

    const mentorSession = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!mentorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (
      mentorSession.mentorId !== session.user.id &&
      mentorSession.menteeId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        revieweeId,
        sessionId,
        rating,
        comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        reviewee: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: "REVIEW_RECEIVED",
        title: "New Review",
        message: `${session.user.name} left you a ${rating}-star review`,
        relatedId: review.id,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
