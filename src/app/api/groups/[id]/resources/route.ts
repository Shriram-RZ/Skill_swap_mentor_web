import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

const createSchema = z
  .object({
    title: z.string().min(1).max(160),
    type: z.enum(["NOTE", "PDF", "VIDEO", "ASSIGNMENT"]),
    content: z.string().max(20000).optional(),
    url: z.string().url().optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((d) => (d.type === "NOTE" ? !!d.content : !!d.url), {
    message: "Notes require content; PDF/Video/Assignment require a URL",
  });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const resources = await prisma.knowledgeResource.findMany({
      where: { groupId: id },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
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

    const data = createSchema.parse(await req.json());

    const resource = await prisma.knowledgeResource.create({
      data: {
        groupId: id,
        uploadedById: session.user.id,
        title: data.title,
        type: data.type,
        content: data.content,
        url: data.url,
        description: data.description,
      },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
