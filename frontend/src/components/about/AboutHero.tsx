"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Database,
  Radio,
  ShieldCheck,
  UserCheck,
  HeartPulse,
  ChevronDown,
  FileCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-white border-b border-slate-100">
      {/* Soft background ambient gradient glows (strict pure light theme) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 right-1/4 h-96 w-96 rounded-full bg-teal-50/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-8 h-80 w-80 rounded-full bg-sky-50/60 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>ABOUT OUR MISSION</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12] sm:leading-[1.1]">
              Building the Future of{" "}
              <span className="block text-slate-950">Intelligent Clinical</span>
              <span className="text-teal-600 block">
                Decision Support
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              HealthNova AI was founded to bridge the critical gap between complex clinical data
              and real-time medical decision-making at the point of care. We build transparent,
              explainable, and clinically-validated intelligence tools designed to empower physicians,
              nurses, and medical informaticists.
            </p>

            {/* Reassurance Invariant Banner */}
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex items-start gap-3.5 max-w-xl shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
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
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 shadow-xs gap-2 text-sm h-12 rounded-xl"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#foundation">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-semibold px-6 text-sm h-12 rounded-xl"
                >
                  <span>Our Clinical Principles</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column: Architectural Satellite Node Ecosystem Diagram */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md h-[440px] sm:h-[460px] rounded-3xl bg-slate-50/70 border border-slate-200/90 p-6 shadow-xs flex items-center justify-center overflow-hidden">
              {/* Subtle Ambient Pattern */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"
              />

              {/* Connecting Radial Lines */}
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full pointer-events-none stroke-teal-300/80"
              >
                <line x1="50%" y1="50%" x2="25%" y2="18%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="75%" y2="18%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="25%" y2="82%" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="75%" y2="82%" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              {/* 1. Top-Left Satellite Node */}
              <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 w-40 sm:w-44 rounded-2xl bg-white border border-slate-200 p-3 shadow-xs transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">EHR / FHIR Feeds</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Vitals, lab assays &amp; history
                </p>
              </div>

              {/* 2. Top-Right Satellite Node */}
              <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-40 sm:w-44 rounded-2xl bg-white border border-slate-200 p-3 shadow-xs transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                    <Radio className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Diagnostic Signals</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Real-time telemetry &amp; ECG
                </p>
              </div>

              {/* 3. Central Clinical Intelligence Core */}
              <div className="relative z-10 flex flex-col items-center justify-center h-32 w-32 rounded-full bg-white border-2 border-teal-500 shadow-md p-3 text-center transition-transform hover:scale-105">
                <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-1 shadow-2xs">
                  <HeartPulse className="h-5 w-5 animate-pulse" />
                </div>
                <span className="text-xs font-extrabold text-slate-950 leading-tight">
                  Clinical Core
                </span>
                <span className="text-[10px] font-bold text-teal-700 mt-0.5">
                  Ruflo AI Swarm
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                  v3.42 Active
                </span>
              </div>

              {/* 4. Bottom-Left Satellite Node */}
              <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 z-20 w-40 sm:w-44 rounded-2xl bg-white border border-slate-200 p-3 shadow-xs transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <FileCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Clinical Guidelines</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  qSOFA, NEWS2 &amp; sepsis rules
                </p>
              </div>

              {/* 5. Bottom-Right Satellite Node */}
              <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 w-40 sm:w-44 rounded-2xl bg-white border border-slate-200 p-3 shadow-xs transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Clinician Review</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Physician evaluation &amp; sign-off
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
