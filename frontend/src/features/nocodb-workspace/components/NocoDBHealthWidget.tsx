"use client";

import React, { useState } from "react";
import { useNocoDBHealth } from "@/services/nocodb/nocodbHealth";
import { nocodbClient } from "@/services/nocodb/nocodbClient";

interface NocoDBHealthWidgetProps {
  onSyncTriggered?: () => void;
  canSync?: boolean;
}

export function NocoDBHealthWidget({ onSyncTriggered, canSync = false }: NocoDBHealthWidgetProps) {
  const { health, isLoading, error } = useNocoDBHealth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await nocodbClient.triggerSync();
      if (res.success) {
        setSyncMessage("Analytical projections refreshed from Neon PostgreSQL.");
        if (onSyncTriggered) onSyncTriggered();
      }
    } catch (err: any) {
      setSyncMessage(err?.response?.data?.error || "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && !health) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-500 animate-pulse flex items-center justify-between">
        <div className="h-4 bg-slate-100 rounded w-28"></div>
        <div className="h-4 bg-slate-100 rounded w-16"></div>
      </div>
    );
  }

  const isHealthy = health?.status === "HEALTHY";

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isHealthy ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span className="font-semibold text-slate-800">NocoDB Analytics Engine</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {health?.status || "CONNECTED"}
          </span>
          <span className="text-[11px] text-slate-400">
            {health?.managed_datasets_count ?? 6} Governed Datasets
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canSync && (
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isSyncing ? "Syncing..." : "Sync from Neon"}
            </button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
          {syncMessage}
        </div>
      )}

      {error && (
        <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
