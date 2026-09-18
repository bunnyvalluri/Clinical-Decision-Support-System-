"use client";

import React from "react";
import {
  FileText,
  Stethoscope,
  Cpu,
  UserCheck,
  ClipboardList,
  Activity,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";

interface JourneyStep {
  step: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    step: "01",
    title: "Patient Data",
    description: "Historical EHR baseline and active vitals ingested securely.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Health Assessment",
    description: "Automated calculation of baseline scores (NEWS2, qSOFA, BMI).",
    icon: Stethoscope,
  },
  {
    step: "03",
    title: "Risk Prediction",
    description: "Calibrated ML models evaluate 30-day decompensation probability.",
    icon: Cpu,
  },
  {
    step: "04",
    title: "Clinical Review",
    description: "Licensed MD reviews TreeSHAP attributions and clinical timeline.",
    icon: UserCheck,
  },
  {
    step: "05",
    title: "Care Planning",
    description: "Personalized protocol established with medication and lifestyle adjustments.",
    icon: ClipboardList,
  },
  {
    step: "06",
    title: "Continuous Monitoring",
    description: "Real-time wearable or telemetry streaming detects subtle shifts.",
    icon: Activity,
  },
  {
    step: "07",
    title: "Follow-Up & Closure",
    description: "Scheduled check-ins ensure therapy adherence and recovery.",
    icon: CalendarCheck,
  },
];

export function HealthcareWorkflowJourney() {
  return (
    <section id="healthcare-workflow" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            LONGITUDINAL CARE PATHWAY
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            The Connected Patient Care Journey
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Guiding patient encounters from initial physiological intake through predictive review, evidence-informed intervention, and ongoing recovery monitoring.
          </p>
        </div>

        {/* 7-Step Journey Grid / Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5 relative">
          {JOURNEY_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="group relative rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-teal-700">
                      STEP {step.step}
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Arrow */}
                {idx < JOURNEY_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
