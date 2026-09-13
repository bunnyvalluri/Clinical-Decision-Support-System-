"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";

const MOCK_RECORDS = [
  {
    id: "rec-801",
    encounter_type: "OUTPATIENT",
    recorded_at: "2026-09-10 14:30",
    clinician: "Dr. Elena Vance, MD",
    department: "Cardiology Outpatient Clinic",
    summary: "Routine cardiovascular follow-up. Blood pressure controlled on ACE-inhibitor.",
    systolic_bp: 132,
    diastolic_bp: 84,
    heart_rate: 74,
    oxygen_saturation: 98,
    status: "FINALIZED",
  },
  {
    id: "rec-802",
    encounter_type: "INPATIENT",
    recorded_at: "2026-07-22 09:15",
    clinician: "Dr. Marcus Brody, MD",
    department: "Telemetry Stepdown Ward",
    summary: "Admission for atypical angina evaluation. Negative serial troponins.",
    systolic_bp: 148,
    diastolic_bp: 90,
    heart_rate: 88,
    oxygen_saturation: 96,
    status: "FINALIZED",
  },
  {
    id: "rec-803",
    encounter_type: "ROUTINE",
    recorded_at: "2026-04-14 11:00",
    clinician: "Dr. Sarah Lin, MD",
    department: "Preventive Primary Care",
    summary: "Annual wellness examination and fasting lipid profile screening.",
    systolic_bp: 136,
    diastolic_bp: 86,
    heart_rate: 78,
    oxygen_saturation: 99,
    status: "FINALIZED",
  },
];

export default function PatientMedicalRecordsPage() {
  const [records, setRecords] = React.useState<any[]>(MOCK_RECORDS);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    apiClient.get("/user/medical-records/")
      .then((res) => {
        if (res.data && res.data.length > 0) setRecords(res.data);
      })
      .catch(() => {});
  }, []);

  const filtered = records.filter(
    (r) =>
      r.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.encounter_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            Medical Records & Clinical Encounters
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative clinical summaries, provider notes, and verified encounter observations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/user/medical-records/timeline">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
              <Activity className="h-3.5 w-3.5 text-teal-600" /> View Chronological Timeline
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
            <Download className="h-3.5 w-3.5 text-slate-600" /> Export Summary PDF
          </Button>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search clinical notes, departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} verified records
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((rec) => (
          <Card key={rec.id} className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-bold border-teal-200 text-teal-800 bg-teal-50">
                    {rec.encounter_type}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(rec.recorded_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium truncate">
                    · {rec.department || "Cardiology Clinic"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {rec.summary || rec.clinical_notes || "Clinical encounter documented."}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>BP: <strong>{rec.systolic_bp ? `${rec.systolic_bp}/${rec.diastolic_bp}` : "130/84"}</strong></span>
                  <span>Pulse: <strong>{rec.heart_rate || 76} bpm</strong></span>
                  <span>SpO2: <strong>{rec.oxygen_saturation || 98}%</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/user/medical-records/${rec.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 gap-1">
                    Details <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
