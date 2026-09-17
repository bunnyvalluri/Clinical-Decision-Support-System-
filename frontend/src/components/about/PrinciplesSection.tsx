import React from "react";
import {
  Users,
  ShieldCheck,
  Eye,
  Lock,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

interface Principle {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const PRINCIPLES: Principle[] = [
  {
    title: "People First",
    description:
      "Patients and healthcare professionals remain at the center of the technology we build.",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  {
    title: "Clinical Responsibility",
    description:
      "AI-assisted insights support professional judgment rather than replacing qualified healthcare professionals.",
    icon: ShieldCheck,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
  },
  {
    title: "Transparency",
    description:
      "Predictions and AI-assisted outputs should be understandable, traceable, and appropriately explained.",
    icon: Eye,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
  },
  {
    title: "Privacy & Security",
    description:
      "Healthcare data must be protected through strong authorization, least privilege, auditing, and secure architecture.",
    icon: Lock,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    title: "Innovation",
    description:
      "We continuously explore responsible ways to apply machine learning and AI to real healthcare challenges.",
    icon: Lightbulb,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
  },
  {
    title: "Continuous Improvement",
    description:
      "Models, workflows, infrastructure, and user experiences should be continuously evaluated and improved.",
    icon: RefreshCw,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
  },
];

export function PrinciplesSection() {
  return (
    <section id="principles" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            OUR GUIDING PRINCIPLES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            The Principles That Guide Everything We Do
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Our technology is designed around responsibility, transparency, safety, clinical
            usefulness, and continuous improvement.
          </p>
        </div>

        {/* 2x3 or 3x2 Responsive Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PRINCIPLES.map((principle) => {
            const IconComponent = principle.icon;
            return (
              <div
                key={principle.title}
                tabIndex={0}
                className="group rounded-2xl bg-white border border-slate-200 p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div className="space-y-4">
                  <div
                    className={`h-12 w-12 rounded-2xl border border-slate-200/80 ${principle.iconBg} ${principle.iconColor} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
