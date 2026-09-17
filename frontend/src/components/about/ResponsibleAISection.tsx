import React from "react";
import {
  UserCheck,
  Eye,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface ResponsiblePillar {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  points: string[];
}

const PILLARS: ResponsiblePillar[] = [
  {
    title: "Human Oversight",
    subtitle: "Clinician in the Loop",
    description:
      "AI never issues standalone prescriptions or autonomous diagnoses. Clinicians inspect risk probabilities and retain final clinical sign-off.",
    icon: UserCheck,
    points: [
      "Clinician override workflows",
      "Immutable audit records",
      "Zero autonomous prescriptions",
    ],
  },
  {
    title: "Explainability",
    subtitle: "Interpretable Inferences",
    description:
      "Black-box predictions are prohibited. Every patient risk score is paired with localized TreeSHAP feature attributions and entropy bounds.",
    icon: Eye,
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
    points: [
      "Neon PostgreSQL authoritative store",
      "Least-privilege RBAC matrices",
      "Context minimization before inference",
    ],
  },
  {
    title: "Continuous Evaluation",
    subtitle: "Empirical Calibration",
    description:
      "Models undergo ongoing drift analysis (PSI, KS-tests), Brier score calibration, and sensitivity audits to guard against performance decay.",
    icon: TrendingUp,
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
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            CLINICAL SAFETY INVARIANTS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Responsible Intelligence by Design
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Our platform is built around the principle that intelligent healthcare technology must
            be useful, explainable, secure, and accountable.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl bg-slate-50/70 border border-slate-200 p-6 flex flex-col justify-between hover:border-teal-300 transition-all duration-200 shadow-2xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-700 shadow-xs">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-[11px] font-mono text-teal-700 uppercase font-semibold">
                      {pillar.subtitle}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/80 space-y-1.5">
                  {pillar.points.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <FileCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Disclaimer Banner (Visually noticeable, professional, not alarming) */}
        <div className="rounded-2xl bg-teal-50/60 border border-teal-200/90 p-5 sm:p-6 shadow-2xs max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-teal-900">
              Institutional Clinical Disclaimer
            </h4>
            <p className="text-xs sm:text-sm text-teal-950 leading-relaxed font-medium">
              AI-generated or machine-learning-assisted information is intended to support qualified
              healthcare professionals and should not be treated as an autonomous medical diagnosis
              or treatment decision.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
