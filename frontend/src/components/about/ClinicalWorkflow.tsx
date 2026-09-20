"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  CheckCheck,
  Cpu,
  Activity,
  Sliders,
  Stethoscope,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Terminal,
} from "lucide-react";

interface WorkflowStep {
  step: number;
  label: string;
  role: "SYSTEM" | "CLINICIAN";
  phase: "AUTOMATED PIPELINE" | "HUMAN CLINICAL GATE";
  description: string;
  clinicalInput: string;
  processingEngine: string;
  safetyThreshold: string;
  outputArtifact: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    label: "Telemetry & FHIR Ingestion",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "High-frequency physiological telemetry, lab assays, and patient encounter history ingested via native HL7 FHIR v4.0.1.",
    clinicalInput: "Bedside monitors (ECG, SpO2, NIBP, Art Line) + Laboratory serum panels",
    processingEngine: "ASGI WebSockets / FHIR Observation & Encounter resource parser",
    safetyThreshold: "Sub-20ms packet arrival check with zero PHI export",
    outputArtifact: "Normalized clinical feature vector without identifiers",
    icon: FileSpreadsheet,
  },
  {
    step: 2,
    label: "Biological Plausibility Filter",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Multi-parameter outlier detection removes sensor detachment noise, motion artifacts, and biologically impossible physiological values.",
    clinicalInput: "Normalized vitals stream and blood chemistry assays",
    processingEngine: "Deterministic physiological range boundaries & trend slope validator",
    safetyThreshold: "Rejects sensor decoupling (e.g. HR > 300, SpO2 = 0 without arrest)",
    outputArtifact: "Validated, noise-free physiological dataset",
    icon: CheckCheck,
  },
  {
    step: 3,
    label: "Ensemble Risk Inference",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "CatBoost, Random Forest, and SVM ensembles generate Platt-calibrated risk probabilities for acute sepsis and respiratory deterioration.",
    clinicalInput: "Temporal vital trends, organ dysfunction markers, and lab ratios",
    processingEngine: "Multi-hospital validated ensemble models (0.136ms p99 latency)",
    safetyThreshold: "Shannon entropy uncertainty check; abstains if uncertainty > 0.82",
    outputArtifact: "Calibrated risk score (0–100%) with confidence bounds",
    icon: Cpu,
  },
  {
    step: 4,
    label: "Deterministic Clinical Audit",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Statistical ML predictions are strictly cross-audited against hardcoded deterministic scoring standards: qSOFA, NEWS2, and Shock Index.",
    clinicalInput: "Calibrated risk score paired with bedside respiratory rate, BP, and GCS",
    processingEngine: "Hardcoded clinical scoring interlocks (qSOFA ≥ 2, NEWS2 ≥ 7)",
    safetyThreshold: "Blocks statistical false-positives if clinical rules contradict",
    outputArtifact: "Dual-cleared clinical alert bundle",
    icon: Activity,
  },
  {
    step: 5,
    label: "TreeSHAP Local Explainability",
    role: "SYSTEM",
    phase: "AUTOMATED PIPELINE",
    description: "Calculates the exact additive Shapley contribution of every biomarker to eliminate black-box opacity before alerting bedside teams.",
    clinicalInput: "Trained tree leaves and specific patient biomarker values",
    processingEngine: "Exact TreeSHAP algorithm (additive marginal game-theoretic values)",
    safetyThreshold: "100% mathematical decomposition into positive/negative drivers",
    outputArtifact: "Pathophysiological attribution breakdown",
    icon: Sliders,
  },
  {
    step: 6,
    label: "Bedside Clinician Inspection",
    role: "CLINICIAN",
    phase: "HUMAN CLINICAL GATE",
    description: "Attending physician, intensive care fellow, or triage nurse reviews the risk trajectory and TreeSHAP biomarker drivers at point of care.",
    clinicalInput: "Bedside tablet HUD, SMART-on-FHIR embedded EHR view, and physical exam",
    processingEngine: "Frontline physician clinical judgment and holistic bedside examination",
    safetyThreshold: "Mandatory human review; zero automated therapeutic execution",
    outputArtifact: "Clinician-evaluated differential diagnosis",
    icon: Stethoscope,
  },
  {
    step: 7,
    label: "Cryptographic Human Sign-Off",
    role: "CLINICIAN",
    phase: "HUMAN CLINICAL GATE",
    description: "Licensed attending physician signs off on the clinical order (e.g. 1-Hour Sepsis Bundle) with immutable cryptographic audit logging.",
    clinicalInput: "Physician clinical decision, treatment plan, and electronic signature",
    processingEngine: "Neon PostgreSQL immutable audit logger with SHA-256 integrity stamp",
    safetyThreshold: "100% human sign-off gate; system cannot order independently",
    outputArtifact: "Authorized EHR order & permanent audit entry",
    icon: UserCheck,
  },
];

export function ClinicalWorkflow() {
  const [activeStepNum, setActiveStepNum] = useState(1);
  const activeStep = WORKFLOW_STEPS.find((s) => s.step === activeStepNum) || WORKFLOW_STEPS[0];
  const StepIcon = activeStep.icon;

  return (
    <section id="workflow" className="py-12 sm:py-20 lg:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>END-TO-END CARE PATHWAY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            How Clinical Intelligence{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Comes Together
            </span>
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            A structured two-phase pipeline separating automated statistical processing from the
            mandatory human clinician decision gate.
          </p>
        </div>

        {/* Two-Phase Visual Pipeline Bar */}
        <div className="space-y-4">
          {/* Phase Demarcation Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-mono font-bold">
            <div className="md:col-span-8 p-3.5 rounded-2xl bg-slate-50 text-slate-800 border border-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                PHASE 1: AUTOMATED TELEMETRY &amp; ML INFERENCE (STEPS 1–5)
              </span>
              <span className="text-slate-500 hidden sm:inline">Stateless Execution</span>
            </div>
            <div className="md:col-span-4 p-3.5 rounded-2xl bg-teal-50 text-teal-900 border border-teal-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                PHASE 2: HUMAN CLINICAL GATE (STEPS 6–7)
              </span>
              <span className="text-teal-800 font-bold bg-teal-100 px-2 py-0.5 rounded border border-teal-200 hidden sm:inline">
                MANDATORY
              </span>
            </div>
          </div>

          {/* 7 Interactive Steps Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {WORKFLOW_STEPS.map((s) => {
              const isSelected = activeStepNum === s.step;
              const isClinician = s.role === "CLINICIAN";
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStepNum(s.step)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white text-slate-950 border-teal-600 shadow-md ring-2 ring-teal-500/20"
                      : isClinician
                      ? "bg-teal-50/50 hover:bg-teal-50 text-slate-900 border-teal-200 shadow-2xs"
                      : "bg-slate-50 hover:bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-mono">
                    <span
                      className={`text-xs font-black ${
                        isSelected ? "text-teal-800" : isClinician ? "text-teal-700" : "text-slate-500"
                      }`}
                    >
                      0{s.step}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isClinician
                          ? "bg-teal-100 text-teal-900 font-bold"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {s.role}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold tracking-tight text-slate-950 line-clamp-1">
                    {s.label}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep Inspector */}
          <div className="rounded-3xl bg-slate-50 border border-slate-300 p-6 sm:p-8 lg:p-10 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      activeStep.role === "CLINICIAN"
                        ? "bg-teal-100 text-teal-900 border-teal-300"
                        : "bg-slate-200 text-slate-800 border-slate-300"
                    }`}
                  >
                    STEP 0{activeStep.step} • {activeStep.phase}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    AUTHORITY: {activeStep.role}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {activeStep.label}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md bg-teal-700 text-white">
                <StepIcon className="h-6 w-6" />
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
              {activeStep.description}
            </p>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Clinical Input
                </span>
                <span className="font-bold text-slate-900 block text-xs">
                  {activeStep.clinicalInput}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Processing Engine
                </span>
                <span className="font-bold text-slate-900 block text-xs">
                  {activeStep.processingEngine}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-[10px] text-teal-700 block font-bold uppercase">
                  Safety Gate / Threshold
                </span>
                <span className="font-bold text-teal-950 block text-xs">
                  {activeStep.safetyThreshold}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-teal-50 text-teal-950 border border-teal-200 space-y-1 shadow-2xs">
                <span className="text-[10px] text-teal-800 block font-bold uppercase">
                  Output Artifact
                </span>
                <span className="font-bold text-teal-950 block text-xs">
                  {activeStep.outputArtifact}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
