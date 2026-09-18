"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FEATURES_FAQS } from "@/config/features";
import { HelpCircle, Sparkles, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeaturesFAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>COMMON QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Common Questions About{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Our Platform
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Find answers to the most common questions about our clinical features, model evaluation,
            and healthcare data protection standards.
          </p>
        </div>

        {/* Accessible shadcn Accordion */}
        <div className="rounded-3xl bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-sm">
          <Accordion type="single" collapsible className="w-full space-y-3.5">
            {FEATURES_FAQS.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${idx}`}
                className="border border-slate-200/90 rounded-2xl bg-white px-5 shadow-2xs transition-all hover:border-teal-400 hover:shadow-xs"
              >
                <AccordionTrigger className="text-left font-bold text-slate-950 text-sm sm:text-base hover:text-teal-700 py-4.5 hover:no-underline">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 leading-relaxed pt-1 pb-4 font-normal pl-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Institutional Contact Support Callout */}
          <div className="pt-6 mt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-teal-600" />
              Have clinical deployment questions?
            </span>
            <Link
              href="/contact"
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 hover:underline"
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
