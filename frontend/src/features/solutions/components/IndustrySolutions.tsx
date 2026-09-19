"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Stethoscope,
  Home,
  Users2,
  ArrowRight,
  ShieldCheck,
  Activity,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface IndustryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  capabilities: string[];
  metrics: { label: string; value: string }[];
  icon: React.ElementType;
  accentBg: string;
  accentColor: string;
  tag: string;
  learnMoreHref: string;
}

const INDUSTRY_SOLUTIONS: IndustryItem[] = [
  {
    id: "hospitals",
    title: "Hospitals & Health Systems",
    category: "Tertiary & Acute Care",
    description:
      "Improve inpatient operational throughput, reduce 30-day preventable readmissions, and deliver standardized, high-quality care across high-acuity wards.",
    capabilities: [
      "Continuous multi-lead telemetry integration",
      "Automated qSOFA and NEWS2 sepsis tripwires",
      "Sub-second WebSocket alert routing to on-duty teams",
    ],
    metrics: [
      { label: "Readmission Drop", value: "-32%" },
      { label: "Alert Lead Time", value: "+4.2 hrs" },
    ],
    icon: Building2,
    accentBg: "bg-teal-50",
    accentColor: "text-teal-700 border-teal-200",
    tag: "Enterprise Acute Care",
    learnMoreHref: "#results",
  },
  {
    id: "clinics",
    title: "Clinics & Ambulatory Practices",
    category: "Ambulatory & Outpatient Care",
    description:
      "Simplify clinical documentation workflows, automate chronic disease risk screening, and elevate patient engagement with lightweight, browser-based AI decision tools.",
    capabilities: [
      "Rapid longitudinal vital trend summaries",
      "Automated cardiovascular and diabetic risk estimation",
      "Clinician-verified patient care plans in seconds",
    ],
    metrics: [
      { label: "Chart Time Saved", value: "3.5 hrs/wk" },
      { label: "Diagnostic Accuracy", value: "98.4%" },
    ],
    icon: Stethoscope,
    accentBg: "bg-sky-50",
    accentColor: "text-sky-700 border-sky-200",
    tag: "Ambulatory Workflows",
    learnMoreHref: "#results",
  },
  {
    id: "longterm-care",
    title: "Long-Term & Post-Acute Care",
    category: "Skilled Nursing & Assisted Living",
    description:
      "Monitor vulnerable residents continuously, proactively catch early physiological deterioration signals, and streamline inter-shift nursing handoffs.",
    capabilities: [
      "Early baseline vital drift alerts (KS-test verified)",
      "Non-alarmist trend visualization for floor nurses",
      "Secure family health updates with role-based access",
    ],
    metrics: [
      { label: "False Alarms", value: "-42%" },
      { label: "Audit Compliance", value: "100%" },
    ],
    icon: Home,
    accentBg: "bg-emerald-50",
    accentColor: "text-emerald-700 border-emerald-200",
    tag: "Resident Safety",
    learnMoreHref: "#results",
  },
  {
    id: "public-health",
    title: "Public Health & Academic Centers",
    category: "Epidemiology & Medical Research",
    description:
      "Unlock longitudinal population-level health trends, analyze cohort risk stratifications, and drive clinical research to build resilient, healthier communities.",
    capabilities: [
      "De-identified aggregate cohort analytics",
      "Population Stability Index (PSI) drift tracking",
      "FHIR v4.0.1 research dataset exports",
    ],
    metrics: [
      { label: "Cohort Size", value: "250K+ Rows" },
      { label: "Drift Metric", value: "PSI < 0.10" },
    ],
    icon: Users2,
    accentBg: "bg-indigo-50",
    accentColor: "text-indigo-700 border-indigo-200",
    tag: "Population Health",
    learnMoreHref: "#results",
  },
];

export function IndustrySolutions() {
  return (
    <section id="industry-solutions" className="py-16 sm:py-22 bg-slate-50/60 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>CARE ENVIRONMENTS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Engineered for High-Acuity Healthcare Environments
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Scalable architecture adaptable to the unique demands of academic health systems, outpatient ambulatory centers, and post-acute care facilities.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {INDUSTRY_SOLUTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${item.accentColor} ${item.accentBg} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {item.tag}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-teal-700 uppercase tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-bold text-slate-950 group-hover:text-teal-700 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {item.description}
                  </p>

                  {/* Quantitative Environment Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    {item.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="text-left">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">{m.label}</span>
                        <span className="text-sm font-mono font-bold text-slate-900">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Capability Highlights */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    {item.capabilities.map((cap, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Full FHIR v4.0.1 Compatibility
                  </span>
                  <a
                    href={item.learnMoreHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:translate-x-1 transition-all"
                  >
                    <span>View Case Study</span>
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
