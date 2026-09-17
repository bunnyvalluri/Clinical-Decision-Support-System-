"use client";

import * as React from "react";
import { BookOpen, ExternalLink } from "lucide-react";

export interface CitationItem {
  guideline_id: string;
  title: string;
  section?: string;
  recommendation: string;
  evidence_level?: string;
  doi_or_url?: string;
}

interface SourceCardProps {
  citation: CitationItem;
}

export const SourceCard: React.FC<SourceCardProps> = ({ citation }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-blue-700">
            <BookOpen className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800">
              {citation.guideline_id}
            </span>
            <span className="ml-2 text-xs text-slate-500 font-medium">
              {citation.section || "Clinical Consensus"}
            </span>
          </div>
        </div>
        {citation.doi_or_url && (
          <a
            href={citation.doi_or_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            DOI <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <h4 className="mt-2 text-xs font-semibold text-slate-900 leading-snug">
        {citation.title}
      </h4>

      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
        "{citation.recommendation}"
      </p>

      {citation.evidence_level && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Evidence Grade:</span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {citation.evidence_level}
          </span>
        </div>
      )}
    </div>
  );
};
