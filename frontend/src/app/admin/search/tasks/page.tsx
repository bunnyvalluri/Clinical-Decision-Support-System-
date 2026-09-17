"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  ListOrdered,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { SearchService } from "@/services/search/searchService";
import { type SearchTask } from "@/services/search/searchTypes";

export default function AdminSearchTasksPage() {
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await SearchService.getTasks();
      setTasks(data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            SUCCEEDED
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            FAILED
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
            <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
            PROCESSING
          </span>
        );
      case "enqueued":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            ENQUEUED
          </span>
        );
    }
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/search"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Search Center</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Meilisearch Task Queue Monitor
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Detailed tracking of document additions, settings migrations, and batch indexing tasks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTasks}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh Tasks</span>
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Asynchronous Tasks</h3>
            <span className="text-xs text-slate-500 font-mono">
              Total Recorded: {tasks.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Task UID</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Target Index</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Enqueued At</th>
                  <th className="px-6 py-3">Error Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No recent task executions found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        #{task.uid}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] font-semibold text-slate-700 uppercase">
                        {task.type}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-800">
                        {task.indexUid || "*"}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                        {task.duration || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(task.enqueuedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-[11px] text-rose-600 font-mono">
                        {task.error?.message || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
