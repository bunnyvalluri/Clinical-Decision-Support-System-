"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, HeartPulse, UserPlus } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import type { RiskLevel } from "@/types";

export default function CreatePatientPage() {
  const router = useRouter();
  const { addPatient } = useClinicalStore();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [age, setAge] = React.useState("58");
  const [gender, setGender] = React.useState<"M" | "F">("M");
  const [department, setDepartment] = React.useState("Cardiology");
  const [room, setRoom] = React.useState("Telemetry-304");
  const [bloodType, setBloodType] = React.useState("O+");
  const [doctor, setDoctor] = React.useState("Dr. Vadla Abhinay, MD");
  const [systolicBp, setSystolicBp] = React.useState("132");
  const [diastolicBp, setDiastolicBp] = React.useState("84");
  const [heartRate, setHeartRate] = React.useState("76");
  const [spo2, setSpo2] = React.useState("98");
  const [glucose, setGlucose] = React.useState("108");

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please specify both first and last names for the medical record.");
      return;
    }

    setIsSubmitting(true);
    const newId = `p-${Date.now()}`;
    const newPatient = {
      id: newId,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      age: parseInt(age) || 50,
      gender,
      blood_type: bloodType,
      admission_date: new Date().toISOString().replace("T", " ").substring(0, 16),
      room_number: room,
      primary_doctor: doctor,
      department,
      status: "INPATIENT" as const,
      latest_risk_level: "LOW" as RiskLevel,
      latest_risk_score: 0.18,
      systolic_bp: parseInt(systolicBp) || 120,
      diastolic_bp: parseInt(diastolicBp) || 80,
      heart_rate: parseInt(heartRate) || 72,
      spo2: parseInt(spo2) || 98,
      blood_glucose: parseInt(glucose) || 100,
    };

    setTimeout(() => {
      addPatient(newPatient);
      setIsSubmitting(false);
      router.push(`/patients/${newId}`);
    }, 400);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/patients">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200">
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-emerald-600" />
                Admit New Clinical Patient
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Create an authoritative Electronic Health Record in the HealthNova AI repository.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Patient Admission & Baseline Vitals
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              All entered clinical information is cryptographically registered into Neon PostgreSQL.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="error" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Demographics Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  1. Demographics & Identification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name *"
                    placeholder="e.g. Liam"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name *"
                    placeholder="e.g. Gallagher"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Age (Years) *"
                    type="number"
                    min={18}
                    max={110}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                  <Select
                    label="Gender *"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "M" | "F")}
                    options={[
                      { value: "M", label: "Male" },
                      { value: "F", label: "Female" },
                    ]}
                  />
                  <Select
                    label="Blood Type"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    options={[
                      { value: "O+", label: "O+" },
                      { value: "O-", label: "O-" },
                      { value: "A+", label: "A+" },
                      { value: "A-", label: "A-" },
                      { value: "B+", label: "B+" },
                      { value: "B-", label: "B-" },
                      { value: "AB+", label: "AB+" },
                      { value: "AB-", label: "AB-" },
                    ]}
                  />
                </div>
              </div>

              {/* Clinical Assignment Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  2. Hospital Bed & Attending Physician
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    options={[
                      { value: "Cardiology", label: "Cardiology" },
                      { value: "ICU", label: "ICU" },
                      { value: "Emergency", label: "Emergency Medicine" },
                      { value: "Telemetry", label: "Telemetry Ward" },
                      { value: "General Medicine", label: "General Medicine" },
                    ]}
                  />
                  <Input
                    label="Room / Bed Location *"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Telemetry-304"
                    required
                  />
                  <Input
                    label="Attending Physician"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    placeholder="e.g. Dr. Vadla Abhinay, MD"
                    required
                  />
                </div>
              </div>

              {/* Baseline Resting Vitals Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  3. Admission Physiological Baseline Vitals
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Input
                    label="Systolic BP (mmHg)"
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value)}
                    required
                  />
                  <Input
                    label="Diastolic BP (mmHg)"
                    type="number"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value)}
                    required
                  />
                  <Input
                    label="Heart Rate (bpm)"
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    required
                  />
                  <Input
                    label="SpO2 (%)"
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    required
                  />
                  <Input
                    label="Blood Glucose (mg/dL)"
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <Link href="/patients">
                  <Button type="button" variant="outline" size="sm" className="border-slate-200">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmitting} className="shadow-sm">
                  Admit Patient & Open EHR
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

