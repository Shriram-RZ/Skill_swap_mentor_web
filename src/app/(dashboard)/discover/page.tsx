"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, MapPin, Star, ArrowLeftRight, MessageSquare, SlidersHorizontal } from "lucide-react";
import { getInitials, skillLevelColor } from "@/lib/utils";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface UserSkill {
  id: string;
  type: "TEACH" | "LEARN";
  level: string;
  skill: Skill;
}

interface User {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  skills: UserSkill[];
  receivedReviews: { rating: number }[];
}

export default function DiscoverPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  function avgRating(reviews: { rating: number }[]) {
    if (!reviews.length) return null;
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }

  async function sendRequest(receiverId: string) {
    if (!message.trim()) return;
    setSendingTo(receiverId);
    const res = await fetch("/api/swap-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, message }),
    });

    setSendingTo(null);
    setShowModal(null);
    setMessage("");

    if (res.ok) {
      setSuccess("Request sent successfully!");
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function startConversation(participantId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId }),
    });
    const data = await res.json();
    if (data.id) window.location.href = `/messages/${data.id}`;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Discover</h1>
        <p className="text-slate-500 mt-1">Find people to swap skills with</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl mb-4">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <Search size={18} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, bio, location, or skill..."
          className="flex-1 text-slate-900 placeholder-slate-400 outline-none bg-transparent"
        />
        <SlidersHorizontal size={18} className="text-slate-400" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-full mb-1" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Search size={48} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No users found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const rating = avgRating(user.receivedReviews);
            const teachSkills = user.skills.filter((s) => s.type === "TEACH");
            const learnSkills = user.skills.filter((s) => s.type === "LEARN");

            return (
              <div
                key={user.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${user.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-600 truncate block"
                    >
                      {user.name}
                    </Link>
                    {user.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <MapPin size={11} />
                        {user.location}
                      </div>
                    )}
                    {rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                        <Star size={11} fill="currentColor" />
                        {rating} ({user.receivedReviews.length})
                      </div>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{user.bio}</p>
                )}

                {teachSkills.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-slate-400 mb-1">Can teach</div>
                    <div className="flex flex-wrap gap-1">
                      {teachSkills.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${skillLevelColor(s.level)}`}
                        >
                          {s.skill.name}
                        </span>
                      ))}
                      {teachSkills.length > 3 && (
                        <span className="text-xs text-slate-400">+{teachSkills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                {learnSkills.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-400 mb-1">Wants to learn</div>
                    <div className="flex flex-wrap gap-1">
                      {learnSkills.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                      {learnSkills.length > 3 && (
                        <span className="text-xs text-slate-400">+{learnSkills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-slate-50 flex gap-2">
                  <button
                    onClick={() => setShowModal(user.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ArrowLeftRight size={13} />
                    Swap Skills
                  </button>
                  <button
                    onClick={() => startConversation(user.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare size={13} />
                    Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">Send Skill Swap Request</h3>
            <p className="text-slate-500 text-sm mb-4">
              Introduce yourself and explain what skills you want to swap.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Hi! I can teach you React and would love to learn Python from you..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowModal(null); setMessage(""); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendRequest(showModal)}
                disabled={!message.trim() || sendingTo === showModal}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {sendingTo === showModal ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
