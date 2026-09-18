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
} from "lucide-react";

interface CoreSolutionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  learnMoreHref: string;
}

const CORE_SOLUTIONS: CoreSolutionItem[] = [
  {
    id: "clinical-insights",
    title: "AI Clinical Insights",
    description:
      "Turn complex patient health records and vital signs into actionable, contextual insights for faster, evidence-supported clinical decisions.",
    icon: TrendingUp,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50 border-teal-100",
    learnMoreHref: "#ai-ml",
  },
  {
    id: "patient-engagement",
    title: "Patient Engagement",
    description:
      "Personalized communication tools, longitudinal health trends, and educational explanations to keep patients informed, engaged, and empowered.",
    icon: Users,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-100",
    learnMoreHref: "#role-solutions",
  },
  {
    id: "predictive-risk",
    title: "Predictive Risk Analytics",
    description:
      "Identify high-risk patient trajectories early using validated machine learning models and take proactive steps to prevent avoidable complications.",
    icon: ShieldAlert,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-100",
    learnMoreHref: "#responsible-safety",
  },
  {
    id: "workflow-automation",
    title: "Workflow Automation",
    description:
      "Automate routine documentation summaries, triage screening checklists, and administrative follow-ups to significantly reduce clinician burnout.",
    icon: FileText,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-100",
    learnMoreHref: "#healthcare-workflow",
  },
  {
    id: "remote-monitoring",
    title: "Remote Patient Monitoring",
    description:
      "Continuous health signal visibility through medical wearables and bedside telemetry with automated, low-latency threshold alerts.",
    icon: Activity,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-100",
    learnMoreHref: "#realtime-intelligence",
  },
  {
    id: "secure-health-data",
    title: "Secure Health Data",
    description:
      "Enterprise-grade role-based access control, cryptographic verification, and end-to-end audit logging ensuring continuous HIPAA and zero-trust compliance.",
    icon: Cloud,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-100",
    learnMoreHref: "#security-privacy",
  },
  {
    id: "interoperability",
    title: "Interoperability",
    description:
      "Seamless bidirectional integration with existing EHR systems via HL7 FHIR standards, DICOM interfaces, and institutional health data exchanges.",
    icon: Network,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50 border-violet-100",
    learnMoreHref: "#faq",
  },
  {
    id: "population-health",
    title: "Population Health",
    description:
      "Leverage aggregated population health analytics and predictive risk modeling to identify community health gaps and optimize resource allocation.",
    icon: Lightbulb,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-100",
    learnMoreHref: "#results",
  },
];

export function CoreSolutions() {
  return (
    <section id="core-solutions" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            CORE SOLUTIONS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Comprehensive AI Solutions for Modern Healthcare
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            From predictive analytics to workflow automation, our solutions are designed to meet the diverse needs of healthcare professionals, institutions, and patients.
          </p>
        </div>

        {/* 8-Card Grid (4 cols on xl, 2 cols on md, 1 col on sm) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_SOLUTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-teal-400/80 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Icon Box */}
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center border ${item.iconBg} mb-5 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-teal-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Learn More Link */}
                <a
                  href={item.learnMoreHref}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:translate-x-1 transition-all pt-2 border-t border-slate-100"
                >
                  <span>Learn More</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
