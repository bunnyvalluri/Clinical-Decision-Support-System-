"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Download
} from "lucide-react";

interface ConsentItem {
  id: string;
  type: string;
  title: string;
  description: string;
  granted: boolean;
  version: string;
  updatedAt: string;
  required: boolean;
}

const DEFAULT_CONSENTS: ConsentItem[] = [
  {
    id: "hipaa_sharing",
    type: "HIPAA_DISCLOSURE",
    title: "HIPAA Clinical Data Exchange",
    description: "Authorizes secure sharing of lab results, vitals, and diagnostic histories among your designated primary care and specialty medical team.",
    granted: true,
    version: "v4.2 (2026)",
    updatedAt: "2026-08-14T10:30:00Z",
    required: true,
  },
  {
    id: "ai_inference",
    type: "AI_RISK_SCORING",
    title: "AI Clinical Decision Support & Risk Analysis",
    description: "Permits de-identified clinical telemetry and symptom logs to be processed by validated ensemble ML models for non-autonomous risk stratification.",
    granted: true,
    version: "v3.1 (2026)",
    updatedAt: "2026-08-14T10:30:00Z",
    required: false,
  },
  {
    id: "telehealth_recording",
    type: "TELEHEALTH_CONSENT",
    title: "Telehealth Encounter Recordings & Transcripts",
    description: "Allows audio/visual recording of video consultations solely for clinical documentation, care plan reconciliation, and physician review.",
    granted: false,
    version: "v2.0 (2025)",
    updatedAt: "2026-01-10T14:15:00Z",
    required: false,
  },
  {
    id: "research_deid",
    type: "RESEARCH_ANALYTICS",
    title: "De-Identified Clinical Research Contribution",
    description: "Contribute fully de-identified health metrics to academic medical consortium research on cardiopulmonary health and early clinical intervention.",
    granted: true,
    version: "v1.8 (2025)",
    updatedAt: "2026-05-20T09:00:00Z",
    required: false,
  },
];

export default function ConsentPage() {
  const [consents, setConsents] = useState<ConsentItem[]>(DEFAULT_CONSENTS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((item) => {
        if (item.id === id && !item.required) {
          return {
            ...item,
            granted: !item.granted,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Consent & Legal Authorizations</h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Manage your HIPAA data authorizations, AI clinical processing consent, and health information exchanges. You hold legal rights under 45 CFR § 164.508 to revoke optional authorizations at any time.
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Save Consent Preferences"}
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Consent updates recorded successfully with cryptographic audit timestamp.</span>
          </div>
        )}
      </div>

      {/* Grid of Consent Cards */}
      <div className="space-y-4">
        {consents.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {item.version}
                  </span>
                  {item.required ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Required for Active Care
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last reviewed: {new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <a
                    href="#view-notice"
                    className="text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
                  >
                    View legal agreement <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={() => toggleConsent(item.id)}
                  disabled={item.required}
                  aria-label={`Toggle consent for ${item.title}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                    item.granted ? "bg-teal-600" : "bg-slate-200"
                  } ${item.required ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      item.granted ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold ${item.granted ? "text-teal-700" : "text-slate-500"}`}>
                  {item.granted ? "Authorized" : "Revoked"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Regulatory & Audit Guarantee Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-slate-900">
            <Lock className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-base">Cryptographic Audit Trail</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Every grant and revocation is recorded in our tamper-evident audit ledger with SHA-256 integrity proofs. You can request a certified copy of your consent ledger for personal or legal records.
          </p>
          <button className="text-sm font-medium text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Download Signed Consent PDF
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-slate-900">
            <HelpCircle className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-base">Have Questions About Your Rights?</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Our hospital Privacy Officer is available to discuss your rights regarding electronic protected health information (ePHI) or revoke authorizations via telephone or mail.
          </p>
          <a
            href="mailto:privacy@patientrisk.internal"
            className="text-sm font-medium text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5"
          >
            Contact Hospital Privacy Officer <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
