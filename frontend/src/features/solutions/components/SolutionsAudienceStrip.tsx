"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  Stethoscope,
  HeartHandshake,
  Building2,
  Database,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AudienceCard {
  id: string;
  title: string;
  roleSubtitle: string;
  description: string;
  badge: string;
  metric: string;
  icon: React.ElementType;
  accentColor: string;
  accentBorder: string;
  linkHref: string;
}

const AUDIENCE_CARDS: AudienceCard[] = [
  {
    id: "patients",
    title: "Patients",
    roleSubtitle: "Individual & Family Care",
    description:
      "Understand your personal vital trajectories and receive clear, non-alarmist health guidance without confusing medical jargon.",
    badge: "Personal Health",
    metric: "Plain Language Insights",
    icon: User,
    accentColor: "bg-rose-50 text-rose-600 border-rose-200",
    accentBorder: "border-t-rose-500",
    linkHref: "#role-solutions",
  },
  {
    id: "doctors",
    title: "Doctors & MDs",
    roleSubtitle: "Clinical Decision Support",
    description:
      "Access validated risk predictions, longitudinal trend analysis, and TreeSHAP explainability to elevate diagnostic confidence.",
    badge: "Diagnostics & Care",
    metric: "TreeSHAP Attributions",
    icon: Stethoscope,
    accentColor: "bg-teal-50 text-teal-600 border-teal-200",
    accentBorder: "border-t-teal-600",
    linkHref: "#role-solutions",
  },
  {
    id: "nurses",
    title: "Nurses & Triage",
    roleSubtitle: "Bedside Care Teams",
    description:
      "Rapid acuity scoring, continuous vital trend tracking, early sepsis warnings, and intelligent threshold alarms to eliminate alert fatigue.",
    badge: "Continuous Triage",
    metric: "42% Less Alarm Fatigue",
    icon: HeartHandshake,
    accentColor: "bg-sky-50 text-sky-600 border-sky-200",
    accentBorder: "border-t-sky-500",
    linkHref: "#role-solutions",
  },
  {
    id: "organizations",
    title: "Health Systems",
    roleSubtitle: "Hospitals & Networks",
    description:
      "Optimize bed allocation, reduce 30-day preventable readmissions, and achieve enterprise-scale clinical workflow efficiency.",
    badge: "Enterprise Scale",
    metric: "32% Fewer Readmissions",
    icon: Building2,
    accentColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
    accentBorder: "border-t-indigo-600",
    linkHref: "#role-solutions",
  },
  {
    id: "data-teams",
    title: "Health Data Teams",
    roleSubtitle: "Informatics & MLOps",
    description:
      "Continuous model drift auditing with PSI tests, FHIR v4.0.1 interoperability, and immutable 21 CFR Part 11 cryptographic logging.",
    badge: "MLOps & Security",
    metric: "21 CFR Part 11 Trails",
    icon: Database,
    accentColor: "bg-amber-50 text-amber-600 border-amber-200",
    accentBorder: "border-t-amber-500",
    linkHref: "#role-solutions",
  },
];

export function SolutionsAudienceStrip() {
  return (
    <section className="py-14 sm:py-18 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>STAKEHOLDER CENTRIC</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
            Built for Every Part of the Healthcare Journey
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Purpose-engineered workflows designed specifically for the distinct clinical responsibilities of doctors, nurses, informaticists, and patients.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {AUDIENCE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`group relative rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-1 transition-all flex flex-col justify-between border-t-4 ${card.accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border ${card.accentColor} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 group-hover:text-teal-700 transition-colors leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-teal-700 mb-2">
                    {card.roleSubtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {card.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    {card.metric}
                  </span>
                  <a
                    href={card.linkHref}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Explore</span>
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
