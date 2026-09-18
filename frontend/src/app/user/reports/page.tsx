"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Search,
  FileCheck,
  Eye,
  Printer,
  X,
  AlertCircle,
  Building2,
  Activity,
  HeartPulse,
  Sparkles,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

interface ClinicalReportItem {
  id: string;
  title: string;
  type: "AI_DECISION_SUPPORT" | "DISCHARGE_SUMMARY" | "DIAGNOSTIC_STUDY" | string;
  generated_at: string;
  clinician: string;
  clinician_role: string;
  department: string;
  facility: string;
  pages: number;
  status: "READY" | "FINALIZED" | string;
  summary: string;
  findings: string[];
  signature_hash: string;
}

const MOCK_REPORTS: ClinicalReportItem[] = [
  {
    id: "rep-01",
    title: "Comprehensive Cardiovascular Risk Assessment Report",
    type: "AI_DECISION_SUPPORT",
    generated_at: "2026-09-13 14:50",
    clinician: "Dr. Vadla Abhinay, MD",
    clinician_role: "Cardiology Specialist",
    department: "Cardiology Outpatient Clinic",
    facility: "Heart & Vascular Pavilion, Suite 402",
    pages: 4,
    status: "READY",
    summary:
      "Automated 10-year risk stratification based on 30-day ambulatory blood pressure telemetry and fasting lipid profile. Stratified into Moderate Risk Tier (42.0%).",
    findings: [
      "Resting systolic blood pressure mean: 134 mmHg (elevated baseline)",
      "Resting pulse: 74 bpm (normal regular sinus)",
      "Serum LDL: 142 mg/dL with HDL 48 mg/dL",
      "Calculated Mean Arterial Pressure (MAP): 100 mmHg",
    ],
    signature_hash: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  },
  {
    id: "rep-02",
    title: "Cardiology Discharge Summary & Care Plan",
    type: "DISCHARGE_SUMMARY",
    generated_at: "2026-07-24 11:30",
    clinician: "Dr. Elena Rostova, MD",
    clinician_role: "Attending Cardiologist",
    department: "Telemetry Stepdown Ward",
    facility: "Main University Hospital, Floor 4",
    pages: 6,
    status: "READY",
    summary:
      "Inpatient admission summary following evaluation of exertional chest tightness. High-sensitivity troponin assays negative x3. Discharged in stable condition.",
    findings: [
      "Continuous cardiac telemetry: sinus rhythm with rare isolated PVCs",
      "Echocardiogram: LVEF 60%, normal wall motion, no valvular stenosis",
      "Serial troponins non-reactive (<0.01 ng/mL)",
      "Patient discharged on daily Aspirin 81mg and Lisinopril 10mg",
    ],
    signature_hash: "SHA256:3a1b2c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0",
  },
  {
    id: "rep-03",
    title: "48-Hour Continuous Ambulatory Holter ECG Analysis",
    type: "DIAGNOSTIC_STUDY",
    generated_at: "2026-06-20 16:15",
    clinician: "Dr. Vadla Abhinay, MD",
    clinician_role: "Attending Cardiologist",
    department: "Non-Invasive Diagnostic Lab",
    facility: "Heart & Vascular Pavilion",
    pages: 8,
    status: "READY",
    summary:
      "Complete 48-hour ambulatory Holter monitor recording analysis. Evaluated for paroxysmal dysrhythmias and exertional chronotropic response.",
    findings: [
      "Total recorded beats: 204,180 (average heart rate 71 bpm)",
      "Minimum HR: 54 bpm (nocturnal), Maximum HR: 118 bpm (brisk walk)",
      "No sustained supraventricular tachycardia (SVT) or ventricular tachycardias",
      "Patient symptoms logged at 14:15 corresponded to normal sinus tachycardia (92 bpm)",
    ],
    signature_hash: "SHA256:9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
  },
];

export default function PatientReportsPage() {
  const [reports, setReports] = React.useState<ClinicalReportItem[]>(MOCK_REPORTS);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [previewReport, setPreviewReport] = React.useState<ClinicalReportItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const handleDownload = (rep: ClinicalReportItem) => {
    setToastMessage(`Downloading official signed document: ${rep.title}.pdf`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filtered = reports.filter((r) => {
    const matchesCat =
      selectedCategory === "ALL" ||
      r.type.toUpperCase() === selectedCategory.toUpperCase();

    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clinician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const getReportTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "AI_DECISION_SUPPORT":
        return (
          <Badge className="bg-teal-50 text-teal-800 border-teal-200 font-semibold text-[11px] px-2.5 py-0.5">
            AI Decision Support
          </Badge>
        );
      case "DISCHARGE_SUMMARY":
        return (
          <Badge className="bg-sky-50 text-sky-800 border-sky-200 font-semibold text-[11px] px-2.5 py-0.5">
            Discharge Summary
          </Badge>
        );
      case "DIAGNOSTIC_STUDY":
        return (
          <Badge className="bg-purple-50 text-purple-800 border-purple-200 font-semibold text-[11px] px-2.5 py-0.5">
            Diagnostic Study
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-700 border-slate-300 text-[11px]">
            {type}
          </Badge>
        );
    }
  };

  return (
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Document Export</p>
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Clinical Reports &amp; Diagnostic Documents
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Authoritative clinical summaries, inpatient discharge records, AI decision support
            analyses, and certified diagnostic telemetry reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() =>
              handleDownload({
                id: "all-rep",
                title: "Complete_Patient_Record_Dossier",
                type: "DOSSIER",
                generated_at: "2026-09-14",
                clinician: "Clinical Staff",
                clinician_role: "Medical Records",
                department: "EHR Administration",
                facility: "Health Pavilion",
                pages: 18,
                status: "READY",
                summary: "All clinical documents",
                findings: [],
                signature_hash: "",
              })
            }
            size="sm"
            className="text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm h-9 px-4"
          >
            <Download className="h-3.5 w-3.5" />
            Download Complete Dossier
          </Button>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Verified Documents</span>
            <FileCheck className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{reports.length}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> 100% Signed &amp; Audited
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Latest Report Generated</span>
            <Calendar className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">Sep 13, 2026</div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            Cardiovascular Risk Assessment
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Document Pages</span>
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {reports.reduce((acc, r) => acc + r.pages, 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Encrypted PDF &amp; CDA
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Audit Standard</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">HL7 CDA / FHIR</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Cryptographically Sealed
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Reports" },
            { id: "AI_DECISION_SUPPORT", label: "AI Decision Support" },
            { id: "DISCHARGE_SUMMARY", label: "Discharge Summaries" },
            { id: "DIAGNOSTIC_STUDY", label: "Diagnostic Studies" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search report titles, physicians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8.5 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Report Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No clinical reports found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No documents matched &quot;{searchTerm}&quot; in the selected category.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("ALL");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filtered.map((rep) => (
            <Card
              key={rep.id}
              className="bg-white border-slate-200/90 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getReportTypeBadge(rep.type)}
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {rep.pages} Pages · PDF
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {rep.generated_at}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Signed: {rep.clinician}
                    </span>
                  </div>
                </div>

                {/* Report Content */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rep.summary}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{rep.department} · {rep.facility}</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {rep.id} · Audit Validated
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewReport(rep)}
                      className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-8 gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-teal-600" />
                      Preview Document
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(rep)}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold h-8 gap-1 px-3.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Document Interactive Preview Modal */}
      <ResponsiveModal
        isOpen={Boolean(previewReport)}
        onClose={() => setPreviewReport(null)}
        title={previewReport ? previewReport.title : "Document Preview"}
        subtitle={previewReport?.facility || "Clinical Document Dossier"}
        maxWidth="2xl"
      >
        {previewReport && (
          <div className="space-y-5 text-slate-900 text-xs">
            {/* Header info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-400">DOCUMENT ID: {previewReport.id}</span>
                <p className="text-xs font-bold text-slate-900">{previewReport.department}</p>
                <p className="text-[11px] text-slate-500">{previewReport.facility}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-emerald-600 text-white font-semibold text-[10px]">
                  Finalized &amp; Certified
                </Badge>
                <p className="text-[11px] text-slate-400 mt-1">Generated: {previewReport.generated_at}</p>
              </div>
            </div>

            {/* Document Summary */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-teal-600" />
                Clinical Document Abstract
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                {previewReport.summary}
              </p>
            </div>

            {/* Document Findings */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-rose-600" />
                Certified Findings &amp; Clinical Observations
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {previewReport.findings.map((finding, idx) => (
                  <div key={idx} className="p-3 flex items-start gap-2 text-xs text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Signature Box */}
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Electronically Signed by {previewReport.clinician}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">{previewReport.clinician_role}</span>
              </div>
              <p className="text-[10px] text-emerald-800 font-mono break-all pt-1">
                Checksum: {previewReport.signature_hash}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(previewReport)}
                className="text-xs gap-1.5 border-slate-200 text-slate-700"
              >
                <Printer className="h-3.5 w-3.5" /> Print / Save
              </Button>
              <Button
                onClick={() => setPreviewReport(null)}
                className="bg-slate-900 text-white text-xs h-8"
              >
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
