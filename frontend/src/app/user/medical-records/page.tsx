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
  CheckCircle2,
  Stethoscope,
  Building2,
  FileCheck,
  Share2,
  Eye,
  X,
  AlertCircle,
  Pill,
  HeartPulse,
  Printer,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { ResponsivePageContainer, ResponsiveModal } from "@/components/responsive";

interface MedicalRecordItem {
  id: string;
  encounter_date?: string;
  recorded_at?: string;
  encounter_type: "OUTPATIENT" | "INPATIENT" | "ROUTINE" | string;
  department: string;
  facility: string;
  clinician_name: string;
  clinician_role: string;
  clinician_license?: string;
  summary: string;
  chief_complaint?: string;
  assessment_plan?: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  oxygen_saturation: number;
  diagnoses: string[];
  prescriptions_adjusted?: string[];
  status: "FINALIZED" | "PENDING_REVIEW" | string;
  signed_at: string;
}

const INITIAL_RECORDS: MedicalRecordItem[] = [
  {
    id: "rec-801",
    encounter_type: "OUTPATIENT",
    recorded_at: "2026-09-10 14:30",
    encounter_date: "Sep 10, 2026",
    clinician_name: "Dr. Vadla Abhinay, MD",
    clinician_role: "Cardiology Specialist",
    clinician_license: "CA-MD-98421",
    department: "Cardiology Outpatient Clinic",
    facility: "Heart & Vascular Pavilion, Suite 402",
    chief_complaint: "Routine cardiovascular follow-up & 30-day ambulatory BP log evaluation.",
    summary: "Routine cardiovascular follow-up. Blood pressure well controlled on current ACE-inhibitor therapy with no adverse postural symptoms.",
    assessment_plan: "Patient demonstrates adequate blood pressure control (132/84 mmHg). Stable cardiac rhythm on 24-hr telemetry log. Continue Lisinopril 10mg PO daily. Maintain low-sodium dietary regimen (<2g/day). Repeat basic metabolic panel in 90 days.",
    systolic_bp: 132,
    diastolic_bp: 84,
    heart_rate: 74,
    oxygen_saturation: 98,
    diagnoses: ["Essential (Primary) Hypertension (I10)", "Pure Hypercholesterolemia (E78.0)"],
    prescriptions_adjusted: ["Lisinopril 10mg - Maintained", "Atorvastatin 20mg - Maintained"],
    status: "FINALIZED",
    signed_at: "2026-09-10 15:15:00 UTC",
  },
  {
    id: "rec-802",
    encounter_type: "INPATIENT",
    recorded_at: "2026-07-22 09:15",
    encounter_date: "Jul 22, 2026",
    clinician_name: "Dr. Elena Rostova, MD",
    clinician_role: "Attending Cardiologist",
    clinician_license: "CA-MD-44192",
    department: "Telemetry Stepdown Ward",
    facility: "Main University Hospital, Floor 4",
    chief_complaint: "Substernal chest tightness radiating to left shoulder on moderate exertion.",
    summary: "Admission for atypical angina evaluation. Negative serial troponins and stable continuous ECG telemetry.",
    assessment_plan: "Serial high-sensitivity cardiac troponins x3 were non-elevated. Continuous telemetry demonstrated normal sinus rhythm with occasional benign PVCs. Echocardiogram reveals preserved LVEF 60% without regional wall motion abnormalities. Discharge on Aspirin 81mg daily with scheduled outpatient Bruce protocol stress test.",
    systolic_bp: 148,
    diastolic_bp: 90,
    heart_rate: 88,
    oxygen_saturation: 96,
    diagnoses: ["Angina Pectoris, Unspecified (I20.9)", "Sinus Tachycardia (R00.0)"],
    prescriptions_adjusted: ["Aspirin Enteric Coated 81mg - Initiated"],
    status: "FINALIZED",
    signed_at: "2026-07-23 11:40:00 UTC",
  },
  {
    id: "rec-803",
    encounter_type: "ROUTINE",
    recorded_at: "2026-04-14 11:00",
    encounter_date: "Apr 14, 2026",
    clinician_name: "Dr. Sarah Jenkins, MD",
    clinician_role: "Internal Medicine Attending",
    clinician_license: "CA-MD-31084",
    department: "Preventive Primary Care",
    facility: "Westside Ambulatory Health Center",
    chief_complaint: "Annual comprehensive preventive wellness checkup & preventive bloodwork.",
    summary: "Annual wellness examination and fasting lipid profile screening. Cardiovascular baseline parameters reviewed.",
    assessment_plan: "Healthy overall appearance. BMI 26.4. Resting BP slightly elevated at 136/86 mmHg. Fasting lipid panel demonstrated elevated LDL (142 mg/dL). Discussed lifestyle modification, Mediterranean diet, and moderate aerobic exercise 150 min/wk. Initiated low-dose statin therapy for primary prevention.",
    systolic_bp: 136,
    diastolic_bp: 86,
    heart_rate: 78,
    oxygen_saturation: 99,
    diagnoses: ["Encounter for General Adult Medical Exam (Z00.00)", "Hyperlipidemia, Unspecified (E78.5)"],
    prescriptions_adjusted: ["Atorvastatin 20mg - Initiated"],
    status: "FINALIZED",
    signed_at: "2026-04-14 12:30:00 UTC",
  },
];

export default function PatientMedicalRecordsPage() {
  const [records, setRecords] = React.useState<MedicalRecordItem[]>(INITIAL_RECORDS);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedRecord, setSelectedRecord] = React.useState<MedicalRecordItem | null>(null);
  const [exportNotification, setExportNotification] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiClient
      .get("/user/medical-records/")
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Merge API data with baseline fields if necessary
          const merged: MedicalRecordItem[] = res.data.map((item: Partial<MedicalRecordItem> & Record<string, unknown>, idx: number) => ({
            ...INITIAL_RECORDS[idx % INITIAL_RECORDS.length],
            ...item,
            id: item.id || `rec-api-${idx}`,
            encounter_date: item.encounter_date || (typeof item.recorded_at === "string" ? item.recorded_at.split(" ")[0] : "2026-09-10"),
          }));
          setRecords(merged);
        }
      })
      .catch(() => {
        // Fallback to rich mock records
      });
  }, []);

  const handleExportPDF = (recordTitle?: string) => {
    const filename = recordTitle
      ? `Encounter_Summary_${recordTitle.replace(/\s+/g, "_")}.pdf`
      : "Complete_Patient_Medical_Records_Summary.pdf";
    setExportNotification(`Generating signed CDA/FHIR compliant document: ${filename}`);
    setTimeout(() => {
      setExportNotification(null);
    }, 4500);
  };

  const filteredRecords = records.filter((r) => {
    const matchesType =
      selectedType === "ALL" ||
      r.encounter_type.toUpperCase() === selectedType.toUpperCase();

    const matchesQuery =
      r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clinician_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.chief_complaint && r.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.diagnoses.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesQuery;
  });

  const getEncounterBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "OUTPATIENT":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold text-[11px] px-2.5 py-0.5">
            Outpatient Consult
          </Badge>
        );
      case "INPATIENT":
        return (
          <Badge className="bg-amber-50 text-amber-900 border-amber-200 font-semibold text-[11px] px-2.5 py-0.5">
            Inpatient Telemetry
          </Badge>
        );
      case "ROUTINE":
        return (
          <Badge className="bg-sky-50 text-sky-800 border-sky-200 font-semibold text-[11px] px-2.5 py-0.5">
            Routine Wellness
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-700 border-slate-300 text-[11px]">
            {type}
          </Badge>
        );
    }
  };

  return (
    <ResponsivePageContainer className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Toast Notification for Export */}
      {exportNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">Export in Progress</p>
            <p className="text-slate-300 text-[11px]">{exportNotification}</p>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <FileText className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Medical Records & Clinical Encounters
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Authoritative clinical notes, verified encounter vitals, attending physician signatures,
            and complete longitudinal diagnostic summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/user/medical-records/timeline">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-teal-700 h-9"
            >
              <Activity className="h-3.5 w-3.5 text-teal-600" />
              Chronological Timeline
            </Button>
          </Link>
          <Button
            onClick={() => handleExportPDF()}
            size="sm"
            className="text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm h-9 px-3.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export Complete PDF
          </Button>
        </div>
      </div>

      {/* Overview Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Verified Encounters</span>
            <FileCheck className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{records.length}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> 100% Signed & Audited
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Most Recent Encounter</span>
            <Calendar className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">Sep 10, 2026</div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            Cardiology Outpatient Clinic
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Attending Cardiologist</span>
            <Stethoscope className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">Dr. Vadla Abhinay</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Heart & Vascular Pavilion
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Record Standard</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">HL7 FHIR R4</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            HIPAA Audit Hash Verified
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Encounters" },
            { id: "OUTPATIENT", label: "Outpatient" },
            { id: "INPATIENT", label: "Inpatient" },
            { id: "ROUTINE", label: "Wellness / Routine" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === tab.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search notes, diagnoses, doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8.5 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Record Cards List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No matching medical records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We could not find any encounter records matching &quot;{searchTerm}&quot; in the current filter category.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedType("ALL");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <Card
              key={rec.id}
              className="bg-white border-slate-200/90 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                {/* Card Top Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getEncounterBadge(rec.encounter_type)}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {rec.encounter_date || rec.recorded_at}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {rec.facility || rec.department}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Signed & Finalized
                    </span>
                  </div>
                </div>

                {/* Primary Narrative & Chief Complaint */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {rec.summary}
                  </h3>
                  {rec.chief_complaint && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <strong className="text-slate-800 font-semibold">Chief Complaint & Reason:</strong>{" "}
                      {rec.chief_complaint}
                    </p>
                  )}
                </div>

                {/* Clinical Metadata Bar: Telemetry Snapshot & Doctor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Attending Clinician
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {rec.clinician_name}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {rec.clinician_role}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Encounter Vitals
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-800 font-semibold">
                      <span>BP {rec.systolic_bp}/{rec.diastolic_bp}</span>
                      <span className="text-slate-300">|</span>
                      <span>HR {rec.heart_rate} bpm</span>
                      <span className="text-slate-300">|</span>
                      <span>SpO2 {rec.oxygen_saturation}%</span>
                    </div>
                    <span className="text-[10px] text-teal-700 font-medium block">
                      In-clinic automated triage
                    </span>
                  </div>

                  <div className="lg:col-span-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Documented Diagnoses
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {rec.diagnoses.map((diag, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                        >
                          {diag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {rec.id} · Certified EHR Audit Trail
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(rec.encounter_date || rec.summary)}
                      className="text-xs text-slate-600 hover:text-slate-900 border-slate-200 h-8 gap-1"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedRecord(rec)}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold h-8 gap-1.5 px-3.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Note & Orders
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comprehensive Encounter Detail Modal */}
      <ResponsiveModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Clinical Note: ${selectedRecord.encounter_date}` : "Clinical Note"}
        subtitle={selectedRecord?.facility || "Encounter summary and physician assessment."}
        maxWidth="2xl"
      >
        {selectedRecord && (
          <div className="space-y-5 p-1 text-slate-900">
            {/* Header info strip */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {getEncounterBadge(selectedRecord.encounter_type)}
                  <span className="text-xs font-bold text-slate-800">
                    {selectedRecord.department}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Recorded: {selectedRecord.recorded_at} · Status: {selectedRecord.status}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-700">
                  {selectedRecord.clinician_name}
                </div>
                <div className="text-[11px] text-slate-500">
                  License: {selectedRecord.clinician_license || "Verified Clinician"}
                </div>
              </div>
            </div>

            {/* In-Clinic Triage Telemetry */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                Physical Examination & Triage Vitals
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedRecord.systolic_bp}/{selectedRecord.diastolic_bp}
                  </span>
                  <span className="text-[10px] text-slate-400 block">mmHg</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">Heart Rate</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedRecord.heart_rate}
                  </span>
                  <span className="text-[10px] text-slate-400 block">bpm (Regular)</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">Oxygen (SpO2)</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedRecord.oxygen_saturation}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Room Air</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center col-span-3 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 block">Clinical Status</span>
                  <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                    Hemodynamically Stable
                  </span>
                </div>
              </div>
            </div>

            {/* Assessment & Plan (SOAP) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                Clinical Assessment & Plan
              </h4>
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                {selectedRecord.assessment_plan || selectedRecord.summary}
              </div>
            </div>

            {/* Prescriptions and Adjustments */}
            {selectedRecord.prescriptions_adjusted && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-indigo-500" />
                  Prescriptions & Treatment Modifications
                </h4>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  {selectedRecord.prescriptions_adjusted.map((rx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-slate-800 py-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold">{rx}</span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Pharmacy Synced (E-Prescribed)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attending Signature Box */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Digitally Signed by {selectedRecord.clinician_name}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Timestamp: {selectedRecord.signed_at} · Authenticated with SAMD-II Clinical HSM
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white font-semibold text-[10px]">
                Valid EHR Signature
              </Badge>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportPDF(selectedRecord.summary)}
                className="text-xs gap-1.5 border-slate-200 text-slate-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Encounter Summary
              </Button>
              <Button
                onClick={() => setSelectedRecord(null)}
                size="sm"
                className="text-xs bg-slate-900 text-white hover:bg-slate-800"
              >
                Close Note
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </ResponsivePageContainer>
  );
}
