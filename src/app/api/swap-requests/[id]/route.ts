import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    if (!["ACCEPTED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const request = await prisma.swapRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (request.receiverId !== session.user.id && request.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.swapRequest.update({
      where: { id },
      data: { status },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    const notifyUserId =
      status === "ACCEPTED" || status === "REJECTED"
        ? request.senderId
        : request.receiverId;

    const notifyType =
      status === "ACCEPTED"
        ? "REQUEST_ACCEPTED"
        : status === "REJECTED"
        ? "REQUEST_REJECTED"
        : "SWAP_REQUEST";

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: notifyType,
        title: `Swap Request ${status.charAt(0) + status.slice(1).toLowerCase()}`,
        message:
          status === "ACCEPTED"
            ? `${session.user.name} accepted your skill swap request`
            : status === "REJECTED"
            ? `${session.user.name} declined your skill swap request`
            : `Swap request marked as completed`,
        relatedId: id,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const request = await prisma.swapRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (request.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.swapRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
