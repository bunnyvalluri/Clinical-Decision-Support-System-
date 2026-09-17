import React from "react";
import { Check } from "lucide-react";

interface TimelineStage {
  step: string;
  title: string;
  description: string;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    step: "01",
    title: "Understanding the Problem",
    description:
      "Healthcare teams need timely and meaningful insights from increasingly complex patient data.",
  },
  {
    step: "02",
    title: "Building the Intelligence",
    description:
      "Machine learning models are developed and evaluated for patient risk prediction.",
  },
  {
    step: "03",
    title: "Making AI Understandable",
    description:
      "Explainability, validation, uncertainty, and human review are incorporated into the workflow.",
  },
  {
    step: "04",
    title: "Connecting the Ecosystem",
    description:
      "Clinical data, real-time infrastructure, AI, ML, and healthcare workflows operate together.",
  },
  {
    step: "05",
    title: "Continuously Improving",
    description:
      "Models, data quality, security, usability, and clinical workflows are continuously evaluated.",
  },
];

export function JourneyTimeline() {
  return (
    <section id="journey" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            OUR JOURNEY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            From Data to Meaningful Clinical Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            How rigorous clinical research and machine learning engineering evolved into an
            integrated decision-support ecosystem.
          </p>
        </div>

        {/* Desktop Horizontal Timeline (Visible on lg+) */}
        <div className="hidden lg:block relative pt-6 pb-2">
          {/* Subtle Connecting Line */}
          <div
            aria-hidden="true"
            className="absolute top-12 left-10 right-10 h-0.5 bg-slate-200"
          />

          <div className="grid grid-cols-5 gap-6 relative z-10">
            {TIMELINE_STAGES.map((stage) => (
              <div key={stage.step} className="flex flex-col items-center text-center space-y-4">
                {/* Numbered Circle with Pinpoint Node */}
                <div className="h-12 w-12 rounded-full bg-white border-2 border-teal-500 shadow-sm flex items-center justify-center font-mono font-extrabold text-sm text-teal-800 transition-transform hover:scale-110">
                  {stage.step}
                </div>

                <div className="space-y-2 px-1">
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
            <div key={stage.step} className="relative pl-6 sm:pl-8 space-y-2">
              {/* Numbered Node on Line */}
              <div className="absolute -left-6 sm:-left-7 top-0 h-9 w-9 rounded-full bg-white border-2 border-teal-500 shadow-xs flex items-center justify-center font-mono font-bold text-xs text-teal-800">
                {stage.step}
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs space-y-1">
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  {stage.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
