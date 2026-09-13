"use client";

import React, { useState } from "react";
import { 
  Shield, 
  FileCheck, 
  Download, 
  Trash2, 
  EyeOff, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  UserCheck
} from "lucide-react";

export default function PrivacyPage() {
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [requestProgress, setRequestProgress] = useState(0);

  const handleExportData = () => {
    setDownloadRequested(true);
    setRequestProgress(15);
    const interval = setInterval(() => {
      setRequestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privacy & Data Governance</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Under HIPAA 45 CFR § 164.524, you maintain complete rights of access to your medical records, telemetry logs, and machine learning inferences. Review our strict zero-third-party disclosure policies below.
            </p>
          </div>
        </div>
      </div>

      {/* HIPAA Right of Access & Data Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-600" />
              HIPAA Electronic Health Data Export (EHI)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Download your complete clinical dossier, including FHIR R4 clinical resources, vital telemetry, and ML risk evaluations in standard JSON and encrypted PDF format.
            </p>
          </div>

          <button
            onClick={handleExportData}
            disabled={downloadRequested && requestProgress < 100}
            className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60 shrink-0"
          >
            {downloadRequested && requestProgress < 100 ? `Packaging (${requestProgress}%)` : "Export Health Dossier"}
          </button>
        </div>

        {downloadRequested && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Export status: {requestProgress === 100 ? "Ready for download" : "Compressing EHI archive..."}</span>
              <span>{requestProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${requestProgress}%` }}
              />
            </div>
            {requestProgress === 100 && (
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  EHI Archive (3.4 MB) generated with SHA-256 verification hash.
                </span>
                <a
                  href="#download-archive"
                  className="font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
                >
                  Download .ZIP file
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Core Privacy Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Zero Commercial Sharing</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your clinical data, notes, and AI risk profiles are never sold, licensed, or shared with commercial advertisers or life insurance underwriters.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-2">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">AES-256 & TLS 1.3</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            All stored electronic protected health information (ePHI) is encrypted at rest using AES-256 and in transit via authenticated TLS 1.3 tunnels.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-2">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Strict Role Access Control</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Only credentialed attending physicians, triage nurses, and hospital staff assigned directly to your active care team can review your chart.
          </p>
        </div>
      </div>

      {/* Retention and Right to Deletion */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Data Retention & Account Archival
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Federal and state medical record retention statutes require clinical documentation to be preserved for a minimum of 7 to 10 years following active clinical discharge. However, you may request permanent de-identification of telemetry snapshots and non-clinical portal accounts.
        </p>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Important Clinical Notice:</span> Revoking portal access will not expunge clinical chart history stored within the primary hospital electronic health record (EHR) necessary for ongoing continuity of care and regulatory compliance.
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm rounded-lg transition-colors">
            Request Account Archival Review
          </button>
        </div>
      </div>
    </div>
  );
}
