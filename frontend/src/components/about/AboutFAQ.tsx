"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    question: "What is this platform?",
    answer:
      "It is an AI and machine-learning-powered clinical decision-support platform designed to help healthcare professionals understand patient risk and relevant clinical information.",
  },
  {
    question: "Does the platform replace healthcare professionals?",
    answer:
      "No. The platform is designed to assist qualified healthcare professionals. Clinical decisions remain with appropriately qualified professionals.",
  },
  {
    question: "How does patient risk prediction work?",
    answer:
      "The system processes validated patient data through evaluated machine-learning models to generate risk-related predictions and supporting insights.",
  },
  {
    question: "Can predictions be explained?",
    answer:
      "The platform is designed to support explainability through model metadata, relevant features, evaluation information, and explainability techniques such as SHAP where appropriate.",
  },
  {
    question: "How is healthcare data protected?",
    answer:
      "The platform uses authentication, role-based authorization, least-privilege access, auditing, secure APIs, database controls, and security monitoring.",
  },
  {
    question: "Can the platform work in real time?",
    answer:
      "Yes. The architecture supports real-time events and updates through Django Channels, WebSockets, and Redis where appropriate.",
  },
  {
    question: "Is the AI always correct?",
    answer:
      "No machine-learning or AI system should be treated as infallible. Predictions require appropriate validation, uncertainty handling, monitoring, and professional review.",
  },
  {
    question: "Who is the platform designed for?",
    answer:
      "The platform supports patients/users, doctors, nurses, medical informaticists, and authorized IT administrators through role-specific workflows.",
  },
];

export function AboutFAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide uppercase">
            <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>KNOWLEDGE BASE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Find answers to common questions regarding our clinical decision support architecture,
            safety standards, and deployment models.
          </p>
        </div>

        {/* Accessible shadcn Accordion */}
        <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-2xs">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_LIST.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`item-${idx}`}
                className="border border-slate-200/80 rounded-2xl bg-white px-5 shadow-2xs transition-all hover:border-slate-300"
              >
                <AccordionTrigger className="text-left font-bold text-slate-950 text-sm sm:text-base hover:text-teal-700 py-4 hover:no-underline">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 leading-relaxed pt-1 pb-4">
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
