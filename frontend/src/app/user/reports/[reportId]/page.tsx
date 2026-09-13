"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Download, ShieldCheck, CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.reportId as string;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/user/reports")} className="text-xs gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Clinical Report
              </Badge>
              <span className="text-xs font-mono text-slate-400">ID: {reportId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Cardiovascular Risk &amp; Inpatient Summary
            </h1>
          </div>

          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm self-start sm:self-auto">
            <Download className="h-3.5 w-3.5" /> Download Official PDF
          </Button>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400">Compiled Date:</span>
            <p className="font-bold text-slate-800 mt-0.5">2026-09-13 14:50</p>
          </div>
          <div>
            <span className="text-slate-400">Supervising MD:</span>
            <p className="font-bold text-slate-800 mt-0.5">Dr. Elena Vance, MD</p>
          </div>
          <div>
            <span className="text-slate-400">Classification:</span>
            <p className="font-bold text-slate-800 mt-0.5">Confidential Medical Record</p>
          </div>
          <div>
            <span className="text-slate-400">Digital Signature:</span>
            <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Cryptographically Verified
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-700">
          <h3 className="font-bold text-slate-900 text-sm">Executive Clinical Summary</h3>
          <p>
            Patient Eleanor Ward (MRN-90241) underwent cardiovascular evaluation following episodic exertional tightness. Resting hemodynamics demonstrate systolic blood pressure in the mild prehypertensive range (134 mmHg mean) with regular sinus rhythm.
          </p>
          <p>
            Ensemble random forest prediction algorithm calculated a 42.0% probability tier. In accordance with clinical guidelines, secondary pharmacological adjustment was not indicated at this juncture; continued ambulatory lifestyle intervention, sodium reduction, and routine 3-month clinic follow-up are prescribed.
          </p>
        </div>
      </div>
    </div>
  );
}
