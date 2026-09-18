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
  Sparkles,
  Lock,
  Award,
  Activity,
} from "lucide-react";

interface ResponsiblePillar {
  title: string;
  subtitle: string;
  description: string;
  auditStamp: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
  points: string[];
}

const PILLARS: ResponsiblePillar[] = [
  {
    title: "Human Oversight",
    subtitle: "CLINICIAN IN THE LOOP",
    description:
      "AI never issues standalone prescriptions or autonomous diagnoses. Clinicians inspect risk probabilities and retain final clinical sign-off.",
    auditStamp: "Attending Gate: Mandatory",
    icon: UserCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800 border-blue-200",
    hoverBorder: "hover:border-blue-400 hover:shadow-blue-500/5",
    points: [
      "Mandatory attending physician sign-off gate",
      "Explicit audit documentation for clinical overrides",
      "Zero autonomous prescriptions or therapies",
    ],
  },
  {
    title: "Absolute Explainability",
    subtitle: "INTERPRETABLE INFERENCES",
    description:
      "Black-box predictions are prohibited. Every patient risk score is paired with localized TreeSHAP feature attributions and entropy bounds.",
    auditStamp: "TreeSHAP Local Attributions",
    icon: Eye,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800 border-amber-200",
    hoverBorder: "hover:border-amber-400 hover:shadow-amber-500/5",
    points: [
      "TreeSHAP additive feature attributions",
      "Shannon entropy uncertainty abstention flags",
      "Biologically plausible range validation checks",
    ],
  },
  {
    title: "Privacy & Security",
    subtitle: "ZERO PHI LEAKAGE",
    description:
      "All persistent records reside securely in Neon PostgreSQL. Patient PHI is excluded from external agent memories, and role boundaries are audited.",
    auditStamp: "Authoritative Neon Store",
    icon: ShieldCheck,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-800 border-teal-200",
    hoverBorder: "hover:border-teal-400 hover:shadow-teal-500/5",
    points: [
      "Neon PostgreSQL sole authoritative store",
      "Least-privilege RBAC matrices across 5 roles",
      "Stateless context minimization before inference",
    ],
  },
  {
    title: "Continuous Drift Monitoring",
    subtitle: "EMPIRICAL CALIBRATION",
    description:
      "Models undergo ongoing drift analysis (PSI, KS-tests), Brier score calibration, and sensitivity audits to guard against performance decay.",
    auditStamp: "PSI Drift Detection Active",
    icon: TrendingUp,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800 border-purple-200",
    hoverBorder: "hover:border-purple-400 hover:shadow-purple-500/5",
    points: [
      "Continuous Brier score calibration audits",
      "Population Stability Index (PSI) drift alarms",
      "Automated governance alerts to MLOps team",
    ],
  },
];

export function ResponsibleAISection() {
  return (
    <section id="responsible-ai" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>ETHICAL AI &amp; SAFETY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Responsible Intelligence{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              by Design
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            We hold our clinical AI models to the highest institutional standards of patient safety,
            probabilistic calibration, explainability, and regulatory governance.
          </p>

          {/* Standards Badges Strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono font-semibold text-slate-600">
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <Award className="h-3 w-3 text-teal-600" />
              FDA SaMD Aligned
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-teal-600" />
              HIPAA Omnibus Rule
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              SOC 2 Type II
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-teal-600" />
              HL7 FHIR v4.0.1
            </span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.title}
                className={`rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col justify-between ${pillar.hoverBorder} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 shadow-xs group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-11 w-11 rounded-xl border border-slate-200/80 ${pillar.iconBg} ${pillar.iconColor} flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110`}
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
                    <h3 className="text-base font-bold text-slate-950 tracking-tight mb-2 group-hover:text-teal-700 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>

                {/* Sub-points and Audit Stamp */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                  {pillar.points.map((point) => (
                    <div key={point} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">{point}</span>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-dashed border-slate-200 text-[10px] font-mono font-bold text-slate-500 flex items-center justify-between">
                    <span>{pillar.auditStamp}</span>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Clinical Disclaimer Banner (Strict Healthcare Invariant) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-50/80 via-white to-slate-50 border border-teal-200/90 text-teal-950 shadow-sm max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
            <FileCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-950 tracking-tight">
                FDA CDSS Non-Device Guidance &amp; Regulatory Standard
              </h4>
              <span className="text-[9px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                STATUTORY NOTICE
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              HealthNova AI functions strictly as an assistive Clinical Decision Support (CDSS) system.
              Outputs <strong className="font-semibold text-slate-900">should not be treated as an autonomous medical diagnosis or treatment decision</strong>.
              All predictions, clinical scores, and recommendations are subject to the independent verification, evaluation,
              and sign-off of licensed medical professionals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
