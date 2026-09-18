"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, FolderGit2 } from "lucide-react";
import { julesApi } from "@/services/jules";
import { JulesSource } from "@/types/jules";
import { JulesSourceSelector, JulesErrorState } from "@/features/automation/jules/components";

export default function JulesSourcesPage() {
  const [sources, setSources] = useState<JulesSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await julesApi.listSources();
      setSources(data);
    } catch (err: any) {
      setError(err.message || "Failed to load connected sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const updated = await julesApi.syncSources();
      setSources(updated);
    } catch (err: any) {
      setError(err.message || "Failed to synchronize sources with Google Jules");
    } finally {
      setSyncing(false);
    }
  };

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
              Connected Repository Sources
            </h1>
            <p className="text-xs text-slate-500">
              Repositories synchronized from your Jules workspace via Google Sources API
            </p>
          </div>
        </div>
      </div>

      {error && <JulesErrorState message={error} onRetry={loadSources} />}

      <JulesSourceSelector
        sources={sources}
        loading={loading}
        onSync={handleSync}
        syncing={syncing}
      />
    </div>
  );
}
