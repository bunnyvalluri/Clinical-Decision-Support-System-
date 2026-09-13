"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Edit, HeartPulse } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { patients } = useClinicalStore();
  const patient = patients.find((p) => p.id === patientId) || patients[0];

  const [firstName, setFirstName] = React.useState(patient.first_name);
  const [lastName, setLastName] = React.useState(patient.last_name);
  const [age, setAge] = React.useState(String(patient.age));
  const [gender, setGender] = React.useState(patient.gender);
  const [department, setDepartment] = React.useState(patient.department);
  const [room, setRoom] = React.useState(patient.room_number);
  const [doctor, setDoctor] = React.useState(patient.primary_doctor);
  const [bloodType, setBloodType] = React.useState(patient.blood_type);
  const [status, setStatus] = React.useState<string>(patient.status);

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last names are mandatory.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // update state
      patient.first_name = firstName;
      patient.last_name = lastName;
      patient.age = parseInt(age) || patient.age;
      patient.gender = gender as "M" | "F" | "OTHER";
      patient.department = department;
      patient.room_number = room;
      patient.primary_doctor = doctor;
      patient.blood_type = bloodType;
      patient.status = status as "INPATIENT" | "OUTPATIENT" | "ICU" | "DISCHARGED";

      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/patients/${patient.id}`);
      }, 1000);
    }, 400);
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/patients/${patient.id}`}>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200">
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Edit className="h-6 w-6 text-emerald-600" />
                Edit Patient EHR: {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                MRN: {patient.mrn} • Hospital System Synchronization
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Update Medical Demographics & Room Allocation
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Modifications are audited with the active clinician credentials under HIPAA protocols.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {success ? (
              <div className="text-center py-8 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Patient Record Updated Successfully</h3>
                <p className="text-xs text-slate-500">Redirecting to patient chart view...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="error" onDismiss={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                  <Select
                    label="Gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "M" | "F" | "OTHER")}
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
                      { value: "AB+", label: "AB+" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    options={[
                      { value: "Cardiology", label: "Cardiology" },
                      { value: "ICU", label: "ICU" },
                      { value: "Emergency", label: "Emergency Medicine" },
                      { value: "General Medicine", label: "General Medicine" },
                    ]}
                  />
                  <Input
                    label="Room / Bed"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    required
                  />
                  <Select
                    label="Patient Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { value: "INPATIENT", label: "Inpatient" },
                      { value: "ICU", label: "ICU Ward" },
                      { value: "OUTPATIENT", label: "Outpatient" },
                      { value: "DISCHARGED", label: "Discharged" },
                    ]}
                  />
                </div>

                <Input
                  label="Primary Attending Doctor"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <Link href={`/patients/${patient.id}`}>
                    <Button type="button" variant="outline" size="sm" className="border-slate-200">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" variant="default" size="sm" isLoading={isSubmitting} className="shadow-sm">
                    Save EHR Changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
