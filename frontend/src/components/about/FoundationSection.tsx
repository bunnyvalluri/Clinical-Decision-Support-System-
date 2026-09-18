"use client";

import React from "react";
import { Eye, Target, HeartHandshake, CheckCircle2 } from "lucide-react";

interface FoundationCard {
  title: string;
  subtitle: string;
  content: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

const FOUNDATION_CARDS: FoundationCard[] = [
  {
    title: "Our Vision",
    subtitle: "Anticipatory & Precision Care",
    content:
      "Transforming inpatient and outpatient healthcare delivery into an anticipatory, precision-guided experience where preventable clinical deteriorations are detected hours before bedside monitors alarm.",
    bullets: [
      "Early sepsis & shock trajectory forecasting",
      "Sub-20ms point-of-care data synchronization",
      "Zero clinical black-box opacity",
    ],
    icon: Eye,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    badgeBg: "bg-teal-50/80",
    badgeText: "text-teal-800 border-teal-200",
    borderColor: "group-hover:border-teal-300",
  },
  {
    title: "Our Mission",
    subtitle: "Evidence-Informed Decision Support",
    content:
      "Providing frontline healthcare teams with ambient, calibrated, and explainable decision support tools that eliminate clinical documentation fatigue and empower clinicians to act with swift confidence.",
    bullets: [
      "Multi-hospital evaluated ML ensembles (ROC-AUC 0.94)",
      "Native HL7 FHIR v4.0.1 bidirectional integration",
      "Context-minimized patient data flows",
    ],
    icon: Target,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50/80",
    badgeText: "text-blue-800 border-blue-200",
    borderColor: "group-hover:border-blue-300",
  },
  {
    title: "Our Purpose",
    subtitle: "Human-Centered Medical AI",
    content:
      "Engineering reliable, ethically-grounded clinical intelligence that respects clinician autonomy, enforces strict HIPAA/SOC 2 privacy, and preserves the sacred doctor-patient relationship.",
    bullets: [
      "Mandatory licensed clinician review and sign-off",
      "Non-autonomous FDA CDSS guidance compliance",
      "Authoritative Neon PostgreSQL audit persistence",
    ],
    icon: HeartHandshake,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    badgeBg: "bg-purple-50/80",
    badgeText: "text-purple-800 border-purple-200",
    borderColor: "group-hover:border-purple-300",
  },
];

export function FoundationSection() {
  return (
    <section id="foundation" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Large Rounded Container matching the Reference Design */}
        <div className="rounded-3xl bg-slate-50/70 border border-slate-200/80 p-8 sm:p-12 lg:p-16 shadow-2xs">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
              OUR FOUNDATION
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              Bridging the Gap Between Data, Intelligence &amp; Clinical Care
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              A unified, clinically-grounded architecture built to address the three core pillars of
              modern hospital operations: early detection, cognitive burden reduction, and patient safety.
            </p>
          </div>

          {/* 3 Foundation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {FOUNDATION_CARDS.map((card) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.title}
                  tabIndex={0}
                  className={`group relative rounded-2xl bg-white border border-slate-200/90 p-7 sm:p-8 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${card.borderColor} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex flex-col justify-between`}
                >
                  <div>
                    {/* Top Row: Icon & Tag */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`h-12 w-12 rounded-2xl border border-slate-200/80 ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105`}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${card.badgeBg} ${card.badgeText}`}
                      >
                        {card.subtitle}
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="text-xl font-bold text-slate-950 tracking-tight mb-3">
                      {card.title}
                    </h3>

                    {/* Card Content */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                      {card.content}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
