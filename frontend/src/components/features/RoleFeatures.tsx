"use client";

import React from "react";
import Link from "next/link";
import { ROLE_FEATURE_CARDS } from "@/config/features";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoleFeatures() {
  return (
    <section id="role-features" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-mono font-bold tracking-wider text-teal-700 uppercase bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full shadow-2xs">
            ROLE-BASED WORKSPACES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Built for Every Healthcare Role
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Tailored clinical interfaces with strict least-privilege RBAC boundaries designed for
            patients, physicians, ward nurses, informaticists, and platform administrators.
          </p>
        </div>

        {/* 5 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ROLE_FEATURE_CARDS.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.role}
                tabIndex={0}
                className="group rounded-2xl bg-slate-50/70 border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200/80 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wide">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      {card.role}
                    </span>
                    <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                      {card.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-slate-200/60">
                    {card.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="text-[11px] leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                  <Link href={card.route}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold border-slate-300 hover:bg-white gap-1.5 rounded-xl"
                    >
                      <span>Access Workspace</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <span className="text-[10px] font-mono text-slate-400">
                    {card.route}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
