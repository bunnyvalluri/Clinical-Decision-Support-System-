"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Activity,
  Cpu,
  Database,
  Radio,
  Eye,
  UserCheck,
  HeartPulse,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ECOSYSTEM_NODES = [
  {
    title: "Patient Risk",
    desc: "Calibrated Risk Tiers",
    icon: Activity,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pos: "top-4 left-6 sm:top-2 sm:left-4",
  },
  {
    title: "Machine Learning",
    desc: "Ensemble Modeling",
    icon: Cpu,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    pos: "top-4 right-6 sm:top-2 sm:right-4",
  },
  {
    title: "Clinical Data",
    desc: "Neon PostgreSQL",
    icon: Database,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    pos: "bottom-4 left-6 sm:bottom-2 sm:left-4",
  },
  {
    title: "Real-Time Insights",
    desc: "Sub-20ms Telemetry",
    icon: Radio,
    color: "bg-teal-50 text-teal-700 border-teal-200",
    pos: "bottom-4 right-6 sm:bottom-2 sm:right-4",
  },
  {
    title: "Explainability",
    desc: "TreeSHAP Attributions",
    icon: Eye,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    pos: "top-1/2 -left-3 sm:-left-2 -translate-y-1/2",
  },
  {
    title: "Human Review",
    desc: "Clinician Authority",
    icon: UserCheck,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    pos: "top-1/2 -right-3 sm:-right-2 -translate-y-1/2",
  },
];

export function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-white border-b border-slate-100">
      {/* Soft background glow accents (pure light theme) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-teal-50/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-10 h-80 w-80 rounded-full bg-sky-50/50 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>ABOUT OUR PLATFORM</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] sm:leading-[1.12]">
              Building the Future of{" "}
              <span className="text-teal-600 block sm:inline">
                Intelligent Clinical Decision Support
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              The platform combines machine learning, clinical data, real-time intelligence,
              and healthcare expertise to help clinicians understand patient risk and make
              better-informed decisions.
            </p>

            {/* Reassurance Disclaimer Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 max-w-xl">
              <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold text-slate-900">Human-in-the-Loop Architecture:</strong>{" "}
                AI/ML models provide risk signals and feature attributions. Licensed clinical professionals
                retain sole final diagnostic, prescription, and treatment authority.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 shadow-sm gap-2 text-sm h-12"
                >
                  <span>Explore Our Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#workflow">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-semibold px-6 text-sm h-12"
                >
                  <span>Learn How It Works</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Clinical Intelligence Node Ecosystem */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md h-[400px] sm:h-[440px] rounded-3xl bg-slate-50/80 border border-slate-200 p-6 shadow-xs flex items-center justify-center overflow-hidden">
              {/* Subtle SVG Grid Background */}
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full stroke-slate-200/60 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
              >
                <defs>
                  <pattern
                    id="hero-grid"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M.5 24V.5H24" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#hero-grid)" />
              </svg>

              {/* Connecting Radial Lines */}
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full pointer-events-none stroke-slate-300/80 stroke-dasharray-2"
              >
                <line x1="50%" y1="50%" x2="25%" y2="15%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="75%" y2="15%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="15%" y2="50%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="85%" y2="50%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="25%" y2="85%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="75%" y2="85%" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              {/* Central Clinical Intelligence Node */}
              <div className="relative z-10 flex flex-col items-center justify-center h-28 w-28 rounded-full bg-white border-2 border-teal-500 shadow-md p-3 text-center transition-transform hover:scale-105">
                <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-1 shadow-2xs">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                  Clinical
                </span>
                <span className="text-[10px] font-semibold text-teal-700">
                  Intelligence
                </span>
                <div className="absolute -bottom-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Satellite Connected Concept Nodes */}
              {ECOSYSTEM_NODES.map((node) => {
                const IconComponent = node.icon;
                return (
                  <div
                    key={node.title}
                    className={`absolute z-10 ${node.pos} bg-white border rounded-2xl p-2.5 shadow-xs flex items-center gap-2.5 transition-all hover:shadow-md hover:border-slate-300`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${node.color}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="text-left pr-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {node.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {node.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
