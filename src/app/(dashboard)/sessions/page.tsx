"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Link2, CheckCircle, XCircle, Plus, X } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

interface Session {
  id: string;
  scheduledAt: string;
  duration: number;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  meetingLink: string | null;
  mentor: { id: string; name: string; avatar: string | null };
  mentee: { id: string; name: string; avatar: string | null };
  review: { rating: number; comment: string | null } | null;
}

interface SwapRequest {
  id: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
  status: string;
}

export default function SessionsPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [acceptedRequests, setAcceptedRequests] = useState<SwapRequest[]>([]);
  const [form, setForm] = useState({
    menteeId: "",
    scheduledAt: "",
    duration: 60,
    meetingLink: "",
    notes: "",
    swapRequestId: "",
  });

  async function load() {
    const [sessRes, reqRes] = await Promise.all([
      fetch("/api/sessions"),
      fetch("/api/swap-requests?filter=all"),
    ]);
    const [sessData, reqData] = await Promise.all([sessRes.json(), reqRes.json()]);
    setSessions(Array.isArray(sessData) ? sessData : []);
    const accepted = Array.isArray(reqData)
      ? reqData.filter((r: SwapRequest) => r.status === "ACCEPTED")
      : [];
    setAcceptedRequests(accepted);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        duration: Number(form.duration),
        swapRequestId: form.swapRequestId || undefined,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ menteeId: "", scheduledAt: "", duration: 60, meetingLink: "", notes: "", swapRequestId: "" });
      load();
    }
  }

  const upcoming = sessions.filter((s) => s.status === "UPCOMING");
  const past = sessions.filter((s) => s.status !== "UPCOMING");

  function SessionCard({ s }: { s: Session }) {
    const ismentor = s.mentor.id === session?.user?.id;
    const other = ismentor ? s.mentee : s.mentor;
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
              {getInitials(other.name)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{other.name}</div>
              <div className="text-sm text-slate-500">
                {ismentor ? "You are mentoring" : "Your mentor"}
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar size={14} />
                  {formatDateTime(s.scheduledAt)}
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock size={14} />
                  {s.duration} minutes
                </div>
                {s.meetingLink && (
                  <a
                    href={s.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                  >
                    <Link2 size={14} />
                    Join meeting
                  </a>
                )}
              </div>
              {s.notes && (
                <p className="text-sm text-slate-400 mt-1">{s.notes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                s.status === "UPCOMING"
                  ? "bg-blue-50 text-blue-700"
                  : s.status === "COMPLETED"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
            </span>
            {s.status === "UPCOMING" && (
              <div className="flex gap-1">
                <button
                  onClick={() => updateStatus(s.id, "COMPLETED")}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <CheckCircle size={12} /> Done
                </button>
                <button
                  onClick={() => updateStatus(s.id, "CANCELLED")}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <XCircle size={12} /> Cancel
                </button>
              </div>
            )}
            {s.status === "COMPLETED" && !s.review && (
              <span className="text-xs text-slate-400">Leave a review</span>
            )}
            {s.review && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < s.review!.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sessions</h1>
          <p className="text-slate-500 mt-1">Manage your mentorship sessions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Schedule Session
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-slate-700 mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((s) => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-700 mb-3">Past Sessions</h2>
              <div className="space-y-3">
                {past.map((s) => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
          {sessions.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Calendar size={48} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No sessions scheduled yet</p>
            </div>
          )}
        </>
      )}

      {/* Schedule Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900">Schedule a Session</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createSession} className="space-y-4">
              {acceptedRequests.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    From Swap Request
                  </label>
                  <select
                    value={form.swapRequestId}
                    onChange={(e) => {
                      const req = acceptedRequests.find((r) => r.id === e.target.value);
                      const other = req
                        ? req.sender.id === session?.user?.id
                          ? req.receiver.id
                          : req.sender.id
                        : "";
                      setForm((p) => ({ ...p, swapRequestId: e.target.value, menteeId: other }));
                    }}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a swap request (optional)</option>
                    {acceptedRequests.map((r) => {
                      const other = r.sender.id === session?.user?.id ? r.receiver : r.sender;
                      return (
                        <option key={r.id} value={r.id}>
                          with {other.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mentee User ID
                </label>
                <input
                  type="text"
                  required
                  value={form.menteeId}
                  onChange={(e) => setForm((p) => ({ ...p, menteeId: e.target.value }))}
                  placeholder="Paste user ID from their profile"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                  onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} minutes</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Meeting Link (optional)
                </label>
                <input
                  type="url"
                  value={form.meetingLink}
                  onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Topics to cover..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
