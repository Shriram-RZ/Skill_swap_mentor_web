"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Star, X, Plus } from "lucide-react";
import { timeAgo, getInitials, formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string; avatar: string | null };
  reviewee: { id: string; name: string; avatar: string | null };
  session: { scheduledAt: string; duration: number };
}

interface CompletedSession {
  id: string;
  scheduledAt: string;
  mentor: { id: string; name: string };
  mentee: { id: string; name: string };
  review: null | { id: string };
}

type TabType = "received" | "given";

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={`text-2xl transition-colors ${
            i < rating ? "text-amber-400" : "text-slate-200"
          } ${onChange ? "hover:text-amber-300 cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<TabType>("received");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [form, setForm] = useState({ sessionId: "", revieweeId: "", rating: 5, comment: "" });

  async function load(t: TabType) {
    setLoading(true);
    const res = await fetch(`/api/reviews?type=${t}`);
    const data = await res.json();
    setReviews(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadSessions() {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    const completed = Array.isArray(data)
      ? data.filter((s: CompletedSession & { status: string }) =>
          s.status === "COMPLETED" && !s.review
        )
      : [];
    setCompletedSessions(completed);
  }

  useEffect(() => { load(tab); }, [tab]);
  useEffect(() => { loadSessions(); }, []);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ sessionId: "", revieweeId: "", rating: 5, comment: "" });
      load(tab);
      loadSessions();
    }
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
          <p className="text-slate-500 mt-1">Your reputation on SkillSwap</p>
        </div>
        {completedSessions.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Leave Review
          </button>
        )}
      </div>

      {/* Stats */}
      {tab === "received" && avgRating && (
        <div className="bg-indigo-50 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="text-5xl font-extrabold text-indigo-700">{avgRating}</div>
          <div>
            <StarRating rating={Math.round(parseFloat(avgRating))} />
            <div className="text-slate-500 text-sm mt-1">
              Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit mb-6">
        {(["received", "given"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-28" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Star size={48} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No {tab} reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const person = tab === "received" ? r.reviewer : r.reviewee;
            return (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  {person.avatar ? (
                    <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {getInitials(person.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-slate-900">{person.name}</span>
                      <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <StarRating rating={r.rating} />
                    {r.comment && (
                      <p className="text-sm text-slate-600 mt-2">{r.comment}</p>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      Session on {formatDate(r.session.scheduledAt)} · {r.session.duration}min
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900">Leave a Review</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
                <select
                  required
                  value={form.sessionId}
                  onChange={(e) => {
                    const s = completedSessions.find((cs) => cs.id === e.target.value);
                    const revieweeId = s
                      ? s.mentor.id === session?.user?.id
                        ? s.mentee.id
                        : s.mentor.id
                      : "";
                    setForm((p) => ({ ...p, sessionId: e.target.value, revieweeId }));
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a session</option>
                  {completedSessions.map((s) => {
                    const other = s.mentor.id === session?.user?.id ? s.mentee : s.mentor;
                    return (
                      <option key={s.id} value={s.id}>
                        {other.name} — {formatDate(s.scheduledAt)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <StarRating rating={form.rating} onChange={(r) => setForm((p) => ({ ...p, rating: r }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={3}
                  placeholder="Share your experience..."
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
                  disabled={!form.sessionId}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
