"use client";

import React from "react";
import {
  Activity,
  Server,
  Cpu,
  Radio,
  UserCheck,
  Stethoscope,
  ArrowRight,
  Zap,
} from "lucide-react";

interface PipelineStep {
  title: string;
  technology: string;
  description: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    title: "Data Event",
    technology: "Bedside Monitor / EHR",
    description: "New vitals observation (e.g. SpO2 or blood pressure) generated at bedside.",
    icon: Activity,
  },
  {
    title: "Backend Ingestion",
    technology: "Django & Redis",
    description: "Payload validated, normalized, and placed on distributed queue.",
    icon: Server,
  },
  {
    title: "Risk / AI Processing",
    technology: "Celery ML Worker",
    description: "Random Forest & SVM models evaluate multi-parameter risk trajectory.",
    icon: Cpu,
  },
  {
    title: "Realtime Broadcast",
    technology: "Django Channels (WebSocket)",
    description: "Multiplexed event broadcasted to active bedside & triage dashboards.",
    icon: Radio,
  },
  {
    title: "Authorized User",
    technology: "MD / RN Client",
    description: "Clinician interface updates with visual alert and TreeSHAP attribution.",
    icon: UserCheck,
  },
  {
    title: "Clinical Action",
    technology: "Clinician Protocol",
    description: "Clinician reviews patient, adjusts medication, or confirms stable status.",
    icon: Stethoscope,
  },
];

export function RealtimeIntelligenceSection() {
  return (
    <section id="realtime-intelligence" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            EVENT-DRIVEN ARCHITECTURE
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Healthcare Intelligence That Keeps Up
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Changing patient physiology cannot wait for batch database jobs. Our event-driven pipeline propagates telemetry updates to authorized clinicians in sub-seconds.
          </p>
        </div>

        {/* 6-Step Horizontal Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[10px] font-mono font-semibold text-teal-700 mb-2">
                    {step.technology}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow indicator between steps */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Telemetry Architecture Footnote */}
        <div className="mt-10 p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-slate-900">Live Telemetry Pipeline:</span>
            <span>WebSocket push via Django Channels backed by Redis Pub/Sub.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Zero polling overhead &bull; Sub-second updates
          </span>
        </div>
      </div>
    </section>
  );
}
