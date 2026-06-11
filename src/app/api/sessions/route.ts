import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sessionSchema = z.object({
  menteeId: z.string(),
  swapRequestId: z.string().optional(),
  scheduledAt: z.string(),
  duration: z.number().int().min(15).max(240),
  notes: z.string().optional(),
  meetingLink: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessions = await prisma.session.findMany({
      where: {
        OR: [{ mentorId: session.user.id }, { menteeId: session.user.id }],
      },
      include: {
        mentor: { select: { id: true, name: true, avatar: true } },
        mentee: { select: { id: true, name: true, avatar: true } },
        review: true,
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = sessionSchema.parse(body);

    const mentorSession = await prisma.session.create({
      data: {
        mentorId: session.user.id,
        menteeId: data.menteeId,
        swapRequestId: data.swapRequestId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        notes: data.notes,
        meetingLink: data.meetingLink,
      },
      include: {
        mentor: { select: { id: true, name: true, avatar: true } },
        mentee: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: data.menteeId,
        type: "SESSION_SCHEDULED",
        title: "Session Scheduled",
        message: `${session.user.name} scheduled a mentorship session with you`,
        relatedId: mentorSession.id,
      },
    });

    return NextResponse.json(mentorSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
