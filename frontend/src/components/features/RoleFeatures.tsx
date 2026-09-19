"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ROLE_FEATURE_CARDS } from "@/config/features";
import { ArrowRight, CheckCircle2, Sparkles, UserCheck, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoleFeatures() {
  const [activeRoleIdx, setActiveRoleIdx] = useState(0);
  const activeCard = ROLE_FEATURE_CARDS[activeRoleIdx];
  const ActiveIcon = activeCard.icon;

  return (
    <section id="role-features" className="py-20 sm:py-28 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>ROLE-SCOPED WORKSPACES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Built for Every{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Healthcare Role
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Tailored clinical interfaces with strict least-privilege RBAC boundaries designed for
            attending physicians, triage nurses, clinical informaticists, and IT administrators.
          </p>
        </div>

        {/* 5 Role Cards Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLE_FEATURE_CARDS.map((card, idx) => {
            const IconComponent = card.icon;
            const isSelected = activeRoleIdx === idx;
            return (
              <div
                key={card.role}
                tabIndex={0}
                onClick={() => setActiveRoleIdx(idx)}
                className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-white border-teal-600 shadow-md ring-2 ring-teal-500/20"
                    : "bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-sm"
                          : "bg-teal-50 border border-teal-200 text-teal-700"
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wide">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider block mb-1">
                      {card.role}
                    </span>
                    <h3 className="text-lg font-bold text-slate-950 tracking-tight group-hover:text-teal-800 transition-colors">
                      {card.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {card.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {card.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span className="text-xs leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <Link href={card.route}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 gap-1.5 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Access Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <span className="text-[10px] font-mono text-slate-500">
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
