import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const resource = await prisma.knowledgeResource.findUnique({
      where: { id },
      select: { groupId: true, uploadedById: true },
    });
    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    const check = await requireGroupMember(resource.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    // Uploader or group owner may delete.
    if (resource.uploadedById !== session.user.id && check.role !== "OWNER") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    await prisma.knowledgeResource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
