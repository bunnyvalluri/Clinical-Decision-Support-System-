"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HeartPulse,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useAuthStore } from "@/features/auth/authStore";
import { LoadingScreen } from "@/components/ui/loading";

function NewClinicalRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const { patients, updatePatient } = useClinicalStore();
  const { user } = useAuthStore();

  const [selectedPatientId, setSelectedPatientId] = React.useState(
    preselectedPatientId || (patients[0]?.id ?? "")
  );

  // Vitals State
  const [systolicBP, setSystolicBP] = React.useState("142");
  const [diastolicBP, setDiastolicBP] = React.useState("88");
  const [heartRate, setHeartRate] = React.useState("92");
  const [spo2, setSpo2] = React.useState("94");
  const [respiratoryRate, setRespiratoryRate] = React.useState("18");
  const [bloodGlucose, setBloodGlucose] = React.useState("135");
  const [bmi, setBmi] = React.useState("27.4");
  const [troponin, setTroponin] = React.useState("0.04");

  // Clinical context
  const [chiefComplaint, setChiefComplaint] = React.useState(
    "Exertional retrosternal chest pressure and dyspnea on walking"
  );
  const [icd10Code, setIcd10Code] = React.useState("I20.9 - Angina pectoris, unspecified");
  const [clinicalNotes, setClinicalNotes] = React.useState(
    "Patient presented with intermittent sub-sternal chest discomfort radiating to left shoulder. EKG shows non-specific ST-T changes. High-sensitivity troponin drawn at bedside."
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Physiological range checks
  const numSBP = parseFloat(systolicBP) || 120;
  const numSpO2 = parseFloat(spo2) || 98;
  const numHR = parseFloat(heartRate) || 72;

  const isHypertensiveCrisis = numSBP >= 160;
  const isHypoxic = numSpO2 < 92;
  const isTachycardic = numHR > 100;

  const handleSave = (andTriggerPrediction = false) => {
    setIsSubmitting(true);
    setTimeout(() => {
      updatePatient(selectedPatientId, {
        systolic_bp: numSBP,
        diastolic_bp: parseFloat(diastolicBP) || 80,
        heart_rate: numHR,
        spo2: numSpO2,
        blood_glucose: parseFloat(bloodGlucose) || 100,
      });

      setIsSubmitting(false);
      if (andTriggerPrediction) {
        router.push(`/predictions/new?patientId=${selectedPatientId}&sbp=${numSBP}&hr=${numHR}`);
      } else {
        setSuccessMessage("Clinical encounter observation recorded to EHR successfully.");
        setTimeout(() => {
          router.push(`/patients/${selectedPatientId}`);
        }, 1200);
      }
    }, 600);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/patients" className="hover:text-slate-800 flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patients
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">New Clinical Record & Observations</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-emerald-600" />
              Record Bedside Observations & Vitals
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Physiological data is validated with clinical range boundaries and feeds continuous ML risk models.
            </p>
          </div>
          <Badge variant="outline" className="text-xs self-start sm:self-auto font-mono bg-white border-slate-200 text-slate-700">
            {user?.full_name || "Physician"}
          </Badge>
        </div>

        {successMessage && (
          <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Physiological Warnings if out of range */}
        {(isHypertensiveCrisis || isHypoxic || isTachycardic) && (
          <Alert variant="warning" title="Clinical Physiological Boundary Alert">
            <div className="space-y-1">
              {isHypertensiveCrisis && (
                <p>• Systolic Blood Pressure ({numSBP} mmHg) exceeds severe hypertension threshold (&gt;160 mmHg).</p>
              )}
              {isHypoxic && (
                <p>• Oxygen Saturation ({numSpO2}%) indicates sub-acute hypoxia (&lt;92%). Consider supplemental O2.</p>
              )}
              {isTachycardic && (
                <p>• Resting Heart Rate ({numHR} bpm) indicates tachycardia (&gt;100 bpm).</p>
              )}
            </div>
          </Alert>
        )}

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
          {/* Patient Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Select Inpatient / Bed
            </label>
            <Select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.first_name} ${p.last_name} (${p.mrn}) — ${p.room_number} [${p.latest_risk_level} Risk]`,
              }))}
            />
          </div>

          {/* Vitals Matrix */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">
              Physiological Parameters & Hemodynamics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Systolic BP (mmHg)"
                type="number"
                value={systolicBP}
                onChange={(e) => setSystolicBP(e.target.value)}
                helperText="Normal: 90-120"
                required
              />
              <Input
                label="Diastolic BP (mmHg)"
                type="number"
                value={diastolicBP}
                onChange={(e) => setDiastolicBP(e.target.value)}
                helperText="Normal: 60-80"
                required
              />
              <Input
                label="Heart Rate (bpm)"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                helperText="Normal: 60-100"
                required
              />
              <Input
                label="SpO2 (%)"
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                helperText="Normal: 95-100"
                required
              />
              <Input
                label="Respiratory Rate (/min)"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                helperText="Normal: 12-20"
              />
              <Input
                label="Blood Glucose (mg/dL)"
                type="number"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                helperText="Fasting: 70-110"
              />
              <Input
                label="Body Mass Index (BMI)"
                type="number"
                step="0.1"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
                helperText="Normal: 18.5-24.9"
              />
              <Input
                label="Troponin I (ng/mL)"
                type="number"
                step="0.01"
                value={troponin}
                onChange={(e) => setTroponin(e.target.value)}
                helperText="Elevated: > 0.04"
              />
            </div>
          </div>

          {/* Clinical Context & Notes */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Diagnostic Context & Encounter Notes
            </h3>

            <Input
              label="Chief Complaint / Presentation"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Substernal chest tightness radiating to jaw"
              required
            />

            <Select
              label="Primary ICD-10 Diagnostic Impression"
              value={icd10Code}
              onChange={(e) => setIcd10Code(e.target.value)}
              options={[
                { value: "I20.9 - Angina pectoris, unspecified", label: "I20.9 - Angina pectoris, unspecified" },
                { value: "I21.9 - Acute myocardial infarction, unspecified", label: "I21.9 - Acute myocardial infarction" },
                { value: "I25.10 - Atherosclerotic heart disease", label: "I25.10 - Atherosclerotic heart disease" },
                { value: "I50.9 - Heart failure, unspecified", label: "I50.9 - Heart failure, unspecified" },
                { value: "R07.9 - Chest pain, unspecified", label: "R07.9 - Chest pain, unspecified" },
              ]}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Clinician Progress & Assessment Notes
              </label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
              isLoading={isSubmitting}
              className="w-full sm:w-auto text-xs gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Save className="h-4 w-4 text-slate-500" />
              Save Record Only
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={() => handleSave(true)}
              isLoading={isSubmitting}
              className="w-full sm:w-auto text-xs gap-2 shadow-sm"
            >
              <HeartPulse className="h-4 w-4" />
              Save & Run ML Risk Assessment
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default function NewClinicalRecordPage() {
  return (
    <React.Suspense fallback={<LoadingScreen message="Loading clinical forms..." />}>
      <NewClinicalRecordContent />
    </React.Suspense>
  );
}
