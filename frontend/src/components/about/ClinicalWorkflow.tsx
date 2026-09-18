"use client";

import React from "react";
import {
  FileSpreadsheet,
  CheckCheck,
  Cpu,
  Activity,
  Sliders,
  Stethoscope,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";

interface WorkflowStep {
  step: number;
  label: string;
  role: "SYSTEM" | "CLINICIAN";
  phase: "AUTOMATED PIPELINE" | "HUMAN CLINICAL GATE";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    label: "Patient Ingestion",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Physiological vitals, lab assays, and bedside telemetry ingested via FHIR v4.0.1.",
    icon: FileSpreadsheet,
    accentColor: "border-slate-200/90 bg-white text-slate-800",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700 border-slate-200",
    hoverBorder: "hover:border-slate-400",
  },
  {
    step: 2,
    label: "Data Validation",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Biological plausibility checks and out-of-distribution outlier filtering.",
    icon: CheckCheck,
    accentColor: "border-blue-200/90 bg-white text-blue-800",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700 border-blue-200",
    hoverBorder: "hover:border-blue-400",
  },
  {
    step: 3,
    label: "ML Inference",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Multi-model ensemble risk scoring with uncertainty margin estimation.",
    icon: Cpu,
    accentColor: "border-indigo-200/90 bg-white text-indigo-800",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700 border-indigo-200",
    hoverBorder: "hover:border-indigo-400",
  },
  {
    step: 4,
    label: "Deterministic Gate",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Cross-audited against clinical rule baselines: qSOFA, NEWS2 & sepsis bundles.",
    icon: Activity,
    accentColor: "border-amber-200/90 bg-white text-amber-800",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700 border-amber-200",
    hoverBorder: "hover:border-amber-400",
  },
  {
    step: 5,
    label: "Explainability",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "TreeSHAP attribution bars and pathophysiological biomarker drivers generated.",
    icon: Sliders,
    accentColor: "border-teal-200/90 bg-white text-teal-800",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700 border-teal-200",
    hoverBorder: "hover:border-teal-400",
  },
  {
    step: 6,
    label: "Clinical Review",
    role: "CLINICIAN",
    phase: "HUMAN CLINICAL GATE",
    description: "Attending physician or ward triage nurse evaluates outputs at bedside.",
    icon: Stethoscope,
    accentColor: "border-purple-200/90 bg-white text-purple-800",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700 border-purple-200",
    hoverBorder: "hover:border-purple-400",
  },
  {
    step: 7,
    label: "Human Decision",
    role: "CLINICIAN",
    phase: "HUMAN CLINICAL GATE",
    description: "Final diagnosis, clinical prescription, and treatment pathway signed off.",
    icon: UserCheck,
    accentColor: "border-emerald-300 bg-gradient-to-b from-emerald-50/40 to-white text-emerald-900 ring-2 ring-emerald-500/20",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800 border-emerald-300 font-bold",
    hoverBorder: "hover:border-emerald-500",
  },
];

export function ClinicalWorkflow() {
  return (
    <section id="workflow" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>INTELLIGENCE PATHWAY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            How Clinical Intelligence{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Comes Together
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            The platform provides structured, transparent decision support throughout the care pathway.
            The licensed healthcare professional remains the sole final authority for every patient decision.
          </p>

          {/* Dual Phase Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-mono font-bold">
              <Cpu className="h-3 w-3" />
              Steps 1–5: Automated AI Risk Pipeline
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-mono font-bold">
              <UserCheck className="h-3 w-3" />
              Steps 6–7: Mandatory Human Clinician Gate
            </span>
          </div>
        </div>

        {/* 7 Workflow Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {WORKFLOW_STEPS.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.step}
                className={`rounded-2xl border p-4.5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between group ${step.accentColor} ${step.hoverBorder}`}
              >
                <div>
                  {/* Top Row: Number & Role Badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="h-7 w-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-mono font-extrabold text-slate-900 shadow-2xs">
                      {step.step}
                    </span>
                    <span
                      className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${step.badgeBg} ${step.badgeText}`}
                    >
                      {step.role}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-3 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Label & Description */}
                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 tracking-tight mb-1.5 group-hover:text-teal-700 transition-colors">
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                  <span>STEP 0{step.step}</span>
                  {step.step === 7 ? (
                    <span className="text-emerald-700 font-extrabold">FINAL SIGN-OFF</span>
                  ) : (
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Safeguard Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-200/80 shadow-sm max-w-3xl mx-auto flex items-center gap-4 text-left">
          <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-950 uppercase tracking-wide block mb-0.5">
              Deterministic Safety Invariant
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="font-semibold text-slate-900">Clinical Safeguard:</strong> Predictions with high epistemic uncertainty are automatically flagged for manual review rather than issuing speculative recommendations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
