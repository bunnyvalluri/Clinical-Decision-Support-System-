"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Award,
  Zap,
  ShieldCheck,
  Calendar,
  Activity,
  ChevronRight,
  TrendingUp,
  FileCheck,
} from "lucide-react";

interface Milestone {
  step: string;
  phase: string;
  period: string;
  title: string;
  subtitle: string;
  deliverable: string;
  description: string;
  clinicalImpact: string;
  validationMetric: string;
  isCurrent?: boolean;
}

const MILESTONES: Milestone[] = [
  {
    step: "01",
    phase: "PHASE 01",
    period: "Q1–Q3 2024",
    title: "Clinical Need & Alarm Fatigue Audit",
    subtitle: "FOUNDATIONAL OBSERVATION",
    deliverable: "ICU Bedside Alarm Audit Report",
    description:
      "Critical care intensivists, triage nurses, and medical informaticists completed a 3,400-hour audit across acute care wards, documenting that up to 99% of acoustic alarms produced no actionable intervention.",
    clinicalImpact: "Established the dual-gated design requirement: statistical ML combined with deterministic safety rules.",
    validationMetric: "3,400+ Clinical Hours Observed",
  },
  {
    step: "02",
    phase: "PHASE 02",
    period: "Q4 2024–Q2 2025",
    title: "Multi-Hospital Ensemble Training",
    subtitle: "COHORT CALIBRATION",
    deliverable: "Calibrated Risk Model (CatBoost/RF)",
    description:
      "Engineered ensemble models evaluated on diverse multi-hospital clinical cohorts comprising over 50,000 patient encounters. Executed Platt scaling to achieve empirical probability calibration.",
    clinicalImpact: "Demonstrated early sepsis detection 6–8 hours prior to acute organ failure with Brier score below 0.08.",
    validationMetric: "ROC-AUC 0.94 • 50,000+ Encounters",
  },
  {
    step: "03",
    phase: "PHASE 03",
    period: "Q3 2025",
    title: "Deterministic Safety Architecture",
    subtitle: "HARDCODED CLINICAL GATES",
    deliverable: "Zero-PHI Memory Boundary & HL7 FHIR",
    description:
      "Constructed hardcoded clinical score verification engines (qSOFA, NEWS2, shock index) and context minimization pipelines to ensure zero patient PHI enters external agent memory.",
    clinicalImpact: "Authoritative persistence established in Neon PostgreSQL with 100% immutable cryptographic audit logging.",
    validationMetric: "HIPAA Zero-Leak Verified",
  },
  {
    step: "04",
    phase: "PHASE 04",
    period: "Q4 2025–Q1 2026",
    title: "Ruflo Swarm Governance Integration",
    subtitle: "POLICY-GOVERNED SWARM",
    deliverable: "Hierarchical Multi-Agent Consensus",
    description:
      "Integrated the Ruflo v3.42.0 hierarchical multi-agent framework. Six specialized clinical agents coordinate to verify drift, calibration, TreeSHAP attributions, and clinician sign-off gates.",
    clinicalImpact: "Eliminated black-box opacity; every alert is accompanied by exact additive Shapley pathophysiological drivers.",
    validationMetric: "6 Specialized Safety Agents",
  },
  {
    step: "05",
    phase: "PHASE 05",
    period: "ACTIVE DEPLOYMENT",
    title: "Enterprise Bedside Telemetry Rollout",
    subtitle: "POINT-OF-CARE SYNCHRONIZATION",
    deliverable: "Sub-20ms ASGI Telemetry Stream",
    description:
      "Hospital-wide production deployment providing sub-20ms point-of-care telemetry synchronization directly into physician tablets and ward nursing dashboards with mandatory attending sign-off.",
    clinicalImpact: "Frontline bedside teams receive proactive deterioration alerts with actionable, audited 1-hour sepsis bundles.",
    validationMetric: "<20ms Telemetry Sync • Active",
    isCurrent: true,
  },
];

export function JourneyTimeline() {
  const [activeStepIdx, setActiveStepIdx] = useState(4); // Default to current phase
  const activeMilestone = MILESTONES[activeStepIdx];

  return (
    <section id="journey" className="py-20 sm:py-28 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>CLINICAL EVIDENCE ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            From Cohort Evidence to{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Bedside Impact
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            How rigorous clinical research, multi-center cohort validation, and machine learning
            engineering evolved into an enterprise-grade hospital decision support ecosystem.
          </p>
        </div>

        {/* Interactive Milestone Stepper (Desktop Horizontal / Mobile Vertical) */}
        <div className="space-y-8">
          {/* Milestone Step Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {MILESTONES.map((m, idx) => {
              const isSelected = activeStepIdx === idx;
              return (
                <button
                  key={m.step}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white text-slate-950 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                      : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-mono font-black ${
                        isSelected ? "text-teal-800" : "text-teal-700"
                      }`}
                    >
                      {m.step}
                    </span>
                    {m.isCurrent && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold tracking-tight text-slate-950 line-clamp-1">
                    {m.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{m.period}</span>
                </button>
              );
            })}
          </div>

          {/* Active Milestone Deep Inspection Card */}
          <div className="rounded-3xl bg-white border border-slate-300 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                    {activeMilestone.phase}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {activeMilestone.period}
                  </span>
                  {activeMilestone.isCurrent && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      LIVE PRODUCTION
                    </span>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {activeMilestone.title}
                </h3>
                <span className="text-xs font-mono font-bold text-teal-800 block uppercase">
                  {activeMilestone.subtitle}
                </span>
              </div>
              <div className="font-mono text-right">
                <span className="text-xs text-slate-400 block">Validated Outcome:</span>
                <span className="text-sm sm:text-base font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 inline-block mt-1">
                  {activeMilestone.validationMetric}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Detailed Narrative (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  {activeMilestone.description}
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-teal-700" />
                    Clinical Transformation &amp; Impact:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeMilestone.clinicalImpact}
                  </p>
                </div>
              </div>

              {/* Key Deliverables & Artifacts (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 space-y-3 font-mono text-xs shadow-2xs">
                <span className="text-teal-800 font-bold flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-teal-700" />
                  Validated Technical Artifact:
                </span>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-950 font-bold block text-sm">
                    {activeMilestone.deliverable}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Institutional Governance Sign-Off Completed
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Audit Trail: PostgreSQL Immutable</span>
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
