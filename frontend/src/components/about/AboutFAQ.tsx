"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles, Mail, ArrowRight, ShieldCheck, Database, Brain } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  category: "safety" | "integration" | "ml" | "all";
  tag: string;
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    category: "safety",
    tag: "FDA Guidance",
    question: "What is HealthNova AI?",
    answer:
      "HealthNova AI is an enterprise Clinical Decision Support System (CDSS) that combines evaluated machine learning ensembles, deterministic clinical scoring (qSOFA, NEWS2), and local explainability (TreeSHAP) to assist healthcare teams in identifying acute patient deterioration and risk trajectories hours in advance.",
  },
  {
    category: "safety",
    tag: "Clinician Autonomy",
    question: "Does HealthNova AI replace healthcare professionals or issue diagnoses?",
    answer:
      "No. In strict compliance with FDA CDSS non-device guidance, HealthNova AI provides assistive decision support. AI models never issue autonomous prescriptions or medical diagnoses. Licensed clinicians retain full authority for all patient diagnostic and therapeutic decisions.",
  },
  {
    category: "integration",
    tag: "HL7 FHIR v4",
    question: "How does the platform integrate with our existing hospital EHR?",
    answer:
      "We connect bidirectionally through native HL7 FHIR v4.0.1 and SMART-on-FHIR specifications. The system can be embedded directly within Epic Hyperspace, Cerner Millennium, or MEDITECH workflows without requiring duplicate logins or separate tabs.",
  },
  {
    category: "ml",
    tag: "Ensemble ML",
    question: "What machine learning models and datasets are utilized?",
    answer:
      "The system utilizes calibrated ensembles including Random Forest, Gradient Boosted Trees (CatBoost/XGBoost), and support vector machines trained and validated on diverse multi-hospital clinical cohorts. Models undergo continuous Population Stability Index (PSI) and Brier calibration monitoring.",
  },
  {
    category: "safety",
    tag: "HIPAA / SOC 2",
    question: "How is patient data protected under HIPAA and SOC 2?",
    answer:
      "Patient data is protected through AES-256 encryption at rest, TLS 1.3 in transit, and role-based access control (RBAC). The platform operates under a Zero-PHI memory boundary where patient identifiers are redacted before reaching statistical model pipelines.",
  },
  {
    category: "ml",
    tag: "TreeSHAP",
    question: "What is TreeSHAP explainability?",
    answer:
      "TreeSHAP (Tree Shapley Additive Explanations) is a mathematically rigorous game-theoretic approach that calculates the exact pathophysiological contribution of each vital sign, lab assay, and biometric marker toward the final risk score, eliminating black-box opacity.",
  },
  {
    category: "safety",
    tag: "Rule Calibration",
    question: "Can hospital clinical committees customize alert thresholds and rules?",
    answer:
      "Yes. Clinical administrators and medical informaticists can calibrate alert sensitivity, adjust epistemic uncertainty thresholds, and align scoring formulas with institution-specific sepsis or rapid response team (RRT) protocols.",
  },
  {
    category: "integration",
    tag: "Hospital RBAC",
    question: "Who can access the platform across hospital roles?",
    answer:
      "The system provides tailored, role-gated interfaces for Attending Physicians, Triage Nurses, Medical Informaticists, IT Administrators, and Patients, ensuring each stakeholder interacts only with data and tools relevant to their scope.",
  },
];

export function AboutFAQ() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFaqs =
    activeCategory === "all"
      ? FAQ_LIST
      : FAQ_LIST.filter((item) => item.category === activeCategory);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>TRANSPARENCY &amp; FAQS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Find answers to critical questions regarding our clinical decision support architecture,
            safety standards, and hospital deployment models.
          </p>

          {/* Interactive Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: "all", label: "All Questions" },
              { id: "safety", label: "Clinical Safety & Governance" },
              { id: "integration", label: "EHR & HL7 FHIR Integration" },
              { id: "ml", label: "Machine Learning & SHAP" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accessible shadcn Accordion */}
        <div className="rounded-3xl bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <Accordion type="single" collapsible className="w-full space-y-3.5">
            {filteredFaqs.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`item-${idx}`}
                className="border border-slate-200/90 rounded-2xl bg-white px-5 shadow-2xs transition-all hover:border-teal-400 hover:shadow-xs"
              >
                <AccordionTrigger className="text-left font-bold text-slate-950 text-sm sm:text-base hover:text-teal-700 py-4.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 pr-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                      {faq.tag}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 leading-relaxed pt-1 pb-5 font-normal pl-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Institutional Contact Support Callout */}
          <div className="pt-6 mt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-teal-600" />
              Have institutional or compliance questions?
            </span>
            <Link
              href="/contact"
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Contact Clinical Informatics Team</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
