"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: { id: string; name: string; avatar: string | null };
}

interface Conversation {
  id: string;
  participant1: { id: string; name: string; avatar: string | null };
  participant2: { id: string; name: string; avatar: string | null };
  messages: Message[];
}

export default function ConversationPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/conversations/${params.id}`);
    const data = await res.json();
    setConversation(data);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);

    const res = await fetch(`/api/conversations/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    setSending(false);

    if (res.ok) {
      setContent("");
      load();
    }
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const other =
    conversation.participant1.id === session?.user?.id
      ? conversation.participant2
      : conversation.participant1;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <Link href="/messages" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        {other.avatar ? (
          <img
            src={other.avatar}
            alt={other.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {getInitials(other.name)}
          </div>
        )}
        <div>
          <Link
            href={`/profile/${other.id}`}
            className="font-semibold text-slate-900 hover:text-indigo-600"
          >
            {other.name}
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Start the conversation with {other.name}!
          </div>
        )}
        {conversation.messages.map((msg) => {
          const isOwn = msg.sender.id === session?.user?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {getInitials(msg.sender.name)}
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? "items-end" : "items-start"} flex flex-col`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-100 text-slate-900 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {formatDateTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="bg-white border-t border-slate-100 px-6 py-4 flex items-center gap-3 flex-shrink-0"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message ${other.name}...`}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
