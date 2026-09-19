"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FEATURES_FAQS } from "@/config/features";
import { HelpCircle, Sparkles, Mail, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export function FeaturesFAQ() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = FEATURES_FAQS.filter(
    (faq) =>
      searchQuery.trim() === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>COMMON QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Find answers regarding our clinical features, model calibration,
            EHR interoperability, and healthcare data protection standards.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feature questions, TreeSHAP, HL7 FHIR..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Accessible shadcn Accordion */}
        <div className="rounded-3xl bg-slate-50/70 border border-slate-300 p-6 sm:p-8 lg:p-10 shadow-sm">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-sm font-mono text-slate-500">
                No matching questions found for &ldquo;{searchQuery}&rdquo;
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Reset search filter
                </button>
              </div>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3.5">
              {filteredFaqs.map((faq, idx) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${idx}`}
                  className="border border-slate-200 rounded-2xl bg-white px-5 shadow-2xs transition-all hover:border-teal-400 hover:shadow-xs"
                >
                  <AccordionTrigger className="text-left font-bold text-slate-950 text-sm sm:text-base hover:text-teal-800 py-4 hover:no-underline">
                    <span>{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1 pb-4 font-normal">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Institutional Contact Support Callout */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-teal-700" />
              Have clinical deployment or hospital IT questions?
            </span>
            <Link
              href="/contact"
              className="text-teal-800 hover:text-teal-950 font-bold flex items-center gap-1 hover:underline font-mono"
            >
              <span>Speak with an Informatics Specialist</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
