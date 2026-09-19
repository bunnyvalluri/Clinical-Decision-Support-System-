"use client";

import React, { useState } from "react";
import {
  Database,
  CheckCircle,
  Cpu,
  Layers,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Code,
  CheckCircle2,
} from "lucide-react";

interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  technicalPayload: string;
  invariants: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Collect",
    subtitle: "Authorized Health Signals",
    description:
      "Ingest authorized electronic health records, continuous vital sensors, lab panels, and clinician notes with zero PHI leakage into external models.",
    icon: Database,
    badge: "Ingestion & Sanitization",
    technicalPayload: "FHIR v4.0.1 Observation { code: '8867-4', valueQuantity: 114 bpm, status: 'final' }",
    invariants: "Zero patient identifiers retained in volatile agent memory.",
  },
  {
    number: "02",
    title: "Understand",
    subtitle: "Data Normalization & Context",
    description:
      "Normalize, validate, and contextualize clinical measurements against baseline vitals, historical trends, and demographic reference bounds.",
    icon: CheckCircle,
    badge: "Context Minimization",
    technicalPayload: "ClinicalRiskContextBuilder { z_score: +2.1, MAP: 58 mmHg, qSOFA: 2 }",
    invariants: "Physiological boundary check [HR: 30-220 bpm, SpO2: 50-100%].",
  },
  {
    number: "03",
    title: "Predict",
    subtitle: "Validated Machine Learning",
    description:
      "Apply evaluated, calibrated machine learning models (SVM, Random Forest, AdaBoost) to quantify risk probabilities with confidence intervals.",
    icon: Cpu,
    badge: "Model Inference",
    technicalPayload: "EnsembleInference { p_sepsis: 0.847, ci_95: [0.812, 0.881], ece: 0.019 }",
    invariants: "Deterministic fallbacks engage if prediction entropy > 0.45.",
  },
  {
    number: "04",
    title: "Explain",
    subtitle: "TreeSHAP Interpretability",
    description:
      "Generate clear feature contribution attributions, model uncertainty scores, and evidence summaries so clinicians understand every recommendation.",
    icon: Layers,
    badge: "Explainable AI",
    technicalPayload: "TreeSHAP { Lactate: +0.214, MAP_Drop: +0.168, SpO2_FiO2: +0.092 }",
    invariants: "All feature contributions must sum to net margin delta.",
  },
  {
    number: "05",
    title: "Review",
    subtitle: "Clinician Final Authority",
    description:
      "Licensed healthcare professionals review insights, apply clinical expertise, sign off on care plans, and communicate clearly with the patient.",
    icon: UserCheck,
    badge: "Human Oversight",
    technicalPayload: "ClinicianSignOff { npi: '1092834710', decision: 'CONFIRMED', sha256: 'a9f2...' }",
    invariants: "Mandatory human sign-off gate before chart write-back.",
  },
];

export function HealthcareIntelligenceFlow() {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(2);
  const activeStep = STEPS[activeStepIdx];

  return (
    <section className="py-16 sm:py-22 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>CLINICAL PIPELINE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            From Healthcare Data to Actionable Intelligence
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            A transparent, audit-ready five-stage pipeline designed to transform raw physiological data into trusted bedside decision support.
          </p>
        </div>

        {/* 5-Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-4 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStepIdx === idx;
            return (
              <div
                key={step.number}
                onClick={() => setActiveStepIdx(idx)}
                className={`group relative rounded-2xl bg-white border p-5 shadow-2xs transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
                    : "border-slate-200 hover:shadow-md hover:border-teal-300 hover:-translate-y-1"
                }`}
              >
                <div>
                  {/* Step Number & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-mono font-black text-teal-600">
                      {step.number}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-teal-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs font-semibold text-teal-700 mb-2">
                    {step.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Step Connector Indicator (hidden on last) */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="h-5 w-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-teal-600 shadow-2xs">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Stage Architecture Schema Inspector */}
        <div className="mt-8 rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Code className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Stage {activeStep.number}: {activeStep.title} — {activeStep.badge}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600 mt-0.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                {activeStep.technicalPayload}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {activeStep.invariants}
            </span>
          </div>
        </div>

        {/* Highlighted Governing Statement Banner */}
        <div className="mt-8 max-w-2xl mx-auto rounded-2xl bg-teal-50/90 border border-teal-200/90 p-4 sm:p-5 flex items-center justify-center gap-3 text-center shadow-xs">
          <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-teal-950">
            &ldquo;AI supports healthcare professionals. It does not replace them.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
