"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  ShieldAlert,
  FileText,
  Activity,
  Cloud,
  Network,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CoreSolutionItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  spec: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  learnMoreHref: string;
}

const CORE_SOLUTIONS: CoreSolutionItem[] = [
  {
    id: "clinical-insights",
    title: "AI Clinical Insights",
    badge: "Bedside Support",
    description:
      "Transform raw vital timeseries, laboratory panels, and historical EHR trends into actionable clinical rationales to accelerate bedside decision-making.",
    spec: "TreeSHAP Attributions",
    icon: TrendingUp,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50 border-teal-200",
    learnMoreHref: "#ai-ml",
  },
  {
    id: "patient-engagement",
    title: "Patient Engagement",
    badge: "Personal Health",
    description:
      "Personalized communication tools, longitudinal health trends, and educational explanations that empower patients without generating medical alarm.",
    spec: "Plain-Language Insights",
    icon: Users,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-200",
    learnMoreHref: "#role-solutions",
  },
  {
    id: "predictive-risk",
    title: "Predictive Risk Analytics",
    badge: "Early Warning",
    description:
      "Detect deteriorating patient trajectories early using multi-model ML ensembles (XGBoost, SVM, Random Forest) with calibrated confidence bounds.",
    spec: "Calibrated Probabilities",
    icon: ShieldAlert,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-200",
    learnMoreHref: "#responsible-safety",
  },
  {
    id: "workflow-automation",
    title: "Workflow Automation",
    badge: "Clinician Relief",
    description:
      "Automate triage acuity scoring, routine documentation summaries, and alert routing to eliminate documentation burnout during busy ward rounds.",
    spec: "NEWS2 / qSOFA Auto-Score",
    icon: FileText,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200",
    learnMoreHref: "#healthcare-workflow",
  },
  {
    id: "remote-monitoring",
    title: "Remote Patient Monitoring",
    badge: "Continuous Telemetry",
    description:
      "Continuous health signal visibility through medical wearables and bedside telemetry with low-latency threshold alerts and noise suppression.",
    spec: "Sub-Second Ingestion",
    icon: Activity,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-200",
    learnMoreHref: "#realtime-intelligence",
  },
  {
    id: "secure-health-data",
    title: "Secure Health Data",
    badge: "Zero-Trust Security",
    description:
      "Role-based access control, cryptographic verification, context minimization, and immutable audit trails committed directly to PostgreSQL.",
    spec: "21 CFR Part 11 Aligned",
    icon: Cloud,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-200",
    learnMoreHref: "#security-privacy",
  },
  {
    id: "interoperability",
    title: "Interoperability",
    badge: "FHIR v4.0.1",
    description:
      "Seamless bidirectional integration with hospital EHRs (Epic, Cerner, Meditech) via HL7 FHIR v4.0.1 resources and standard DICOM interfaces.",
    spec: "Standard HL7 / FHIR",
    icon: Network,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50 border-violet-200",
    learnMoreHref: "#faq",
  },
  {
    id: "population-health",
    title: "Population Health",
    badge: "Cohort Intelligence",
    description:
      "Leverage aggregated population health analytics and predictive risk modeling to identify community health gaps and optimize hospital bed allocation.",
    spec: "Cohort Risk Stratification",
    icon: Lightbulb,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-200",
    learnMoreHref: "#results",
  },
];

export function CoreSolutions() {
  return (
    <section id="core-solutions" className="py-16 sm:py-22 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>CORE SOLUTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-black text-slate-950 tracking-tight">
            Comprehensive AI Solutions for Modern Healthcare
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            From calibrated predictive analytics to automated triage workflows, our modular solutions empower clinicians and safeguard high-acuity patients.
          </p>
        </div>

        {/* 8-Card Grid (4 cols on lg, 2 cols on md, 1 col on sm) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_SOLUTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xs hover:shadow-md hover:border-teal-400 hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center border ${item.iconBg} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className={`h-6 w-6 ${item.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-950 mb-2 group-hover:text-teal-700 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-5">
                    {item.description}
                  </p>
                </div>

                {/* Card Footer with Spec Tag & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {item.spec}
                  </span>
                  <a
                    href={item.learnMoreHref}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-teal-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
