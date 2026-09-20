"use client";

import React, { useState, useMemo } from "react";
import { POWERFUL_FEATURES } from "@/config/features";
import {
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export function FeatureGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

  const categories = [
    { id: "ALL", label: "All Capabilities" },
    { id: "PATIENT INTELLIGENCE", label: "Risk Prediction" },
    { id: "TELEMETRY & STREAMS", label: "Telemetry Streams" },
    { id: "CLINICAL DECISIONING", label: "Decision Support" },
    { id: "INTERPRETABILITY", label: "TreeSHAP Explainability" },
    { id: "GOVERNANCE & TRUST", label: "Security & Governance" },
  ];

  const filteredFeatures = useMemo(() => {
    return POWERFUL_FEATURES.filter((f) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        f.category.toUpperCase().includes(selectedCategory) ||
        selectedCategory.includes(f.category.toUpperCase());

      const matchesSearch =
        searchQuery.trim() === "" ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="powerful-features" className="py-20 sm:py-28 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>ENTERPRISE CAPABILITIES MATRIX</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Comprehensive Tools for{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Clinical Excellence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Twelve integrated clinical and engineering capabilities designed to eliminate diagnostic
            blindspots, automate vital monitoring, and support clinical stewardship.
          </p>

          {/* Search & Domain Filter Toolbar */}
          <div className="pt-4 max-w-2xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities (e.g., TreeSHAP, Holter, qSOFA, Redis, FHIR)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Interactive Domain Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono text-slate-500 text-center">
              Showing {filteredFeatures.length} of {POWERFUL_FEATURES.length} verified capabilities
            </div>
          </div>
        </div>

        {/* 12 Feature Cards Responsive Grid */}
        {filteredFeatures.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 max-w-md mx-auto space-y-2">
            <p className="text-sm font-bold text-slate-900">No matching capabilities found</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or switching back to &ldquo;All Capabilities&rdquo;.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="mt-2 text-xs font-mono font-bold text-teal-700 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredFeatures.map((feat) => {
              const IconComponent = feat.icon;
              const isExpanded = expandedFeatureId === feat.id;

              return (
                <div
                  key={feat.id}
                  tabIndex={0}
                  className="group rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:border-teal-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wide">
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 font-bold block mb-1">
                        {feat.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-950 tracking-tight group-hover:text-teal-800 transition-colors">
                        {feat.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {feat.description}
                    </p>

                    {/* Expandable Technical Specification Drawer */}
                    {isExpanded && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>SPECIFICATION PAYLOAD</span>
                          <span className="text-teal-700 font-bold">HL7 FHIR v4.0.1</span>
                        </div>
                        <div className="text-[11px] text-slate-700 space-y-1">
                          <p>• Telemetry Latency: <strong>&lt; 20ms over ASGI</strong></p>
                          <p>• Data Ingestion: <strong>Redis Channel Layer</strong></p>
                          <p>• Audit Persistence: <strong>Neon PostgreSQL ACID</strong></p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <button
                      type="button"
                      onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)}
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="h-3 w-3" />
                      <span>{isExpanded ? "Hide Details" : "Inspect Payload"}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <span>ID: #{feat.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
