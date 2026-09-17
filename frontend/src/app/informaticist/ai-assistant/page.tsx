"use client";

import * as React from "react";
import { AIChat } from "@/components/ai/AIChat";
import { BarChart3, ShieldCheck } from "lucide-react";

const INFORMATICIST_QUERIES = [
  { label: "Population Stability Index", text: "Audit feature drift and PSI metrics for systolic_bp over the last 30 days." },
  { label: "Model Calibration Analysis", text: "Summarize Brier scores and calibration curves for the production Random Forest model." },
  { label: "RAG Grounding Benchmark", text: "What is the average citation precision and grounding compliance rate across the golden evaluation suite?" },
  { label: "False Positive Distribution", text: "Analyze prediction distribution shifts and false positive clusters in high-risk triage." },
];

export default function InformaticistAIAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 p-4 md:p-6 bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Medical Informatics & MLOps Assistant
          </h1>
          <p className="text-xs text-slate-500">
            ML model calibration analysis, feature drift auditing (PSI), and population health distribution analytics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="h-4 w-4 text-purple-600" />
          <span>De-identified / Aggregated Analytics Only · Zero Raw PHI</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AIChat
          agentRole="INFORMATICIST"
          roleSubtitle="MLOps Analytics · Feature Drift · Calibration · Model Registry"
          initialGreeting="Hello, Informaticist. I am your HealthNova MLOps & Data Analysis Assistant. I can help you evaluate feature drift (PSI, KS-test), inspect ensemble calibration, and audit RAG grounding metrics. No raw patient identifiers are processed."
          suggestedQueries={INFORMATICIST_QUERIES}
        />
      </div>
    </div>
  );
}
