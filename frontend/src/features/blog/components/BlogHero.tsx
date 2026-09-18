"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, BarChart2, Lightbulb, ShieldCheck, Search } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

interface BlogHeroProps {
  onOpenSearch?: () => void;
}

export function BlogHero({ onOpenSearch }: BlogHeroProps) {
  return (
    <section className="relative overflow-hidden pt-4 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20 border-b border-slate-200/80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.06),rgba(2,132,199,0.03),transparent)]">
      {/* Background medical grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Editorial Heading & Description */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>OUR BLOG</span>
            </div>

            {/* Main Editorial Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              AI Healthcare, Wellness &amp; <br />
              <span className="text-teal-600 underline decoration-teal-300/60 decoration-wavy decoration-2 underline-offset-8">
                Health Data Insights
              </span>
            </h1>

            {/* Editorial Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Explore the latest insights, research, and practical guides on AI in healthcare, patient wellness, clinical innovation and data-driven decisions. Stay informed with expert perspectives, trends and real-world applications from {BRAND_CONFIG.brandName}.
            </p>

            {/* Clinical Advisory Ribbon */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
              <span>Evidence-based clinical intelligence &bull; Human-in-the-loop healthcare</span>
            </div>

            {/* Instant Search Bar */}
            {onOpenSearch && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="group flex items-center gap-3 w-full max-w-lg px-4 py-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-400 hover:shadow-md transition-all text-left"
                >
                  <Search className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="flex-1 text-xs sm:text-sm text-slate-500 font-medium truncate">
                    Search clinical research, TreeSHAP, sepsis trajectories...
                  </span>
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
                    ⌘K
                  </kbd>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Hero Visual with Doctor & Floating Badges */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Circular soft ambient backdrop */}
            <div className="absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tr from-teal-100/70 via-sky-50/80 to-teal-50/50 blur-2xl -z-10" />

            {/* Doctor Portrait Container */}
            <div className="relative w-full max-w-md aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-xs flex items-center justify-center p-2 group">
              <Image
                src="/doctor-hero.jpg"
                alt="Healthcare professional using clinical AI technology on tablet"
                width={540}
                height={540}
                className="w-full h-full object-cover rounded-2xl group-hover:scale-102 transition-transform duration-500"
                priority
              />

              {/* Floating Badge 1: Smarter Healthcare */}
              <div className="absolute top-6 left-4 sm:top-8 sm:left-6 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200/80 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-left duration-300">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-600">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-extrabold text-slate-900 leading-tight">
                    Smarter Healthcare
                  </span>
                  <span className="block text-[9px] font-medium text-slate-500">
                    Real-Time Predictive Analytics
                  </span>
                </div>
              </div>

              {/* Floating Badge 2: Better Insights */}
              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200/80 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-bottom duration-400">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-extrabold text-slate-900 leading-tight">
                    Better Insights
                  </span>
                  <span className="block text-[9px] font-medium text-slate-500">
                    TreeSHAP Explainability
                  </span>
                </div>
              </div>

              {/* Annotation Callout (Top Right) */}
              <div className="absolute -top-3 -right-2 sm:top-2 sm:right-2 rotate-6 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-lg text-[10px] font-bold tracking-tight">
                <span>Knowledge today for a healthier tomorrow ✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
