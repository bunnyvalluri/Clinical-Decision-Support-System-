"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  ListOrdered,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { SearchService } from "@/services/search/searchService";
import { type SearchHealthStatus, type SearchIndexMetadata } from "@/services/search/searchTypes";

export default function AdminSearchCenterPage() {
  const [health, setHealth] = useState<SearchHealthStatus | null>(null);
  const [indexes, setIndexes] = useState<SearchIndexMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexFeedback, setReindexFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [h, idxs] = await Promise.all([
        SearchService.getHealth(),
        SearchService.getIndexes(),
      ]);
      setHealth(h);
      setIndexes(idxs);
    } catch {
      // Handled in services
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerReindex = async (indexUid?: string) => {
    setIsReindexing(true);
    setReindexFeedback(null);
    try {
      const res = await SearchService.triggerReindex(indexUid);
      setReindexFeedback(res.message);
      loadData();
    } catch {
      setReindexFeedback("Failed to trigger reindexing.");
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                IT Admin
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-semibold text-emerald-700">
                Infrastructure & Cluster Operations
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Meilisearch Cluster & Index Center
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Real-time monitoring of search projection health, task queue depth, index metadata, and reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/search/tasks"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ListOrdered className="h-4 w-4 text-slate-500" />
              <span>Task Monitor</span>
            </Link>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {reindexFeedback && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center justify-between">
            <span>{reindexFeedback}</span>
            <button
              onClick={() => setReindexFeedback(null)}
              className="text-emerald-700 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Service Status</span>
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  health?.reachable ? "bg-emerald-500" : "bg-rose-500 animate-ping"
                }`}
              />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {health?.status || "UNKNOWN"}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Engine: {health?.engine} v{health?.version}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Indexes</span>
              <Layers className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {health?.indexes_count ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Configured projection schemas
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Indexing Queue</span>
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {health?.tasks_queued ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Async tasks processing/queued
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Database Size</span>
              <Database className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {health?.database_size_bytes
                ? `${(health.database_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                : "0.0 MB"}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              LMDB virtual memory allocation
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Index Synchronization & Rebuild
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Trigger zero-downtime reconstruction from Neon PostgreSQL authoritative tables.
              </p>
            </div>
            <button
              onClick={() => handleTriggerReindex()}
              disabled={isReindexing}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isReindexing ? "animate-spin" : ""}`} />
              <span>Reindex All Projections</span>
            </button>
          </div>
        </div>

        {/* Index Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Registered Search Indexes</h3>
            <p className="text-xs text-slate-500">
              Attribute mappings, searchable fields, and individual reindexing triggers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Index UID</th>
                  <th className="px-6 py-3">Searchable Attributes</th>
                  <th className="px-6 py-3">Filterable Attributes</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {indexes.map((idx) => (
                  <tr key={idx.index_uid} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {idx.index_uid}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-mono text-[11px] text-slate-600">
                      {idx.searchable_attributes.join(", ") || "*"}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-mono text-[11px] text-slate-600">
                      {idx.filterable_attributes.join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleTriggerReindex(idx.index_uid)}
                        disabled={isReindexing}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-emerald-300 transition-colors"
                      >
                        Rebuild
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
