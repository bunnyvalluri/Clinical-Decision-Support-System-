"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { SourceCard, CitationItem } from "./SourceCard";

interface CitationListProps {
  citations: CitationItem[];
}

export const CitationList: React.FC<CitationListProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-slate-900"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          Grounded Clinical Citations ({citations.length})
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2">
          {citations.map((c, i) => (
            <SourceCard key={`${c.guideline_id}-${i}`} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
};
