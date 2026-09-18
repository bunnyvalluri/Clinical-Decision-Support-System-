"use client";

import React from "react";
import { FileCode, GitPullRequest, Download, ExternalLink } from "lucide-react";
import { JulesArtifact } from "@/types/jules";

interface Props {
  artifacts: JulesArtifact[];
  prUrl?: string;
  prNumber?: number | null;
}

export function JulesArtifactList({ artifacts, prUrl, prNumber }: Props) {
  if ((!artifacts || artifacts.length === 0) && !prUrl) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
        <FileCode className="h-5 w-5 text-teal-600" />
        <h3 className="text-base font-bold text-slate-950">
          Remediation Artifacts & Deliverables
        </h3>
      </div>

      <div className="space-y-3">
        {prUrl && (
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <GitPullRequest className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  GitHub Pull Request {prNumber ? `#${prNumber}` : ""}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                  {prUrl}
                </p>
              </div>
            </div>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
            >
              <span>Review on GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {artifacts?.map((art) => (
          <div
            key={art.id}
            className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="h-4 w-4 text-slate-500" />
              <div>
                <span className="font-bold text-slate-800">{art.artifact_type}</span>
                <p className="font-mono text-[11px] text-slate-500">{art.path || "diff.patch"}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {new Date(art.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
