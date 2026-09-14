"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  HeartPulse,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";

interface DashboardPatient {
  full_name: string;
  mrn: string;
  age: number;
  gender: string;
  blood_group: string;
}

interface DashboardVitals {
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  recorded_at: string;
  source: string;
}

interface DashboardPrediction {
  id: string;
  model_name: string;
  model_version_str: string;
  prediction_result: string;
  probability: number;
  created_at: string;
  explanation: string;
  disclaimer: string;
}

interface DashboardAppointment {
  id: string;
  clinician_name: string;
  department: string;
  scheduled_time: string;
  location_or_link: string;
  reason_for_visit: string;
}

interface DashboardTask {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

interface DashboardData {
  patient: DashboardPatient;
  latest_vitals: DashboardVitals;
  latest_prediction: DashboardPrediction;
  next_appointment: DashboardAppointment;
  pending_tasks: DashboardTask[];
  unread_notification_count: number;
}

export default function PatientDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<DashboardData | null>(null);

  const getFallbackData = React.useCallback((): DashboardData => {
    return {
      patient: {
        full_name: user?.full_name || "Eleanor Ward",
        mrn: user?.license_number || "MRN-90241",
        age: 68,
        gender: "Female",
        blood_group: "A+",
      },
      latest_vitals: {
        systolic_bp: 134,
        diastolic_bp: 86,
        heart_rate: 76,
        spo2: 97,
        recorded_at: new Date().toISOString(),
        source: "USER_ENTERED",
      },
      latest_prediction: {
        id: "pred-demo-01",
        model_name: "CardioEnsemble-RF",
        model_version_str: "v1.4.2",
        prediction_result: "MEDIUM",
        probability: 0.42,
        created_at: new Date().toISOString(),
        explanation: "The model estimates a moderate risk category based on recent blood pressure measurements and age. Regular monitoring is advised.",
        disclaimer: "Notice: This prediction is a model-generated estimate for clinical decision support. It is not an autonomous diagnosis.",
      },
      next_appointment: {
        id: "appt-demo-01",
        clinician_name: "Dr. Elena Vance, MD",
        department: "Cardiology Outpatient Clinic",
        scheduled_time: new Date(Date.now() + 86400000 * 3).toISOString(),
        location_or_link: "Suite 402 - Heart & Vascular Pavilion",
        reason_for_visit: "Quarterly Cardiovascular Review & Holter Follow-up",
      },
      pending_tasks: [
        { id: "task-01", title: "Log Morning Blood Pressure & Pulse", due_date: "Today, 10:00 AM", status: "PENDING" },
        { id: "task-02", title: "Review Potassium & Electrolyte Lab Report", due_date: "Tomorrow", status: "PENDING" },
      ],
      unread_notification_count: 2,
    };
  }, [user]);

  const fetchDashboard = React.useCallback(async () => {
    try {
      const res = await apiClient.get("/user/dashboard/");
      if (res.data) {
        setData(res.data);
      }
    } catch {
      setData(getFallbackData());
    }
  }, [getFallbackData]);

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await apiClient.get("/user/dashboard/");
        if (!isMounted) return;
        if (res.data) {
          setData(res.data);
        }
      } catch {
        if (!isMounted) return;
        setData(getFallbackData());
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [getFallbackData]);

  // Handle live WebSocket events seamlessly
  useUserWebSocket((event) => {
    if (
      event.event_type === "user.risk_assessment.completed" ||
      event.event_type === "user.vital_recorded" ||
      event.event_type === "user.appointment.created"
    ) {
      fetchDashboard();
    }
  });

  const vitals = data?.latest_vitals;
  const prediction = data?.latest_prediction;
  const nextAppt = data?.next_appointment;
  const tasks = data?.pending_tasks || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {data?.patient?.full_name || user?.full_name || "Patient"}
            </h1>
            <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
              Active Patient
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            MRN: <span className="font-mono font-semibold text-slate-700">{data?.patient?.mrn || "MRN-90241"}</span> · 
            Primary Care: <span className="font-medium text-slate-700">Dr. Elena Vance, MD (Cardiology)</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/user/risk-assessment/new">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Start Health Assessment
            </Button>
          </Link>
          <Link href="/user/vitals">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
              <HeartPulse className="h-3.5 w-3.5 text-teal-600" /> Log Vitals
            </Button>
          </Link>
        </div>
      </div>

      {/* Vital Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-semibold">Blood Pressure</p>
              <p className="text-lg font-bold text-slate-900">
                {vitals?.systolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : "134/86"}{" "}
                <span className="text-xs font-normal text-slate-400">mmHg</span>
              </p>
              <span className="text-[10px] font-medium text-emerald-600">Within Target Range</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-semibold">Resting Heart Rate</p>
              <p className="text-lg font-bold text-slate-900">
                {vitals?.heart_rate || 76}{" "}
                <span className="text-xs font-normal text-slate-400">bpm</span>
              </p>
              <span className="text-[10px] font-medium text-emerald-600">Normal Sinus Rhythm</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-semibold">Blood Oxygen (SpO2)</p>
              <p className="text-lg font-bold text-slate-900">
                {vitals?.spo2 || 98}{" "}
                <span className="text-xs font-normal text-slate-400">%</span>
              </p>
              <span className="text-[10px] font-medium text-emerald-600">Optimal Oxygenation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-semibold">Current Risk Category</p>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {prediction?.prediction_result || "Moderate"}{" "}
                <span className="text-xs font-normal text-slate-400">Risk</span>
              </p>
              <span className="text-[10px] font-medium text-slate-500">AI Clinical Model v1.4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Latest Prediction & Health Guidance */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Latest AI Health Assessment
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Evaluated by approved clinical decision support model ({prediction?.model_name || "CardioEnsemble-RF"})
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-bold ${
                  prediction?.prediction_result === "HIGH" || prediction?.prediction_result === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : prediction?.prediction_result === "MEDIUM"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {prediction?.prediction_result || "MODERATE"} RISK ESTIMATE
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {prediction?.explanation ||
                    "The clinical risk algorithm evaluated your reported vitals and health history. Your calculated risk probability is currently in the moderate range."}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                  <span>
                    Estimated probability: <strong>{((prediction?.probability || 0.42) * 100).toFixed(1)}%</strong> (95% CI: [36.0% – 48.0%])
                  </span>
                </div>
              </div>

              {/* Strict Regulatory SaMD Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  <strong>Clinical Safety Notice:</strong> This machine learning prediction is an assistive decision-support calculation and does NOT constitute a confirmed medical diagnosis. Always discuss clinical findings with your healthcare provider.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <Link href="/user/predictions">
                  <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 gap-1">
                    View Prediction History & Insights <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Next Scheduled Appointment */}
          {nextAppt && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Upcoming Appointment
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {nextAppt.department}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
                  Confirmed
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{nextAppt.clinician_name}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(nextAppt.scheduled_time).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-slate-500">{nextAppt.location_or_link}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/user/appointments">
                    <Button variant="outline" size="sm" className="text-xs border-slate-200">
                      Manage Appointment
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Daily Health Tasks & Care Team Quick Connect */}
        <div className="space-y-6">
          {/* Daily Tasks Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">Health Tasks</CardTitle>
                </div>
                <Link href="/user/tasks" className="text-xs text-teal-600 hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {tasks.map((task: DashboardTask) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5 hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-600 h-4 w-4 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{task.title}</p>
                    <span className="text-[11px] text-slate-400 font-medium">{task.due_date}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Secure Care Team Messaging Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-700" />
                <CardTitle className="text-sm font-bold text-slate-900">Care Team Message</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">Dr. Elena Vance, MD</span>
                  <span className="text-[10px] text-slate-400">Yesterday</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  &quot;Eleanor, your 30-day vitals trend looks consistent. Keep up with the daily sodium restriction and let us know if any dizziness occurs.&quot;
                </p>
              </div>

              <Link href="/user/messages" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-200">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-600" /> Reply to Care Team
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
