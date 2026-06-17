import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const messages = await prisma.groupMessage.findMany({
      where: { groupId: id },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { content, attachmentUrl, attachmentType } = await req.json();
    if (!content?.trim() && !attachmentUrl) {
      return NextResponse.json({ error: "Content or attachment required" }, { status: 400 });
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId: id,
        senderId: session.user.id,
        content: content?.trim() ?? "",
        attachmentUrl: attachmentUrl ?? null,
        attachmentType: attachmentType ?? null,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
