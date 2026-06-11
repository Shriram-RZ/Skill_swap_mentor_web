"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, ArrowLeftRight, MessageSquare, Calendar, Star } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId: string | null;
}

const typeIcons: Record<string, React.ElementType> = {
  SWAP_REQUEST: ArrowLeftRight,
  REQUEST_ACCEPTED: ArrowLeftRight,
  REQUEST_REJECTED: ArrowLeftRight,
  NEW_MESSAGE: MessageSquare,
  SESSION_SCHEDULED: Calendar,
  SESSION_REMINDER: Calendar,
  REVIEW_RECEIVED: Star,
};

const typeColors: Record<string, string> = {
  SWAP_REQUEST: "bg-indigo-50 text-indigo-600",
  REQUEST_ACCEPTED: "bg-green-50 text-green-600",
  REQUEST_REJECTED: "bg-red-50 text-red-600",
  NEW_MESSAGE: "bg-blue-50 text-blue-600",
  SESSION_SCHEDULED: "bg-emerald-50 text-emerald-600",
  SESSION_REMINDER: "bg-amber-50 text-amber-600",
  REVIEW_RECEIVED: "bg-purple-50 text-purple-600",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  useEffect(() => { load(); }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          {unread > 0 && (
            <p className="text-slate-500 mt-1">{unread} unread notification{unread !== 1 ? "s" : ""}</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-1" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Bell size={48} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">You&apos;re all caught up! No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            const colorClass = typeColors[n.type] ?? "bg-slate-50 text-slate-500";
            return (
              <div
                key={n.id}
                className={`bg-white border rounded-2xl p-4 flex items-start gap-3 transition-colors ${
                  n.read ? "border-slate-100" : "border-indigo-100 bg-indigo-50/30"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium text-sm ${
                        n.read ? "text-slate-700" : "text-slate-900"
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
