"use client";

import React, { useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { TaskState, TaskStatusPayload } from "@/types";

export function TaskStatusTracker() {
  const [tasks, setTasks] = useState<Record<string, TaskStatusPayload>>({});

  const handleTaskUpdate = (data: unknown) => {
    const obj = data as Record<string, unknown>;
    const payload = (obj?.payload || obj) as TaskStatusPayload;
    if (!payload?.task_id) return;

    setTasks((prev) => ({
      ...prev,
      [payload.task_id]: {
        task_id: payload.task_id,
        task_name: payload.task_name,
        status: payload.status,
        progress: payload.progress ?? 0,
        result: payload.result,
        error: payload.error,
        timestamp: payload.timestamp,
      },
    }));

    // Auto-dismiss completed or failed tasks after 15 seconds
    if (payload.status === "COMPLETED" || payload.status === "FAILED") {
      setTimeout(() => {
        setTasks((prev) => {
          const next = { ...prev };
          delete next[payload.task_id];
          return next;
        });
      }, 15000);
    }
  };

  useWebSocket({
    path: "dashboard/",
    handlers: {
      TASK_STATUS_UPDATED: handleTaskUpdate,
      task_status_updated: handleTaskUpdate,
    },
  });

  const dismissTask = (taskId: string) => {
    setTasks((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const taskList = Object.values(tasks);
  if (taskList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">Celery Async Processing Engine</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">Broker: Upstash Redis (TLS) • All workers ready</span>
      </div>
    );
  }

  const formatTaskName = (name: string) => {
    if (!name) return "Background Task";
    if (name.includes("pdf") || name.includes("report")) return "Clinical PDF Report Generation";
    if (name.includes("bulk") || name.includes("batch")) return "Vectorized Bulk Risk Processing";
    if (name.includes("train")) return "ML Model Training & Evaluation";
    if (name.includes("notification") || name.includes("email")) return "Clinical Alert Notification";
    if (name.includes("analytics")) return "Periodic Analytics Aggregation";
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusBadge = (status: TaskState) => {
    switch (status) {
      case "QUEUED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            QUEUED
          </span>
        );
      case "PROCESSING":
      case "RETRYING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <svg className="animate-spin h-3 w-3 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            PROCESSING
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
            COMPLETED
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <svg className="h-3 w-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <h3 className="text-sm font-bold text-slate-800">Asynchronous Task Monitor</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
            {taskList.length} active
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Redis Channels Layer</span>
      </div>

      <div className="space-y-2.5">
        {taskList.map((task) => {
          const downloadUrl = typeof task.result?.download_url === "string" ? task.result.download_url : undefined;
          return (
            <div
              key={task.task_id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{formatTaskName(task.task_name)}</h4>
                  <p className="text-[11px] font-mono text-slate-400">Task ID: {task.task_id.slice(0, 16)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                  <button
                    onClick={() => dismissTask(task.task_id)}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1"
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    task.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : task.status === "FAILED"
                      ? "bg-rose-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${task.status === "COMPLETED" ? 100 : Math.max(task.progress, 5)}%` }}
                />
              </div>

              {/* Download or Error message */}
              <div className="flex items-center justify-between text-xs pt-1">
                {task.error ? (
                  <span className="text-rose-600 text-[11px] font-medium truncate max-w-[280px]" title={task.error}>
                    {task.error}
                  </span>
                ) : downloadUrl ? (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Compiled PDF Report
                  </a>
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    {task.status === "QUEUED"
                      ? "Waiting for available Celery worker thread..."
                      : task.status === "PROCESSING"
                      ? "Processing data pipelines..."
                      : "Job finalized."}
                  </span>
                )}
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  {task.status === "COMPLETED" ? "100%" : `${task.progress}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
