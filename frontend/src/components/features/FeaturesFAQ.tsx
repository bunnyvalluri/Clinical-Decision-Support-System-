"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FEATURES_FAQS } from "@/config/features";
import { HelpCircle } from "lucide-react";

export function FeaturesFAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide uppercase shadow-2xs">
            <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>COMMON QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Common Questions About Our Platform
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Find answers to the most common questions about our clinical features, model evaluation,
            and healthcare data protection standards.
          </p>
        </div>

        {/* Accessible shadcn Accordion */}
        <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-2xs">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FEATURES_FAQS.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${idx}`}
                className="border border-slate-200/80 rounded-2xl bg-white px-5 shadow-2xs transition-all hover:border-teal-300"
              >
                <AccordionTrigger className="text-left font-bold text-slate-950 text-sm sm:text-base hover:text-teal-700 py-4.5 hover:no-underline">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 leading-relaxed pt-1 pb-4 font-normal">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
