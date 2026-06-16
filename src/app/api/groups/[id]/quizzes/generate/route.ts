import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";
import { groqJSON, GroqConfigError } from "@/lib/groq";

const bodySchema = z.object({
  topic: z.string().min(1).max(120),
  sessionId: z.string().optional(),
});

type AIQuiz = {
  title: string;
  questions: {
    type: "MCQ" | "CODING" | "SHORT_ANSWER";
    prompt: string;
    options?: string[];
    answer: string;
    explanation?: string;
  }[];
};

const VALID_TYPES = new Set(["MCQ", "CODING", "SHORT_ANSWER"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupMember(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { topic, sessionId } = bodySchema.parse(await req.json());

    const ai = await groqJSON<AIQuiz>({
      system:
        "You are a quiz generator that tests understanding after a lesson. " +
        "Reply ONLY with a JSON object of this exact shape: " +
        `{"title": string, "questions": [{"type": "MCQ"|"CODING"|"SHORT_ANSWER", "prompt": string, "options": string[], "answer": string, "explanation": string}]}. ` +
        "Include a mix: 3 MCQs (each with exactly 4 options and answer being the exact text of the correct option), " +
        "1 CODING question (answer is a reference solution), and 1 SHORT_ANSWER question (answer is the expected response). " +
        "For non-MCQ questions, options must be an empty array.",
      user: `Generate a quiz to test understanding of: "${topic}".`,
    });

    const questions = (ai?.questions ?? []).filter(
      (q) => q?.prompt && q?.answer && VALID_TYPES.has(q.type)
    );
    if (!questions.length) {
      return NextResponse.json({ error: "AI returned no valid questions" }, { status: 502 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        groupId: id,
        createdById: session.user.id,
        title: ai.title?.slice(0, 160) || `${topic} Quiz`,
        topic,
        sessionId,
        questions: {
          create: questions.map((q, i) => ({
            type: q.type,
            prompt: q.prompt.slice(0, 2000),
            options: q.type === "MCQ" ? (q.options ?? []).map((o) => String(o).slice(0, 500)) : [],
            answer: String(q.answer).slice(0, 4000),
            explanation: q.explanation?.slice(0, 2000),
            order: i,
          })),
        },
      },
    });

    // Notify other active members that a new quiz is available.
    const members = await prisma.groupMembership.findMany({
      where: { groupId: id, status: "ACTIVE", userId: { not: session.user.id } },
      select: { userId: true },
    });
    if (members.length) {
      await prisma.notification.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          type: "QUIZ_CREATED" as const,
          title: "New quiz",
          message: `${session.user.name} created a quiz: "${quiz.title}"`,
          relatedId: quiz.id,
        })),
      });
    }

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
