"use client";

import React, { useState } from "react";
import { Plus, Minus, HelpCircle, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

interface FAQItem {
  id: string;
  category: "all" | "integration" | "security" | "clinical";
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "integrate",
    category: "integration",
    question: "How can HealthNova AI integrate with our existing systems?",
    answer:
      "HealthNova AI supports bidirectional HL7 FHIR standards, DICOM messaging, and RESTful APIs, allowing smooth synchronization with major EHR platforms (such as Epic, Cerner, and Meditech) and bedside telemetry monitors without ripping or replacing existing infrastructure.",
  },
  {
    id: "security",
    category: "security",
    question: "Is our data secure and compliant?",
    answer:
      "Yes. HealthNova AI operates on a zero-trust, defense-in-depth architecture. All data in transit is encrypted using TLS 1.3, and data at rest is encrypted with AES-256. Context minimization ensures no patient identifiers are shared with external model endpoints. Cryptographic audit logs in Neon PostgreSQL ensure complete auditability.",
  },
  {
    id: "customize",
    category: "integration",
    question: "Can solutions be customized for our organization?",
    answer:
      "Yes. Clinical risk thresholds, alert escalation tiers, triage scoring weights (NEWS2, qSOFA), and notification rules can be tailored to match your hospital's specific clinical pathways, departmental workflows, and administrative policies.",
  },
  {
    id: "timeline",
    category: "integration",
    question: "How long does implementation take?",
    answer:
      "Standard cloud deployments typically go live within 4 to 8 weeks. This includes FHIR connector validation, role-based access configuration, clinical team onboarding, and test runs against simulated telemetry data.",
  },
  {
    id: "training",
    category: "clinical",
    question: "Do you provide training and ongoing support?",
    answer:
      "We provide dedicated clinical informatics specialists, hands-on CME-eligible training modules for physicians and nurses, 24/7 technical support, and continuous MLOps monitoring to detect and resolve model drift.",
  },
  {
    id: "problems-solved",
    category: "clinical",
    question: "What healthcare problems does HealthNova AI solve?",
    answer:
      "HealthNova AI addresses delayed detection of patient physiological decompensation, clinician burnout from fragmented documentation, alarm fatigue caused by non-contextual alerts, and siloing between bedside nursing and attending physician decision-making.",
  },
  {
    id: "who-can-use",
    category: "clinical",
    question: "Who can use HealthNova AI?",
    answer:
      "HealthNova AI provides role-tailored portals for licensed physicians, bedside nurses, clinical informaticists, hospital administrators, and patients seeking transparent visibility into their personal care pathways.",
  },
  {
    id: "risk-prediction-work",
    category: "clinical",
    question: "How does patient risk prediction work?",
    answer:
      "Validated ensemble machine learning models (Support Vector Machines, Random Forest, and AdaBoost) analyze historical cohort patterns alongside real-time vitals. Predictions calculate risk probabilities with statistical confidence bounds rather than binary assumptions.",
  },
  {
    id: "replace-professionals",
    category: "clinical",
    question: "Does HealthNova AI replace healthcare professionals?",
    answer:
      "Absolutely not. HealthNova AI is strictly a clinical decision support system. It provides timely, contextual intelligence to assist clinicians. Final diagnostic judgment, prescriptions, and treatment plans always remain the exclusive responsibility of licensed human clinicians.",
  },
  {
    id: "explainability",
    category: "clinical",
    question: "How explainable are the ML predictions?",
    answer:
      "Every prediction includes TreeSHAP (Shapley Additive exPlanations) attribution bars. Clinicians see exactly which physiological parameters (e.g. systolic blood pressure drop, heart rate volatility) drove the score, eliminating 'black-box' opacity.",
  },
];

export function SolutionsFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const filteredFaqs =
    activeCategory === "all"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="py-16 sm:py-22 bg-slate-50/60 border-b border-slate-200/80">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span>SOLUTIONS FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Common Questions About Our Solutions
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Find answers to frequently asked questions about our healthcare AI solutions, integration pathways, and clinical governance.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {[
              { id: "all", label: "All Questions (10)" },
              { id: "clinical", label: "Clinical & ML (5)" },
              { id: "integration", label: "FHIR Integration (3)" },
              { id: "security", label: "Security & Privacy (2)" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-white border transition-all ${
                  isOpen ? "border-teal-300 shadow-sm" : "border-slate-200/90 shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  id={`faq-question-${item.id}`}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-950 leading-snug">
                    {item.question}
                  </span>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isOpen
                        ? "bg-teal-50 border-teal-200 text-teal-700"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-question-${item.id}`}
                    className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100"
                  >
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reassurance Footer Note */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500">
            Have a specialized clinical integration or regulatory question?{" "}
            <a
              href="/about#faq"
              className="font-bold text-teal-700 hover:text-teal-900 underline underline-offset-2"
            >
              Contact our clinical informatics team &rarr;
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
