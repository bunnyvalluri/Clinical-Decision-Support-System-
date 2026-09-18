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
} from "lucide-react";

interface WorkflowStep {
  step: number;
  label: string;
  role: "SYSTEM" | "CLINICIAN";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    label: "Patient Ingestion",
    role: "SYSTEM",
    description: "Physiological vitals, lab assays, and bedside telemetry ingested via FHIR v4.0.1.",
    icon: FileSpreadsheet,
    accentColor: "border-slate-200 bg-white text-slate-700",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
  },
  {
    step: 2,
    label: "Data Validation",
    role: "SYSTEM",
    description: "Biological plausibility checks and out-of-distribution outlier filtering.",
    icon: CheckCheck,
    accentColor: "border-blue-200 bg-blue-50/40 text-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700 border-blue-200",
  },
  {
    step: 3,
    label: "ML Inference",
    role: "SYSTEM",
    description: "Multi-model ensemble risk scoring with uncertainty margin estimation.",
    icon: Cpu,
    accentColor: "border-indigo-200 bg-indigo-50/40 text-indigo-700",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700 border-indigo-200",
  },
  {
    step: 4,
    label: "Deterministic Gate",
    role: "SYSTEM",
    description: "Cross-audited against clinical rule baselines: qSOFA, NEWS2 & sepsis bundles.",
    icon: Activity,
    accentColor: "border-amber-200 bg-amber-50/40 text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700 border-amber-200",
  },
  {
    step: 5,
    label: "Explainability",
    role: "SYSTEM",
    description: "TreeSHAP attribution bars and pathophysiological biomarker drivers generated.",
    icon: Sliders,
    accentColor: "border-teal-200 bg-teal-50/40 text-teal-700",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700 border-teal-200",
  },
  {
    step: 6,
    label: "Clinical Review",
    role: "CLINICIAN",
    description: "Attending physician or ward triage nurse evaluates outputs at bedside.",
    icon: Stethoscope,
    accentColor: "border-purple-200 bg-purple-50/40 text-purple-700",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700 border-purple-200",
  },
  {
    step: 7,
    label: "Human Decision",
    role: "CLINICIAN",
    description: "Final diagnosis, clinical prescription, and treatment pathway signed off.",
    icon: UserCheck,
    accentColor: "border-emerald-300 bg-emerald-50/60 text-emerald-800 ring-2 ring-emerald-500/20",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800 border-emerald-300 font-bold",
  },
];

export function ClinicalWorkflow() {
  return (
    <section id="workflow" className="py-16 sm:py-24 bg-slate-50/50 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            INTELLIGENCE PATHWAY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            How Clinical Intelligence Comes Together
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            The platform provides structured, transparent decision support throughout the care pathway.
            The licensed healthcare professional remains the sole authority for clinical decisions.
          </p>
        </div>

        {/* 7 Workflow Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {WORKFLOW_STEPS.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.step}
                className={`rounded-2xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${step.accentColor}`}
              >
                <div>
                  {/* Top Row: Number & Role Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[11px] font-mono font-bold text-slate-800 shadow-2xs">
                      {step.step}
                    </span>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${step.badgeBg} ${step.badgeText}`}
                    >
                      {step.role}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="h-9 w-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center mb-3 shadow-2xs">
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Label & Description */}
                  <h3 className="text-xs font-bold text-slate-950 tracking-tight mb-1.5">
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safeguard Banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs max-w-3xl mx-auto flex items-center justify-center gap-3 text-center">
          <ShieldAlert className="h-5 w-5 text-teal-600 shrink-0" />
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            <strong>Clinical Safeguard:</strong> Predictions with high epistemic uncertainty are automatically flagged for manual review rather than issuing speculative recommendations.
          </p>
        </div>
      </div>
    </section>
  );
}
