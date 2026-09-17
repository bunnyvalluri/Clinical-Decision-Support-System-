"use client";

import * as React from "react";
import { BookOpen, ExternalLink, Award } from "lucide-react";

export interface Citation {
  title: string;
  organization?: string;
  doi_or_url?: string;
  evidence_level?: string;
  passage?: string;
}

interface AgentCitationListProps {
  citations: Citation[];
}

export const AgentCitationList: React.FC<AgentCitationListProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-slate-700 pb-1 border-b border-slate-100">
        <BookOpen className="h-3.5 w-3.5 text-blue-600" />
        <span>Authoritative Clinical Evidence & Citations ({citations.length})</span>
      </div>

      <div className="space-y-2">
        {citations.map((c, i) => (
          <div
            key={i}
            className="p-2.5 rounded-md bg-slate-50 border border-slate-100 space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-slate-800">{c.title}</span>
              {c.evidence_level && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                  <Award className="h-3 w-3" />
                  {c.evidence_level}
                </span>
              )}
            </div>

            {c.organization && (
              <div className="text-[11px] text-slate-500">{c.organization}</div>
            )}

            {c.passage && (
              <p className="text-[11px] text-slate-600 italic line-clamp-2">
                &quot;{c.passage}&quot;
              </p>
            )}

            {c.doi_or_url && (
              <a
                href={c.doi_or_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline pt-0.5"
              >
                <span>View Source Protocol</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentCitationList;
