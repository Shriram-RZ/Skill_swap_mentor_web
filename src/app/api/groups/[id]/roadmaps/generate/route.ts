import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";
import { groqJSON, GroqConfigError } from "@/lib/groq";

const bodySchema = z.object({
  skillName: z.string().min(1).max(80),
  weeks: z.number().int().min(1).max(12).optional(),
});

type AIRoadmap = {
  title: string;
  description?: string;
  weeks: {
    weekNumber: number;
    title: string;
    tasks: { title: string; description?: string; xp?: number }[];
  }[];
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { skillName, weeks = 4 } = bodySchema.parse(await req.json());

    const ai = await groqJSON<AIRoadmap>({
      system:
        "You are an expert curriculum designer. Produce a week-by-week learning roadmap. " +
        "Reply ONLY with a JSON object of this exact shape: " +
        `{"title": string, "description": string, "weeks": [{"weekNumber": number, "title": string, "tasks": [{"title": string, "description": string, "xp": number}]}]}. ` +
        "Each week should have 3-5 concrete, actionable tasks. xp must be an integer between 10 and 50 based on difficulty. " +
        "Order weeks from fundamentals to a final mini-project.",
      user: `Create a ${weeks}-week roadmap to learn "${skillName}".`,
    });

    if (!ai?.weeks?.length) {
      return NextResponse.json({ error: "AI returned an empty roadmap" }, { status: 502 });
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        groupId: id,
        title: ai.title?.slice(0, 120) || `${skillName} Roadmap`,
        skillName,
        description: ai.description?.slice(0, 500),
        source: "AI",
        createdById: session.user.id,
        weeks: {
          create: ai.weeks.map((w, wi) => ({
            weekNumber: w.weekNumber ?? wi + 1,
            title: w.title?.slice(0, 200) || `Week ${wi + 1}`,
            order: wi,
            tasks: {
              create: (w.tasks ?? []).map((t, ti) => ({
                title: t.title?.slice(0, 200) || `Task ${ti + 1}`,
                description: t.description?.slice(0, 1000),
                xp: typeof t.xp === "number" ? Math.max(0, Math.min(1000, Math.round(t.xp))) : 10,
                order: ti,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json(roadmap, { status: 201 });
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
  }
}
