"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.appointmentId as string;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/user/appointments")} className="text-xs gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Appointments
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm space-y-4">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-base font-bold text-slate-900">Appointment Details</CardTitle>
            </div>
            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
              CONFIRMED
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500 font-mono">
            Booking ID: {appointmentId}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Attending Clinician:</span>
              <span className="font-bold text-slate-800">Dr. Elena Vance, MD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="font-semibold text-slate-700">Cardiology Outpatient Clinic</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date &amp; Time:</span>
              <span className="font-semibold text-slate-800">Wednesday, Sep 16, 2026 at 10:30 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-800">Suite 402 - Heart &amp; Vascular Pavilion</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="font-semibold text-slate-800">30 Minutes</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Reason for Visit</span>
            <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
              Quarterly cardiovascular checkup, 30-day blood pressure trend review, and Holter monitor results consultation.
            </p>
          </div>

          <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>Please arrive 15 minutes prior to appointment time with your current medication list.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
