"use client";

import React from "react";
import {
  FolderGit2,
  RefreshCw,
  GitBranch,
  Lock,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { JulesSource } from "@/types/jules";

interface Props {
  sources: JulesSource[];
  loading?: boolean;
  onSync?: () => void;
  syncing?: boolean;
}

export function JulesSourceSelector({ sources, loading, onSync, syncing }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">
              Connected GitHub Sources
            </h3>
            <p className="text-xs text-slate-500">
              Authorized repositories synchronized from Google Jules v1alpha
            </p>
          </div>
        </div>

        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-teal-600" : ""}`} />
            <span>{syncing ? "Synchronizing..." : "Sync Sources"}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No connected GitHub sources synchronized yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  {source.is_private ? (
                    <Lock className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Globe className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{source.github_owner}/{source.github_repository}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                      {source.provider}
                    </span>
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3 text-slate-400" />
                      default: {source.default_branch}
                    </span>
                    <span>&bull;</span>
                    <span>{source.available_branches?.length || 0} branches tracked</span>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-center">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>AUTHORIZED</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
