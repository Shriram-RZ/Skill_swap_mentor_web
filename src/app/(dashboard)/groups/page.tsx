"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, X, BookOpen, FolderOpen, FileQuestion, Check, Crown } from "lucide-react";

interface GroupMember {
  user: { id: string; name: string; avatar: string | null };
}
interface Group {
  id: string;
  name: string;
  description: string | null;
  myRole?: "OWNER" | "MEMBER";
  owner: { id: string; name: string };
  memberships: GroupMember[];
  _count: { roadmaps: number; resources: number; quizzes: number };
}
interface Invite {
  membershipId: string;
  group: Group & { owner: { name: string } };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroups(Array.isArray(data.groups) ? data.groups : []);
    setInvites(Array.isArray(data.invites) ? data.invites : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", description: "" });
      load();
    } else {
      setError("Could not create group. Name must be at least 2 characters.");
    }
  }

  async function respondInvite(groupId: string, accept: boolean) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    load();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Groups</h1>
          <p className="text-slate-500 mt-1">Learn together — share roadmaps, knowledge & track progress</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Create Group
        </button>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-slate-700 mb-3">Pending Invitations</h2>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.membershipId}
                className="bg-white border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-900">{inv.group.name}</div>
                  <div className="text-sm text-slate-500">
                    Invited by {inv.group.owner.name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondInvite(inv.group.id, true)}
                    className="flex items-center gap-1 text-sm px-3 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => respondInvite(inv.group.id, false)}
                    className="flex items-center gap-1 text-sm px-3 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-40" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Users size={48} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">You're not in any groups yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Users size={18} />
                </div>
                {g.myRole === "OWNER" && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Crown size={12} /> Owner
                  </span>
                )}
              </div>
              <div className="font-semibold text-slate-900">{g.name}</div>
              {g.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{g.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span>{g.memberships.length} member{g.memberships.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500">
                <span className="flex items-center gap-1"><BookOpen size={13} /> {g._count.roadmaps}</span>
                <span className="flex items-center gap-1"><FolderOpen size={13} /> {g._count.resources}</span>
                <span className="flex items-center gap-1"><FileQuestion size={13} /> {g._count.quizzes}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900">Create a Group</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Web Dev Squad"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="What is this group learning together?"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
