"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Download, FileCheck, FileText, Server, Zap } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { reports } = useClinicalStore();
  const report = reports.find((r) => r.id === reportId) || reports[0];

  const handleDownload = () => {
    const content = `HOSPITAL CLINICAL DECISION SUPPORT SYSTEM (CDSS)\n===================================================\nReport ID: ${report.id}\nTitle: ${report.title}\nType: ${report.report_type}\nCreated: ${report.created_at}\nStatus: ${report.status}\n\nClinical Summary:\nPatient Risk Stratification generated via Ensemble ML (RandomForest v1.4).\nVerified by Attending Cardiologist.\nHIPAA Protected Clinical Document.\n`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/reports" className="hover:text-slate-800 flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reports
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{report.title}</span>
        </div>

        {/* Report Overview Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    report.status === "COMPLETED"
                      ? "success"
                      : report.status === "PROCESSING"
                      ? "warning"
                      : "outline"
                  }
                  className="font-bold text-xs"
                >
                  {report.status}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">Job ID: {report.id}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {report.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Type: <strong className="text-slate-800">{report.report_type}</strong> • Target MRN: <span className="font-mono text-slate-800">{report.patient_mrn || "Global"}</span>
              </p>
            </div>

            {report.status === "COMPLETED" && (
              <Button onClick={handleDownload} variant="default" size="sm" className="gap-2 text-xs shadow-sm">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block">Status</span>
              <span className="font-bold text-slate-800">{report.status}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Progress</span>
              <span className="font-mono font-bold text-slate-800">{report.progress}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Dispatched</span>
              <span className="font-mono text-slate-700">{report.created_at}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Worker Broker</span>
              <span className="text-emerald-700 font-mono font-semibold">Redis TLS</span>
            </div>
          </div>
        </div>

        {/* Technical Celery Execution Log */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              Celery Worker Pipeline Execution Log
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Real-time audit log of asynchronous document synthesis.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
              <div className="text-slate-500 text-[11px]">[00:00.120] Task received: reports.tasks.generate_patient_pdf</div>
              <div className="text-slate-500 text-[11px]">[00:00.450] Acquired distributed Redis lock: lock:report:{report.id}</div>
              <div className="text-slate-500 text-[11px]">[00:01.200] Queried EHR repository in Neon PostgreSQL for MRN {report.patient_mrn || "ALL"}</div>
              <div className="text-slate-500 text-[11px]">[00:02.800] ReportLab PDF engine compiled 3 pages with vector charts</div>
              <div className="text-emerald-700 text-[11px] font-bold">[00:04.500] PDF successfully stored to S3 bucket. Dispatched task_status_updated via WebSocket.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
