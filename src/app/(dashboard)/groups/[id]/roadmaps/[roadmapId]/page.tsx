"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Sparkles, Trophy, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Completion { user: { id: string; name: string; avatar: string | null }; }
interface Task { id: string; title: string; description: string | null; xp: number; completions: Completion[]; }
interface Week { id: string; weekNumber: number; title: string; tasks: Task[]; }
interface Roadmap {
  id: string; title: string; skillName: string; description: string | null; source: "AI" | "MANUAL";
  group: { id: string; name: string }; createdBy: { id: string; name: string }; weeks: Week[];
}

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string; roadmapId: string }> }) {
  const { id, roadmapId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const meId = session?.user?.id;

  async function load() {
    const res = await fetch(`/api/roadmaps/${roadmapId}`);
    if (res.ok) setRoadmap(await res.json());
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [roadmapId]);

  async function toggle(taskId: string) {
    await fetch(`/api/roadmap-tasks/${taskId}/complete`, { method: "POST" });
    load();
  }
  async function removeRoadmap() {
    await fetch(`/api/roadmaps/${roadmapId}`, { method: "DELETE" });
    router.push(`/groups/${id}`);
  }

  if (!roadmap) {
    return <div className="p-8 max-w-3xl mx-auto"><div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" /></div>;
  }

  const allTasks = roadmap.weeks.flatMap((w) => w.tasks);
  const myDone = allTasks.filter((t) => t.completions.some((c) => c.user.id === meId));
  const myXp = myDone.reduce((a, t) => a + t.xp, 0);
  const totalXp = allTasks.reduce((a, t) => a + t.xp, 0);
  const pct = allTasks.length ? Math.round((myDone.length / allTasks.length) * 100) : 0;
  const canDelete = roadmap.createdBy.id === meId;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href={`/groups/${id}`} className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to {roadmap.group.name}</Link>
      <div className="flex items-start justify-between gap-3 mt-2 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{roadmap.skillName}</span>
            {roadmap.source === "AI" && <span className="flex items-center gap-1 text-xs text-purple-600"><Sparkles size={11} /> AI generated</span>}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{roadmap.title}</h1>
          {roadmap.description && <p className="text-slate-500 mt-1">{roadmap.description}</p>}
        </div>
        {canDelete && (
          <button onClick={removeRoadmap} className="text-slate-300 hover:text-red-500" title="Delete roadmap"><Trash2 size={18} /></button>
        )}
      </div>

      {/* Progress summary */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-900">Your progress</span>
          <span className="flex items-center gap-1 text-sm font-medium text-amber-600"><Trophy size={14} /> {myXp} / {totalXp} XP</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-slate-400 mt-1">{myDone.length} of {allTasks.length} tasks completed ({pct}%)</div>
      </div>

      {/* Weeks */}
      <div className="space-y-5">
        {roadmap.weeks.map((w) => (
          <div key={w.id} className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Week {w.weekNumber}: {w.title}</h3>
            <div className="space-y-2">
              {w.tasks.map((t) => {
                const done = t.completions.some((c) => c.user.id === meId);
                return (
                  <div key={t.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50">
                    <button onClick={() => toggle(t.id)} className={done ? "text-green-600" : "text-slate-300 hover:text-slate-400"}>
                      {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.title}</div>
                      {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                      {t.completions.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">Done by {t.completions.map((c) => c.user.name.split(" ")[0]).join(", ")}</div>
                      )}
                    </div>
                    <span className="text-xs text-amber-600 font-medium flex-shrink-0">+{t.xp} XP</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
