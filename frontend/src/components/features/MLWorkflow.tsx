"use client";

import React from "react";
import {
  FileSpreadsheet,
  CheckCheck,
  Cpu,
  Activity,
  Sliders,
  Stethoscope,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface MLStep {
  step: string;
  name: string;
  actor: "ML ENGINE" | "CLINICIAN" | "SYSTEM";
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ML_STEPS: MLStep[] = [
  {
    step: "01",
    name: "Patient Ingestion",
    actor: "SYSTEM",
    detail: "Vitals, ECG ST depression, blood pressure, lab assays continuous ingestion.",
    icon: FileSpreadsheet,
  },
  {
    step: "02",
    name: "Data Validation",
    actor: "SYSTEM",
    detail: "Biological plausibility checks & Mahalanobis out-of-distribution guard.",
    icon: CheckCheck,
  },
  {
    step: "03",
    name: "Feature Pipeline",
    actor: "ML ENGINE",
    detail: "StandardScaler normalization & group-aware imputation pipelines.",
    icon: Sliders,
  },
  {
    step: "04",
    name: "Model Ensemble",
    actor: "ML ENGINE",
    detail: "Random Forest champion, SVM (RBF), and AdaBoost benchmark inference.",
    icon: Cpu,
  },
  {
    step: "05",
    name: "Risk Stratification",
    actor: "ML ENGINE",
    detail: "Calibrated probability output partitioned into clinical triage risk tiers.",
    icon: Activity,
  },
  {
    step: "06",
    name: "TreeSHAP Breakdown",
    actor: "ML ENGINE",
    detail: "Additive margin decomposition & Shannon entropy uncertainty score.",
    icon: Sliders,
  },
  {
    step: "07",
    name: "Clinical Review",
    actor: "CLINICIAN",
    detail: "Attending physician reviews prediction with documented sign-off or override.",
    icon: Stethoscope,
  },
  {
    step: "08",
    name: "Immutable Audit",
    actor: "SYSTEM",
    detail: "Cryptographic audit trail committed to Neon PostgreSQL authoritative store.",
    icon: ShieldCheck,
  },
];

export function MLWorkflow() {
  return (
    <section id="ml-workflow" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>MACHINE LEARNING PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Machine Learning for{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Clinical Risk Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            From biological plausibility screening to TreeSHAP feature attributions and mandatory
            physician review, every prediction is transparent, calibrated, and auditable.
          </p>
        </div>

        {/* 8-Step Pipeline Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {ML_STEPS.map((s) => {
            const IconComponent = s.icon;
            const isClinician = s.actor === "CLINICIAN";

            return (
              <div
                key={s.step}
                className={`rounded-2xl border p-5.5 bg-white shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${
                  isClinician
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/5"
                    : "border-slate-200/90 hover:border-teal-400"
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-slate-400">
                      STEP {s.step}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isClinician
                          ? "bg-teal-700 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {s.actor}
                    </span>
                  </div>

                  <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-950 tracking-tight group-hover:text-teal-700 transition-colors">
                    {s.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supported Model Architectures Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            {
              name: "Random Forest Classifier",
              role: "Champion Model",
              desc: "100-tree ensemble with Platt sigmoid calibration wrapper; optimal sensitivity on acute cardiac risk cohorts.",
              metric: "Active Champion",
              badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
            },
            {
              name: "Support Vector Machine (SVM)",
              role: "Benchmark Model",
              desc: "Radial Basis Function (RBF) kernel with non-linear margin hyperplanes for boundary verification.",
              metric: "RBF Kernel",
              badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
            },
            {
              name: "AdaBoost Classifier",
              role: "Adaptive Boosting",
              desc: "Sequential weak learners iteratively weighting borderline physiological outliers.",
              metric: "Adaptive Boost",
              badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-teal-400 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${m.badgeBg}`}>
                  {m.metric}
                </span>
                <Cpu className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-sm font-bold text-slate-950 group-hover:text-teal-700 transition-colors">{m.name}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Prominent Risk Prediction Safety Disclaimer Banner (Mandatory Clinical Invariant) */}
        <div className="rounded-3xl bg-amber-50/80 border border-amber-200 p-5 sm:p-6 max-w-3xl mx-auto flex items-start sm:items-center gap-4 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
            <strong className="font-bold text-amber-950">Risk Prediction Safety:</strong> Risk predictions are decision-support outputs and should be interpreted by qualified healthcare professionals alongside relevant clinical information and bedside assessment.
          </p>
        </div>
      </div>
    </section>
  );
}
