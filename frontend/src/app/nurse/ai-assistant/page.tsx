"use client";

import * as React from "react";
import { AIChat } from "@/components/ai/AIChat";
import { Activity, ShieldCheck } from "lucide-react";

const NURSE_QUERIES = [
  { label: "qSOFA Triage Checklist", text: "What are the bedside criteria for rapid qSOFA evaluation?" },
  { label: "Hypokalemia Protocol", text: "Summarize nursing telemetry and infusion safety protocols for potassium < 3.0 mmol/L." },
  { label: "Sepsis Early Warning Signs", text: "What vital sign combinations require immediate clinical escalation for sepsis?" },
  { label: "Glycemic Escalation Criteria", text: "What are the standard nursing parameters for notifying the physician of refractory hypoglycemia?" },
];

export default function NurseAIAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 p-4 md:p-6 bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Nurse Clinical Workflow Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Bedside protocol guidance, triage checklist verification, and escalation guidelines.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Nursing Protocol Support · Deterministic Safety Precedence</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AIChat
          agentRole="NURSE"
          roleSubtitle="Bedside Triage · Nursing Care Protocols · Clinical Escalation"
          initialGreeting="Hello, Nurse. I am your HealthNova Clinical Workflow Assistant. I provide rapid access to hospital nursing care protocols, vital sign triage criteria (qSOFA, NEWS2), and escalation guidelines. How may I assist your shift workflow?"
          suggestedQueries={NURSE_QUERIES}
        />
      </div>
    </div>
  );
}
