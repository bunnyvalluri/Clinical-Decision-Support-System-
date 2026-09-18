"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Cpu,
  GitBranch,
  FolderGit2,
  RefreshCw,
  Send,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesSession, JulesActivity } from "@/types/jules";
import {
  JulesStatusBadge,
  JulesSessionProgress,
  JulesActivityTimeline,
  JulesArtifactList,
  JulesErrorState,
} from "@/features/automation/jules/components";

export default function JulesSessionDetailPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<JulesSession | null>(null);
  const [activities, setActivities] = useState<JulesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message input state
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const loadSessionData = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const sess = await julesApi.getSession(sessionId);
      setSession(sess);
      const acts = await julesApi.getSessionActivities(sessionId);
      setActivities(acts);
    } catch (err: any) {
      setError(err.message || "Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session) return;

    setSendingMessage(true);
    setMessageError(null);
    try {
      await julesApi.sendMessage(session.id, message.trim());
      setMessage("");
      // Refresh activities
      const acts = await julesApi.getSessionActivities(sessionId);
      setActivities(acts);
    } catch (err: any) {
      setMessageError(err.message || "Failed to send message to Jules");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-100 rounded" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <JulesErrorState message={error || "Session not found"} onRetry={loadSessionData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/automation/jules/sessions"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-950 truncate max-w-xl">
                {session.title}
              </h1>
              <JulesStatusBadge status={session.state} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {session.external_session_id || "Provisioning external session..."}
            </p>
          </div>
        </div>

        <button
          onClick={loadSessionData}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Progress Stepper Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
          SESSION PROGRESSION
        </h3>
        <JulesSessionProgress state={session.state} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">REPOSITORY</span>
            <span className="font-bold text-slate-800">{session.repository}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">BRANCH</span>
            <span className="font-bold text-slate-800">{session.branch}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">PLAN APPROVAL</span>
            <span className="font-bold text-slate-800">
              {session.require_plan_approval ? "Required" : "Automated"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">STARTED AT</span>
            <span className="font-bold text-slate-800">
              {session.started_at ? new Date(session.started_at).toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Message / Instruction Dispatch Form */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-teal-600" />
          <span>Send Instruction to Active Jules Session</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Provide additional constraints or guidance. Input is scanned for secrets and prompt injection before delivery.
        </p>

        <form onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Focus specifically on the timestamp parser in src/utils/dates.ts and keep existing unit tests passing."
            rows={2}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          {messageError && (
            <p className="text-xs text-rose-600">{messageError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendingMessage || !message.trim()}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="h-3 w-3" />
              <span>{sendingMessage ? "Sending..." : "Send Instruction"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Artifacts if any */}
      <JulesArtifactList artifacts={session.artifacts || []} />

      {/* Activity Timeline */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-teal-600" />
          <span>Session Activity Log ({activities.length})</span>
        </h3>
        <JulesActivityTimeline activities={activities} />
      </div>
    </div>
  );
}
