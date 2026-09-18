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
} from "lucide-react";

interface IndustryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  accentBg: string;
  accentColor: string;
  tag: string;
  visualGraphic: "hospital" | "clinic" | "longterm" | "research";
  learnMoreHref: string;
}

const INDUSTRY_SOLUTIONS: IndustryItem[] = [
  {
    id: "hospitals",
    title: "Hospitals & Health Systems",
    category: "Tertiary & Acute Care",
    description:
      "Improve inpatient operational efficiency, reduce 30-day preventable readmissions, and deliver standardized, high-quality care at enterprise scale.",
    icon: Building2,
    accentBg: "bg-teal-50",
    accentColor: "text-teal-700 border-teal-200",
    tag: "Enterprise Acute Care",
    visualGraphic: "hospital",
    learnMoreHref: "#results",
  },
  {
    id: "clinics",
    title: "Clinics & Private Practices",
    category: "Ambulatory & Primary Care",
    description:
      "Simplify clinical documentation workflows, automate risk screening, and elevate patient engagement with lightweight, accessible AI decision tools.",
    icon: Stethoscope,
    accentBg: "bg-sky-50",
    accentColor: "text-sky-700 border-sky-200",
    tag: "Ambulatory Workflows",
    visualGraphic: "clinic",
    learnMoreHref: "#results",
  },
  {
    id: "longterm-care",
    title: "Long-Term Care",
    category: "Skilled Nursing & Assisted Living",
    description:
      "Monitor vulnerable residents continuously, proactively catch early deterioration signals, prevent fall risks, and streamline inter-shift care coordination.",
    icon: Home,
    accentBg: "bg-emerald-50",
    accentColor: "text-emerald-700 border-emerald-200",
    tag: "Resident Safety",
    visualGraphic: "longterm",
    learnMoreHref: "#results",
  },
  {
    id: "public-health",
    title: "Public Health & Research",
    category: "Epidemiology & Academic Medical Centers",
    description:
      "Unlock longitudinal population-level health trends, analyze cohort risk stratifications, and drive research to build resilient, healthier communities.",
    icon: Users2,
    accentBg: "bg-indigo-50",
    accentColor: "text-indigo-700 border-indigo-200",
    tag: "Population Health",
    visualGraphic: "research",
    learnMoreHref: "#results",
  },
];

export function IndustrySolutions() {
  return (
    <section id="industry-solutions" className="py-16 sm:py-20 bg-slate-50/50 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700 mb-2">
            SOLUTIONS BY INDUSTRY
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Tailored for Every Healthcare Environment
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Our clinical intelligence solutions adapt to the unique operational pressures, clinical protocols, and regulatory needs of diverse healthcare settings.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INDUSTRY_SOLUTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Visual Header Card Header (Medical Environment Graphic with Soft Healthcare Gradients) */}
                  <div className="relative h-44 w-full bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/40 p-4 flex flex-col justify-between border-b border-slate-100 overflow-hidden">
                    {/* Abstract Decorative Health Waves */}
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-teal-100/40 blur-2xl pointer-events-none" />
                    <div className="absolute left-1/4 -top-6 w-24 h-24 rounded-full bg-sky-100/50 blur-xl pointer-events-none" />

                    {/* Environment Graphic Representation */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/90 text-slate-700 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
                        {item.tag}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center text-teal-600 shadow-2xs">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Visual Center Badge */}
                    <div className="relative z-10 flex items-center justify-center py-2">
                      <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/90 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-teal-600" />
                      </div>
                    </div>

                    {/* Bottom Status Subtext */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{item.category}</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Activity className="h-3 w-3" /> Ready
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${item.accentBg} ${item.accentColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <a
                    href={item.learnMoreHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:translate-x-1 transition-all pt-3 border-t border-slate-100 w-full"
                  >
                    <span>Learn More</span>
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
