"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, RefreshCw, ArrowLeft, ArrowRight, GitBranch } from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesSession } from "@/types/jules";
import { JulesStatusBadge, JulesErrorState } from "@/features/automation/jules/components";

export function JulesSessionsListPage() {
  const [sessions, setSessions] = useState<JulesSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await julesApi.listSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/automation/jules"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950">
              Google Jules Sessions
            </h1>
            <p className="text-xs text-slate-500">
              All cloud coding and bug fixing sessions dispatched to Jules
            </p>
          </div>
        </div>

        <button
          onClick={loadSessions}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <JulesErrorState message={error} onRetry={loadSessions} />}

      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">External ID / Title</th>
                <th className="py-3 px-4 font-bold">Repository</th>
                <th className="py-3 px-4 font-bold">Branch</th>
                <th className="py-3 px-4 font-bold">Plan Approval</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-bold text-slate-900 truncate">{session.title}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {session.external_session_id || "Provisioning..."}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {session.repository}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3 text-slate-400" />
                      {session.branch}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        session.require_plan_approval
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {session.require_plan_approval ? "Required" : "Autonomous"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <JulesStatusBadge status={session.state} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/automation/jules/sessions/${session.id}`}
                      className="font-bold text-teal-700 hover:text-teal-900 underline underline-offset-2"
                    >
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No Jules sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default JulesSessionsListPage;
