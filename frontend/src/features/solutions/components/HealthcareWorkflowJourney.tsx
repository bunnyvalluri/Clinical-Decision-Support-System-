"use client";

import React, { useState } from "react";
import {
  FileText,
  Stethoscope,
  Cpu,
  UserCheck,
  ClipboardList,
  Activity,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface JourneyStep {
  step: string;
  title: string;
  badge: string;
  description: string;
  governanceCheckpoint: string;
  icon: React.ElementType;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    step: "01",
    title: "Patient Data",
    badge: "FHIR v4.0.1 Ingestion",
    description: "Historical EHR baseline and active vitals ingested securely with context minimization.",
    governanceCheckpoint: "De-identified via Context Builder",
    icon: FileText,
  },
  {
    step: "02",
    title: "Health Assessment",
    badge: "Deterministic Rules",
    description: "Automated calculation of baseline tripwire scores (NEWS2, qSOFA, BMI).",
    governanceCheckpoint: "Zero hallucination deterministic gate",
    icon: Stethoscope,
  },
  {
    step: "03",
    title: "Risk Prediction",
    badge: "ML Ensembles",
    description: "Calibrated ML models evaluate 30-day decompensation probability with confidence bounds.",
    governanceCheckpoint: "Brier Loss ECE < 2.5%",
    icon: Cpu,
  },
  {
    step: "04",
    title: "Clinical Review",
    badge: "Human MD Sign-Off",
    description: "Licensed physician reviews TreeSHAP attributions and confirms clinical trajectory.",
    governanceCheckpoint: "Mandatory human-in-the-loop sign-off",
    icon: UserCheck,
  },
  {
    step: "05",
    title: "Care Planning",
    badge: "Personalized Care",
    description: "Personalized protocol established with medication and lifestyle adjustments.",
    governanceCheckpoint: "EHR writeback authenticated",
    icon: ClipboardList,
  },
  {
    step: "06",
    title: "Continuous Monitoring",
    badge: "Live Telemetry",
    description: "Real-time wearable or bedside telemetry streaming detects subtle signal shifts.",
    governanceCheckpoint: "Sub-second WebSocket stream",
    icon: Activity,
  },
  {
    step: "07",
    title: "Follow-Up & Closure",
    badge: "Care Continuity",
    description: "Scheduled check-ins ensure therapy adherence, recovery, and long-term wellness.",
    governanceCheckpoint: "Audit committed to Neon DB",
    icon: CalendarCheck,
  },
];

export function HealthcareWorkflowJourney() {
  const [selectedStep, setSelectedStep] = useState<number>(3);
  const activeStep = JOURNEY_STEPS[selectedStep];

  return (
    <section id="healthcare-workflow" className="py-16 sm:py-22 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>LONGITUDINAL CARE PATHWAY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            The Connected Patient Care Journey
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Guiding patient encounters from initial physiological intake through predictive review, evidence-informed intervention, and ongoing recovery monitoring.
          </p>
        </div>

        {/* 7-Step Horizontal / Grid Journey */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 relative">
          {JOURNEY_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = selectedStep === idx;
            return (
              <div
                key={item.step}
                onClick={() => setSelectedStep(idx)}
                className={`group relative rounded-2xl bg-white border p-4 shadow-2xs transition-all flex flex-col justify-between text-left cursor-pointer ${
                  isSelected
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                    : "border-slate-200 hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-black text-teal-700">
                      STEP {item.step}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-teal-700 transition-colors mb-1 leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-semibold block mb-2 w-fit">
                    {item.badge}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator between steps */}
                {idx < JOURNEY_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="h-4 w-4 rounded-full bg-white border border-slate-300 flex items-center justify-center text-teal-600 shadow-2xs">
                      <ArrowRight className="h-2.5 w-2.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Governance Banner */}
        <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="font-bold text-slate-900">
              Step {activeStep.step} ({activeStep.title}) Governance Check:
            </span>
            <span className="text-slate-600">{activeStep.governanceCheckpoint}</span>
          </div>
          <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
            Status: VERIFIED &amp; COMPLIANT
          </span>
        </div>
      </div>
    </section>
  );
}
