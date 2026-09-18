"use client";

import React from "react";
import {
  Database,
  CheckCircle,
  Cpu,
  Layers,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badge: string;
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
  },
  {
    number: "02",
    title: "Understand",
    subtitle: "Data Normalization & Context",
    description:
      "Normalize, validate, and contextualize clinical measurements against baseline vitals, historical trends, and demographic reference bounds.",
    icon: CheckCircle,
    badge: "Context Minimization",
  },
  {
    number: "03",
    title: "Predict",
    subtitle: "Validated Machine Learning",
    description:
      "Apply evaluated, calibrated machine learning models (SVM, Random Forest, AdaBoost) to quantify risk probabilities with confidence intervals.",
    icon: Cpu,
    badge: "Model Inference",
  },
  {
    number: "04",
    title: "Explain",
    subtitle: "TreeSHAP Interpretability",
    description:
      "Generate clear feature contribution attributions, model uncertainty scores, and evidence summaries so clinicians understand every recommendation.",
    icon: Layers,
    badge: "Explainable AI",
  },
  {
    number: "05",
    title: "Review",
    subtitle: "Clinician Final Authority",
    description:
      "Licensed healthcare professionals review insights, apply clinical expertise, sign off on care plans, and communicate clearly with the patient.",
    icon: UserCheck,
    badge: "Human Oversight",
  },
];

export function HealthcareIntelligenceFlow() {
  return (
    <section className="py-16 sm:py-22 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
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
            return (
              <div
                key={step.number}
                className="group relative rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Step Number & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-mono font-black text-teal-600">
                      {step.number}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
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

        {/* Highlighted Governing Statement Banner */}
        <div className="mt-12 max-w-2xl mx-auto rounded-2xl bg-teal-50/90 border border-teal-200/90 p-4 sm:p-5 flex items-center justify-center gap-3 text-center shadow-xs">
          <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-teal-950">
            &ldquo;AI supports healthcare professionals. It does not replace them.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
