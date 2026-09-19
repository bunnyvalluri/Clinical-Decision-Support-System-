"use client";

import React, { useState } from "react";
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
  TrendingUp,
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
    detail: "High-frequency vitals, ECG ST depression, blood pressure, lab assays continuous ingestion via FHIR v4.0.1.",
    icon: FileSpreadsheet,
  },
  {
    step: "02",
    name: "Data Validation",
    actor: "SYSTEM",
    detail: "Biological plausibility checks & Mahalanobis out-of-distribution guard filtering sensor motion artifacts.",
    icon: CheckCheck,
  },
  {
    step: "03",
    name: "Feature Pipeline",
    actor: "ML ENGINE",
    detail: "StandardScaler normalization, dynamic imputation, and temporal ratio extraction pipelines.",
    icon: Sliders,
  },
  {
    step: "04",
    name: "Model Ensemble",
    actor: "ML ENGINE",
    detail: "CatBoost & Random Forest champion ensembles with Platt probability calibration wrapper.",
    icon: Cpu,
  },
  {
    step: "05",
    name: "Risk Stratification",
    actor: "ML ENGINE",
    detail: "Calibrated probability output partitioned into clinical triage risk tiers with Shannon entropy bounds.",
    icon: Activity,
  },
  {
    step: "06",
    name: "TreeSHAP Breakdown",
    actor: "ML ENGINE",
    detail: "Exact additive Shapley value decomposition calculating local pathophysiological biomarker attributions.",
    icon: Sliders,
  },
  {
    step: "07",
    name: "Clinical Review",
    actor: "CLINICIAN",
    detail: "Attending physician reviews prediction and evidence at bedside with documented sign-off or override.",
    icon: Stethoscope,
  },
  {
    step: "08",
    name: "Immutable Audit",
    actor: "SYSTEM",
    detail: "Cryptographic audit trail committed permanently to Neon PostgreSQL authoritative store.",
    icon: ShieldCheck,
  },
];

export function MLWorkflow() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  return (
    <section id="ml-workflow" className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>MACHINE LEARNING PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Machine Learning for{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Risk Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            From biological plausibility screening to TreeSHAP feature attributions and mandatory
            physician review, every prediction is transparent, calibrated, and auditable.
          </p>
        </div>

        {/* 8-Step Pipeline Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {ML_STEPS.map((s, idx) => {
            const IconComponent = s.icon;
            const isClinician = s.actor === "CLINICIAN";
            const isSelected = activeStepIdx === idx;

            return (
              <div
                key={s.step}
                onClick={() => setActiveStepIdx(idx)}
                className={`rounded-2xl border p-5 bg-white shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer ${
                  isSelected
                    ? "border-teal-600 ring-2 ring-teal-500/20 shadow-sm"
                    : isClinician
                    ? "border-teal-300 bg-teal-50/20"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs font-black text-slate-400">
                      STEP {s.step}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isClinician
                          ? "bg-teal-700 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {s.actor}
                    </span>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-950 tracking-tight">
                    {s.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
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
              role: "Champion Ensemble",
              desc: "100-tree ensemble with Platt sigmoid calibration wrapper; optimal sensitivity on acute cardiac and sepsis cohorts.",
              metric: "Active Champion (AUC 0.94)",
              badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
            },
            {
              name: "Support Vector Machine (SVM)",
              role: "Boundary Verifier",
              desc: "Radial Basis Function (RBF) kernel with non-linear margin hyperplanes for boundary verification and anomaly detection.",
              metric: "RBF Kernel (AUC 0.91)",
              badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
            },
            {
              name: "AdaBoost & CatBoost Classifier",
              role: "Adaptive Boosting",
              desc: "Sequential weak learners iteratively weighting borderline physiological outliers and clinical edge cases.",
              metric: "Adaptive Boost (AUC 0.93)",
              badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 shadow-2xs space-y-3 hover:bg-white hover:border-teal-400 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${m.badgeBg}`}>
                  {m.metric}
                </span>
                <Cpu className="h-4 w-4 text-teal-700 group-hover:scale-105 transition-transform" />
              </div>
              <h4 className="text-sm font-bold text-slate-950 group-hover:text-teal-800 transition-colors">{m.name}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Prominent Risk Prediction Safety Disclaimer Banner (Mandatory Clinical Invariant) */}
        <div className="rounded-3xl bg-amber-50/90 border border-amber-300 p-5 sm:p-6 max-w-3xl mx-auto flex items-start sm:items-center gap-4 shadow-2xs">
          <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
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
