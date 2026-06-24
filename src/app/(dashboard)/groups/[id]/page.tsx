"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, FolderOpen, FileQuestion, Network, FileText,
  Users, Plus, X, Sparkles, Crown, Trash2, UserPlus, Trophy,
  GraduationCap, Clock, CheckCircle2, Award, Video, ClipboardList, StickyNote, ExternalLink,
  MessageSquare, Send, Paperclip,
} from "lucide-react";
import { getInitials, timeAgo, resourceTypeColor, formatDateTime } from "@/lib/utils";
import { SkillMapGraph } from "@/components/groups/SkillMapGraph";

type Tab = "dashboard" | "chat" | "roadmaps" | "knowledge" | "quizzes" | "skillmap" | "report" | "members";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "roadmaps", label: "Roadmaps", icon: BookOpen },
  { key: "knowledge", label: "Knowledge", icon: FolderOpen },
  { key: "quizzes", label: "Quizzes", icon: FileQuestion },
  { key: "skillmap", label: "Skill Map", icon: Network },
  { key: "report", label: "Weekly Report", icon: FileText },
  { key: "members", label: "Members", icon: Users },
];

interface Member {
  id: string; role: "OWNER" | "MEMBER"; status: "INVITED" | "ACTIVE";
  user: { id: string; name: string; avatar: string | null; email: string };
}
interface GroupDetail {
  id: string; name: string; description: string | null; ownerId: string;
  myRole: "OWNER" | "MEMBER"; memberships: Member[];
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");

  const loadGroup = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}`);
    if (res.ok) setGroup(await res.json());
    else router.push("/groups");
  }, [id, router]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  if (!group) {
    return <div className="p-8 max-w-5xl mx-auto"><div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" /></div>;
  }

  const isOwner = group.myRole === "OWNER";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/groups" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back to groups</Link>
      <div className="flex items-start justify-between gap-3 mt-2 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {group.name}
              {isOwner && <Crown size={16} className="text-amber-500" />}
            </h1>
            {group.description && <p className="text-slate-500 mt-0.5">{group.description}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab groupId={id} />}
      {tab === "chat" && <ChatTab groupId={id} meId={session?.user?.id} />}
      {tab === "roadmaps" && <RoadmapsTab groupId={id} />}
      {tab === "knowledge" && <KnowledgeTab groupId={id} />}
      {tab === "quizzes" && <QuizzesTab groupId={id} />}
      {tab === "skillmap" && <SkillMapTab groupId={id} />}
      {tab === "report" && <ReportTab groupId={id} />}
      {tab === "members" && (
        <MembersTab group={group} isOwner={isOwner} meId={session?.user?.id} reload={loadGroup} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Dashboard
function StatCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

interface Leader { userId: string; name: string; avatar: string | null; hoursTaught: number; hoursLearned: number; tasksCompleted: number; skillsCompleted: number; xp: number; }
function DashboardTab({ groupId }: { groupId: string }) {
  const [data, setData] = useState<{ totals: Record<string, number>; leaderboard: Leader[] } | null>(null);
  useEffect(() => {
    fetch(`/api/groups/${groupId}/progress`).then((r) => r.json()).then(setData);
  }, [groupId]);

  if (!data) return <div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" />;
  const maxXp = Math.max(1, ...data.leaderboard.map((l) => l.xp));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Hours taught" value={data.totals.hoursTaught} color="bg-indigo-100 text-indigo-700" />
        <StatCard icon={CheckCircle2} label="Tasks completed" value={data.totals.tasksCompleted} color="bg-green-100 text-green-700" />
        <StatCard icon={Award} label="Skills completed" value={data.totals.skillsCompleted} color="bg-purple-100 text-purple-700" />
        <StatCard icon={Trophy} label="Total XP" value={data.totals.totalXp} color="bg-amber-100 text-amber-700" />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> XP Leaderboard</h3>
        {data.leaderboard.length === 0 ? (
          <p className="text-sm text-slate-400">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {data.leaderboard.map((l, i) => (
              <div key={l.userId} className="flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-slate-400">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {getInitials(l.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 truncate">{l.name}</span>
                    <span className="text-slate-500">{l.xp} XP</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(l.xp / maxXp) * 100}%` }} />
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-400">
                    <span>{l.hoursTaught}h taught</span>
                    <span>{l.hoursLearned}h learned</span>
                    <span>{l.tasksCompleted} tasks</span>
                    <span>{l.skillsCompleted} skills</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Chat
interface GroupMessage {
  id: string; content: string; attachmentUrl: string | null; attachmentType: string | null; createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
}
function ChatTab({ groupId, meId }: { groupId: string; meId?: string }) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/messages`);
    if (res.ok) setMessages(await res.json());
  }, [groupId]);

  // Light polling while the Chat tab is open.
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch(`/api/groups/${groupId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) { setContent(""); load(); }
  }

  async function sendAttachment(file: File) {
    if (uploading) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body });
    setUploading(false);
    if (!up.ok) return;
    const { url, type } = await up.json();
    const res = await fetch(`/api/groups/${groupId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "", attachmentUrl: url, attachmentType: type }),
    });
    if (res.ok) load();
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No messages yet. Say hi to the group!</div>}
        {messages.map((m) => {
          const isOwn = m.sender.id === meId;
          return (
            <div key={m.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {getInitials(m.sender.name)}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && <span className="text-xs text-slate-500 mb-0.5 ml-1">{m.sender.name.split(" ")[0]}</span>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn ? "bg-indigo-600 text-white rounded-br-sm" : "bg-slate-50 border border-slate-100 text-slate-900 rounded-bl-sm"}`}>
                  {m.attachmentUrl && m.attachmentType === "image" && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.attachmentUrl} alt="" className="rounded-lg max-w-full max-h-72 mb-1" />
                  )}
                  {m.attachmentUrl && m.attachmentType === "video" && (
                    <video src={m.attachmentUrl} controls className="rounded-lg max-w-full max-h-72 mb-1" />
                  )}
                  {m.attachmentUrl && m.attachmentType === "audio" && (
                    <audio src={m.attachmentUrl} controls className="w-full mb-1" />
                  )}
                  {m.attachmentUrl && m.attachmentType === "pdf" && (
                    <div className="mb-1">
                      <embed src={m.attachmentUrl} type="application/pdf" className="w-full rounded-lg" style={{ height: "280px" }} />
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline opacity-70 mt-0.5 block">Open PDF</a>
                    </div>
                  )}
                  {m.content}
                </div>
                <span className="text-xs text-slate-400 mt-1">{formatDateTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-slate-100 p-4 flex items-center gap-3">
        <label className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 cursor-pointer transition-colors flex-shrink-0">
          <Paperclip size={16} />
          <input type="file" accept="image/*,video/*,audio/*,.pdf" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) sendAttachment(f); e.target.value = ""; }} />
        </label>
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message the group..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" disabled={!content.trim()} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Roadmaps
interface RoadmapItem { id: string; title: string; skillName: string; source: "AI" | "MANUAL"; createdBy: { name: string }; weeks: { id: string; _count: { tasks: number } }[]; }
function RoadmapsTab({ groupId }: { groupId: string }) {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [skill, setSkill] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/roadmaps`);
    setRoadmaps(await res.json());
    setLoading(false);
  }, [groupId]);
  useEffect(() => { load(); }, [load]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch(`/api/groups/${groupId}/roadmaps/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillName: skill, weeks: Number(weeks) }),
    });
    setBusy(false);
    if (res.ok) { setShowGen(false); setSkill(""); load(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error === "GROQ_API_KEY not configured" ? "AI is not configured. Set GROQ_API_KEY to generate roadmaps." : "Failed to generate roadmap."); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Learning Roadmaps</h3>
        <button onClick={() => setShowGen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Sparkles size={15} /> Generate with AI
        </button>
      </div>

      {loading ? (
        <div className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      ) : roadmaps.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
          <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No roadmaps yet. Generate one with AI to get started!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {roadmaps.map((r) => {
            const tasks = r.weeks.reduce((a, w) => a + w._count.tasks, 0);
            return (
              <Link key={r.id} href={`/groups/${groupId}/roadmaps/${r.id}`} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{r.skillName}</span>
                  {r.source === "AI" && <span className="flex items-center gap-1 text-xs text-purple-600"><Sparkles size={11} /> AI</span>}
                </div>
                <div className="font-semibold text-slate-900">{r.title}</div>
                <div className="text-xs text-slate-400 mt-2">{r.weeks.length} weeks · {tasks} tasks · by {r.createdBy.name}</div>
              </Link>
            );
          })}
        </div>
      )}

      {showGen && (
        <Modal title="Generate AI Roadmap" onClose={() => setShowGen(false)}>
          <form onSubmit={generate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What do you want to learn?</label>
              <input required value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. Web Development"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of weeks</label>
              <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {[2, 4, 6, 8, 12].map((w) => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? "Generating…" : <><Sparkles size={15} /> Generate</>}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Knowledge
interface Resource { id: string; title: string; type: "NOTE" | "PDF" | "VIDEO" | "ASSIGNMENT"; content: string | null; url: string | null; description: string | null; createdAt: string; uploadedBy: { id: string; name: string }; }
const RES_ICON = { NOTE: StickyNote, PDF: FileText, VIDEO: Video, ASSIGNMENT: ClipboardList };
function KnowledgeTab({ groupId }: { groupId: string }) {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", type: "NOTE" as Resource["type"], content: "", url: "", description: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/resources`);
    setItems(await res.json()); setLoading(false);
  }, [groupId]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const body: Record<string, string> = { title: form.title, type: form.type };
    if (form.type === "NOTE") body.content = form.content; else body.url = form.url;
    if (form.description) body.description = form.description;
    const res = await fetch(`/api/groups/${groupId}/resources`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setShow(false); setForm({ title: "", type: "NOTE", content: "", url: "", description: "" }); load(); }
    else setError("Notes need content; other types need a valid URL.");
  }

  async function remove(id: string) {
    await fetch(`/api/resources/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Knowledge Repository</h3>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"><Plus size={15} /> Add Resource</button>
      </div>
      {loading ? <div className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" /> : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100"><FolderOpen size={40} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-500">No notes, PDFs, videos or assignments yet.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const Icon = RES_ICON[r.type];
            return (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0"><Icon size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{r.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${resourceTypeColor(r.type)}`}>{r.type}</span>
                  </div>
                  {r.description && <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>}
                  {r.type === "NOTE" && r.content && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{r.content}</p>}
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-1"><ExternalLink size={12} /> Open</a>}
                  <div className="text-xs text-slate-400 mt-1">by {r.uploadedBy.name} · {timeAgo(r.createdAt)}</div>
                </div>
                <button onClick={() => remove(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      )}

      {show && (
        <Modal title="Add Resource" onClose={() => setShow(false)}>
          <form onSubmit={add} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Resource["type"] }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {["NOTE", "PDF", "VIDEO", "ASSIGNMENT"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {form.type === "NOTE" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note content</label>
                <textarea required value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL ({form.type === "VIDEO" ? "YouTube, etc." : "Drive, etc."})</label>
                <input required type="url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://…" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Quizzes
interface QuizItem { id: string; title: string; topic: string; createdBy: { name: string }; _count: { questions: number; attempts: number }; attempts: { score: number | null }[]; }
function QuizzesTab({ groupId }: { groupId: string }) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/quizzes`);
    setQuizzes(await res.json()); setLoading(false);
  }, [groupId]);
  useEffect(() => { load(); }, [load]);

  async function generate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const res = await fetch(`/api/groups/${groupId}/quizzes/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
    setBusy(false);
    if (res.ok) { setShow(false); setTopic(""); load(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error === "GROQ_API_KEY not configured" ? "AI is not configured. Set GROQ_API_KEY to generate quizzes." : "Failed to generate quiz."); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Quizzes</h3>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"><Sparkles size={15} /> Generate Quiz</button>
      </div>
      {loading ? <div className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" /> : quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100"><FileQuestion size={40} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-500">No quizzes yet. Generate one after a lesson!</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map((q) => (
            <Link key={q.id} href={`/groups/${groupId}/quizzes/${q.id}`} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="font-semibold text-slate-900">{q.title}</div>
              <div className="text-xs text-slate-400 mt-1">{q._count.questions} questions · by {q.createdBy.name}</div>
              {q.attempts.length > 0 && q.attempts[0].score !== null && (
                <div className="mt-2 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 inline-block">Your score: {q.attempts[0].score}%</div>
              )}
            </Link>
          ))}
        </div>
      )}
      {show && (
        <Modal title="Generate AI Quiz" onClose={() => setShow(false)}>
          <form onSubmit={generate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lesson topic</label>
              <input required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. CSS Flexbox" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? "Generating…" : <><Sparkles size={15} /> Generate (MCQ + Coding + Short answer)</>}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Skill Map
function SkillMapTab({ groupId }: { groupId: string }) {
  const [data, setData] = useState<{ nodes: never[]; edges: never[]; gaps: string[] } | null>(null);
  useEffect(() => { fetch(`/api/groups/${groupId}/skill-map`).then((r) => r.json()).then(setData); }, [groupId]);
  if (!data) return <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />;
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2"><Network size={16} className="text-indigo-600" /> Who teaches what to whom</h3>
        <p className="text-sm text-slate-400 mb-3">Arrows point from a teacher to a member who wants to learn that skill.</p>
        <SkillMapGraph nodes={data.nodes} edges={data.edges} />
      </div>
      {data.gaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="text-sm font-medium text-amber-800">Skill gaps</div>
          <p className="text-sm text-amber-700 mt-1">Members want to learn these, but nobody in the group teaches them yet: {data.gaps.join(", ")}.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Report
interface Report { id: string; content: string; periodStart: string; periodEnd: string; createdAt: string; generatedBy: { name: string }; }
function ReportTab({ groupId }: { groupId: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/report`);
    setReports(await res.json());
  }, [groupId]);
  useEffect(() => { load(); }, [load]);

  async function generate() {
    setBusy(true); setError("");
    const res = await fetch(`/api/groups/${groupId}/report`, { method: "POST" });
    setBusy(false);
    if (res.ok) load();
    else { const d = await res.json().catch(() => ({})); setError(d.error === "GROQ_API_KEY not configured" ? "AI is not configured. Set GROQ_API_KEY to generate reports." : "Failed to generate report."); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Weekly AI Reports</h3>
        <button onClick={generate} disabled={busy} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
          <Sparkles size={15} /> {busy ? "Generating…" : "Generate this week's report"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100"><FileText size={40} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-500">No reports yet. Generate your first weekly summary!</p></div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="text-xs text-slate-400 mb-2">Week of {new Date(r.periodStart).toLocaleDateString()} · by {r.generatedBy.name} · {timeAgo(r.createdAt)}</div>
              <Markdown text={r.content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Members
function MembersTab({ group, isOwner, meId, reload }: { group: GroupDetail; isOwner: boolean; meId?: string; reload: () => void }) {
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch(`/api/groups/${group.id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    if (res.ok) { setShow(false); setEmail(""); reload(); }
    else { const d = await res.json().catch(() => ({})); setError(typeof d.error === "string" ? d.error : "Could not send invite."); }
  }
  async function remove(userId: string) {
    await fetch(`/api/groups/${group.id}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    reload();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Members</h3>
        {isOwner && <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"><UserPlus size={15} /> Invite</button>}
      </div>
      <div className="space-y-3">
        {group.memberships.map((m) => (
          <div key={m.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">{getInitials(m.user.name)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 flex items-center gap-2">
                {m.user.name}
                {m.role === "OWNER" && <Crown size={13} className="text-amber-500" />}
                {m.status === "INVITED" && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">Invited</span>}
              </div>
              <div className="text-xs text-slate-400">{m.user.email}</div>
            </div>
            {(isOwner || m.user.id === meId) && m.role !== "OWNER" && (
              <button onClick={() => remove(m.user.id)} className="text-slate-300 hover:text-red-500" title={m.user.id === meId ? "Leave group" : "Remove member"}><Trash2 size={15} /></button>
            )}
          </div>
        ))}
      </div>
      {show && (
        <Modal title="Invite a Member" onClose={() => setShow(false)}>
          <form onSubmit={invite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Their email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Send Invite</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Shared
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Minimal markdown renderer for report content (headings, bold, bullets).
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm text-slate-700">
      {lines.map((line, i) => {
        const bold = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>
        );
        if (line.startsWith("## ")) return <h4 key={i} className="font-semibold text-slate-900 mt-3">{line.slice(3)}</h4>;
        if (line.startsWith("# ")) return <h3 key={i} className="font-bold text-slate-900 mt-3">{line.slice(2)}</h3>;
        if (/^\s*[-*]\s+/.test(line)) return <div key={i} className="flex gap-2 pl-1"><span className="text-indigo-400">•</span><span>{bold(line.replace(/^\s*[-*]\s+/, ""))}</span></div>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{bold(line)}</p>;
      })}
    </div>
  );
}
