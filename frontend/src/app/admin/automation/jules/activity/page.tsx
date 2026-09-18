"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Activity } from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesActivity } from "@/types/jules";
import { JulesActivityTimeline, JulesErrorState } from "@/features/automation/jules/components";

export default function JulesActivityStreamPage() {
  const [activities, setActivities] = useState<JulesActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await julesApi.listGlobalActivity(50);
      setActivities(data);
    } catch (err: any) {
      setError(err.message || "Failed to load activity stream");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
              Jules Activity Audit Stream
            </h1>
            <p className="text-xs text-slate-500">
              Real-time chronological events from all Google Jules automation sessions
            </p>
          </div>
        </div>

        <button
          onClick={loadActivities}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <JulesErrorState message={error} onRetry={loadActivities} />}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <JulesActivityTimeline activities={activities} loading={loading} />
      </div>
    </div>
  );
}
