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
    question: "What is HealthNova AI?",
    answer:
      "HealthNova AI is an enterprise Clinical Decision Support System (CDSS) that combines evaluated machine learning ensembles, deterministic clinical scoring (qSOFA, NEWS2), and local explainability (TreeSHAP) to assist healthcare teams in identifying acute patient deterioration and risk trajectories hours in advance.",
  },
  {
    question: "Does HealthNova AI replace healthcare professionals or issue diagnoses?",
    answer:
      "No. In strict compliance with FDA CDSS non-device guidance, HealthNova AI provides assistive decision support. AI models never issue autonomous prescriptions or medical diagnoses. Licensed clinicians retain full authority for all patient diagnostic and therapeutic decisions.",
  },
  {
    question: "How does the platform integrate with our existing hospital EHR?",
    answer:
      "We connect bidirectionally through native HL7 FHIR v4.0.1 and SMART-on-FHIR specifications. The system can be embedded directly within Epic Hyperspace, Cerner Millennium, or MEDITECH workflows without requiring duplicate logins or separate tabs.",
  },
  {
    question: "What machine learning models and datasets are utilized?",
    answer:
      "The system utilizes calibrated ensembles including Random Forest, Gradient Boosted Trees (CatBoost/XGBoost), and support vector machines trained and validated on diverse multi-hospital clinical cohorts. Models undergo continuous Population Stability Index (PSI) and Brier calibration monitoring.",
  },
  {
    question: "How is patient data protected under HIPAA and SOC 2?",
    answer:
      "Patient data is protected through AES-256 encryption at rest, TLS 1.3 in transit, and role-based access control (RBAC). The platform operates under a Zero-PHI memory boundary where patient identifiers are redacted before reaching statistical model pipelines.",
  },
  {
    question: "What is TreeSHAP explainability?",
    answer:
      "TreeSHAP (Tree Shapley Additive Explanations) is a mathematically rigorous game-theoretic approach that calculates the exact pathophysiological contribution of each vital sign, lab assay, and biometric marker toward the final risk score, eliminating black-box opacity.",
  },
  {
    question: "Can hospital clinical committees customize alert thresholds and rules?",
    answer:
      "Yes. Clinical administrators and medical informaticists can calibrate alert sensitivity, adjust epistemic uncertainty thresholds, and align scoring formulas with institution-specific sepsis or rapid response team (RRT) protocols.",
  },
  {
    question: "Who can access the platform across hospital roles?",
    answer:
      "The system provides tailored, role-gated interfaces for Attending Physicians, Triage Nurses, Medical Informaticists, IT Administrators, and Patients, ensuring each stakeholder interacts only with data and tools relevant to their scope.",
  },
];

export function AboutFAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold tracking-wide uppercase shadow-2xs">
            <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>TRANSPARENCY &amp; FAQS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            Find answers to critical questions regarding our clinical decision support architecture,
            safety standards, and hospital deployment models.
          </p>
        </div>

        {/* Accessible shadcn Accordion */}
        <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-2xs">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQ_LIST.map((faq, idx) => (
              <AccordionItem
                key={faq.question}
                value={`item-${idx}`}
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
