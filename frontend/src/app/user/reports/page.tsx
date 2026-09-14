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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOCK_REPORTS = [
  {
    id: "rep-01",
    title: "Comprehensive Cardiovascular Risk Assessment Report",
    type: "AI_DECISION_SUPPORT",
    generated_at: "2026-09-13 14:50",
    clinician: "Doctor",
    pages: 4,
    status: "READY",
  },
  {
    id: "rep-02",
    title: "Cardiology Discharge Summary & Care Plan",
    type: "DISCHARGE_SUMMARY",
    generated_at: "2026-07-24 11:30",
    clinician: "Doctor",
    pages: 6,
    status: "READY",
  },
  {
    id: "rep-03",
    title: "48-Hour Continuous Ambulatory Holter ECG Analysis",
    type: "DIAGNOSTIC_STUDY",
    generated_at: "2026-06-20 16:15",
    clinician: "Doctor",
    pages: 8,
    status: "READY",
  },
];

export default function PatientReportsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = MOCK_REPORTS.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" />
            Clinical Reports &amp; Diagnostic Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative clinical summaries, diagnostic reports, and AI risk analysis documents.
          </p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search report titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} documents
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((rep) => (
          <Card key={rep.id} className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                    {rep.type.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    {rep.pages} Pages · PDF
                  </span>
                  <span className="text-xs text-slate-400">· {rep.generated_at}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{rep.title}</h3>
                <p className="text-xs text-slate-500">
                  Signed &amp; Verified by: <strong className="text-slate-700">{rep.clinician}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/user/reports/${rep.id}`}>
                  <Button variant="outline" size="sm" className="text-xs border-slate-200">
                    Preview
                  </Button>
                </Link>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
