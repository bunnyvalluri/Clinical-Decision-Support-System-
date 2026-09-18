"use client";

import React from "react";
import {
  UserCheck,
  Eye,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ResponsiblePillar {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  points: string[];
}

const PILLARS: ResponsiblePillar[] = [
  {
    title: "Human Oversight",
    subtitle: "Clinician in the Loop",
    description:
      "AI never issues standalone prescriptions or autonomous diagnoses. Clinicians inspect risk probabilities and retain final clinical sign-off.",
    icon: UserCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50/80",
    badgeText: "text-blue-800 border-blue-200",
    points: [
      "Mandatory attending sign-off gate",
      "Explicit override documentation",
      "Zero autonomous prescriptions",
    ],
  },
  {
    title: "Absolute Explainability",
    subtitle: "Interpretable Inferences",
    description:
      "Black-box predictions are prohibited. Every patient risk score is paired with localized TreeSHAP feature attributions and entropy bounds.",
    icon: Eye,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badgeBg: "bg-amber-50/80",
    badgeText: "text-amber-800 border-amber-200",
    points: [
      "TreeSHAP additive attributions",
      "Shannon entropy uncertainty flags",
      "Biologically plausible range checks",
    ],
  },
  {
    title: "Privacy & Security",
    subtitle: "Zero PHI Leakage",
    description:
      "All persistent records reside securely in Neon PostgreSQL. Patient PHI is excluded from external agent memories, and role boundaries are audited.",
    icon: ShieldCheck,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50/80",
    badgeText: "text-teal-800 border-teal-200",
    points: [
      "Neon PostgreSQL authoritative store",
      "Least-privilege RBAC matrices",
      "Context minimization before inference",
    ],
  },
  {
    title: "Continuous Drift Monitoring",
    subtitle: "Empirical Calibration",
    description:
      "Models undergo ongoing drift analysis (PSI, KS-tests), Brier score calibration, and sensitivity audits to guard against performance decay.",
    icon: TrendingUp,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50/80",
    badgeText: "text-purple-800 border-purple-200",
    points: [
      "Periodic calibration audits",
      "Population Stability Index (PSI)",
      "Automated drift alerts to MLOps",
    ],
  },
];

export function ResponsibleAISection() {
  return (
    <section id="responsible-ai" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            ETHICAL AI &amp; SAFETY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Responsible Intelligence by Design
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            We hold our clinical AI models to the highest standards of safety, transparency, and statistical rigor.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition-all duration-200 shadow-2xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-11 w-11 rounded-xl border border-slate-200/80 ${pillar.iconBg} ${pillar.iconColor} flex items-center justify-center shadow-2xs`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${pillar.badgeBg} ${pillar.badgeText}`}
                    >
                      {pillar.subtitle}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>

                {/* Sub-points */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                  {pillar.points.map((point) => (
                    <div key={point} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Disclaimer Banner */}
        <div className="p-6 rounded-3xl bg-teal-50/60 border border-teal-200/80 text-teal-950 shadow-2xs max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-xs">
            <FileCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2">
              <span>FDA CDSS Non-Device Guidance &amp; Regulatory Standard</span>
            </h4>
            <p className="text-xs text-teal-900/90 leading-relaxed">
              HealthNova AI functions strictly as an assistive Clinical Decision Support (CDSS) system.
              Outputs <strong className="font-semibold">should not be treated as an autonomous medical diagnosis or treatment decision</strong>.
              All predictions, clinical scores, and recommendations are subject to the independent verification, evaluation,
              and sign-off of licensed medical professionals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
