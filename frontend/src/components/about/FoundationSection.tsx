"use client";

import React from "react";
import { Eye, Target, HeartHandshake, CheckCircle2, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";

interface FoundationCard {
  title: string;
  subtitle: string;
  content: string;
  metricBadge: string;
  bullets: { text: string; highlight: string }[];
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  accentGradient: string;
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
}

const FOUNDATION_CARDS: FoundationCard[] = [
  {
    title: "Our Vision",
    subtitle: "ANTICIPATORY & PRECISION CARE",
    content:
      "Transforming inpatient and outpatient hospital delivery into an anticipatory, precision-guided experience where preventable clinical deteriorations are intercepted hours before bedside monitors alarm.",
    metricBadge: "Target: <20ms Bedside Sync",
    bullets: [
      { highlight: "Early Sepsis Trajectory", text: "Predicting decompensation 6-8 hours in advance." },
      { highlight: "Sub-20ms Telemetry", text: "Zero-latency synchronization across acute ICU wards." },
      { highlight: "Zero Black-Box Opacity", text: "Full pathophysiological interpretability for clinicians." },
    ],
    icon: Eye,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    accentGradient: "from-teal-500 to-emerald-500",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-800 border-teal-200",
    hoverBorder: "hover:border-teal-400 hover:shadow-teal-500/5",
  },
  {
    title: "Our Mission",
    subtitle: "EVIDENCE-INFORMED DECISION SUPPORT",
    content:
      "Providing frontline healthcare teams with ambient, calibrated, and explainable decision support tools that eliminate clinical documentation fatigue and empower clinicians to act with swift confidence.",
    metricBadge: "Evaluated: ROC-AUC 0.94",
    bullets: [
      { highlight: "Multi-Hospital ML", text: "Evaluated ensembles with empirical Platt calibration." },
      { highlight: "Native HL7 FHIR v4.0.1", text: "Bidirectional integration with Epic & Cerner." },
      { highlight: "Context Minimization", text: "Redacting all patient PHI prior to ML inference." },
    ],
    icon: Target,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    accentGradient: "from-blue-500 to-sky-500",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800 border-blue-200",
    hoverBorder: "hover:border-blue-400 hover:shadow-blue-500/5",
  },
  {
    title: "Our Purpose",
    subtitle: "HUMAN-CENTERED MEDICAL AI",
    content:
      "Engineering reliable, ethically-grounded clinical intelligence that respects clinician autonomy, enforces strict HIPAA/SOC 2 privacy, and preserves the sacred doctor-patient relationship.",
    metricBadge: "Policy: 100% Clinician Sign-Off",
    bullets: [
      { highlight: "Mandatory Human Sign-Off", text: "AI assists; licensed attending physicians decide." },
      { highlight: "FDA CDSS Compliance", text: "Strict alignment with non-device guidance standards." },
      { highlight: "Neon PostgreSQL Store", text: "Authoritative immutable audit persistence." },
    ],
    icon: HeartHandshake,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    accentGradient: "from-purple-500 to-indigo-500",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800 border-purple-200",
    hoverBorder: "hover:border-purple-400 hover:shadow-purple-500/5",
  },
];

export function FoundationSection() {
  return (
    <section id="foundation" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 relative">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-gradient-to-r from-teal-50/60 via-slate-50 to-sky-50/60 rounded-full blur-3xl -z-10"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Large Rounded Modern Hospital SaaS Container */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-50/90 via-slate-50/60 to-white border border-slate-200/90 p-7 sm:p-12 lg:p-16 shadow-lg shadow-slate-100/80">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>OUR FOUNDATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Bridging the Gap Between Data,{" "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Intelligence &amp; Clinical Care
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              A unified, clinically-grounded architecture built to address the three core pillars of
              modern hospital operations: early deterioration detection, cognitive burden reduction, and patient safety.
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
                  className={`group relative rounded-2xl bg-white border border-slate-200/90 p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${card.hoverBorder} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Top Color Accent Line */}
                  <div
                    aria-hidden="true"
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accentGradient}`}
                  />

                  <div>
                    {/* Top Row: Icon & Subtitle Tag */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`h-12 w-12 rounded-2xl border border-slate-200/80 ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110`}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${card.badgeBg} ${card.badgeText} uppercase tracking-wider`}
                      >
                        {card.subtitle}
                      </span>
                    </div>

                    {/* Card Title & Metric Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                        {card.title}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                        {card.metricBadge}
                      </span>
                    </div>

                    {/* Card Content Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                      {card.content}
                    </p>
                  </div>

                  {/* Bullet Points with Highlighted Keywords */}
                  <div className="pt-5 border-t border-slate-100 space-y-3">
                    {card.bullets.map((bullet) => (
                      <div key={bullet.highlight} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          <strong className="font-bold text-slate-900">{bullet.highlight}:</strong>{" "}
                          {bullet.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
