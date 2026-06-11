import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all"; // sent | received | all

    const where =
      filter === "sent"
        ? { senderId: session.user.id }
        : filter === "received"
        ? { receiverId: session.user.id }
        : {
            OR: [
              { senderId: session.user.id },
              { receiverId: session.user.id },
            ],
          };

    const requests = await prisma.swapRequest.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true, skills: { include: { skill: true } } } },
        receiver: { select: { id: true, name: true, avatar: true, skills: { include: { skill: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, message } = await req.json();
    if (!receiverId || !message) {
      return NextResponse.json({ error: "receiverId and message required" }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
    }

    const existing = await prisma.swapRequest.findFirst({
      where: {
        senderId: session.user.id,
        receiverId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Request already exists" }, { status: 400 });
    }

    const request = await prisma.swapRequest.create({
      data: { senderId: session.user.id, receiverId, message },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "SWAP_REQUEST",
        title: "New Skill Swap Request",
        message: `${session.user.name} sent you a skill swap request`,
        relatedId: request.id,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
