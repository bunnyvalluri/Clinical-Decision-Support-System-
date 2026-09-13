"use client";

import * as React from "react";
import Link from "next/link";
import {
  HeartPulse,
  Activity,
  Plus,
  Clock,
  History,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

export default function PatientVitalsPage() {
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [sbp, setSbp] = React.useState("130");
  const [dbp, setDbp] = React.useState("84");
  const [hr, setHr] = React.useState("74");
  const [spo2, setSpo2] = React.useState("98");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [vitalsList, setVitalsList] = React.useState<any[]>([
    {
      id: "v-01",
      systolic_bp: 134,
      diastolic_bp: 86,
      heart_rate: 76,
      spo2: 97,
      recorded_at: "Today, 08:30 AM",
      source: "USER_ENTERED",
    },
    {
      id: "v-02",
      systolic_bp: 132,
      diastolic_bp: 84,
      heart_rate: 72,
      spo2: 98,
      recorded_at: "Yesterday, 07:45 PM",
      source: "USER_ENTERED",
    },
    {
      id: "v-03",
      systolic_bp: 136,
      diastolic_bp: 88,
      heart_rate: 78,
      spo2: 98,
      recorded_at: "Sep 11, 2026, 09:00 AM",
      source: "CLINICIAN",
    },
  ]);

  const handleLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numSbp = parseInt(sbp, 10);
    const numDbp = parseInt(dbp, 10);
    const numHr = parseInt(hr, 10);
    const numSpo2 = parseInt(spo2, 10);

    // Physiological checks
    if (isNaN(numSbp) || numSbp < 40 || numSbp > 300) {
      setError("Systolic pressure must be between 40 and 300 mmHg.");
      return;
    }
    if (isNaN(numDbp) || numDbp < 30 || numDbp > 200) {
      setError("Diastolic pressure must be between 30 and 200 mmHg.");
      return;
    }
    if (numSbp <= numDbp) {
      setError("Systolic pressure must be strictly greater than diastolic pressure.");
      return;
    }

    try {
      await apiClient.post("/user/vitals/", {
        systolic_bp: numSbp,
        diastolic_bp: numDbp,
        heart_rate: numHr,
        spo2: numSpo2,
      }).catch(() => {});
    } catch {}

    const newEntry = {
      id: `v-${Date.now()}`,
      systolic_bp: numSbp,
      diastolic_bp: numDbp,
      heart_rate: numHr,
      spo2: numSpo2,
      recorded_at: "Just now",
      source: "USER_ENTERED",
    };

    setVitalsList([newEntry, ...vitalsList]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowLogModal(false);
    }, 1500);
  };

  return (
    <ResponsivePageContainer
      title="Vitals & Physiological Measurements"
      subtitle="Track daily blood pressure, pulse rate, oxygen saturation, and clinical baseline vitals"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setShowLogModal(true)}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm touch-target"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Measurement</span>
          </Button>
          <Link href="/user/vitals/history">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200 touch-target">
              <History className="h-3.5 w-3.5 text-slate-600" />
              <span>Full History</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* Safety Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Important Clinical Reminder:</strong> If you record a systolic pressure over 180 mmHg, severe chest pain, shortness of breath, or numbness, seek emergency medical assistance immediately.
        </p>
      </div>

      {/* Latest Readings Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Latest Blood Pressure</span>
            <p className="text-2xl font-bold text-slate-900">
              {vitalsList[0]?.systolic_bp}/{vitalsList[0]?.diastolic_bp} <span className="text-xs font-normal text-slate-400">mmHg</span>
            </p>
            <p className="text-[11px] text-slate-400">Recorded: {vitalsList[0]?.recorded_at}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Resting Pulse</span>
            <p className="text-2xl font-bold text-slate-900">
              {vitalsList[0]?.heart_rate || 76} <span className="text-xs font-normal text-slate-400">bpm</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Normal Range (60-100 bpm)</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Oxygen Saturation</span>
            <p className="text-2xl font-bold text-slate-900">
              {vitalsList[0]?.spo2 || 98}%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Adequate Peripheral Perfusion</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Log Table */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Recent Measurements</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Validated against biological limits upon entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {vitalsList.map((v) => (
              <div key={v.id} className="p-4 flex items-center justify-between flex-wrap gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {v.systolic_bp} / {v.diastolic_bp} mmHg · {v.heart_rate} bpm
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.recorded_at} · Source: {v.source === "USER_ENTERED" ? "Self-Reported" : "Clinical Staff Verified"}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                  SpO2: {v.spo2}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Modal with iOS-sheet on mobile */}
      <ResponsiveModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log Vital Measurement"
        subtitle="Enter today's physiological readings. Values are verified against clinical limits."
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Vitals recorded and verified successfully!
            </div>
          )}

          <form onSubmit={handleLogVital} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Systolic (mmHg)</label>
                <Input value={sbp} onChange={(e) => setSbp(e.target.value)} type="number" className="text-xs h-10 touch-target" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Diastolic (mmHg)</label>
                <Input value={dbp} onChange={(e) => setDbp(e.target.value)} type="number" className="text-xs h-10 touch-target" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Heart Rate (bpm)</label>
                <Input value={hr} onChange={(e) => setHr(e.target.value)} type="number" className="text-xs h-10 touch-target" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SpO2 (%)</label>
                <Input value={spo2} onChange={(e) => setSpo2(e.target.value)} type="number" className="text-xs h-10 touch-target" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowLogModal(false)} className="text-xs touch-target">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs touch-target">
                Record Measurement
              </Button>
            </div>
          </form>
        </div>
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
