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

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participant1: { select: { id: true, name: true, avatar: true } },
        participant2: { select: { id: true, name: true, avatar: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isParticipant =
      conversation.participant1Id === session.user.id ||
      conversation.participant2Id === session.user.id;

    if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: session.user.id },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isParticipant =
      conversation.participant1Id === session.user.id ||
      conversation.participant2Id === session.user.id;

    if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: session.user.id, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const receiverId =
      conversation.participant1Id === session.user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `${session.user.name}: ${content.slice(0, 50)}${content.length > 50 ? "..." : ""}`,
        relatedId: id,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
