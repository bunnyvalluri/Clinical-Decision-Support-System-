import React from "react";
import { Eye, Target, HeartHandshake } from "lucide-react";

interface FoundationCard {
  title: string;
  subtitle: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

const FOUNDATION_CARDS: FoundationCard[] = [
  {
    title: "Our Vision",
    subtitle: "Accessible & Explainable Care",
    content:
      "To make intelligent clinical decision support more accessible, explainable, responsible, and useful for healthcare professionals.",
    icon: Eye,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    borderColor: "group-hover:border-teal-300",
  },
  {
    title: "Our Mission",
    subtitle: "Evidence-Informed Risk Modeling",
    content:
      "To develop secure, evidence-informed AI and machine learning tools that help healthcare professionals interpret patient risk and make better-informed decisions.",
    icon: Target,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    borderColor: "group-hover:border-blue-300",
  },
  {
    title: "Our Purpose",
    subtitle: "Human-Centered Intelligence",
    content:
      "To use technology responsibly to transform complex healthcare data into meaningful clinical insights while keeping people and professional judgment at the center.",
    icon: HeartHandshake,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    borderColor: "group-hover:border-purple-300",
  },
];

export function FoundationSection() {
  return (
    <section id="foundation" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Large Rounded Container inspired by Reference Design */}
        <div className="rounded-3xl bg-slate-50/70 border border-slate-200/80 p-8 sm:p-12 lg:p-16 shadow-2xs">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              OUR FOUNDATION
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              Bridging the Gap Between Data, Intelligence &amp; Clinical Care
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Our platform connects patient physiological vitals, machine learning risk prediction,
              clinical workflows, and human expertise into one cohesive decision-support ecosystem.
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
                  className={`group relative rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${card.borderColor} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
                >
                  {/* Card Icon */}
                  <div
                    className={`h-12 w-12 rounded-2xl border border-slate-200/60 ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-6 shadow-2xs transition-transform group-hover:scale-105`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Card Title & Subtitle */}
                  <h3 className="text-xl font-bold text-slate-950 tracking-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs font-mono font-medium text-slate-400 mb-4 uppercase tracking-wide">
                    {card.subtitle}
                  </p>

                  {/* Card Content */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {card.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
