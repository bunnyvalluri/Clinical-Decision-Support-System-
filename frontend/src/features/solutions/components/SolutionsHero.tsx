"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  BarChart2,
  Users,
  Heart,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SolutionsHero() {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24 bg-white border-b border-slate-100">
      {/* Background Soft Glows (Strict White/Light Theme) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-1/4 h-96 w-96 rounded-full bg-teal-50/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-8 h-80 w-80 rounded-full bg-sky-50/50 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900">Solutions</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>OUR SOLUTIONS</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] sm:leading-[1.12]">
              Smarter Solutions{" "}
              <span className="text-teal-600 block sm:inline">
                for a Healthier Tomorrow
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              AI-powered solutions built for healthcare professionals, organizations, and communities — helping you deliver better care, improve outcomes, and create healthier lives.
            </p>

            {/* Reassurance Governance Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 max-w-xl">
              <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold text-slate-900">Clinical Decision Support Invariant:</strong>{" "}
                HealthNova AI assists clinical teams with validated risk models and explainable telemetry. Licensed healthcare professionals retain complete diagnostic and prescription authority.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a href="#core-solutions">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-bold px-7 shadow-sm gap-2 text-sm h-12 rounded-xl transition-all"
                >
                  <span>Explore Solutions</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/about#faq">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-semibold px-6 text-sm h-12 gap-2 rounded-xl"
                >
                  <MessageSquare className="h-4 w-4 text-teal-600" />
                  <span>Talk to an Expert</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Visual with Doctor & 4 Floating Satellite Badges */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center relative">
            {/* Top-right Cursive Annotation with Arrow */}
            <div className="absolute -top-10 right-4 sm:right-10 z-20 hidden sm:flex flex-col items-end pointer-events-none">
              <span className="font-serif italic text-sm font-semibold text-teal-700 tracking-wide">
                Technology for a healthier tomorrow
              </span>
              <svg
                width="64"
                height="48"
                viewBox="0 0 64 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-teal-500 mt-1 stroke-current"
              >
                <path
                  d="M12 4C28 6 52 14 42 34C38 42 24 40 22 42"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="3 3"
                />
                <path
                  d="M20 36L22 42L28 40"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Doctor Main Image Frame */}
              <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-b from-teal-50/50 via-white to-sky-50/50 shadow-xl p-2">
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
                  <Image
                    src="/doctor-hero.jpg"
                    alt="Healthcare clinician using HealthNova AI tablet at bedside"
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Floating Badge 1: Top Left - Better Decisions */}
              <div className="absolute -top-4 -left-4 sm:-left-8 rounded-2xl bg-white border border-slate-200/90 px-3.5 py-2.5 shadow-lg flex items-center gap-3 z-20 animate-fade-in">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Better Decisions</p>
                  <p className="text-[10px] font-medium text-slate-500">Evidence-informed</p>
                </div>
              </div>

              {/* Floating Badge 2: Top Right - Empowered Providers */}
              <div className="absolute top-16 -right-4 sm:-right-8 rounded-2xl bg-white border border-slate-200/90 px-3.5 py-2.5 shadow-lg flex items-center gap-3 z-20 animate-fade-in">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Empowered Providers</p>
                  <p className="text-[10px] font-medium text-slate-500">Reduced burden</p>
                </div>
              </div>

              {/* Floating Badge 3: Bottom Left - Healthier Communities */}
              <div className="absolute bottom-16 -left-4 sm:-left-8 rounded-2xl bg-white border border-slate-200/90 px-3.5 py-2.5 shadow-lg flex items-center gap-3 z-20 animate-fade-in">
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Healthier Communities</p>
                  <p className="text-[10px] font-medium text-slate-500">Early risk awareness</p>
                </div>
              </div>

              {/* Floating Badge 4: Bottom Right - Safer Care */}
              <div className="absolute -bottom-4 -right-4 sm:-right-8 rounded-2xl bg-white border border-slate-200/90 px-3.5 py-2.5 shadow-lg flex items-center gap-3 z-20 animate-fade-in">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Safer Care</p>
                  <p className="text-[10px] font-medium text-slate-500">Continuous audit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
