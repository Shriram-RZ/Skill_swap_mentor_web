"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  ArrowLeftRight,
  MessageSquare,
  Calendar,
  Star,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/discover", icon: Search, label: "Discover" },
  { href: "/requests", icon: ArrowLeftRight, label: "Requests" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/sessions", icon: Calendar, label: "Sessions" },
  { href: "/reviews", icon: Star, label: "Reviews" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-white border-r border-slate-100 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">SkillSwap</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100">
        <Link
          href="/profile/edit"
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group mb-1"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-700 font-semibold text-xs">
                {getInitials(session?.user?.name ?? "U")}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {session?.user?.name}
            </div>
            <div className="text-xs text-slate-400 truncate">{session?.user?.email}</div>
          </div>
          <User size={14} className="text-slate-400 group-hover:text-slate-600" />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
