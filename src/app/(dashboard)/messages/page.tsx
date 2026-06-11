"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";
import { timeAgo, getInitials } from "@/lib/utils";

interface Conversation {
  id: string;
  participant1: { id: string; name: string; avatar: string | null };
  participant2: { id: string; name: string; avatar: string | null };
  messages: { content: string; createdAt: string; senderId: string }[];
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = conversations.filter((c) => {
    const other =
      c.participant1.id === session?.user?.id ? c.participant2 : c.participant1;
    return other.name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 mt-1">Your conversations</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-50 flex items-center gap-3">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={48} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No conversations yet</p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Find people to chat with
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((conv) => {
              const other =
                conv.participant1.id === session?.user?.id
                  ? conv.participant2
                  : conv.participant1;
              const lastMsg = conv.messages[0];

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  {other.avatar ? (
                    <img
                      src={other.avatar}
                      alt={other.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                      {getInitials(other.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{other.name}</span>
                      {lastMsg && (
                        <span className="text-xs text-slate-400">
                          {timeAgo(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-sm text-slate-400 truncate">
                        {lastMsg.senderId === session?.user?.id ? "You: " : ""}
                        {lastMsg.content}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
