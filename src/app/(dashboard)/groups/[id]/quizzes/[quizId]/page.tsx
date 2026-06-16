"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Code, FileText, ListChecks } from "lucide-react";

interface Question {
  id: string;
  type: "MCQ" | "CODING" | "SHORT_ANSWER";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string | null;
  order: number;
}
interface Quiz {
  id: string; title: string; topic: string;
  createdBy: { id: string; name: string };
  questions: Question[];
  reveal: boolean;
}
interface QResult {
  questionId: string; type: string; given: string; correctAnswer: string;
  explanation: string | null; graded: boolean; isCorrect: boolean | null;
}
interface AttemptResult { score: number | null; correct: number; totalGraded: number; results: QResult[]; }

const TYPE_ICON = { MCQ: ListChecks, CODING: Code, SHORT_ANSWER: FileText };
const TYPE_LABEL = { MCQ: "Multiple choice", CODING: "Coding", SHORT_ANSWER: "Short answer" };

export default function QuizPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${quizId}`).then((r) => r.json()).then(setQuiz);
  }, [quizId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    if (res.ok) {
      setResult(await res.json());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!quiz) {
    return <div className="p-8 max-w-2xl mx-auto"><div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" /></div>;
  }

  const resultFor = (qid: string) => result?.results.find((r) => r.questionId === qid);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href={`/groups/${id}`} className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to group</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2">{quiz.title}</h1>
      <p className="text-slate-500 mb-5">Topic: {quiz.topic}</p>

      {result && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 mb-5">
          <div className="text-sm text-slate-500">Your score (auto-graded multiple choice)</div>
          <div className="text-3xl font-bold text-indigo-700">{result.score ?? "—"}%</div>
          <div className="text-sm text-slate-500">{result.correct} of {result.totalGraded} multiple-choice correct. Review reference answers for coding & short-answer below.</div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {quiz.questions.map((q, i) => {
          const Icon = TYPE_ICON[q.type];
          const r = resultFor(q.id);
          return (
            <div key={q.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Icon size={13} /> {TYPE_LABEL[q.type]}
              </div>
              <div className="font-medium text-slate-900 mb-3">{i + 1}. {q.prompt}</div>

              {q.type === "MCQ" ? (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[q.id] === opt;
                    const isAnswer = r && opt === r.correctAnswer;
                    const isWrongPick = r && selected && opt !== r.correctAnswer;
                    return (
                      <label key={oi} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm ${
                        isAnswer ? "border-green-300 bg-green-50" : isWrongPick ? "border-red-300 bg-red-50" : selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
                      }`}>
                        <input type="radio" name={q.id} value={opt} checked={selected} disabled={!!result}
                          onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} className="accent-indigo-600" />
                        <span className="flex-1">{opt}</span>
                        {isAnswer && <CheckCircle2 size={15} className="text-green-600" />}
                        {isWrongPick && <XCircle size={15} className="text-red-500" />}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={answers[q.id] ?? ""}
                  disabled={!!result}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                  rows={q.type === "CODING" ? 6 : 3}
                  placeholder={q.type === "CODING" ? "Write your code…" : "Your answer…"}
                  className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${q.type === "CODING" ? "font-mono" : ""}`}
                />
              )}

              {r && (
                <div className="mt-3 text-sm border-t border-slate-50 pt-3">
                  {q.type !== "MCQ" && (
                    <div className="text-slate-600"><span className="font-medium text-slate-800">Reference answer:</span>
                      <pre className="mt-1 whitespace-pre-wrap font-mono text-xs bg-slate-50 p-3 rounded-lg">{r.correctAnswer}</pre>
                    </div>
                  )}
                  {r.explanation && <div className="text-slate-500 mt-2"><span className="font-medium text-slate-700">Why:</span> {r.explanation}</div>}
                </div>
              )}
            </div>
          );
        })}

        {!result && (
          <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit answers"}
          </button>
        )}
      </form>
    </div>
  );
}
