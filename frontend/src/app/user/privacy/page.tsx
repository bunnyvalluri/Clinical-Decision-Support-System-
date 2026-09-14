"use client";

import * as React from "react";
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
  UserCheck,
  Scale,
  FileText,
  X,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsivePageContainer } from "@/components/responsive";

export default function PrivacyPage() {
  const [downloadRequested, setDownloadRequested] = React.useState(false);
  const [requestProgress, setRequestProgress] = React.useState(0);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const exportTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (exportTimerRef.current) clearInterval(exportTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleExportData = () => {
    if (downloadRequested) return;
    setDownloadRequested(true);
    setRequestProgress(15);
    if (exportTimerRef.current) clearInterval(exportTimerRef.current);
    let progress = 15;
    exportTimerRef.current = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        if (exportTimerRef.current) {
          clearInterval(exportTimerRef.current);
          exportTimerRef.current = null;
        }
        setRequestProgress(100);
        setToastMessage("EHI Patient Health Dossier generated successfully (3.4 MB)");
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
      } else {
        setRequestProgress(progress);
      }
    }, 400);
  };

  return (
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Export Complete</p>
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
              <Shield className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Privacy &amp; Data Governance
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Under HIPAA 45 CFR § 164.524, you maintain complete rights of access to your medical
            records, telemetry logs, and machine learning inferences. Review our strict zero-commercial
            sharing policies below.
          </p>
        </div>

        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-3 py-1 font-semibold self-start md:self-auto">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
          HIPAA Audit Verified
        </Badge>
      </div>

      {/* HIPAA Right of Access & Data Export Card */}
      <Card className="bg-white border-slate-200/90 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-teal-600" />
                HIPAA Electronic Health Information (EHI) Export
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Download your complete clinical dossier, including HL7 FHIR R4 resources, vital
                telemetry logs, and ML risk evaluations in standard JSON and encrypted PDF format.
              </p>
            </div>

            <Button
              onClick={handleExportData}
              disabled={downloadRequested && requestProgress < 100}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-sm disabled:opacity-60 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              {downloadRequested && requestProgress < 100
                ? `Packaging (${requestProgress}%)`
                : "Export Health Dossier"}
            </Button>
          </div>

          {downloadRequested && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Status: {requestProgress === 100 ? "Ready for download" : "Compressing EHI archive..."}
                </span>
                <span className="font-mono">{requestProgress}%</span>
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    EHI Archive (3.4 MB) generated with SHA-256 verification hash.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold text-teal-700 border-slate-200 hover:bg-teal-50 h-8"
                  >
                    Download .ZIP File
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Privacy Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200/90 shadow-sm">
          <CardContent className="p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-2">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Zero Commercial Sharing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your clinical data, notes, and AI risk profiles are never sold, licensed, or shared
              with commercial advertisers or life insurance underwriters.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-sm">
          <CardContent className="p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-2">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">AES-256 &amp; TLS 1.3</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All stored electronic protected health information (ePHI) is encrypted at rest using
              AES-256 and in transit via authenticated TLS 1.3 tunnels.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-sm">
          <CardContent className="p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-2">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Strict Role Access Control</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Only credentialed attending physicians, triage nurses, and hospital staff assigned
              directly to your active care team can access your chart.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retention and Right to Deletion */}
      <Card className="bg-white border-slate-200/90 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-rose-500" />
            Data Retention &amp; Account Archival
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Federal and state medical record retention statutes require clinical documentation to be
            preserved for a minimum of 7 to 10 years following active clinical discharge. However,
            you may request permanent de-identification of telemetry snapshots and non-clinical portal
            accounts.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Important Clinical Notice:</span> Revoking portal access
              will not expunge clinical chart history stored within the primary hospital electronic
              health record (EHR) necessary for ongoing continuity of care and regulatory compliance.
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Request Account Archival Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </ResponsivePageContainer>
  );
}
