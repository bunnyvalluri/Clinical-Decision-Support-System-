"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewVitalPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [saved, setSaved] = React.useState(false);
  const [form, setForm] = React.useState({
    systolic: "", diastolic: "", hr: "", temp: "", spo2: "", rr: "", notes: "",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    // In production: POST to /api/clinical/patients/{id}/vitals/
    setTimeout(() => router.push(`/nurse/patients/${patientId}/vitals`), 1500);
  };

  const field = (name: keyof typeof form, label: string, unit: string, placeholder: string) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2 items-center">
        <Input
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className="bg-white"
        />
        <span className="text-xs text-slate-400 whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );

  if (saved) return (
    <div className="p-6 text-center space-y-4">
      <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
      <p className="font-semibold text-slate-800">Vitals Recorded</p>
      <p className="text-sm text-slate-500">Saved to database and broadcast via WebSocket…</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/nurse/patients/${patientId}/vitals`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Back
        </Button>
        <h1 className="text-xl font-bold text-slate-900">Record Vitals</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-600">Vital Signs Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field("systolic", "Systolic BP", "mmHg", "e.g. 120")}
              {field("diastolic", "Diastolic BP", "mmHg", "e.g. 80")}
              {field("hr", "Heart Rate", "bpm", "e.g. 72")}
              {field("temp", "Temperature", "°C", "e.g. 37.0")}
              {field("spo2", "SpO₂", "%", "e.g. 98")}
              {field("rr", "Resp. Rate", "/min", "e.g. 16")}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Clinical Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any relevant observations…"
                rows={3}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white gap-2">
              <Save className="h-4 w-4" />Save Vitals
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
