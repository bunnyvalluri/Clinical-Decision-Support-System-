"use client";

import React from "react";
import { Sparkles, GitBranch, AlertTriangle, ShieldCheck, HeartPulse } from "lucide-react";

interface WhiteboardToolbarProps {
  onInsertTemplate: (templateName: string) => void;
  onOpenAIDialog: () => void;
  isReadOnly?: boolean;
}

export default function WhiteboardToolbar({
  onInsertTemplate,
  onOpenAIDialog,
  isReadOnly = false,
}: WhiteboardToolbarProps) {
  if (isReadOnly) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Clinical Tools:
      </span>

      <button
        type="button"
        onClick={onOpenAIDialog}
        className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors border border-sky-200"
        title="Generate Evidence-Based Diagram via Prompt 31 AI"
      >
        <Sparkles className="h-3.5 w-3.5 text-sky-600" />
        <span>AI Pathway</span>
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={() => onInsertTemplate("DECISION_DIAMOND")}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        title="Insert Triage Assessment Diamond"
      >
        <GitBranch className="h-3.5 w-3.5 text-emerald-600" />
        <span>Decision Node</span>
      </button>

      <button
        type="button"
        onClick={() => onInsertTemplate("SEPSIS_BUNDLE")}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        title="Insert Surviving Sepsis 1-Hour Protocol Step"
      >
        <HeartPulse className="h-3.5 w-3.5 text-rose-600" />
        <span>Sepsis Step</span>
      </button>

      <button
        type="button"
        onClick={() => onInsertTemplate("NON_AUTHORITATIVE_BANNER")}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
        title="Insert Mandatory Human Sign-Off Notice"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        <span>Sign-Off Banner</span>
      </button>
    </div>
  );
}
