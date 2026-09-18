"use client";

import React from "react";
import { Sparkles, CheckCircle2, Award, Zap, ShieldCheck } from "lucide-react";

interface TimelineStage {
  step: string;
  phase: string;
  title: string;
  subtitle: string;
  deliverable: string;
  description: string;
  isCurrent?: boolean;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    step: "01",
    phase: "PHASE 01",
    title: "Clinical Need Identified",
    subtitle: "FOUNDATIONAL RESEARCH",
    deliverable: "ICU Alarm Fatigue Audit",
    description:
      "Critical care physicians and informaticists observed alarm fatigue and preventable clinical deterioration delays across acute wards.",
  },
  {
    step: "02",
    phase: "PHASE 02",
    title: "Model Validation",
    subtitle: "COHORT EVALUATION",
    deliverable: "50,000+ Cohorts • AUC 0.94",
    description:
      "Trained and calibrated ensemble models on 50,000+ patient encounters, achieving ROC-AUC 0.94 with rigorous Brier score calibration.",
  },
  {
    step: "03",
    phase: "PHASE 03",
    title: "Safety Architecture",
    subtitle: "DETERMINISTIC GATES",
    deliverable: "Zero-PHI Memory Boundary",
    description:
      "Engineered hardcoded clinical safeguards (qSOFA, NEWS2) and bidirectional HL7 FHIR interoperability with zero-PHI memory boundaries.",
  },
  {
    step: "04",
    phase: "PHASE 04",
    title: "Multi-Agent Swarm",
    subtitle: "POLICY GOVERNANCE",
    deliverable: "Ruflo Swarm Coordinator",
    description:
      "Integrated Ruflo hierarchical coordination to audit predictions, calculate uncertainty bounds, and enforce mandatory clinician sign-off.",
  },
  {
    step: "05",
    phase: "PHASE 05",
    title: "Hospital-Wide Deployment",
    subtitle: "POINT-OF-CARE IMPACT",
    deliverable: "Sub-20ms Telemetry Sync",
    description:
      "Active bedside monitoring providing sub-20ms real-time deterioration alerts directly inside doctor and nurse triage workflows.",
    isCurrent: true,
  },
];

export function JourneyTimeline() {
  return (
    <section id="journey" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>OUR JOURNEY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            From Data to Meaningful{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            How rigorous clinical research and machine learning engineering evolved into an
            integrated, hospital-wide decision-support ecosystem.
          </p>
        </div>

        {/* Desktop Horizontal Timeline (Visible on lg+) */}
        <div className="hidden lg:block relative pt-8 pb-4">
          {/* Subtle Connecting Line with Glowing Gradient */}
          <div
            aria-hidden="true"
            className="absolute top-14 left-10 right-10 h-1 bg-gradient-to-r from-teal-200 via-emerald-300 to-teal-500 rounded-full"
          />

          <div className="grid grid-cols-5 gap-5 relative z-10">
            {TIMELINE_STAGES.map((stage) => (
              <div
                key={stage.step}
                className="group flex flex-col items-center text-center space-y-4 p-4 rounded-2xl bg-white/80 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                {/* Numbered Node with Ping Indicator */}
                <div className="relative">
                  <div
                    className={`h-12 w-12 rounded-2xl bg-white border-2 flex items-center justify-center font-mono font-extrabold text-sm transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                      stage.isCurrent
                        ? "border-teal-600 text-teal-700 ring-4 ring-teal-100"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    {stage.step}
                  </div>
                  {stage.isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider block mx-auto w-fit">
                    {stage.subtitle}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 tracking-tight leading-snug group-hover:text-teal-700 transition-colors">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stage.description}
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-teal-600" />
                    <span>{stage.deliverable}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet Vertical Timeline (Visible below lg) */}
        <div className="lg:hidden relative pl-6 sm:pl-8 space-y-8">
          {/* Vertical Connecting Line */}
          <div
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-4 sm:left-5 w-1 bg-gradient-to-b from-teal-200 via-emerald-300 to-teal-500 rounded-full"
          />

          {TIMELINE_STAGES.map((stage) => (
            <div
              key={stage.step}
              className="relative pl-6 sm:pl-8 space-y-2 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs"
            >
              {/* Numbered Node on Line */}
              <div
                className={`absolute top-4 -left-7 sm:-left-8 h-9 w-9 rounded-xl bg-white border-2 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm ${
                  stage.isCurrent
                    ? "border-teal-600 text-teal-700 ring-2 ring-teal-200"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                {stage.step}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
                  {stage.subtitle}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {stage.phase}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-950 tracking-tight">
                {stage.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {stage.description}
              </p>
              <div className="pt-2 text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                <span>{stage.deliverable}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
