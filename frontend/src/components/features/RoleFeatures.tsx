"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ROLE_FEATURE_CARDS } from "@/config/features";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  Layout,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoleFeatures() {
  const [activeRoleIdx, setActiveRoleIdx] = useState(0);
  const activeCard = ROLE_FEATURE_CARDS[activeRoleIdx];
  const ActiveIcon = activeCard.icon;

  return (
    <section id="role-features" className="py-10 sm:py-16 lg:py-20 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>ROLE-SCOPED WORKSPACES</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
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

        {/* Live Active Role Workspace Stage */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-300 p-4 sm:p-6 lg:p-8 shadow-md relative overflow-hidden space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-950">{activeCard.title}</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                    {activeCard.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  RBAC Target Route: <span className="font-bold text-teal-700">{activeCard.route}</span>
                </p>
              </div>
            </div>

            <Link href={activeCard.route}>
              <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 rounded-xl shadow-sm px-5 h-10 border-0 transition-all hover:-translate-y-0.5 cursor-pointer">
                <span>Launch {activeCard.role} Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Clinical Scope</span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">{activeCard.description}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Authorization Boundary</span>
              <p className="text-xs text-slate-800 font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span>Least-privilege JWT session with object-level isolation.</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Core Tooling Included</span>
              <div className="flex flex-wrap gap-1">
                {activeCard.capabilities.map((cap) => (
                  <span key={cap} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Role Cards Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ROLE_FEATURE_CARDS.map((card, idx) => {
            const IconComponent = card.icon;
            const isSelected = activeRoleIdx === idx;
            return (
              <div
                key={card.role}
                tabIndex={0}
                onClick={() => setActiveRoleIdx(idx)}
                className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-white border-teal-600 shadow-lg ring-2 ring-teal-500/20"
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-sm"
                          : "bg-teal-50 border border-teal-200 text-teal-700"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wide">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider block mb-1">
                      {card.role}
                    </span>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight group-hover:text-teal-800 transition-colors">
                      {card.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                    {card.description}
                  </p>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    {card.capabilities.slice(0, 3).map((cap) => (
                      <div key={cap} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span className="text-xs leading-snug truncate">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono transition-colors ${isSelected ? "text-teal-800" : "text-slate-600"}`}>
                    {isSelected ? "Active Selected View" : "Click to Preview"}
                  </span>
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
