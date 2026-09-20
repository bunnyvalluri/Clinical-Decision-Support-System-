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
  Database,
  Layers,
  ChevronRight,
} from "lucide-react";

interface MLStep {
  step: string;
  name: string;
  actor: "ML ENGINE" | "CLINICIAN" | "SYSTEM";
  detail: string;
  technical: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ML_STEPS: MLStep[] = [
  {
    step: "01",
    name: "Patient Ingestion",
    actor: "SYSTEM",
    detail: "High-frequency vitals, ECG ST depression, blood pressure, lab assays continuous ingestion via FHIR v4.0.1.",
    technical: "HL7 FHIR v4.0.1 Observation streams parsed through Pydantic schemas into Celery Redis ingestion buffer under 20ms.",
    icon: FileSpreadsheet,
  },
  {
    step: "02",
    name: "Data Validation",
    actor: "SYSTEM",
    detail: "Biological plausibility checks & Mahalanobis out-of-distribution guard filtering sensor motion artifacts.",
    technical: "Systolic > Diastolic verification, heart rate bound checks [30-240 bpm], and missingness imputation via KNN.",
    icon: CheckCheck,
  },
  {
    step: "03",
    name: "Feature Pipeline",
    actor: "ML ENGINE",
    detail: "StandardScaler normalization, dynamic imputation, and temporal ratio extraction pipelines.",
    technical: "Shock Index (HR/SBP), Modified Shock Index (HR/MAP), and temporal moving delta windows across 60-minute buffers.",
    icon: Sliders,
  },
  {
    step: "04",
    name: "Model Ensemble",
    actor: "ML ENGINE",
    detail: "CatBoost & Random Forest champion ensembles with Platt probability calibration wrapper.",
    technical: "Dual gradient boosted decision trees voting with isotonic probability calibration, producing empirical Brier scores < 0.08.",
    icon: Cpu,
  },
  {
    step: "05",
    name: "Risk Stratification",
    actor: "ML ENGINE",
    detail: "Calibrated probability output partitioned into clinical triage risk tiers with Shannon entropy bounds.",
    technical: "Tier assignment (Low <20%, Elevated 20-60%, High >60%) joined with TreeSHAP additive biomarker attributions.",
    icon: Activity,
  },
];

export function MLWorkflow() {
  const [activeStepIdx, setActiveStepIdx] = useState(3);
  const activeStep = ML_STEPS[activeStepIdx];
  const StepIcon = activeStep.icon;

  return (
    <section id="ml-workflow" className="py-10 sm:py-16 lg:py-20 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>ALGORITHMIC INTEGRITY &amp; LIFECYCLE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            The Machine Learning{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Inference Pipeline
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            From raw physiological telemetry to calibrated risk predictions, every step follows strict
            mathematical verification and clinician-in-the-loop validation gates.
          </p>
        </div>

        {/* 5-Step Interactive Stepper Bar */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200 p-2.5 sm:p-4 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ML_STEPS.map((step, idx) => {
              const IconComp = step.icon;
              const isActive = activeStepIdx === idx;
              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "bg-white border border-teal-600 shadow-md ring-2 ring-teal-500/20"
                      : "bg-white/60 hover:bg-white border border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-black ${isActive ? "text-teal-700" : "text-slate-500"}`}>
                      PHASE {step.step}
                    </span>
                    <IconComp className={`h-4 w-4 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-950 truncate">{step.name}</h4>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">{step.actor}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Deep-Dive Inspector */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-300 p-4 sm:p-6 lg:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-700 uppercase">
                  ACTIVE PHASE INSPECTION • STEP {activeStep.step}
                </span>
                <h3 className="text-lg font-bold text-slate-950">{activeStep.name}</h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
              Actor: {activeStep.actor}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block font-mono text-[11px] uppercase">Clinical Function</span>
              <p className="text-slate-600 leading-relaxed">{activeStep.detail}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <span className="font-bold text-teal-800 block font-mono text-[11px] uppercase">Technical Execution</span>
              <p className="text-slate-700 leading-relaxed font-mono">{activeStep.technical}</p>
            </div>
          </div>
        </div>

        {/* Machine Learning Model Ensembles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              name: "CatBoost Classifier",
              role: "Ensemble Champion",
              desc: "Optimized gradient-boosted decision trees on heterogeneous patient vitals with Platt probability scaling.",
              metric: "Champion (AUC 0.94)",
              badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
            },
            {
              name: "Random Forest Classifier",
              role: "Secondary Ensemble",
              desc: "High-entropy bootstrap aggregated trees mitigating outlier variance and missing bedside telemetry points.",
              metric: "Ensemble (AUC 0.92)",
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
              name: "AdaBoost & Boosting Trees",
              role: "Adaptive Boosting",
              desc: "Sequential weak learners iteratively weighting borderline physiological outliers and clinical edge cases.",
              metric: "Adaptive Boost (AUC 0.93)",
              badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-200 shadow-2xs space-y-3 hover:bg-white hover:border-teal-400 hover:shadow-md transition-all duration-200 group"
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
        <div className="rounded-2xl sm:rounded-3xl bg-amber-50/90 border border-amber-300 p-4 sm:p-5 lg:p-6 max-w-3xl mx-auto flex items-start sm:items-center gap-4 shadow-2xs">
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
