"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HeartPulse, ArrowLeft, Plus, Thermometer, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DEMO_VITALS = [
  { id: "v1", time: "09:15", bp: "138/88", hr: "84", temp: "37.1°C", spo2: "97%", rr: "18" },
  { id: "v2", time: "06:00", bp: "145/92", hr: "90", temp: "37.4°C", spo2: "96%", rr: "20" },
  { id: "v3", time: "00:00", bp: "152/98", hr: "96", temp: "37.8°C", spo2: "95%", rr: "22" },
];

export default function PatientVitalsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/nurse/patients/${patientId}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />Patient
          </Button>
          <h1 className="text-xl font-bold text-slate-900">Vitals History</h1>
        </div>
        <Link href={`/nurse/patients/${patientId}/vitals/new`}>
          <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
            <Plus className="h-4 w-4" />New Entry
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {DEMO_VITALS.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HeartPulse className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-semibold text-slate-700">Recorded at {v.time}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "BP", value: v.bp },
                  { label: "HR", value: `${v.hr} bpm` },
                  { label: "Temp", value: v.temp },
                  { label: "SpO₂", value: v.spo2 },
                  { label: "RR", value: `${v.rr} /min` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
