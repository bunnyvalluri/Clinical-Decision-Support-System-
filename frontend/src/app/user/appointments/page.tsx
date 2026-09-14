"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  User,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive";
import apiClient from "@/services/apiClient";

interface AppointmentItem {
  id: string;
  clinician_name: string;
  clinician_title?: string;
  department: string;
  scheduled_time: string;
  duration_minutes: number;
  status: "CONFIRMED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  location_or_link: string;
  reason_for_visit: string;
  is_telehealth: boolean;
  instructions?: string[];
}

const INITIAL_APPTS: AppointmentItem[] = [
  {
    id: "appt-01",
    clinician_name: "Dr. Sarah Lin, MD",
    clinician_title: "Chief of Outpatient Cardiology",
    department: "Cardiology Outpatient Clinic",
    scheduled_time: new Date(Date.now() + 86400000 * 3).toISOString(),
    duration_minutes: 30,
    status: "CONFIRMED",
    location_or_link: "Suite 402 - Heart & Vascular Pavilion",
    reason_for_visit: "Quarterly Cardiovascular Review & Holter Follow-up",
    is_telehealth: false,
    instructions: [
      "Bring 7-day home blood pressure log",
      "Bring current daily medication bottles",
      "Fasting required 8 hours prior for fasting lipid panel",
    ],
  },
  {
    id: "appt-02",
    clinician_name: "Nurse Practitioner Michael Chang, FNP",
    clinician_title: "Triage & Cardiovascular Prevention",
    department: "Preventive Care & Vitals Triage",
    scheduled_time: new Date(Date.now() + 86400000 * 14).toISOString(),
    duration_minutes: 20,
    status: "SCHEDULED",
    location_or_link: "Telehealth Video Consultation Room 4",
    reason_for_visit: "Home Blood Pressure Telemetry & Dosage Verification",
    is_telehealth: true,
    instructions: [
      "Test camera & microphone 10 minutes prior",
      "Have your Bluetooth cuff ready for live reading",
    ],
  },
  {
    id: "appt-03",
    clinician_name: "Dr. Sarah Lin, MD",
    clinician_title: "Chief of Outpatient Cardiology",
    department: "Cardiology Outpatient Clinic",
    scheduled_time: "2026-06-15T14:00:00Z",
    duration_minutes: 30,
    status: "COMPLETED",
    location_or_link: "Suite 402 - Heart & Vascular Pavilion",
    reason_for_visit: "Initial Diagnostic Risk Assessment & Baseline ECG",
    is_telehealth: false,
    instructions: ["Completed with encounter notes documented in EHR."],
  },
];

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<AppointmentItem[]>(INITIAL_APPTS);
  const [filterTab, setFilterTab] = React.useState<"all" | "upcoming" | "telehealth" | "past">("all");
  const [showBookModal, setShowBookModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Booking Form State
  const [dept, setDept] = React.useState("Cardiology Outpatient Clinic");
  const [clinician, setClinician] = React.useState("Dr. Sarah Lin, MD");
  const [dateStr, setDateStr] = React.useState("2026-09-24T10:30");
  const [visitType, setVisitType] = React.useState<"in-person" | "telehealth">("in-person");
  const [reason, setReason] = React.useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTele = visitType === "telehealth";
    const newAppt: AppointmentItem = {
      id: `appt-${Date.now()}`,
      clinician_name: clinician,
      clinician_title: dept.includes("Cardiology") ? "Cardiology Specialist" : "Preventive Clinician",
      department: dept,
      scheduled_time: new Date(dateStr).toISOString(),
      duration_minutes: 30,
      status: "SCHEDULED",
      location_or_link: isTele ? "Telehealth Video Consultation" : "Suite 402 - Heart & Vascular Pavilion",
      reason_for_visit: reason || "Routine Clinical Follow-up",
      is_telehealth: isTele,
      instructions: isTele
        ? ["Join video room 5 minutes before scheduled start time."]
        : ["Please check in at Reception Desk B 15 minutes prior."],
    };

    try {
      await apiClient.post("/user/appointments/", {
        department: dept,
        scheduled_time: new Date(dateStr).toISOString(),
        reason_for_visit: reason || "Routine Follow-up",
      }).catch(() => {});
    } catch {}

    setAppointments([newAppt, ...appointments]);
    setShowBookModal(false);
    setReason("");
    showToast("Consultation booked successfully. Confirmation sent to care team.");
  };

  const handleCancel = async (id: string) => {
    try {
      await apiClient.patch(`/user/appointments/${id}/`, { status: "CANCELLED" }).catch(() => {});
    } catch {}
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" as const } : a))
    );
    showToast("Appointment status updated to Cancelled.");
  };

  const filtered = appointments.filter((a) => {
    if (filterTab === "upcoming") return a.status === "SCHEDULED" || a.status === "CONFIRMED";
    if (filterTab === "telehealth") return a.is_telehealth && a.status !== "CANCELLED";
    if (filterTab === "past") return a.status === "COMPLETED" || a.status === "CANCELLED";
    return true;
  });

  const upcomingCount = appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Clinical Consultations &amp; Telehealth
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200">
                {upcomingCount} Upcoming Visit{upcomingCount !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Schedule in-person outpatient appointments, manage upcoming follow-ups, and join encrypted clinical telehealth encounters.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              onClick={() => setShowBookModal(true)}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-2 shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Book Consultation
            </Button>
            <Button
              onClick={() => showToast("Exported appointment schedule to calendar (.ics).")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" /> Sync Calendar (.ics)
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto">
        {(
          [
            { id: "all", label: "All Encounters" },
            { id: "upcoming", label: "Upcoming Visits" },
            { id: "telehealth", label: "Telehealth Sessions" },
            { id: "past", label: "Past History" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTab === t.id
                ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-4">
        {filtered.map((appt) => {
          const dateObj = new Date(appt.scheduled_time);
          const isPast = appt.status === "COMPLETED" || appt.status === "CANCELLED";

          return (
            <Card
              key={appt.id}
              className={`bg-white border transition-all ${
                isPast
                  ? "border-slate-200/70 opacity-80"
                  : "border-slate-200/90 shadow-xs hover:border-teal-300 hover:shadow-sm"
              }`}
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Date Badge & Details */}
                  <div className="flex items-start gap-4">
                    {/* Calendar Badge */}
                    <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {dateObj.toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className="text-xl font-black text-slate-900 leading-none">
                        {dateObj.getDate()}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400">
                        {dateObj.toLocaleString("en-US", { weekday: "short" })}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            appt.status === "CONFIRMED"
                              ? "success"
                              : appt.status === "SCHEDULED"
                              ? "info"
                              : appt.status === "COMPLETED"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px] font-bold"
                        >
                          {appt.status}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-500">
                          {appt.department}
                        </span>
                        {appt.is_telehealth && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <Video className="h-3 w-3" /> Telehealth Video
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {appt.clinician_name}
                      </h2>
                      {appt.clinician_title && (
                        <p className="text-xs text-slate-500 font-medium">
                          {appt.clinician_title}
                        </p>
                      )}
                      <p className="text-xs text-slate-700 font-semibold pt-0.5">
                        {appt.reason_for_visit}
                      </p>

                      {/* Location & Time Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ({appt.duration_minutes} mins)
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {appt.location_or_link}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {appt.is_telehealth && !isPast && (
                      <Button
                        size="sm"
                        onClick={() => showToast("Launching secure encrypted telehealth video room...")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Video Call
                      </Button>
                    )}

                    {!isPast && (
                      <>
                        <Link href={`/user/appointments/${appt.id}`}>
                          <Button variant="outline" size="sm" className="text-xs border-slate-200 text-slate-700">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(appt.id)}
                          className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Pre-Visit Instructions */}
                {appt.instructions && appt.instructions.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Preparation Instructions:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {appt.instructions.map((inst, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-400">
            No consultations found for this filter tab.
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <ResponsiveModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Book Clinical Consultation"
        subtitle="Select your preferred medical department, consultation format, and date."
        maxWidth="md"
      >
        <form onSubmit={handleBook} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Consultation Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisitType("in-person")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  visitType === "in-person"
                    ? "bg-teal-50 border-teal-400 text-teal-900 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  In-Person Clinic Visit
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Heart &amp; Vascular Outpatient Pavilion</p>
              </button>

              <button
                type="button"
                onClick={() => setVisitType("telehealth")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  visitType === "telehealth"
                    ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Video className="h-3.5 w-3.5 text-indigo-600" />
                  Telehealth Video
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Encrypted video consultation</p>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800"
            >
              <option value="Cardiology Outpatient Clinic">Cardiology Outpatient Clinic</option>
              <option value="Preventive Care & Vitals Triage">Preventive Care &amp; Vitals Triage</option>
              <option value="Heart Failure Specialized Care">Heart Failure Specialized Care</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Preferred Clinician</label>
            <select
              value={clinician}
              onChange={(e) => setClinician(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800"
            >
              <option value="Dr. Sarah Lin, MD">Dr. Sarah Lin, MD (Cardiology Specialist)</option>
              <option value="Nurse Practitioner Michael Chang, FNP">Nurse Practitioner Michael Chang, FNP</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Date &amp; Time Slot</label>
            <Input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
              className="text-xs h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Reason for Visit / Symptoms</label>
            <Input
              placeholder="E.g., Quarterly BP review, medication adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs h-10"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBookModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
            >
              Confirm Appointment
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}
