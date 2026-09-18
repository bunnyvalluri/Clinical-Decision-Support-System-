"use client";

import React from "react";
import {
  HeartPulse,
  Eye,
  UserCheck,
  Lock,
  Sliders,
  Layers,
} from "lucide-react";

interface Principle {
  title: string;
  ethos: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}

const PRINCIPLES: Principle[] = [
  {
    title: "Primum Non Nocere",
    ethos: "FIRST, DO NO HARM",
    description:
      "Algorithmic conservatism prioritizes patient safety above speculative inference. When confidence is low or uncertainty is high, the system defers immediately to bedside clinicians.",
    icon: HeartPulse,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    badgeBg: "bg-emerald-50/80",
    badgeText: "text-emerald-800 border-emerald-200",
  },
  {
    title: "Absolute Explainability",
    ethos: "TRANSPARENCY BY DEFAULT",
    description:
      "Black-box neural networks are never deployed without local interpretability. Every risk stratification output is accompanied by physiological TreeSHAP attributions and biological plausibility markers.",
    icon: Eye,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badgeBg: "bg-amber-50/80",
    badgeText: "text-amber-800 border-amber-200",
  },
  {
    title: "Clinician Autonomy",
    ethos: "AMPLIFY, NEVER REPLACE",
    description:
      "AI is an assistive colleague, never an autonomous decision-maker. We respect the clinician's intuition, bedside findings, and diagnostic authority with frictionless human-in-the-loop controls.",
    icon: UserCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50/80",
    badgeText: "text-blue-800 border-blue-200",
  },
  {
    title: "Privacy & Security by Design",
    ethos: "ZERO PHI EXPOSURE",
    description:
      "Context minimization ensures patient identifiers never leave authoritative Neon PostgreSQL stores. Role-based access control, TLS 1.3, and AES-256 encryption safeguard every telemetry byte.",
    icon: Lock,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50/80",
    badgeText: "text-teal-800 border-teal-200",
  },
  {
    title: "Continuous Calibration",
    ethos: "EMPIRICAL STEWARDSHIP",
    description:
      "Clinical populations drift across seasons and demographics. We continuously evaluate Population Stability Index (PSI), Kolmogorov-Smirnov statistics, and Brier calibration curves to prevent model decay.",
    icon: Sliders,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50/80",
    badgeText: "text-purple-800 border-purple-200",
  },
  {
    title: "Seamless Workflow Integration",
    ethos: "ZERO-FRICTION DELIVERY",
    description:
      "Intelligence is useless if buried behind separate logins. We integrate natively into EHR views via HL7 FHIR v4.0.1, mobile triage notifications, and ambient clinician dashboards.",
    icon: Layers,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
    badgeBg: "bg-indigo-50/80",
    badgeText: "text-indigo-800 border-indigo-200",
  },
];

export function PrinciplesSection() {
  return (
    <section id="principles" className="py-16 sm:py-24 bg-slate-50/50 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            CORE PHILOSOPHY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            The Principles That Guide Everything We Do
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Built on foundational medical ethics, strict algorithmic stewardship, and human-centered design.
          </p>
        </div>

        {/* 3x2 Responsive Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PRINCIPLES.map((principle) => {
            const IconComponent = principle.icon;
            return (
              <div
                key={principle.title}
                tabIndex={0}
                className="group rounded-2xl bg-white border border-slate-200/90 p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div className="space-y-4">
                  {/* Icon & Subtitle Tag */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-12 w-12 rounded-2xl border border-slate-200/80 ${principle.iconBg} ${principle.iconColor} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${principle.badgeBg} ${principle.badgeText}`}
                    >
                      {principle.ethos}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                    {principle.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {principle.description}
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
