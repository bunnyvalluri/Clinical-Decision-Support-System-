"use client";

import React from "react";
import {
  Layers,
  UserCheck,
  CheckCircle,
  FileCheck2,
  History,
  Lock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface SafetyCardItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  icon: React.ElementType;
}

const SAFETY_CARDS: SafetyCardItem[] = [
  {
    id: "explainable",
    title: "Explainable Predictions",
    subtitle: "Transparent Reasoning",
    tag: "TreeSHAP Attributions",
    description:
      "Every risk tier is accompanied by transparent TreeSHAP attributions and confidence bounds, ensuring clinicians never encounter opaque 'black-box' recommendations.",
    icon: Layers,
  },
  {
    id: "human-review",
    title: "Human Clinical Review",
    subtitle: "Mandatory In-the-Loop",
    tag: "Zero Autonomous Action",
    description:
      "AI provides decision support intelligence only. No prescription, diagnostic order, or care discharge can execute without authenticated clinician review.",
    icon: UserCheck,
  },
  {
    id: "model-validation",
    title: "Model Validation",
    subtitle: "Rigorous Metrics",
    tag: "Calibrated ECE < 2.5%",
    description:
      "All active models are evaluated on true held-out clinical cohorts. Brier calibration curves, ROC-AUC, and F1 metrics are continuously benchmarked.",
    icon: CheckCircle,
  },
  {
    id: "data-quality",
    title: "Data Quality Controls",
    subtitle: "Input Verification",
    tag: "Boundary Sanitization",
    description:
      "Automated sensor sanitization, physiological bound checks, and missingness imputation protect against garbage-in, garbage-out errors.",
    icon: FileCheck2,
  },
  {
    id: "auditability",
    title: "Cryptographic Auditability",
    subtitle: "Immutable Trail",
    tag: "PostgreSQL Signed",
    description:
      "Every risk prediction, telemetry event, and clinician approval is logged immutably in PostgreSQL with timestamps, role IDs, and context snapshots.",
    icon: History,
  },
  {
    id: "privacy-security",
    title: "Privacy & Security by Design",
    subtitle: "Context Minimization",
    tag: "TLS 1.3 & AES-256",
    description:
      "Strict context minimization strips patient identifiers before risk model inference. Data is encrypted in transit (TLS 1.3) and at rest (AES-256).",
    icon: Lock,
  },
];

export function ResponsibleSafetySection() {
  return (
    <section id="responsible-safety" className="py-16 sm:py-22 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>TRUST & SAFETY PILLARS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Responsible Intelligence by Design
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            HealthNova AI is designed to support healthcare decision-making with validated models, transparent insights, and unwavering human clinical oversight.
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAFETY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      {card.tag}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-teal-700 uppercase tracking-wider block mb-1">
                    {card.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-teal-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Medical Ethics Stance Box */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xs">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed flex-1">
            <strong className="font-bold text-slate-900">Clinical Responsibility Standard:</strong> HealthNova AI is an adjunct clinical intelligence tool. It does not replace professional clinical evaluation, diagnostic judgment, or emergency intervention protocols.
          </div>
        </div>
      </div>
    </section>
  );
}
