"use client";

import React from "react";
import { POWERFUL_FEATURES } from "@/config/features";
import { Sparkles, ArrowUpRight } from "lucide-react";

export function FeatureGrid() {
  return (
    <section id="powerful-features" className="py-20 sm:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>CORE CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Personalized Care.{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Real Impact.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Everything needed to understand patient risk trajectories, stream physiological vitals, and support
            informed clinical decisions within a secure hospital ecosystem.
          </p>
        </div>

        {/* 12 Feature Cards Responsive Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {POWERFUL_FEATURES.map((feat) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={feat.id}
                tabIndex={0}
                className="group rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div className="space-y-4">
                  {/* Card Header: Icon & Category/Badge */}
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wide">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 font-bold block mb-1">
                      {feat.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-950 tracking-tight group-hover:text-teal-700 transition-colors">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
