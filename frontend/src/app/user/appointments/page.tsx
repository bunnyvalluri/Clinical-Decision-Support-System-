"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Plus,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/services/apiClient";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

const MOCK_APPTS = [
  {
    id: "appt-01",
    clinician_name: "Dr. Elena Vance, MD",
    department: "Cardiology Outpatient Clinic",
    scheduled_time: new Date(Date.now() + 86400000 * 3).toISOString(),
    duration_minutes: 30,
    status: "CONFIRMED",
    location_or_link: "Suite 402 - Heart & Vascular Pavilion",
    reason_for_visit: "Quarterly Cardiovascular Review & Holter Follow-up",
    is_telehealth: false,
  },
  {
    id: "appt-02",
    clinician_name: "Sarah Jenkins, RN",
    department: "Preventive Care & Vitals Triage",
    scheduled_time: new Date(Date.now() + 86400000 * 14).toISOString(),
    duration_minutes: 20,
    status: "SCHEDULED",
    location_or_link: "Telehealth Video Consultation",
    reason_for_visit: "Home Blood Pressure Telemetry Review",
    is_telehealth: true,
  },
  {
    id: "appt-03",
    clinician_name: "Dr. Elena Vance, MD",
    department: "Cardiology Outpatient Clinic",
    scheduled_time: "2026-06-15T14:00:00Z",
    duration_minutes: 30,
    status: "COMPLETED",
    location_or_link: "Suite 402 - Heart & Vascular Pavilion",
    reason_for_visit: "Initial Diagnostic Risk Assessment",
    is_telehealth: false,
  },
];

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<any[]>(MOCK_APPTS);
  const [showBookModal, setShowBookModal] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [dept, setDept] = React.useState("Cardiology Clinic");
  const [dateStr, setDateStr] = React.useState("2026-09-22T10:00");

  const fetchAppointments = React.useCallback(async () => {
    try {
      const res = await apiClient.get("/user/appointments/");
      if (res.data && res.data.length > 0) setAppointments(res.data);
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useUserWebSocket((evt) => {
    if (evt.event_type === "user.appointment.created" || evt.event_type === "user.appointment.cancelled") {
      fetchAppointments();
    }
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/user/appointments/", {
        department: dept,
        scheduled_time: new Date(dateStr).toISOString(),
        reason_for_visit: reason || "Routine Follow-up",
      });
    } catch (e) {}

    const newAppt = {
      id: `appt-${Date.now()}`,
      clinician_name: "Dr. Elena Vance, MD",
      department: dept,
      scheduled_time: new Date(dateStr).toISOString(),
      duration_minutes: 30,
      status: "SCHEDULED",
      location_or_link: "Suite 402 - Heart & Vascular Pavilion",
      reason_for_visit: reason || "Routine Follow-up",
    };

    setAppointments([newAppt, ...appointments]);
    setShowBookModal(false);
    setReason("");
  };

  const handleCancel = async (id: string) => {
    try {
      await apiClient.patch(`/user/appointments/${id}/`, { status: "CANCELLED" });
    } catch (e) {}
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
    );
  };

  const upcoming = appointments.filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED");
  const past = appointments.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED");

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-teal-600" />
            Clinical Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage upcoming in-person clinic visits and secure telehealth encounters.
          </p>
        </div>

        <Button
          onClick={() => setShowBookModal(true)}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Book Appointment
        </Button>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Upcoming Visits</h2>

        {upcoming.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center text-xs text-slate-400">
              No upcoming appointments scheduled.
            </CardContent>
          </Card>
        ) : (
          upcoming.map((appt) => (
            <Card key={appt.id} className="bg-white border-slate-200 shadow-sm hover:border-teal-300 transition-all">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
                      {appt.status}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">{appt.department}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{appt.clinician_name}</h3>
                  <p className="text-xs text-slate-600 font-medium">{appt.reason_for_visit}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(appt.scheduled_time).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {appt.location_or_link}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/user/appointments/${appt.id}`}>
                    <Button variant="outline" size="sm" className="text-xs border-slate-200">
                      Details
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Past Appointments */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Past Visits &amp; Encounters</h2>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0 divide-y divide-slate-100">
            {past.map((appt) => (
              <div key={appt.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div>
                  <p className="font-bold text-slate-900">{appt.clinician_name} · {appt.department}</p>
                  <p className="text-slate-500 mt-0.5">{new Date(appt.scheduled_time).toLocaleDateString()} · {appt.reason_for_visit}</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600">
                  {appt.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" /> Book Clinical Appointment
              </h2>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleBook} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Specialty Department</label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 bg-white"
                >
                  <option>Cardiology Outpatient Clinic</option>
                  <option>Heart Failure & Rhythm Clinic</option>
                  <option>Preventive Care & Vitals Triage</option>
                  <option>Echocardiogram Diagnostic Unit</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Requested Date &amp; Time</label>
                <Input
                  type="datetime-local"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason for Consultation</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Blood pressure medication review, exertional fatigue..."
                  className="text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBookModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
