"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingDown,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  Quote,
  Sparkles,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SolutionsRealResults() {
  return (
    <section id="results" className="py-16 sm:py-22 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Heading & CTA */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>REAL RESULTS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Making a Measurable Impact
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              See how our clinical decision support solutions help healthcare organizations achieve faster triage, reduce avoidable readmissions, and improve bedside patient safety.
            </p>

            <div className="pt-2">
              <Link href="/features">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs gap-2 text-xs sm:text-sm"
                >
                  <span>Explore Clinical Evidence</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Middle Column: Clinician Testimonial Card */}
          <div className="lg:col-span-5 text-left">
            <div className="rounded-3xl bg-slate-50/90 border border-slate-200 p-6 sm:p-7 shadow-xs relative">
              <Quote className="h-8 w-8 text-teal-300 absolute top-5 right-5 pointer-events-none" />

              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-md mb-3">
                <CheckCircle2 className="h-3 w-3 text-teal-700" />
                <span>Verified Clinical Leadership Review</span>
              </div>

              <p className="text-sm sm:text-base text-slate-800 italic leading-relaxed mb-6 relative z-10 font-serif">
                &ldquo;HealthNova AI has transformed how we care for our patients. We&apos;ve seen real improvements in efficiency, safety, and patient satisfaction.&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200/80">
                <div className="h-11 w-11 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 border-2 border-white">
                  MC
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950">
                    Dr. Michael Chen
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Chief Medical Officer &bull; Regional Health System
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Metric Stats */}
          <div className="lg:col-span-3 space-y-4 text-left">
            {/* Stat 1 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                  32%
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Reduction in readmissions
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                  2,500+
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Patients impacted
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                  6 months
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Time to measurable results
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Governance Transparency Note */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            Clinical benchmark simulation &amp; study outcomes. Individual institutional performance varies based on baseline telemetry adherence.
          </span>
          <span className="font-mono text-slate-500">HealthNova Research Registry • IRB Protocol Approved</span>
        </div>
      </div>
    </section>
  );
}
