"use client";

import React, { useState } from "react";
import {
  XCircle,
  CheckCircle2,
  Clock,
  Zap,
  Split,
  Layers,
  FileQuestion,
  FileCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface ComparisonPoint {
  dimension: string;
  traditional: string;
  healthNova: string;
  impactDelta: string;
}

const COMPARISONS: ComparisonPoint[] = [
  {
    dimension: "Data Ingestion",
    traditional: "Siloed EHRs, fragmented telemetry spreadsheets, and manual data copy-pasting.",
    healthNova: "Unified, FHIR v4.0.1 pipeline streaming real-time vitals and historical charts into one view.",
    impactDelta: "Sub-Second Ingestion",
  },
  {
    dimension: "Risk Detection",
    traditional: "Manual intermittent checks that frequently miss subtle pre-decompensation patterns.",
    healthNova: "Continuous multi-model predictive screening with early drift and trajectory warnings.",
    impactDelta: "+4.2h Anticipatory Lead",
  },
  {
    dimension: "Explainability",
    traditional: "Opaque scoring systems or subjective estimates without mathematical justification.",
    healthNova: "Transparent TreeSHAP feature attributions and calibrated confidence intervals.",
    impactDelta: "100% Attribution Visibility",
  },
  {
    dimension: "Clinical Review",
    traditional: "Disjointed phone alerts, pager interruptions, and scattered charting tabs.",
    healthNova: "Integrated clinical workspace with one-click review, structured escalation, and audit trail.",
    impactDelta: "3.5h Saved / Shift",
  },
  {
    dimension: "Team Coordination",
    traditional: "Handover gaps between shift nurses, attending doctors, and informatics specialists.",
    healthNova: "Role-tailored interfaces synchronized in real time via Django Channels and WebSockets.",
    impactDelta: "Zero Handover Drops",
  },
];

export function SolutionComparison() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-22 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>THE CONNECTED ADVANTAGE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            One Connected Healthcare Intelligence Platform
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Eliminating the friction, delays, and cognitive fatigue of disconnected healthcare software stacks.
          </p>
        </div>

        {/* Comparison Table / Card View */}
        <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Left: Traditional Disconnected Healthcare */}
            <div className="p-6 sm:p-8 bg-slate-50/70 text-left">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-10 w-10 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Legacy Workflow
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Disconnected Healthcare Systems
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {COMPARISONS.map((pt, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onMouseLeave={() => setSelectedIdx(null)}
                    className={`p-4 rounded-xl border text-xs space-y-1 transition-all ${
                      selectedIdx === idx
                        ? "bg-rose-50/50 border-rose-200 shadow-2xs"
                        : "bg-white/80 border-slate-200/80"
                    }`}
                  >
                    <span className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                      {pt.dimension}
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {pt.traditional}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: HealthNova Connected Platform */}
            <div className="p-6 sm:p-8 bg-teal-50/25 text-left">
              <div className="flex items-center justify-between gap-2.5 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 block">
                      HealthNova Platform
                    </span>
                    <h3 className="text-lg font-bold text-slate-950">
                      Unified Healthcare Intelligence
                    </h3>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Next-Gen CDS
                </span>
              </div>

              <div className="space-y-4">
                {COMPARISONS.map((pt, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onMouseLeave={() => setSelectedIdx(null)}
                    className={`p-4 rounded-xl bg-white border text-xs space-y-1 shadow-2xs transition-all ${
                      selectedIdx === idx
                        ? "border-teal-400 ring-1 ring-teal-500/20 shadow-xs"
                        : "border-teal-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-700 uppercase tracking-wider text-[10px] block">
                        {pt.dimension}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {pt.impactDelta}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {pt.healthNova}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
