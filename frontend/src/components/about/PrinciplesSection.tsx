"use client";

import React from "react";
import {
  HeartPulse,
  Eye,
  UserCheck,
  Lock,
  Sliders,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface Principle {
  number: string;
  title: string;
  ethos: string;
  description: string;
  ruleProof: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  hoverBorder: string;
}

const PRINCIPLES: Principle[] = [
  {
    number: "01",
    title: "Primum Non Nocere",
    ethos: "FIRST, DO NO HARM",
    description:
      "Algorithmic conservatism prioritizes patient safety above speculative inference. When confidence is low or uncertainty is high, the system defers immediately to bedside clinicians.",
    ruleProof: "Epistemic uncertainty > 0.82 triggers immediate abstention",
    icon: HeartPulse,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800 border-emerald-200",
    accentBorder: "border-emerald-500",
    hoverBorder: "hover:border-emerald-400 hover:shadow-emerald-500/5",
  },
  {
    title: "Absolute Explainability",
    number: "02",
    ethos: "TRANSPARENCY BY DEFAULT",
    description:
      "Black-box neural networks are never deployed without local interpretability. Every risk stratification output is accompanied by physiological TreeSHAP attributions and biological plausibility markers.",
    ruleProof: "Exact additive Shapley feature attributions for every score",
    icon: Eye,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800 border-amber-200",
    accentBorder: "border-amber-500",
    hoverBorder: "hover:border-amber-400 hover:shadow-amber-500/5",
  },
  {
    title: "Clinician Autonomy",
    number: "03",
    ethos: "AMPLIFY, NEVER REPLACE",
    description:
      "AI is an assistive colleague, never an autonomous decision-maker. We respect the clinician's intuition, bedside findings, and diagnostic authority with frictionless human-in-the-loop controls.",
    ruleProof: "100% Attending Physician sign-off gate enforced",
    icon: UserCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800 border-blue-200",
    accentBorder: "border-blue-500",
    hoverBorder: "hover:border-blue-400 hover:shadow-blue-500/5",
  },
  {
    title: "Privacy & Security by Design",
    number: "04",
    ethos: "ZERO PHI EXPOSURE",
    description:
      "Context minimization ensures patient identifiers never leave authoritative Neon PostgreSQL stores. Role-based access control, TLS 1.3, and AES-256 encryption safeguard every telemetry byte.",
    ruleProof: "HIPAA & SOC 2 Type II zero-PHI agent memory boundary",
    icon: Lock,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-800 border-teal-200",
    accentBorder: "border-teal-500",
    hoverBorder: "hover:border-teal-400 hover:shadow-teal-500/5",
  },
  {
    title: "Continuous Calibration",
    number: "05",
    ethos: "EMPIRICAL STEWARDSHIP",
    description:
      "Clinical populations drift across seasons and demographics. We continuously evaluate Population Stability Index (PSI), Kolmogorov-Smirnov statistics, and Brier calibration curves to prevent model decay.",
    ruleProof: "Automated PSI drift detection with Brier calibration tracking",
    icon: Sliders,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800 border-purple-200",
    accentBorder: "border-purple-500",
    hoverBorder: "hover:border-purple-400 hover:shadow-purple-500/5",
  },
  {
    title: "Seamless Workflow Integration",
    number: "06",
    ethos: "ZERO-FRICTION DELIVERY",
    description:
      "Intelligence is useless if buried behind separate logins. We integrate natively into EHR views via HL7 FHIR v4.0.1, mobile triage notifications, and ambient clinician dashboards.",
    ruleProof: "SMART-on-FHIR embedded launch into Epic & Cerner",
    icon: Layers,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-800 border-indigo-200",
    accentBorder: "border-indigo-500",
    hoverBorder: "hover:border-indigo-400 hover:shadow-indigo-500/5",
  },
];

export function PrinciplesSection() {
  return (
    <section id="principles" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>CORE PHILOSOPHY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            The Principles That{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Guide Everything We Do
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Built on foundational medical ethics, strict algorithmic stewardship, and human-centered design for mission-critical healthcare.
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
                className={`group rounded-2xl bg-white border border-slate-200/90 p-7 shadow-xs ${principle.hoverBorder} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 relative overflow-hidden`}
              >
                <div className="space-y-4">
                  {/* Top Row: Icon, Number & Ethos Tag */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-12 w-12 rounded-2xl border border-slate-200/80 ${principle.iconBg} ${principle.iconColor} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${principle.badgeBg} ${principle.badgeText}`}
                      >
                        {principle.ethos}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-slate-300">
                        {principle.number}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight group-hover:text-teal-700 transition-colors">
                    {principle.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>

                {/* Concrete Rule Proof Bottom Tag */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{principle.ruleProof}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
