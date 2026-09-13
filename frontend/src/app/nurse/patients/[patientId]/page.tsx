"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HeartPulse, User, Activity, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function NursePatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { predictions } = useClinicalStore();
  const patientPreds = predictions.filter((p) => p.patient_id === patientId);
  const patient = patientPreds[0];

  if (!patient) return (
    <div className="p-6 text-center">
      <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500">Patient not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push("/nurse/patients")}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push("/nurse/patients")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Patients
      </Button>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
          <User className="h-6 w-6 text-sky-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{patient.patient_name}</h1>
          <p className="text-sm text-slate-500">
            MRN: {patient.patient_mrn} · Age {patient.age ?? patient.clinical_factors?.age ?? "—"} · {patient.gender ?? patient.clinical_factors?.sex ?? "—"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href={`/nurse/patients/${patientId}/vitals`}>
          <Card className="hover:border-sky-300 cursor-pointer transition-all">
            <CardContent className="pt-5 pb-5 text-center">
              <HeartPulse className="h-8 w-8 text-sky-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Vitals</p>
              <p className="text-xs text-slate-500 mt-1">View &amp; record vitals</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/nurse/patients/${patientId}/risk-screening`}>
          <Card className="hover:border-sky-300 cursor-pointer transition-all">
            <CardContent className="pt-5 pb-5 text-center">
              <Activity className="h-8 w-8 text-sky-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Risk Screening</p>
              <p className="text-xs text-slate-500 mt-1">Authorized screening only</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="hover:border-sky-300 cursor-pointer transition-all" onClick={() => router.push(`/nurse/escalations`)}>
          <CardContent className="pt-5 pb-5 text-center">
            <Shield className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">Escalate</p>
            <p className="text-xs text-slate-500 mt-1">Escalate to physician</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
