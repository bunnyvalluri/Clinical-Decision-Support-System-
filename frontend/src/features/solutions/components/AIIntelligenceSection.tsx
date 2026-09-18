"use client";

import React from "react";
import {
  Cpu,
  Layers,
  TrendingUp,
  BrainCircuit,
  Search,
  Activity,
  LineChart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface AICapability {
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
}

const AI_CAPABILITIES: AICapability[] = [
  {
    title: "Patient Risk Prediction",
    category: "Supervised Learning",
    description:
      "Predict patient physiological risk probabilities using evaluated ensemble models calibrated on historical cohort distributions.",
    icon: Cpu,
  },
  {
    title: "Risk Classification",
    category: "Triage Categorization",
    description:
      "Map vitals and clinical signals into Low, Moderate, and High acuity tiers to help care teams prioritize bedside interventions.",
    icon: Activity,
  },
  {
    title: "Longitudinal Trend Analysis",
    category: "Time-Series Intelligence",
    description:
      "Detect subtle vital degradation patterns before acute threshold breaches occur, giving clinicians earlier intervention windows.",
    icon: TrendingUp,
  },
  {
    title: "Explainable AI (TreeSHAP)",
    category: "Model Interpretability",
    description:
      "Deconstruct model predictions into individual feature attribution contributions so clinicians understand why a patient was flagged.",
    icon: Layers,
  },
  {
    title: "Clinical Data Intelligence",
    category: "Semantic Harmonization",
    description:
      "Normalize heterogeneous EHR codes, vital telemetry streams, and lab panels into a unified, clean clinical observation model.",
    icon: BrainCircuit,
  },
  {
    title: "AI-Assisted Workflows",
    category: "Workflow Optimization",
    description:
      "Synthesize clinical intake notes, summarize shift event timelines, and pre-fill routine triage questionnaires under human supervision.",
    icon: Sparkles,
  },
  {
    title: "Population Health Analytics",
    category: "Epidemiological Insights",
    description:
      "Aggregated risk clustering and demographic distributions to inform public health strategy and institutional capacity planning.",
    icon: LineChart,
  },
  {
    title: "Clinical Knowledge Retrieval",
    category: "Evidence Grounding",
    description:
      "Retrieve clinically approved guidelines and relevant peer-reviewed medical references grounded strictly in institutional knowledge.",
    icon: Search,
  },
];

export function AIIntelligenceSection() {
  return (
    <section id="ai-ml" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            AI & MACHINE LEARNING FOUNDATION
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Intelligence Powered by AI & Machine Learning
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Engineered specifically for clinical decision support. Our algorithms prioritize mathematical interpretability, calibrated confidence intervals, and strict medical human oversight.
          </p>
        </div>

        {/* 8-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AI_CAPABILITIES.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {cap.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Clinician Reviewed</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Principles Bar */}
        <div className="mt-10 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Validated Architectures</p>
              <p className="text-slate-500">SVM, Random Forest & AdaBoost ensembles.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">TreeSHAP Explainability</p>
              <p className="text-slate-500">Instant feature contribution breakdowns.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Continuous Drift Auditing</p>
              <p className="text-slate-500">Automated PSI & KS-test statistical checks.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
