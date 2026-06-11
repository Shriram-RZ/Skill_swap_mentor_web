import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
      include: {
        participant1: { select: { id: true, name: true, avatar: true } },
        participant2: { select: { id: true, name: true, avatar: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { participantId } = await req.json();
    if (!participantId) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 });
    }

    const [p1, p2] = [session.user.id, participantId].sort();

    const conversation = await prisma.conversation.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      update: {},
      create: { participant1Id: p1, participant2Id: p2 },
      include: {
        participant1: { select: { id: true, name: true, avatar: true } },
        participant2: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
