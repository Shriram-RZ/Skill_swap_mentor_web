import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/groups";

// answers: map of questionId -> user's answer string
const bodySchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const check = await requireGroupMember(quiz.groupId, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { answers } = bodySchema.parse(await req.json());

    // Auto-grade MCQs exactly; non-MCQ questions are self-checked against the
    // reference answer (not counted in the score).
    const mcqs = quiz.questions.filter((q) => q.type === "MCQ");
    let correct = 0;
    const results = quiz.questions.map((q) => {
      const given = (answers[q.id] ?? "").trim();
      const isMcq = q.type === "MCQ";
      const isCorrect = isMcq && given.toLowerCase() === q.answer.trim().toLowerCase();
      if (isCorrect) correct += 1;
      return {
        questionId: q.id,
        type: q.type,
        given,
        correctAnswer: q.answer,
        explanation: q.explanation,
        graded: isMcq,
        isCorrect: isMcq ? isCorrect : null,
      };
    });

    const score = mcqs.length ? Math.round((correct / mcqs.length) * 100) : null;

    await prisma.quizAttempt.create({
      data: { quizId: id, userId: session.user.id, score, answers },
    });

    return NextResponse.json({ score, correct, totalGraded: mcqs.length, results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
