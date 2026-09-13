"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  HeartPulse,
  Pill,
  AlertCircle,
  FileCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PatientHealthSummaryPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-600" />
            Comprehensive Health Summary
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated snapshot of active medical conditions, medications, allergies, and clinical baselines.
          </p>
        </div>

        <Link href="/user/medical-records/timeline">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-teal-600" /> View Full Event Timeline
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conditions */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-rose-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Active Diagnoses</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { code: "I10", name: "Essential (Primary) Hypertension", status: "Controlled" },
              { code: "E78.0", name: "Pure Hypercholesterolemia", status: "Managed" },
              { code: "I20.9", name: "Angina Pectoris (Unspecified)", status: "Monitored" },
            ].map(({ code, name, status }) => (
              <div key={code} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{name}</span>
                  <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">{status}</Badge>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ICD-10: {code}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Medications */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Current Medications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { name: "Lisinopril Oral Tablet", dose: "10 mg daily (morning)", purpose: "Blood Pressure" },
              { name: "Atorvastatin Calcium", dose: "20 mg daily (evening)", purpose: "Cholesterol Management" },
              { name: "Aspirin Enteric Coated", dose: "81 mg daily (morning)", purpose: "Cardioprotective" },
            ].map(({ name, dose, purpose }) => (
              <div key={name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <p className="text-xs font-bold text-slate-900">{name}</p>
                <p className="text-xs text-slate-600 font-medium">{dose}</p>
                <span className="text-[10px] text-teal-700 font-medium">{purpose}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Allergies & Precautions */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Documented Allergies</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { allergen: "Penicillins", reaction: "Maculopapular rash (Mild)", severity: "MODERATE" },
              { allergen: "Iodinated Radiocontrast", reaction: "Urticaria / Pruritus", severity: "HIGH" },
            ].map(({ allergen, reaction, severity }) => (
              <div key={allergen} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{allergen}</span>
                  <Badge variant="outline" className={`text-[10px] font-bold ${severity === "HIGH" ? "text-rose-700 border-rose-200 bg-rose-50" : "text-amber-700 border-amber-200 bg-amber-50"}`}>
                    {severity}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">{reaction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Decision Support Baseline Snapshot */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Cardiovascular Risk Baseline</CardTitle>
            </div>
            <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
              Model Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-900 text-sm">Moderate Estimated 10-Year Cardiovascular Risk Tier</p>
            <p className="text-slate-600 max-w-xl leading-relaxed">
              Based on historical physiological markers (mean resting systolic pressure of 134 mmHg, baseline cholesterol of 210 mg/dl, and female non-smoker profile).
            </p>
          </div>
          <Link href="/user/predictions">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1">
              View Detailed Metrics <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
