"use client";

import React from "react";
import {
  XCircle,
  CheckCircle2,
  Clock,
  Zap,
  Split,
  Layers,
  FileQuestion,
  FileCheck,
} from "lucide-react";

interface ComparisonPoint {
  dimension: string;
  traditional: string;
  healthNova: string;
}

const COMPARISONS: ComparisonPoint[] = [
  {
    dimension: "Data Ingestion",
    traditional: "Siloed EHRs, fragmented telemetry spreadsheets, and manual data copy-pasting.",
    healthNova: "Unified, FHIR-compatible pipeline streaming real-time vitals and historical charts into one view.",
  },
  {
    dimension: "Risk Detection",
    traditional: "Manual intermittent checks that frequently miss subtle pre-decompensation patterns.",
    healthNova: "Continuous multi-model predictive screening with early drift and trajectory warnings.",
  },
  {
    dimension: "Explainability",
    traditional: "Opaque scoring systems or subjective estimates without mathematical justification.",
    healthNova: "Transparent TreeSHAP feature attributions and calibrated confidence intervals.",
  },
  {
    dimension: "Clinical Review",
    traditional: "Disjointed phone alerts, pager interruptions, and scattered charting tabs.",
    healthNova: "Integrated clinical workspace with one-click review, structured escalation, and audit trail.",
  },
  {
    dimension: "Team Coordination",
    traditional: "Handover gaps between shift nurses, attending doctors, and informatics specialists.",
    healthNova: "Role-tailored interfaces synchronized in real time via Django Channels and WebSockets.",
  },
];

export function SolutionComparison() {
  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            THE CONNECTED ADVANTAGE
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
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
            <div className="p-6 sm:p-8 bg-slate-50/60">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-9 w-9 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Legacy Workflow
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Disconnected Healthcare Systems
                  </h3>
                </div>
              </div>

              <div className="space-y-5">
                {COMPARISONS.map((comp, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      &times;
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {comp.dimension}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        {comp.traditional}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Connected HealthNova AI Platform */}
            <div className="p-6 sm:p-8 bg-teal-50/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700">
                    Intelligent Architecture
                  </span>
                  <h3 className="text-lg font-bold text-teal-950">
                    HealthNova AI Connected Care
                  </h3>
                </div>
              </div>

              <div className="space-y-5">
                {COMPARISONS.map((comp, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-teal-950">
                        {comp.dimension}
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                        {comp.healthNova}
                      </p>
                    </div>
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
