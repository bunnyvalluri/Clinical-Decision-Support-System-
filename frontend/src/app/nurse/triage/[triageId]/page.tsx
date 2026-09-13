"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertTriangle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEMO_TRIAGE: Record<string, { patient: string; age: number; chief: string; status: string; priority: string; arrived: string; bp: string; hr: string; spo2: string }> = {
  "t-001": { patient: "Robert Chen", age: 67, chief: "Chest pain, shortness of breath", status: "WAITING", priority: "HIGH", arrived: "08:32", bp: "158/95", hr: "102", spo2: "94%" },
  "t-002": { patient: "Maria Santos", age: 45, chief: "Dizziness, irregular heartbeat", status: "TRIAGE_IN_PROGRESS", priority: "MEDIUM", arrived: "08:41", bp: "130/82", hr: "88", spo2: "97%" },
  "t-003": { patient: "James Wilson", age: 78, chief: "Syncope episode", status: "WAITING", priority: "HIGH", arrived: "09:05", bp: "100/60", hr: "58", spo2: "96%" },
};

export default function TriageDetailPage() {
  const { triageId } = useParams<{ triageId: string }>();
  const router = useRouter();
  const t = DEMO_TRIAGE[triageId];

  if (!t) return (
    <div className="p-6 text-center">
      <p className="text-slate-500">Triage record not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push("/nurse/triage")}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Triage
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push("/nurse/triage")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Triage Queue
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                <User className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{t.patient}</h1>
                <p className="text-sm text-slate-500">Age {t.age} · Arrived {t.arrived}</p>
              </div>
            </div>
            <Badge className={`border ${t.priority === "HIGH" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {t.priority} Priority
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Chief Complaint</p>
            <p className="text-sm font-medium text-slate-800 bg-slate-50 rounded-lg p-3 border border-slate-100">{t.chief}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Blood Pressure", value: t.bp },
              { label: "Heart Rate", value: `${t.hr} bpm` },
              { label: "SpO₂", value: t.spo2 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 bg-sky-600 hover:bg-sky-700 text-white">Begin Triage</Button>
            <Button variant="outline" className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50">
              <AlertTriangle className="h-4 w-4 mr-2" />Escalate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
