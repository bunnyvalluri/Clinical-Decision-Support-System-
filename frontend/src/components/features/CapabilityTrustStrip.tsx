import React from "react";
import { TRUST_STRIP_ITEMS } from "@/config/features";

export function CapabilityTrustStrip() {
  return (
    <section className="py-6 sm:py-8 bg-slate-50/70 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {TRUST_STRIP_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center shrink-0">
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate leading-tight">
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
