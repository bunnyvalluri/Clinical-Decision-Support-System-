"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface EvidenceItem {
  id: string;
  evidence_type: string;
  reproduction_steps: string;
  sanitized_request?: Record<string, any>;
  sanitized_response?: Record<string, any>;
  evidence_hash?: string;
  captured_at: string;
}

interface SecurityEvidenceViewerProps {
  evidence: EvidenceItem[];
}

export const SecurityEvidenceViewer: React.FC<SecurityEvidenceViewerProps> = ({ evidence }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Sanitized Evidence Traces</h3>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Zero PHI Policy Enforced
        </Badge>
      </div>

      {evidence.length === 0 ? (
        <div className="text-xs text-slate-400 italic">No sanitized evidence recorded.</div>
      ) : (
        evidence.map((ev) => (
          <div key={ev.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">{ev.evidence_type}</span>
              <span className="font-mono text-slate-400 text-[10px]">
                Hash: {ev.evidence_hash?.slice(0, 10) || "N/A"}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-600 mb-1">Reproduction Steps:</div>
              <div className="p-2 bg-white rounded border border-slate-200 text-xs text-slate-800 font-mono">
                {ev.reproduction_steps}
              </div>
            </div>

            {ev.sanitized_request && Object.keys(ev.sanitized_request).length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-600 mb-1">Redacted Request:</div>
                <pre className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-700 overflow-x-auto">
                  {JSON.stringify(ev.sanitized_request, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
