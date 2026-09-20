"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck, Lock, Award, Activity, HeartPulse, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutCTA() {
  return (
    <section className="py-12 sm:py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50/80 border-t border-slate-200">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-300 p-6 sm:p-12 lg:p-16 text-center shadow-xs sm:shadow-xl relative overflow-hidden space-y-4 sm:space-y-6">
          {/* Ambient subtle glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl"
          />

          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" />
              <span>INSTITUTIONAL CLINICAL DEPLOYMENT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Building Smarter, Safer{" "}
              <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
                Clinical Intelligence Together
              </span>
            </h2>

            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Empower your hospital network, clinical rapid response teams, and medical informaticists
              with anticipatory deterioration detection, explainable TreeSHAP attributions, and
              zero-compromise patient safety.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 shadow-md shadow-teal-900/10 gap-2 text-sm h-12 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <HeartPulse className="h-4 w-4 text-teal-200" />
                  <span>Launch Live Bedside Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/solutions" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-8 text-sm h-12 gap-2 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-slate-500" />
                  <span>Explore Hospital Solutions</span>
                </Button>
              </Link>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-700 font-mono font-semibold">
              <span className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                <span>FDA SaMD Aligned</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-teal-700" />
                <span>HIPAA &amp; SOC 2 Type II</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-teal-700" />
                <span>HL7 FHIR v4.0.1</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-teal-700" />
                <span>21 CFR Part 11 Aligned</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
