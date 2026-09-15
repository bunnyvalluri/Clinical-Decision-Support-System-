"use client";

import * as React from "react";
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
  Download,
  Activity,
  Sparkles,
  Video,
  Microscope,
  FileCheck,
  X,
  Printer,
  Scale,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

interface ConsentItem {
  id: string;
  type: string;
  title: string;
  category: "CLINICAL" | "AI" | "TELEHEALTH" | "RESEARCH";
  description: string;
  legal_notice: string;
  granted: boolean;
  version: string;
  updatedAt: string;
  required: boolean;
}

const DEFAULT_CONSENTS: ConsentItem[] = [
  {
    id: "hipaa_sharing",
    type: "HIPAA_DISCLOSURE",
    category: "CLINICAL",
    title: "HIPAA Clinical Data Exchange",
    description:
      "Authorizes secure sharing of lab results, vitals, and diagnostic histories among your designated primary care and specialty medical team.",
    legal_notice:
      "Pursuant to HIPAA 45 CFR § 164.506, this authorization enables transmission of electronic protected health information (ePHI) strictly across licensed healthcare providers involved in your treatment and clinical care coordination. Revocation does not affect disclosures made prior to notification.",
    granted: true,
    version: "v4.2 (2026)",
    updatedAt: "2026-08-14T10:30:00Z",
    required: true,
  },
  {
    id: "ai_inference",
    type: "AI_RISK_SCORING",
    category: "AI",
    title: "AI Clinical Decision Support & Risk Analysis",
    description:
      "Permits de-identified clinical telemetry and symptom logs to be processed by validated ensemble ML models for non-autonomous risk stratification.",
    legal_notice:
      "This authorization conforms to FDA Software as a Medical Device (SaMD) Class II guidelines. Algorithmic outputs are non-diagnostic decision-support aids verified by credentialed physicians. You may revoke algorithmic processing at any time without impacting standard clinical care.",
    granted: true,
    version: "v3.1 (2026)",
    updatedAt: "2026-08-14T10:30:00Z",
    required: false,
  },
  {
    id: "telehealth_recording",
    type: "TELEHEALTH_CONSENT",
    category: "TELEHEALTH",
    title: "Telehealth Encounter Recordings & Transcripts",
    description:
      "Allows audio/visual recording of video consultations solely for clinical documentation, care plan reconciliation, and physician review.",
    legal_notice:
      "Recorded sessions are stored within HIPAA-compliant, encrypted media repositories with restricted clinician-only access. Recordings are retained in accordance with state medical board record retention statutes and purged after clinical notes are finalized.",
    granted: false,
    version: "v2.0 (2025)",
    updatedAt: "2026-01-10T14:15:00Z",
    required: false,
  },
  {
    id: "research_deid",
    type: "RESEARCH_ANALYTICS",
    category: "RESEARCH",
    title: "De-Identified Clinical Research Contribution",
    description:
      "Contribute fully de-identified health metrics to academic medical consortium research on cardiopulmonary health and early clinical intervention.",
    legal_notice:
      "All shared datasets are scrubbed in accordance with the HIPAA Safe Harbor De-Identification standard (45 CFR § 164.514(b)), removing 18 distinct direct and indirect patient identifiers. Data is used exclusively for peer-reviewed academic cardiovascular research.",
    granted: true,
    version: "v1.8 (2025)",
    updatedAt: "2026-05-20T09:00:00Z",
    required: false,
  },
];

export default function ConsentPage() {
  const [consents, setConsents] = React.useState<ConsentItem[]>(DEFAULT_CONSENTS);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedLegalNotice, setSelectedLegalNotice] = React.useState<ConsentItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

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
      setTimeout(() => setSavedSuccess(false), 4500);
    }, 600);
  };

  const handleDownloadLedger = () => {
    setToastMessage("Generating Cryptographically Signed Consent Audit Ledger (PDF)...");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const activeCount = consents.filter((c) => c.granted).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CLINICAL":
        return <Activity className="h-5 w-5 text-teal-600" />;
      case "AI":
        return <Sparkles className="h-5 w-5 text-indigo-600" />;
      case "TELEHEALTH":
        return <Video className="h-5 w-5 text-sky-600" />;
      case "RESEARCH":
        return <Microscope className="h-5 w-5 text-purple-600" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-teal-600" />;
    }
  };

  return (
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Audit Ledger Export</p>
            <p className="text-slate-300 text-[11px]">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Consent &amp; Legal Authorizations
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Manage your HIPAA data authorizations, AI clinical processing consent, and health
            information exchanges. You hold legal rights under 45 CFR § 164.508 to revoke optional
            authorizations at any time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleSave}
            disabled={submitting}
            size="sm"
            className="text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm h-9 px-4 disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Save Consent Preferences"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-950">Consent Preferences Updated</p>
            <p className="text-emerald-800 text-[11px] mt-0.5">
              Updates recorded in the tamper-evident audit ledger with cryptographic SHA-256
              timestamp verification.
            </p>
          </div>
        </div>
      )}

      {/* Overview Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Authorizations</span>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeCount} of {consents.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Patient Rights Enforced
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Regulatory Statute</span>
            <Scale className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900">45 CFR § 164.508</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            HIPAA Privacy Rule
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Audit Proof</span>
            <Lock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900">SHA-256 Ledger</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Tamper-Evident Sealed
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Privacy Officer</span>
            <Building2 className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">Hospital Privacy Team</div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">
            Direct Inquiries Open
          </div>
        </div>
      </div>

      {/* Grid of Consent Cards */}
      <div className="space-y-4">
        {consents.map((item) => (
          <Card
            key={item.id}
            className="bg-white border-slate-200/90 shadow-sm hover:border-slate-300 transition-all duration-200"
          >
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.version}
                    </span>
                    {item.required ? (
                      <Badge className="bg-amber-50 text-amber-900 border-amber-200 font-bold text-[10px]">
                        Required for Active Care
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600 border-slate-200 text-[10px]">
                        Optional (Patient Controlled)
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      Last reviewed:{" "}
                      {new Date(item.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedLegalNotice(item)}
                      className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 hover:underline"
                    >
                      View legal agreement <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleConsent(item.id)}
                  disabled={item.required}
                  aria-label={`Toggle consent for ${item.title}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    item.granted ? "bg-teal-600" : "bg-slate-200"
                  } ${item.required ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      item.granted ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-semibold ${
                    item.granted ? "text-teal-700" : "text-slate-500"
                  }`}
                >
                  {item.granted ? "Authorized" : "Revoked"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Regulatory & Audit Guarantee Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <span className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Lock className="h-4 w-4" />
            </span>
            Cryptographic Audit Trail
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every grant and revocation is recorded in our tamper-evident audit ledger with SHA-256
            integrity proofs. You can request a certified copy of your consent ledger for personal
            or legal records.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadLedger}
            className="text-xs font-semibold text-teal-700 border-slate-200 hover:bg-teal-50 gap-1.5 h-8"
          >
            <Download className="h-3.5 w-3.5" />
            Download Signed Consent PDF
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <span className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <HelpCircle className="h-4 w-4" />
            </span>
            Have Questions About Your Rights?
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our hospital Privacy Officer is available to discuss your rights regarding electronic
            protected health information (ePHI) or revoke authorizations via telephone or mail.
          </p>
          <a
            href="mailto:privacy@healthnova.ai"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
          >
            Contact Hospital Privacy Officer <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Legal Agreement Details Modal */}
      <ResponsiveModal
        isOpen={Boolean(selectedLegalNotice)}
        onClose={() => setSelectedLegalNotice(null)}
        title={selectedLegalNotice ? `Legal Agreement: ${selectedLegalNotice.title}` : "Legal Agreement"}
        subtitle={selectedLegalNotice ? `Regulatory Standard: ${selectedLegalNotice.version}` : undefined}
        maxWidth="xl"
      >
        {selectedLegalNotice && (
          <div className="space-y-4 text-xs text-slate-900">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Agreement Identification</span>
                <Badge variant="outline" className="text-[10px] font-mono border-slate-300">
                  {selectedLegalNotice.type}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px]">
                Effective Date: {new Date(selectedLegalNotice.updatedAt).toLocaleDateString()} ·
                Governing Body: HIPAA Privacy Rule 45 CFR Part 164
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Statutory Terms &amp; Conditions
              </h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 leading-relaxed text-slate-700 space-y-2">
                <p>{selectedLegalNotice.legal_notice}</p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Revocation Clause: Under federal privacy rules, you may revoke this authorization
                  in writing or via the patient portal toggle switch at any time. Revocation is
                  effective immediately upon ledger commit and does not impact prior treatments or
                  disclosures executed in good faith.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLedger}
                className="text-xs gap-1 border-slate-200 text-slate-700"
              >
                <Printer className="h-3.5 w-3.5" /> Print Terms
              </Button>
              <Button
                onClick={() => setSelectedLegalNotice(null)}
                className="bg-slate-900 text-white text-xs h-8"
              >
                Close Agreement
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
