"use client";

import React from "react";

interface TimelineStage {
  step: string;
  title: string;
  subtitle: string;
  description: string;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    step: "01",
    title: "Clinical Need Identified",
    subtitle: "FOUNDATIONAL RESEARCH",
    description:
      "Critical care physicians and informaticists observed alarm fatigue and preventable clinical deterioration delays across acute wards.",
  },
  {
    step: "02",
    title: "Model Validation",
    subtitle: "COHORT EVALUATION",
    description:
      "Trained and calibrated ensemble models on 50,000+ patient encounters, achieving ROC-AUC 0.94 with rigorous Brier score calibration.",
  },
  {
    step: "03",
    title: "Safety Architecture",
    subtitle: "DETERMINISTIC GATES",
    description:
      "Engineered hardcoded clinical safeguards (qSOFA, NEWS2) and bidirectional HL7 FHIR interoperability with zero-PHI memory boundaries.",
  },
  {
    step: "04",
    title: "Multi-Agent Swarm",
    subtitle: "POLICY GOVERNANCE",
    description:
      "Integrated Ruflo hierarchical coordination to audit predictions, calculate uncertainty bounds, and enforce mandatory clinician sign-off.",
  },
  {
    step: "05",
    title: "Hospital-Wide Deployment",
    subtitle: "POINT-OF-CARE IMPACT",
    description:
      "Active bedside monitoring providing sub-20ms real-time deterioration alerts directly inside doctor and nurse triage workflows.",
  },
];

export function JourneyTimeline() {
  return (
    <section id="journey" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            OUR JOURNEY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            From Data to Meaningful Clinical Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            How rigorous clinical research and machine learning engineering evolved into an
            integrated hospital decision-support ecosystem.
          </p>
        </div>

        {/* Desktop Horizontal Timeline (Visible on lg+) */}
        <div className="hidden lg:block relative pt-6 pb-2">
          {/* Subtle Connecting Line */}
          <div
            aria-hidden="true"
            className="absolute top-12 left-12 right-12 h-0.5 bg-slate-200"
          />

          <div className="grid grid-cols-5 gap-6 relative z-10">
            {TIMELINE_STAGES.map((stage) => (
              <div key={stage.step} className="flex flex-col items-center text-center space-y-3.5">
                {/* Numbered Circle with Pinpoint Node */}
                <div className="h-12 w-12 rounded-full bg-white border-2 border-teal-500 shadow-sm flex items-center justify-center font-mono font-extrabold text-sm text-teal-800 transition-transform hover:scale-110">
                  {stage.step}
                </div>

                <div className="space-y-1.5 px-2">
                  <span className="text-[10px] font-mono font-bold text-teal-700 uppercase tracking-wide block">
                    {stage.subtitle}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 tracking-tight">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet Vertical Timeline (Visible below lg) */}
        <div className="lg:hidden relative pl-6 sm:pl-8 space-y-8">
          {/* Vertical Connecting Line */}
          <div
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-4 sm:left-5 w-0.5 bg-slate-200"
          />

          {TIMELINE_STAGES.map((stage) => (
            <div key={stage.step} className="relative pl-6 sm:pl-8 space-y-1.5">
              {/* Numbered Node on Line */}
              <div className="absolute top-0 -left-4 sm:-left-5 h-8 w-8 rounded-full bg-white border-2 border-teal-500 shadow-2xs flex items-center justify-center font-mono font-extrabold text-xs text-teal-800">
                {stage.step}
              </div>

              <span className="text-[10px] font-mono font-bold text-teal-700 uppercase tracking-wide block">
                {stage.subtitle}
              </span>
              <h3 className="text-base font-bold text-slate-950 tracking-tight">
                {stage.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {stage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
