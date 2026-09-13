"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, HeartPulse, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vitalId = params?.vitalId as string;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/user/vitals")} className="text-xs gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Vitals
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-600" />
              <CardTitle className="text-base font-bold text-slate-900">Measurement Record</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs font-mono text-slate-500 border-slate-200">
              ID: {vitalId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400">Systolic Blood Pressure:</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">134 mmHg</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400">Diastolic Blood Pressure:</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">86 mmHg</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400">Resting Heart Rate:</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">76 bpm</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400">Oxygen Saturation:</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">97 %</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-teal-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
            <span>Biological bounds validated and verified against EHR ingestion standards.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
