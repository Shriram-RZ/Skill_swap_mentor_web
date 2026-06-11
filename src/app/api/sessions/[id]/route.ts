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
    const body = await req.json();

    const mentorSession = await prisma.session.findUnique({ where: { id } });
    if (!mentorSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (
      mentorSession.mentorId !== session.user.id &&
      mentorSession.menteeId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: body,
      include: {
        mentor: { select: { id: true, name: true, avatar: true } },
        mentee: { select: { id: true, name: true, avatar: true } },
        review: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
