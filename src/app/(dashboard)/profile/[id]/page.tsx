"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Star,
  Calendar,
  ArrowLeftRight,
  MessageSquare,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { formatDate, getInitials, skillLevelColor, timeAgo } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  skills: {
    id: string;
    type: "TEACH" | "LEARN";
    level: string;
    skill: { id: string; name: string; category: string };
  }[];
  receivedReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { id: string; name: string; avatar: string | null };
  }[];
}

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/users/${params.id}`);
      const data = await res.json();
      setUser(data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function sendRequest() {
    if (!requestMessage.trim()) return;
    setSending(true);
    const res = await fetch("/api/swap-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: params.id, message: requestMessage }),
    });
    setSending(false);
    setShowRequestModal(false);
    setRequestMessage("");
    if (res.ok) {
      setSuccess("Swap request sent!");
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  async function startChat() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: params.id }),
    });
    const data = await res.json();
    if (data.id) window.location.href = `/messages/${data.id}`;
  }

  function copyId() {
    navigator.clipboard.writeText(user?.id ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-pulse">
        <div className="bg-white rounded-2xl p-8 border border-slate-100">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-7 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-8 text-center text-slate-400">User not found</div>;

  const isOwn = user.id === session?.user?.id;
  const avgRating =
    user.receivedReviews.length > 0
      ? (
          user.receivedReviews.reduce((sum, r) => sum + r.rating, 0) /
          user.receivedReviews.length
        ).toFixed(1)
      : null;

  const teachSkills = user.skills.filter((s) => s.type === "TEACH");
  const learnSkills = user.skills.filter((s) => s.type === "LEARN");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/discover" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Discover
      </Link>

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                {getInitials(user.name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              {user.location && (
                <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                  <MapPin size={13} /> {user.location}
                </div>
              )}
              {avgRating && (
                <div className="flex items-center gap-1 text-amber-500 text-sm mt-1">
                  <Star size={13} fill="currentColor" />
                  {avgRating} ({user.receivedReviews.length} reviews)
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                <Calendar size={11} /> Joined {formatDate(user.createdAt)}
              </div>
              {/* User ID for session scheduling */}
              <button
                onClick={copyId}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-1 font-mono"
              >
                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                {copied ? "Copied!" : `ID: ${user.id.slice(0, 12)}...`}
              </button>
            </div>
          </div>

          {!isOwn && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <ArrowLeftRight size={15} /> Swap Skills
              </button>
              <button
                onClick={startChat}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <MessageSquare size={15} /> Message
              </button>
            </div>
          )}
          {isOwn && (
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {user.bio && (
          <p className="text-slate-600 mt-4 leading-relaxed">{user.bio}</p>
        )}

        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 text-sm hover:underline mt-2"
          >
            <Globe size={13} /> {user.website}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Teaching */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Can Teach ({teachSkills.length})
          </h2>
          {teachSkills.length === 0 ? (
            <p className="text-sm text-slate-400">No teaching skills listed</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teachSkills.map((s) => (
                <div key={s.id} className="flex flex-col items-start">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${skillLevelColor(s.level)}`}
                  >
                    {s.skill.name}
                  </span>
                  <span className="text-xs text-slate-400 ml-1 mt-0.5">{s.level.charAt(0) + s.level.slice(1).toLowerCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Wants to Learn ({learnSkills.length})
          </h2>
          {learnSkills.length === 0 ? (
            <p className="text-sm text-slate-400">No learning goals listed</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {learnSkills.map((s) => (
                <span
                  key={s.id}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium"
                >
                  {s.skill.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {user.receivedReviews.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Reviews</h2>
          <div className="space-y-4">
            {user.receivedReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                {r.reviewer.avatar ? (
                  <img src={r.reviewer.avatar} alt={r.reviewer.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                    {getInitials(r.reviewer.name)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-900">{r.reviewer.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < r.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">Send Skill Swap Request</h3>
            <p className="text-slate-500 text-sm mb-4">
              Tell {user.name} what you want to swap and why you&apos;d be a great match.
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
              placeholder={`Hi ${user.name}! I can teach you...`}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRequestModal(false); setRequestMessage(""); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={sendRequest}
                disabled={!requestMessage.trim() || sending}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
