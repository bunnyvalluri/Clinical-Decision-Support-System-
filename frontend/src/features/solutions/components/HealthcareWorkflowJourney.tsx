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
  Sparkles,
} from "lucide-react";

interface JourneyStep {
  step: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    step: "01",
    title: "Patient Data",
    badge: "FHIR v4.0.1 Ingestion",
    description: "Historical EHR baseline and active vitals ingested securely with context minimization.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Health Assessment",
    badge: "Deterministic Rules",
    description: "Automated calculation of baseline tripwire scores (NEWS2, qSOFA, BMI).",
    icon: Stethoscope,
  },
  {
    step: "03",
    title: "Risk Prediction",
    badge: "ML Ensembles",
    description: "Calibrated ML models evaluate 30-day decompensation probability with confidence bounds.",
    icon: Cpu,
  },
  {
    step: "04",
    title: "Clinical Review",
    badge: "Human MD Sign-Off",
    description: "Licensed physician reviews TreeSHAP attributions and confirms clinical trajectory.",
    icon: UserCheck,
  },
  {
    step: "05",
    title: "Care Planning",
    badge: "Personalized Care",
    description: "Personalized protocol established with medication and lifestyle adjustments.",
    icon: ClipboardList,
  },
  {
    step: "06",
    title: "Continuous Monitoring",
    badge: "Live Telemetry",
    description: "Real-time wearable or bedside telemetry streaming detects subtle signal shifts.",
    icon: Activity,
  },
  {
    step: "07",
    title: "Follow-Up & Closure",
    badge: "Care Continuity",
    description: "Scheduled check-ins ensure therapy adherence, recovery, and long-term wellness.",
    icon: CalendarCheck,
  },
];

export function HealthcareWorkflowJourney() {
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
            return (
              <div
                key={item.step}
                className="group relative rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-1 transition-all flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-black text-teal-700">
                      STEP {item.step}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-teal-700 transition-colors mb-1 leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-semibold block mb-2 w-fit">
                    {item.badge}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator between steps */}
                {idx < JOURNEY_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="h-4 w-4 rounded-full bg-white border border-slate-300 flex items-center justify-center text-teal-600 shadow-2xs">
                      <ArrowRight className="h-2.5 w-2.5" />
                    </div>
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
