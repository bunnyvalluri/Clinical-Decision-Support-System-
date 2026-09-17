"use client";

import * as React from "react";
import { AIChat } from "@/components/ai/AIChat";
import { Stethoscope, ShieldCheck } from "lucide-react";

const DOCTOR_QUERIES = [
  { label: "Sepsis Resuscitation Protocol", text: "What is the SSC-2021 protocol for lactic acid 3.4 mmol/L with MAP < 65?" },
  { label: "KDIGO AKI Criteria", text: "Check KDIGO stage 2 AKI criteria for creatinine 2.3 mg/dL rising from baseline 1.0 mg/dL." },
  { label: "ACS Differential Evaluation", text: "Evaluate protocol recommendations for acute chest pain with ST depression and elevated troponin." },
  { label: "Heart Failure GDMT", text: "Summarize guideline-directed medical therapy for acute decompensated heart failure." },
  { label: "Hypoxia Escalation", text: "What are the clinical escalation criteria for acute hypoxemic respiratory failure with SpO2 < 90%?" },
];

export default function DoctorAIAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 p-4 md:p-6 bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Physician AI Clinical Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Literature-grounded clinical decision support, calibrated risk prediction explanation, and protocol synthesis.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Human-in-the-Loop · Physician Sign-Off Required</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AIChat
          agentRole="DOCTOR"
          roleSubtitle="Clinical Decision Support · Grounded Literature (SSC, KDIGO, AHA) · Multi-Agent Governance"
          initialGreeting="Hello, Doctor. I am your HealthNova AI Clinical Assistant. I can assist you with grounded clinical guideline retrieval, calibrated ML risk explanations, and draft encounter notes. All clinical actions operate strictly under Human-in-the-Loop governance."
          suggestedQueries={DOCTOR_QUERIES}
        />
      </div>
    </div>
  );
}
