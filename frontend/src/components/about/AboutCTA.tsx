"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck, Lock, Award, Activity, HeartPulse, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutCTA() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-white to-slate-50/80 border-t border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-50/95 via-white to-slate-50/90 border border-slate-200/90 p-8 sm:p-14 lg:p-20 text-center shadow-xl shadow-slate-200/40 relative overflow-hidden">
          {/* Ambient background decoration glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl"
          />

          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>CLINICAL ADOPTION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Building Smarter, Safer{" "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Clinical Intelligence Together
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Join leading hospitals, health systems, and clinical informaticists leveraging HealthNova AI
              for anticipatory patient care, reduction of cognitive burden, and zero-compromise clinical safety.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link href="/solutions" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-8 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 gap-2 text-sm h-12 rounded-xl transition-all hover:-translate-y-0.5 border-0"
                >
                  <span>Explore Solutions</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-8 text-sm h-12 gap-2 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5"
                >
                  <Layers className="h-4 w-4 text-slate-500" />
                  <span>Launch Bedside Demo</span>
                </Button>
              </Link>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>HIPAA Compliant</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-teal-600" />
                <span>SOC 2 Type II Certified</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-teal-600" />
                <span>HL7 FHIR v4.0.1</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-teal-600" />
                <span>Project Code: BPY-CSE-2666</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
