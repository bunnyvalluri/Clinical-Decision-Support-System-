"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, BarChart2, Lightbulb, ShieldCheck, Search, Zap, Radio, FileText, CheckCircle2 } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

interface BlogHeroProps {
  onOpenSearch?: () => void;
}

export function BlogHero({ onOpenSearch }: BlogHeroProps) {
  const editorialMetrics = [
    { label: "Peer-Reviewed", value: "Clinical AI", sub: "Multi-hospital evaluated", icon: Zap },
    { label: "Explainability", value: "TreeSHAP", sub: "Biomarker attributions", icon: BarChart2 },
    { label: "Telemetry Sync", value: "<20 ms", sub: "Real-time streaming", icon: Radio },
    { label: "Governance", value: "100% Sign-Off", sub: "Physician authority", icon: ShieldCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-4 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20 border-b border-slate-200/80 bg-gradient-to-b from-slate-50/80 via-white to-white">
      {/* Background medical ambient gradient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-teal-400/15 via-cyan-300/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-sky-400/10 via-indigo-300/8 to-transparent blur-3xl"
      />
      {/* Background grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Editorial Heading & Description */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-teal-800 border border-teal-200/80 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span>CLINICAL RESEARCH &amp; INSIGHTS</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-sans font-semibold">PEER-REVIEWED</span>
            </div>

            {/* Main Editorial Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-950 tracking-tight leading-[1.12] sm:leading-[1.08]">
              AI Healthcare, Clinical AI &amp;{" "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent block">
                Health Data Insights
              </span>
            </h1>

            {/* Editorial Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Explore the latest insights, research, and clinical guides on AI in medicine, patient risk prediction,
              TreeSHAP interpretability, and telemetry streaming. Written and reviewed by hospital informaticists and physicians from {BRAND_CONFIG.brandName}.
            </p>

            {/* Clinical Advisory Ribbon */}
            <div className="inline-flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
              <span>Evidence-based clinical intelligence &bull; Human-in-the-loop healthcare</span>
            </div>

            {/* Instant Search Bar */}
            {onOpenSearch && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="group flex items-center gap-3 w-full max-w-lg px-4.5 py-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-400 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <Search className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="flex-1 text-xs sm:text-sm text-slate-500 font-medium truncate">
                    Search clinical research, TreeSHAP, sepsis trajectories...
                  </span>
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 font-bold">
                    ⌘K
                  </kbd>
                </button>
              </div>
            )}

            {/* Editorial Proof Metric Ribbon */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {editorialMetrics.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-teal-600 mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-950 font-mono">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Hero Visual with Doctor & Floating Badges */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Circular soft ambient backdrop */}
            <div className="absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tr from-teal-100/70 via-sky-50/80 to-teal-50/50 blur-2xl -z-10" />

            {/* Doctor Portrait Container */}
            <div className="relative w-full max-w-md aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden border border-slate-200/90 bg-white p-2.5 shadow-2xl shadow-slate-200/60 flex items-center justify-center group">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <Image
                  src="/doctor-hero.jpg"
                  alt="Attending physician Dr. Marcus Vance reviewing clinical research on tablet"
                  width={540}
                  height={540}
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                  priority
                />

                {/* Floating Badge 1: Smarter Healthcare */}
                <div className="absolute top-4 left-4 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-md backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
                    <BarChart2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-extrabold text-slate-900 leading-tight">
                      Smarter Healthcare
                    </span>
                    <span className="block text-[9px] font-mono text-teal-700 font-semibold">
                      Real-Time Analytics
                    </span>
                  </div>
                </div>

                {/* Floating Badge 2: Better Insights */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-md backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-extrabold text-slate-900 leading-tight">
                      Better Insights
                    </span>
                    <span className="block text-[9px] font-mono text-amber-700 font-semibold">
                      TreeSHAP Explainable
                    </span>
                  </div>
                </div>

                {/* Verification Stamp (Top Right) */}
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white shadow-md text-[9px] font-mono font-bold tracking-tight flex items-center gap-1 border border-white/10">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>EDITORIAL REVIEW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
