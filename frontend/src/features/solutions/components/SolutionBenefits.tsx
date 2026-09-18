"use client";

import React from "react";
import {
  Eye,
  Zap,
  UserCheck,
  Network,
  Layers,
  Heart,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface BenefitCard {
  title: string;
  quote: string;
  metric: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

const BENEFITS: BenefitCard[] = [
  {
    title: "Better Visibility",
    quote: "Bring important healthcare information into a clearer view.",
    metric: "Unified Dashboard",
    description:
      "Synthesize fragmented records, lab values, and live telemetry feeds into a single, high-contrast, uncluttered interface.",
    icon: Eye,
    accent: "bg-teal-50 text-teal-600 border-teal-100",
  },
  {
    title: "Faster Insights",
    quote: "Help professionals understand relevant information sooner.",
    metric: "4-Hour Sepsis Lead Time",
    description:
      "Automate early risk scoring and anomaly detection so clinical teams can intervene hours before severe physiological deterioration.",
    icon: Zap,
    accent: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    title: "Personalized Intelligence",
    quote: "Deliver insights based on authorized patient and healthcare context.",
    metric: "Patient-Specific Baseline",
    description:
      "Calibrate alerts against a patient's individual baseline history rather than generic population averages that cause alarm fatigue.",
    icon: UserCheck,
    accent: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    title: "Connected Workflows",
    quote: "Connect data, AI and healthcare professionals.",
    metric: "Sub-Second Sync",
    description:
      "Bridge bedside nursing, physician rounds, and administrative capacity planning with unified, synchronized communication.",
    icon: Network,
    accent: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    title: "Explainable AI",
    quote: "Make model-supported insights easier to understand and review.",
    metric: "TreeSHAP Transparency",
    description:
      "Deconstruct ML probabilities into readable TreeSHAP feature contributions with clinical uncertainty indicators.",
    icon: Layers,
    accent: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    title: "Human-Centered Care",
    quote: "Keep healthcare professionals at the center of important decisions.",
    metric: "Clinician Authority",
    description:
      "Reinforce clinician autonomy. Technology assists and informs; the human clinician diagnoses, treats, and cares.",
    icon: Heart,
    accent: "bg-rose-50 text-rose-600 border-rose-100",
  },
];

export function SolutionBenefits() {
  return (
    <section className="py-16 sm:py-22 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>MEASURABLE VALUE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Key Benefits for Healthcare Delivery
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Delivering tangible clinical clarity, reduced cognitive overhead, and stronger patient safety across all health encounters.
          </p>
        </div>

        {/* 6 Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-1 transition-all flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${benefit.accent} group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {benefit.metric}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-teal-700 transition-colors mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-xs font-semibold text-teal-700 italic mb-3">
                    &ldquo;{benefit.quote}&rdquo;
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
