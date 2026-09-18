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
} from "lucide-react";

interface AudienceCard {
  id: string;
  title: string;
  roleSubtitle: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
  linkHref: string;
}

const AUDIENCE_CARDS: AudienceCard[] = [
  {
    id: "patients",
    title: "Patients",
    roleSubtitle: "Individual & Family Care",
    description:
      "Understand your health, track important signals and receive personalized preventive health insights without confusing medical jargon.",
    badge: "Personal Health",
    icon: User,
    accentColor: "bg-rose-50 text-rose-600 border-rose-100",
    linkHref: "#role-solutions",
  },
  {
    id: "doctors",
    title: "Doctors & Physicians",
    roleSubtitle: "Clinical Decision Support",
    description:
      "Access validated risk predictions, longitudinal patient trends and AI-assisted clinical insights to focus more time on patient care.",
    badge: "Diagnostics & Care",
    icon: Stethoscope,
    accentColor: "bg-teal-50 text-teal-600 border-teal-100",
    linkHref: "#role-solutions",
  },
  {
    id: "nurses",
    title: "Nurses & Care Teams",
    roleSubtitle: "Bedside & Triage",
    description:
      "Support rapid triage, bedside vitals monitoring, early deterioration alerts, task coordination, and timely escalations.",
    badge: "Continuous Triage",
    icon: HeartHandshake,
    accentColor: "bg-sky-50 text-sky-600 border-sky-100",
    linkHref: "#role-solutions",
  },
  {
    id: "organizations",
    title: "Healthcare Organizations",
    roleSubtitle: "Hospitals & Health Systems",
    description:
      "Improve operational visibility, population-level risk intelligence, capacity allocation, and clinical workflow efficiency at scale.",
    badge: "Enterprise Scale",
    icon: Building2,
    accentColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
    linkHref: "#role-solutions",
  },
  {
    id: "data-teams",
    title: "Health Data & IT Teams",
    roleSubtitle: "Informatics & Compliance",
    description:
      "Monitor data quality, audit model drift, manage clinical integrations, verify role-based governance, and ensure HIPAA/HL7 FHIR compliance.",
    badge: "MLOps & Security",
    icon: Database,
    accentColor: "bg-amber-50 text-amber-600 border-amber-100",
    linkHref: "#role-solutions",
  },
];

export function SolutionsAudienceStrip() {
  return (
    <section className="py-14 sm:py-18 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            STAKEHOLDER CENTRIC
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Built for Every Part of the Healthcare Journey
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Purpose-engineered workflows designed specifically for the unique responsibilities of clinical, operational, and patient stakeholders.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {AUDIENCE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border ${card.accentColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[11px] font-medium text-teal-600 mb-2">
                    {card.roleSubtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {card.description}
                  </p>
                </div>

                <a
                  href={card.linkHref}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:translate-x-0.5 transition-all mt-2 pt-2 border-t border-slate-100"
                >
                  <span>Explore workflow</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
