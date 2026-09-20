"use client";

import React, { useState } from "react";
import { AI_INTELLIGENCE_CAPABILITIES } from "@/config/features";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  Cpu,
  Sliders,
  Activity,
  Award,
  Layers,
  FileCheck,
  Lock,
} from "lucide-react";

export function AIIntelligenceSection() {
  const [activeTab, setActiveTab] = useState<"capabilities" | "models" | "explainability">("capabilities");

  const MODEL_STACK = [
    {
      name: "CatBoost Gradient Boosting",
      role: "Champion Acute Triage",
      metric: "ROC-AUC 0.941",
      desc: "Handles categorical laboratory markers with symmetric tree architectures, minimizing overfitting on skewed clinical cohorts.",
      tags: ["Primary Classifier", "Sub-20ms Inference", "Platt Calibrated"],
    },
    {
      name: "Random Forest Ensemble",
      role: "Stability & Generalization",
      metric: "Brier Score < 0.08",
      desc: "Robust bootstrap aggregated decision trees providing high entropy resilience against missing physiological data.",
      tags: ["Ensemble Member", "Variance Reduction", "Out-of-Bag Verified"],
    },
    {
      name: "TreeSHAP Attribution Engine",
      role: "Pathophysiological Explainability",
      metric: "Exact Additive Shapley",
      desc: "Computes mathematically provable additive feature importances for every vital and lab assay in polynomial time.",
      tags: ["Local Attributions", "Zero Hallucination", "Bedside Waterfall"],
    },
  ];

  return (
    <section id="ai-intelligence" className="py-10 sm:py-16 lg:py-20 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>AI INFRASTRUCTURE &amp; EXPLAINABILITY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Intelligence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A comprehensive suite of calibrated machine learning ensembles, governed multi-agent safety roles,
            and exact TreeSHAP attributions designed to support physician decision-making.
          </p>

          {/* Segmented Architecture Navigation */}
          <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-2xl max-w-md mx-auto mt-4 border border-slate-200 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("capabilities")}
              className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "capabilities"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              12 Capabilities
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("models")}
              className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "models"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ML Stack (AUC 0.94)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("explainability")}
              className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "explainability"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              TreeSHAP Engine
            </button>
          </div>
        </div>

        {/* Tab 1: 12 AI Capabilities Structured Grid */}
        {activeTab === "capabilities" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 animate-in fade-in duration-200">
            {AI_INTELLIGENCE_CAPABILITIES.map((cap) => {
              const IconComponent = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-200/90 p-3.5 sm:p-5 flex flex-col items-center text-center justify-between shadow-2xs hover:bg-white hover:border-teal-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-default"
                >
                  <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight mb-1 group-hover:text-teal-800 transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-[10px] font-mono font-semibold text-teal-700 uppercase tracking-wide">
                      {cap.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Model Stack View */}
        {activeTab === "models" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {MODEL_STACK.map((mod) => (
              <div
                key={mod.name}
                className="rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-200 p-4 sm:p-6 space-y-3 sm:space-y-4 hover:bg-white hover:border-teal-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-teal-100 text-teal-900 border border-teal-200">
                    {mod.metric}
                  </span>
                  <Cpu className="h-5 w-5 text-teal-700" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider block">
                    {mod.role}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5">{mod.name}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                  {mod.tags.map((tag) => (
                    <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: TreeSHAP Explainability View */}
        {activeTab === "explainability" && (
          <div className="rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-200 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="max-w-2xl space-y-2">
              <h3 className="text-lg font-bold text-slate-950">Additive Pathophysiological Attribution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than treating neural predictions as black boxes, TreeSHAP attributes exact credit to each vital sign, laboratory assay, and ECG marker, confirming biological plausibility before bedside alerting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-rose-700 uppercase">Risk Drivers (+)</span>
                <p className="text-xs text-slate-700">Serum Lactate &gt; 3.5, MAP &lt; 65 mmHg, and elevated ST-segment depression increase trajectory risk score.</p>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Protective Markers (-)</span>
                <p className="text-xs text-slate-700">Preserved left ventricular ejection fraction (&gt; 55%) and nominal urine output counteract acute risk tiers.</p>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-teal-700 uppercase">Epistemic Uncertainty</span>
                <p className="text-xs text-slate-700">Shannon entropy bounds flag cases with insufficient physiological data for mandatory manual chart review.</p>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Clinical Governance & Human-in-the-Loop Callout */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-300 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
            <div className="h-12 w-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-800/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-950">
                  Ethical AI Invariants &amp; Clinician Safeguards
                </h4>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                  POLICY-GOVERNED
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Governed by hierarchical agent tool execution and mandatory human clinician validation gates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700 leading-relaxed">
            <div className="space-y-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <p className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>What AI Does:</span>
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Calculates calibrated risk priors, extracts longitudinal physiological patterns, decomposes
                additive TreeSHAP feature weights, surfaces epistemic uncertainty bounds, and retrieves approved
                institutional care protocols.
              </p>
            </div>
            <div className="space-y-2 p-5 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <p className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                <XCircle className="h-4 w-4 text-rose-700 shrink-0" />
                <span>What AI Never Does:</span>
              </p>
              <p className="text-slate-700 text-xs leading-relaxed">
                <strong className="text-rose-950 font-bold">Never diagnoses autonomously</strong>, prescribes
                medications, orders invasive treatments, alters EHR records without clinician sign-off, or
                overrides the professional medical judgment of a licensed attending physician.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
