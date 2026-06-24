"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeftRight,
  MessageSquare,
  Calendar,
  Star,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/utils";

interface Stats {
  pendingRequests: number;
  unreadMessages: number;
  upcomingSessions: number;
  avgRating: number;
  totalConnections: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Session {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  mentor: { id: string; name: string; avatar: string | null };
  mentee: { id: string; name: string; avatar: string | null };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    pendingRequests: 0,
    unreadMessages: 0,
    upcomingSessions: 0,
    avgRating: 0,
    totalConnections: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function load() {
      const [reqRes, notifRes, sessRes, reviewRes] = await Promise.all([
        fetch("/api/swap-requests?filter=received"),
        fetch("/api/notifications"),
        fetch("/api/sessions"),
        fetch("/api/reviews?type=received"),
      ]);

      const [requests, notifications, sessions, reviewData] = await Promise.all([
        reqRes.json(),
        notifRes.json(),
        sessRes.json(),
        reviewRes.json(),
      ]);

      const pending = Array.isArray(requests)
        ? requests.filter((r: { status: string }) => r.status === "PENDING").length
        : 0;
      const unread = Array.isArray(notifications)
        ? notifications.filter((n: Activity) => !n.read).length
        : 0;
      const upcoming = Array.isArray(sessions)
        ? sessions.filter((s: Session) => s.status === "UPCOMING")
        : [];

      const reviews = Array.isArray(reviewData) ? reviewData : [];
      const avgRating = reviews.length
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats((prev) => ({
        ...prev,
        pendingRequests: pending,
        unreadMessages: unread,
        upcomingSessions: upcoming.length,
        avgRating,
      }));

      setUpcomingSessions(upcoming.slice(0, 3));

      if (Array.isArray(notifications)) {
        setActivities(notifications.slice(0, 5));
      }
    }

    load();
  }, []);

  const statCards = [
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      icon: ArrowLeftRight,
      href: "/requests",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Unread Notifications",
      value: stats.unreadMessages,
      icon: MessageSquare,
      href: "/notifications",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Upcoming Sessions",
      value: stats.upcomingSessions,
      icon: Calendar,
      href: "/sessions",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Discover People",
      value: "Browse",
      icon: Users,
      href: "/discover",
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Your Rating",
      value: stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : "—",
      icon: Star,
      href: "/reviews",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s what&apos;s happening with your skill swap journey.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-slate-500 transition-colors"
              />
            </div>
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Upcoming Sessions</h2>
            <Link href="/sessions" className="text-indigo-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No upcoming sessions</p>
              <Link
                href="/discover"
                className="text-indigo-600 text-sm hover:underline mt-1 inline-block"
              >
                Find someone to learn from
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((s) => {
                const other =
                  s.mentor.id === session?.user?.id ? s.mentee : s.mentor;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                      {other.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {other.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Clock size={11} />
                        {formatDateTime(s.scheduledAt)} · {s.duration}min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <Link href="/notifications" className="text-indigo-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp size={32} className="text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      a.read ? "bg-slate-200" : "bg-indigo-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{a.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.message}</div>
                    <div className="text-xs text-slate-300 mt-0.5">{timeAgo(a.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-indigo-50 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Star size={18} className="text-indigo-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/discover", label: "Find Mentors" },
            { href: "/requests", label: "View Requests" },
            { href: "/sessions", label: "Schedule Session" },
            { href: "/reviews", label: "My Reviews" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white text-center px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
