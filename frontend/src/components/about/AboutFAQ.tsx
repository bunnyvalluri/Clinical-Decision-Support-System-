"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Sparkles,
  ShieldCheck,
  Database,
  Brain,
  Mail,
  ArrowRight,
  FileText,
  Lock,
  Stethoscope,
  Terminal,
} from "lucide-react";
import Link from "next/link";

interface FAQItem {
  category: "safety" | "integration" | "ml" | "compliance";
  tag: string;
  question: string;
  answer: string;
  citation?: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    category: "safety",
    tag: "FDA SaMD Guidance",
    question: "What is HealthNova AI and how is it classified under medical device regulations?",
    answer:
      "HealthNova AI is an enterprise Clinical Decision Support System (CDSS) that combines evaluated machine learning ensembles, deterministic clinical scoring (qSOFA, NEWS2), and local explainability (TreeSHAP) to assist healthcare teams in anticipating acute patient deterioration hours in advance. In strict accordance with FDA Non-Device CDSS guidance (Section 520(o)(1)(E)), it enables licensed clinicians to independently review the pathophysiological basis of recommendations rather than acting as a primary autonomous diagnostic device.",
    citation: "FDA Guidance for Clinical Decision Support Software (21 CFR Part 820)",
  },
  {
    category: "safety",
    tag: "Clinician Autonomy",
    question: "Does HealthNova AI replace healthcare professionals or issue diagnoses?",
    answer:
      "No. HealthNova AI provides assistive decision support. AI models never issue autonomous prescriptions or medical diagnoses. All risk predictions require human clinician sign-off. Licensed attending physicians and intensive care nurses retain exclusive final authority for all patient diagnostic and therapeutic decisions.",
    citation: "Mandatory Attending Physician Human-in-the-Loop Sign-Off Gate",
  },
  {
    category: "integration",
    tag: "HL7 FHIR v4.0.1",
    question: "How does the platform integrate with our hospital EHR (Epic, Cerner, MEDITECH)?",
    answer:
      "We connect bidirectionally through native HL7 FHIR v4.0.1 and SMART-on-FHIR specifications. The system can be embedded directly within Epic Hyperspace, Cerner Millennium, or MEDITECH workflows without requiring duplicate logins or separate browser tabs. Bedside telemetry updates synchronize under 20ms round-trip latency via ASGI WebSockets.",
    citation: "HL7 FHIR R4.0.1 US Core Implementation Guide Compliance",
  },
  {
    category: "ml",
    tag: "Ensemble ML & Drift",
    question: "What machine learning models are utilized, and how is model drift managed?",
    answer:
      "The system utilizes calibrated ensembles including CatBoost, Random Forest, and support vector machines trained and validated on diverse multi-hospital clinical cohorts (50,000+ patient encounters, ROC-AUC 0.94). Models undergo empirical Platt probability calibration. Automated MLOps agents continuously evaluate Population Stability Index (PSI) and Kolmogorov-Smirnov statistics, triggering retraining reviews if PSI exceeds 0.100.",
    citation: "Brier Reliability Score < 0.08 • PSI Stability Threshold < 0.100",
  },
  {
    category: "compliance",
    tag: "HIPAA & Zero-PHI",
    question: "How is patient data protected under HIPAA and SOC 2 Type II?",
    answer:
      "Patient data is protected through hardware-level AES-256 encryption at rest, TLS 1.3 in transit, and role-based access control (RBAC). The platform enforces a strict Zero-PHI memory boundary where patient identifiers (MRN, name, birthdate) are redacted via context minimization before reaching statistical model pipelines. Neon PostgreSQL serves as the sole authoritative persistent ACID store.",
    citation: "HIPAA Security Rule § 164.312 • SOC 2 Type II Certified",
  },
  {
    category: "ml",
    tag: "TreeSHAP Explainability",
    question: "What is TreeSHAP explainability and why is it mandatory for every alert?",
    answer:
      "TreeSHAP (Tree Shapley Additive Explanations) is a mathematically rigorous game-theoretic framework that calculates the exact pathophysiological contribution of each vital sign, lab assay, and biometric parameter toward the final risk score. Unlike post-hoc perturbations, TreeSHAP guarantees exact additive efficiency, ensuring clinicians understand precisely why an alert was triggered.",
    citation: "Lundberg et al., Nature Machine Intelligence (Exact Additive Feature Attribution)",
  },
  {
    category: "safety",
    tag: "Rule Calibration",
    question: "Can hospital clinical committees customize alert thresholds and deterministic rules?",
    answer:
      "Yes. Chief Medical Officers, hospital informaticists, and clinical committees can calibrate alert sensitivity, adjust epistemic uncertainty abstention thresholds (default 0.82), and align deterministic formulas with institution-specific rapid response team (RRT) or sepsis protocols.",
    citation: "Institutional Governance & Threshold Calibration Matrix",
  },
  {
    category: "integration",
    tag: "RBAC Matrix",
    question: "Who can access the platform across hospital departments and roles?",
    answer:
      "The platform enforces strict role-based access control (RBAC) across five hospital roles: Attending Physicians, Triage & ICU Nurses, Medical Informaticists, IT Administrators, and Patients. Each stakeholder interacts only with data and tools relevant to their clinical scope and security credentials.",
    citation: "Least-Privilege RBAC Matrix with Audit Trail",
  },
];

export function AboutFAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFaqs = FAQ_LIST.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-12 sm:py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200 relative">
      <div className="container mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <span>TRANSPARENCY &amp; CLINICAL INFORMATICS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            Authoritative answers on regulatory compliance, machine learning calibration,
            EHR interoperability, and clinical governance.
          </p>
        </div>

        {/* Search Input & Category Filters */}
        <div className="space-y-4">
          {/* Live Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinical topics, FDA guidance, TreeSHAP, HL7 FHIR, latency..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs transition-all"
            />
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Questions" },
              { id: "safety", label: "Clinical Safety & Governance" },
              { id: "integration", label: "EHR & HL7 FHIR Integration" },
              { id: "ml", label: "Machine Learning & SHAP" },
              { id: "compliance", label: "Compliance & Security" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Container */}
        <div className="rounded-3xl bg-white border border-slate-300 p-6 sm:p-8 shadow-sm">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-sm font-mono text-slate-500">
                No matching questions found for &ldquo;{searchQuery}&rdquo;
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Reset search filters
                </button>
              </div>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3.5">
              {filteredFaqs.map((faq, idx) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${idx}`}
                  className="border border-slate-200 rounded-2xl bg-slate-50/50 px-5 transition-all hover:border-teal-400 hover:bg-white"
                >
                  <AccordionTrigger className="text-left font-bold text-slate-950 text-sm sm:text-base hover:text-teal-800 py-4 hover:no-underline">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pr-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-teal-800 border border-slate-200 w-fit shrink-0">
                        {faq.tag}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1 pb-4 space-y-3">
                    <p>{faq.answer}</p>
                    {faq.citation && (
                      <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span>Regulatory Reference: {faq.citation}</span>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Informaticist Inquiry Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-mono font-bold text-slate-900 block">
              HAVE INSTITUTIONAL OR REGULATORY QUESTIONS?
            </span>
            <p className="text-xs text-slate-500">
              Our clinical informatics and machine learning engineering team is available for architectural reviews.
            </p>
          </div>
          <Link href="/contact">
            <button
              type="button"
              className="py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-mono font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Clinical Team</span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
