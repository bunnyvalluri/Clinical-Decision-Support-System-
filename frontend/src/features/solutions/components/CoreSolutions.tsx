"use client";

import React, { useState, useMemo } from "react";
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
  CheckCircle2,
  Sliders,
  Cpu,
  Zap,
  Search,
} from "lucide-react";

interface CoreSolutionItem {
  id: string;
  category: "acute" | "diagnostic" | "workflow" | "population";
  title: string;
  badge: string;
  description: string;
  spec: string;
  latency: string;
  clinicalStandard: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  learnMoreHref: string;
}

const CORE_SOLUTIONS: CoreSolutionItem[] = [
  {
    id: "clinical-insights",
    category: "diagnostic",
    title: "AI Clinical Insights",
    badge: "Bedside Support",
    description:
      "Transform raw vital timeseries, laboratory panels, and historical EHR trends into actionable clinical rationales to accelerate bedside decision-making.",
    spec: "TreeSHAP Attributions",
    latency: "< 180ms",
    clinicalStandard: "AMA Clinical AI Guidelines",
    icon: TrendingUp,
    iconColor: "text-teal-700",
    iconBg: "bg-teal-50 border-teal-200",
    learnMoreHref: "#ai-ml",
  },
  {
    id: "patient-engagement",
    category: "workflow",
    title: "Patient Engagement",
    badge: "Personal Health",
    description:
      "Personalized communication tools, longitudinal health trends, and educational explanations that empower patients without generating medical alarm.",
    spec: "Plain-Language Insights",
    latency: "< 95ms",
    clinicalStandard: "Plain Language Health Literacy",
    icon: Users,
    iconColor: "text-purple-700",
    iconBg: "bg-purple-50 border-purple-200",
    learnMoreHref: "#role-solutions",
  },
  {
    id: "predictive-risk",
    category: "acute",
    title: "Predictive Risk Analytics",
    badge: "Early Warning",
    description:
      "Detect deteriorating patient trajectories early using multi-model ML ensembles (XGBoost, SVM, Random Forest) with calibrated confidence bounds.",
    spec: "Calibrated Probabilities",
    latency: "< 240ms",
    clinicalStandard: "Brier Calibration (ECE < 2.5%)",
    icon: ShieldAlert,
    iconColor: "text-amber-700",
    iconBg: "bg-amber-50 border-amber-200",
    learnMoreHref: "#responsible-safety",
  },
  {
    id: "workflow-automation",
    category: "workflow",
    title: "Workflow Automation",
    badge: "Clinician Relief",
    description:
      "Automate triage acuity scoring, routine documentation summaries, and alert routing to eliminate documentation burnout during busy ward rounds.",
    spec: "NEWS2 / qSOFA Auto-Score",
    latency: "< 120ms",
    clinicalStandard: "Royal College of Physicians NEWS2",
    icon: FileText,
    iconColor: "text-blue-700",
    iconBg: "bg-blue-50 border-blue-200",
    learnMoreHref: "#healthcare-workflow",
  },
  {
    id: "remote-monitoring",
    category: "acute",
    title: "Remote Patient Monitoring",
    badge: "Continuous Telemetry",
    description:
      "Continuous health signal visibility through medical wearables and bedside telemetry with low-latency threshold alerts and noise suppression.",
    spec: "Sub-Second Ingestion",
    latency: "< 50ms",
    clinicalStandard: "IEEE 11073 Point-of-Care",
    icon: Activity,
    iconColor: "text-rose-700",
    iconBg: "bg-rose-50 border-rose-200",
    learnMoreHref: "#realtime-intelligence",
  },
  {
    id: "secure-health-data",
    category: "workflow",
    title: "Secure Health Data",
    badge: "Zero-Trust Security",
    description:
      "Role-based access control, cryptographic verification, context minimization, and immutable audit trails committed directly to PostgreSQL.",
    spec: "21 CFR Part 11 Aligned",
    latency: "< 15ms",
    clinicalStandard: "NIST SP 800-53 Rev. 5",
    icon: Cloud,
    iconColor: "text-emerald-700",
    iconBg: "bg-emerald-50 border-emerald-200",
    learnMoreHref: "#security-privacy",
  },
  {
    id: "interoperability",
    category: "workflow",
    title: "Interoperability",
    badge: "FHIR v4.0.1",
    description:
      "Seamless bidirectional integration with hospital EHRs (Epic, Cerner, Meditech) via HL7 FHIR v4.0.1 resources and standard DICOM interfaces.",
    spec: "Standard HL7 / FHIR",
    latency: "< 210ms",
    clinicalStandard: "US Core IG STU4",
    icon: Network,
    iconColor: "text-violet-700",
    iconBg: "bg-violet-50 border-violet-200",
    learnMoreHref: "#faq",
  },
  {
    id: "population-health",
    category: "population",
    title: "Population Health",
    badge: "Cohort Intelligence",
    description:
      "Leverage aggregated population health analytics and predictive risk modeling to identify community health gaps and optimize hospital bed allocation.",
    spec: "Cohort Risk Stratification",
    latency: "< 350ms",
    clinicalStandard: "CMS ACO Quality Metrics",
    icon: Lightbulb,
    iconColor: "text-sky-700",
    iconBg: "bg-sky-50 border-sky-200",
    learnMoreHref: "#results",
  },
];

export function CoreSolutions() {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>("clinical-insights");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSolutions = useMemo(() => {
    return CORE_SOLUTIONS.filter((s) => {
      const matchesFilter = selectedFilter === "all" || s.category === selectedFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.spec.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, searchQuery]);

  const activeSolution = CORE_SOLUTIONS.find((s) => s.id === selectedSolutionId) || CORE_SOLUTIONS[0];

  return (
    <section id="core-solutions" className="py-16 sm:py-22 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>CORE SOLUTIONS WORKBENCH</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Comprehensive AI Solutions for Modern Healthcare
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            From calibrated predictive analytics to automated triage workflows, our modular solutions empower clinicians and safeguard high-acuity patients.
          </p>

          {/* Search & Domain Filter Toolbar */}
          <div className="pt-4 max-w-2xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solutions (e.g., TreeSHAP, FHIR, NEWS2, Telemetry, Risk)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {[
                { id: "all", label: "All Solutions (8)" },
                { id: "acute", label: "Acute Triage & Alerts" },
                { id: "diagnostic", label: "Diagnostic Decisioning" },
                { id: "workflow", label: "Workflow & Interoperability" },
                { id: "population", label: "Population Health" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedFilter === filter.id
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Architecture Highlight Banner */}
        <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${activeSolution.iconBg} shrink-0 shadow-2xs`}>
              <activeSolution.icon className={`h-6 w-6 ${activeSolution.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{activeSolution.title}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  {activeSolution.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Latency: <strong className="text-slate-900">{activeSolution.latency}</strong> • Standard: <strong className="text-slate-900">{activeSolution.clinicalStandard}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
            <span className="text-[11px] font-mono text-teal-800 font-semibold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              {activeSolution.spec}
            </span>
            <a
              href={activeSolution.learnMoreHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              <span>Explore Section</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredSolutions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedSolutionId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedSolutionId(item.id)}
                className={`group relative rounded-3xl bg-white border p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                    : "border-slate-200/90 hover:border-teal-300 hover:-translate-y-1"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${item.iconBg} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-950 group-hover:text-teal-700 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Spec Tag & Action */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    {item.spec}
                  </span>
                  <a
                    href={item.learnMoreHref}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-teal-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3 w-3" />
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
