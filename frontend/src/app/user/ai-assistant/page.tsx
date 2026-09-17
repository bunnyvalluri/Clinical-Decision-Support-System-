"use client";

import * as React from "react";
import { AIChat } from "@/components/ai/AIChat";
import { HeartPulse, ShieldCheck, HelpCircle } from "lucide-react";

const PATIENT_QUERIES = [
  { label: "Blood Pressure Numbers", text: "What do the systolic and diastolic numbers mean on my blood pressure reading?" },
  { label: "A1C Lab Test Meaning", text: "Can you explain what an A1C test checks for in simple terms?" },
  { label: "Questions for My Doctor", text: "What important questions should I ask my doctor about managing hypertension?" },
  { label: "Healthy Habits for Blood Sugar", text: "What daily lifestyle habits can help maintain normal blood glucose levels?" },
];

export default function PatientAIAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 p-4 md:p-6 bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-blue-600" />
            Patient Health Education Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Ask questions about medical terms, lab tests, and prepare for your doctor consultations.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Educational Guidance Only · Not a Medical Diagnosis</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AIChat
          agentRole="PATIENT"
          roleSubtitle="Health Education · General Wellness · Visit Preparation"
          initialGreeting="Hello! I am your HealthNova Health Education Assistant. You can ask me questions about medical concepts, understanding your lab reports, or preparing questions for your next doctor's visit. Remember, I am here to help you understand health information, not to diagnose or prescribe treatments."
          suggestedQueries={PATIENT_QUERIES}
        />
      </div>
    </div>
  );
}
