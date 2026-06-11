"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeftRight, Check, X, Trash2, Clock } from "lucide-react";
import { timeAgo, requestStatusColor, getInitials } from "@/lib/utils";

interface SwapRequest {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; skills: { type: string; skill: { name: string } }[] };
  receiver: { id: string; name: string; avatar: string | null; skills: { type: string; skill: { name: string } }[] };
}

type FilterType = "all" | "sent" | "received";

export default function RequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load(f: FilterType) {
    setLoading(true);
    const res = await fetch(`/api/swap-requests?filter=${f}`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    await fetch(`/api/swap-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    load(filter);
  }

  async function deleteRequest(id: string) {
    setActionLoading(id);
    await fetch(`/api/swap-requests/${id}`, { method: "DELETE" });
    setActionLoading(null);
    load(filter);
  }

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "received", label: "Received" },
    { key: "sent", label: "Sent" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Skill Swap Requests</h1>
        <p className="text-slate-500 mt-1">Manage your incoming and outgoing swap requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <ArrowLeftRight size={48} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No {filter !== "all" ? filter : ""} requests found</p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Find someone to swap with
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isSender = req.sender.id === session?.user?.id;
            const other = isSender ? req.receiver : req.sender;
            const isLoading = actionLoading === req.id;

            return (
              <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {other.avatar ? (
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                        {getInitials(other.name)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile/${other.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600"
                        >
                          {other.name}
                        </Link>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${requestStatusColor(req.status)}`}
                        >
                          {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                        </span>
                        {!isSender && req.status === "PENDING" && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            Incoming
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1 max-w-lg">{req.message}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock size={11} />
                        {timeAgo(req.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isLoading && (
                    <div className="flex gap-2 flex-shrink-0">
                      {!isSender && req.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateStatus(req.id, "ACCEPTED")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors"
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, "REJECTED")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
                          >
                            <X size={14} /> Decline
                          </button>
                        </>
                      )}
                      {req.status === "ACCEPTED" && (
                        <button
                          onClick={() => updateStatus(req.id, "COMPLETED")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                        >
                          <Check size={14} /> Mark Done
                        </button>
                      )}
                      {isSender && req.status === "PENDING" && (
                        <button
                          onClick={() => deleteRequest(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                  {isLoading && (
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
