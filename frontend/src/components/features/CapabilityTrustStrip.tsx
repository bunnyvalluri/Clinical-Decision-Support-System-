"use client";

import React from "react";
import { TRUST_STRIP_ITEMS } from "@/config/features";

export function CapabilityTrustStrip() {
  return (
    <section className="py-6 sm:py-8 bg-slate-50/70 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {TRUST_STRIP_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 group cursor-default"
              >
                <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-950 truncate leading-tight group-hover:text-teal-800 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] font-mono font-medium text-slate-500 truncate leading-tight mt-0.5">
                    {item.subtitle}
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
