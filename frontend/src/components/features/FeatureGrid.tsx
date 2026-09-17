import React from "react";
import { POWERFUL_FEATURES } from "@/config/features";

export function FeatureGrid() {
  return (
    <section id="powerful-features" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            POWERFUL FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Personalized Care. Real Impact.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Everything needed to understand patient risk, analyze healthcare data, and support
            informed clinical decisions within a secure hospital ecosystem.
          </p>
        </div>

        {/* 12 Feature Cards Responsive Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {POWERFUL_FEATURES.map((feat) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={feat.id}
                tabIndex={0}
                className="group rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div className="space-y-4">
                  {/* Card Header: Icon & Category/Badge */}
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                      {feat.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-950 tracking-tight">
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
