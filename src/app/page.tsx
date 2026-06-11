import Link from "next/link";
import { ArrowRight, Users, BookOpen, Star, MessageSquare, Calendar, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Find Your Match",
    description: "Discover people with the exact skills you want to learn, who also want to learn what you offer.",
  },
  {
    icon: BookOpen,
    title: "Skill Swap Requests",
    description: "Send and receive swap requests to connect with compatible learners and mentors.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description: "Chat with your connections to plan sessions and share resources.",
  },
  {
    icon: Calendar,
    title: "Session Scheduling",
    description: "Book and manage mentorship sessions with integrated scheduling.",
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    description: "Build your reputation with reviews from people you've mentored or learned from.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your skill development and mentorship journey over time.",
  },
];

const stats = [
  { value: "500+", label: "Active Users" },
  { value: "120+", label: "Skills Available" },
  { value: "1,200+", label: "Sessions Completed" },
  { value: "4.8★", label: "Average Rating" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="font-bold text-xl text-slate-900">SkillSwap</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Skill Exchange Platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Swap Skills,
          <br />
          <span className="text-indigo-600">Grow Together</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Connect with passionate learners and mentors. Teach what you know, learn what you need — no money required.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-lg"
          >
            Start swapping skills <ArrowRight size={20} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-lg"
          >
            Sign in to your account
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-indigo-200 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to grow</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            A complete platform to find mentors, swap skills, and track your learning journey.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <f.icon size={24} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to start your skill journey?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join hundreds of learners and mentors already using SkillSwap.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors text-lg"
          >
            Create free account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">SS</span>
            </div>
            <span className="font-semibold text-slate-700">SkillSwap</span>
          </div>
          <p className="text-slate-400 text-sm">© 2025 SkillSwap. Connect. Learn. Grow.</p>
        </div>
      </footer>
    </div>
  );
}
