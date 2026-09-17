"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  HeartPulse,
  Heart,
  Activity,
  ShieldCheck,
  Sparkles,
  Play,
  CheckCircle2,
  ChevronRight,
  Cpu,
  TrendingUp,
  Moon,
  Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturesHero() {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24 bg-white border-b border-slate-100">
      {/* Background Soft Glows (Strict Light Theme) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-teal-50/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-10 h-80 w-80 rounded-full bg-sky-50/50 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900">Features</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>OUR FEATURES</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] sm:leading-[1.12]">
              Smarter Tools for{" "}
              <span className="text-teal-600 block sm:inline">
                Everyday Healthcare
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Our clinical decision support platform combines evaluated machine learning, real-time
              telemetry, and intuitive healthcare design to empower physicians, nurses, informaticists,
              and patients with actionable risk intelligence.
            </p>

            {/* Reassurance Disclaimer Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 max-w-xl">
              <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold text-slate-900">Clinician-in-the-Loop Standard:</strong>{" "}
                Risk levels and SHAP attributions are designed to assist healthcare teams.
                Licensed clinicians retain full final diagnostic and prescription responsibility.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a href="#powerful-features">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 shadow-sm gap-2 text-sm h-12"
                >
                  <span>Explore All Features</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#ml-workflow">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-semibold px-6 text-sm h-12 gap-2"
                >
                  <Play className="h-4 w-4 text-teal-600 fill-teal-600" />
                  <span>See How It Works</span>
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column: Realistic Healthcare Intelligence Mobile Device & Dashboard Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Device Frame (Clean White Healthcare Mobile Mockup) */}
              <div className="relative rounded-[40px] border-4 border-slate-900/10 bg-white p-4 sm:p-5 shadow-xl ring-1 ring-slate-900/5">
                {/* Device Speaker Notch */}
                <div className="mx-auto mb-4 h-4 w-28 rounded-full bg-slate-100 border border-slate-200" />

                {/* Device Screen Content */}
                <div className="space-y-4">
                  {/* Top Bar inside Mockup */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Patient Workspace
                      </p>
                      <h4 className="text-sm font-bold text-slate-900">
                        Sarah Jenkins &bull; Bed 04
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Telemetry
                    </span>
                  </div>

                  {/* 2-Col Metric Cards inside Device */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Heart Rate */}
                    <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Heart Rate</p>
                        <p className="text-sm font-extrabold text-slate-900 font-mono">
                          72 <span className="text-[10px] font-normal text-slate-500">bpm</span>
                        </p>
                      </div>
                    </div>

                    {/* Vitals Telemetry */}
                    <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Blood Pressure</p>
                        <p className="text-sm font-extrabold text-slate-900 font-mono">
                          120/80
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Risk Prediction Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-800">
                          ML Risk Assessment
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        LOW RISK TIER
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-slate-950 font-mono">
                          18.4%
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5">
                          Calculated Probability
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Random Forest v1.4
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "18.4%" }} />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      Vitals within normal bounds. Baseline observation scheduled.
                    </p>
                  </div>

                  {/* Secondary Metric Strip */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Moon className="h-3.5 w-3.5 text-blue-500" />
                        <span>Telemetry</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">7h 30m</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Footprints className="h-3.5 w-3.5 text-emerald-500" />
                        <span>SpO2 Level</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">98%</span>
                    </div>
                  </div>

                  {/* Bottom Navigation Mockup */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-[10px] font-semibold text-slate-400">
                    <span className="text-teal-600 font-bold">Vitals</span>
                    <span>Trends</span>
                    <span>Telemetry</span>
                    <span>Reports</span>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Satellite Badges */}
              <div className="absolute -top-3 -right-4 sm:-right-6 rounded-2xl bg-white border border-slate-200 p-2.5 shadow-md flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-left pr-1">
                  <p className="text-[10px] font-mono text-slate-400">TreeSHAP</p>
                  <p className="text-xs font-bold text-slate-900">Explainable</p>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-4 sm:-left-6 rounded-2xl bg-white border border-slate-200 p-2.5 shadow-md flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left pr-1">
                  <p className="text-[10px] font-mono text-slate-400">Governance</p>
                  <p className="text-xs font-bold text-slate-900">Human Sign-off</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
