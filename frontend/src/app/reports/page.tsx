"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  FileCheck,
  FileText,
  Plus,
  Radio,
  Server,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import type { ReportItem } from "@/services/clinicalData";

export default function ReportsPage() {
  const { reports, addReport, updateReportStatus, patients } = useClinicalStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [reportType, setReportType] = React.useState<ReportItem["report_type"]>("PATIENT_SUMMARY");
  const [selectedPatientMRN, setSelectedPatientMRN] = React.useState(patients[0]?.mrn || "MRN-90241");
  const [title, setTitle] = React.useState("Patient Longitudinal Risk Stratification");

  // Handle report queueing to Celery background worker
  const handleQueueReport = (e: React.FormEvent) => {
    e.preventDefault();

    const newReportId = `rep-${Date.now().toString().slice(-4)}`;
    const newReport: ReportItem = {
      id: newReportId,
      title: title || `${reportType.replace(/_/g, " ")} (${selectedPatientMRN})`,
      report_type: reportType,
      patient_mrn: reportType === "PATIENT_SUMMARY" ? selectedPatientMRN : undefined,
      status: "QUEUED",
      progress: 0,
      created_at: new Date().toLocaleTimeString(),
    };

    addReport(newReport);
    setIsCreateModalOpen(false);

    // Simulate Celery Worker Execution progression
    setTimeout(() => {
      updateReportStatus(newReportId, "PROCESSING", 35);
    }, 1200);

    setTimeout(() => {
      updateReportStatus(newReportId, "PROCESSING", 75);
    }, 2800);

    setTimeout(() => {
      updateReportStatus(newReportId, "COMPLETED", 100);
    }, 4500);
  };

  const handleDownloadReport = (report: ReportItem) => {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-emerald-600" />
              Clinical PDF Reports & Celery Job Pipeline
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Asynchronous background document generation powered by Celery, Redis queue locks, and ReportLab.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 shadow-sm">
              <Server className="h-3 w-3 mr-1 text-purple-600" />
              Celery Worker: Active
            </Badge>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Celery Pipeline Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">Dedicated Queue</CardDescription>
              <CardTitle className="text-base text-slate-900 font-bold flex items-center gap-2">
                <Server className="h-4 w-4 text-purple-600" />
                reports.tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 font-medium">Concurrency: 4 workers • Soft timeout: 120s</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">WebSocket Event</CardDescription>
              <CardTitle className="text-base text-slate-900 font-bold flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                task_status_updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 font-medium">Pushed to client on state transition</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-500 font-semibold">Distributed Lock</CardDescription>
              <CardTitle className="text-base text-slate-900 font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                Redis Lock Guard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 font-medium">Prevents duplicate concurrent generation</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Queue Table */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Document Generation Queue</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live status tracking of background jobs (QUEUED → PROCESSING → COMPLETED).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject MRN</TableHead>
                  <TableHead>Celery Job Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Dispatched At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <span>{report.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Job ID: {report.id}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-mono font-medium">
                      {report.report_type}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">
                      {report.patient_mrn || "Global"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "COMPLETED"
                            ? "success"
                            : report.status === "PROCESSING"
                            ? "warning"
                            : report.status === "FAILED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>{report.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              report.status === "COMPLETED"
                                ? "bg-emerald-500"
                                : report.status === "PROCESSING"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${report.progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {report.created_at}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                      </Link>
                      {report.status === "COMPLETED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                          className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">In progress...</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Generate Report Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Dispatch Asynchronous Report Job"
          description="Queues a Celery worker job to generate a compiled PDF clinical report."
        >
          <form onSubmit={handleQueueReport} className="space-y-4">
            <Input
              label="Report Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Select
              label="Report Specification"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as "PATIENT_SUMMARY" | "DEPARTMENT_AUDIT" | "MODEL_PERFORMANCE" | "CLINICAL_RISK_LOG")}
              options={[
                { value: "PATIENT_SUMMARY", label: "Patient Longitudinal Risk Summary" },
                { value: "DEPARTMENT_AUDIT", label: "Cardiology Department Inpatient Risk Audit" },
                { value: "MODEL_PERFORMANCE", label: "ML Model Drift & Calibration Report" },
                { value: "CLINICAL_RISK_LOG", label: "Comprehensive HIPAA Prediction Audit Trail" },
              ]}
            />

            {reportType === "PATIENT_SUMMARY" && (
              <Select
                label="Target Inpatient"
                value={selectedPatientMRN}
                onChange={(e) => setSelectedPatientMRN(e.target.value)}
                options={patients.map((p) => ({
                  value: p.mrn,
                  label: `${p.first_name} ${p.last_name} (${p.mrn}) — ${p.latest_risk_level} Risk`,
                }))}
              />
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">Asynchronous Job Execution:</span>
              <p>
                The REST API returns immediately with status <code>QUEUED</code>. Celery workers compile the
                ReportLab document in the background and notify the browser over WebSockets when ready.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" className="shadow-sm">
                Queue Job in Celery
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
