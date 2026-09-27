"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  HeartPulse,
  Layers,
  Lock,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  User,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive";
import { ClinicalWhiteboard, UserSummary } from "@/features/clinical-whiteboard/types/whiteboard";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import { useAuthStore } from "@/features/auth/authStore";

const MOCK_CLINICIAN: UserSummary = {
  id: "u-doc-01",
  username: "dr_sarah_lin",
  email: "sarah.lin@healthnova.ai",
  role: "DOCTOR",
  name: "Dr. Sarah Lin, MD",
};

interface CarePlanMilestone {
  id: string;
  title: string;
  target: string;
  isCompleted: boolean;
  completedAt?: string;
  category: "telemetry" | "medication" | "lifestyle" | "clinic";
}

interface EnhancedCarePlan extends ClinicalWhiteboard {
  progressPercentage: number;
  activeStage: string;
  milestones: CarePlanMilestone[];
  targetVitals: { metric: string; target: string; current: string }[];
  physicianNote: string;
  lastSyncedAgo: string;
}

const DEMO_CARE_PLANS: EnhancedCarePlan[] = [
  {
    id: "wb-01",
    title: "Post-Myocardial Infarction Ambulatory Care Trajectory",
    description: "Multi-week recovery timeline, medication step-down protocols, and ambulatory vitals tracking milestones.",
    type: "CARE_PLAN",
    status: "APPROVED",
    classification: "PHI",
    current_version: 2,
    patient_mrn: "MRN-PA-90241",
    patient_name: "Eleanor Vance",
    owner: MOCK_CLINICIAN,
    created_by: MOCK_CLINICIAN,
    tags: ["Cardiology", "Post-MI", "Rehabilitation"],
    metadata: { protocol: "ACC/AHA-2026" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_locked: true,
    progressPercentage: 65,
    activeStage: "Phase 2: Ambulatory Aerobic Progression",
    physicianNote: "Eleanor's resting ST-segment and heart rate recovery have shown strong stabilization. Proceeding with Phase 2 rehabilitation.",
    lastSyncedAgo: "Just now",
    targetVitals: [
      { metric: "Resting Heart Rate", target: "60-80 BPM", current: "74 BPM" },
      { metric: "Systolic Blood Pressure", target: "< 125 mmHg", current: "122 mmHg" },
      { metric: "Daily Sodium Intake", target: "< 1,800 mg", current: "1,650 mg" },
    ],
    milestones: [
      { id: "m-1", title: "Daily Morning BP Telemetry Logged", target: "7/7 days", isCompleted: true, completedAt: "Today, 08:30 AM", category: "telemetry" },
      { id: "m-2", title: "Cardiac Step-Down Medication Compliance", target: "100% On-Time", isCompleted: true, completedAt: "Today, 09:00 AM", category: "medication" },
      { id: "m-3", title: "Supervised 25-Min Light Aerobic Walk", target: "HR Zone 90-110 BPM", isCompleted: false, category: "lifestyle" },
      { id: "m-4", title: "30-Day Resting ECG Clinic Checkup", target: "Wednesday Session", isCompleted: false, category: "clinic" },
    ],
  },
  {
    id: "wb-02",
    title: "Hypertension & Dietary Sodium Management Pathway",
    description: "Daily sodium restriction guidelines (<2000mg), morning BP logging cadence, and symptom escalation triggers.",
    type: "PATIENT_JOURNEY",
    status: "APPROVED",
    classification: "SENSITIVE",
    current_version: 1,
    patient_mrn: "MRN-PA-90241",
    patient_name: "Eleanor Vance",
    owner: MOCK_CLINICIAN,
    created_by: MOCK_CLINICIAN,
    tags: ["Hypertension", "Nutrition", "Home-Telemetry"],
    metadata: { target_sbp: 120 },
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_locked: false,
    progressPercentage: 80,
    activeStage: "Stage 3: Long-term Dietary Maintenance",
    physicianNote: "Sodium intake consistently within target range. Maintain current Lisinopril dosage with daily hydration monitoring.",
    lastSyncedAgo: "2 mins ago",
    targetVitals: [
      { metric: "Blood Pressure Target", target: "120/80 mmHg", current: "122/80 mmHg" },
      { metric: "Weekly Avg Sodium", target: "< 2,000 mg/day", current: "1,720 mg/day" },
    ],
    milestones: [
      { id: "m-201", title: "Morning & Evening BP Readings Synced", target: "Daily log", isCompleted: true, completedAt: "Yesterday, 07:15 PM", category: "telemetry" },
      { id: "m-202", title: "Low-Sodium Meal Tracker Confirmation", target: "< 2000 mg", isCompleted: true, completedAt: "Yesterday, 08:30 PM", category: "lifestyle" },
      { id: "m-203", title: "Monthly Telehealth Consultation Review", target: "Upcoming Oct 02", isCompleted: false, category: "clinic" },
    ],
  },
  {
    id: "wb-03",
    title: "Cardiopulmonary Exercise & Rehabilitation Plan",
    description: "Supervised light aerobic walking protocols, target heart-rate zones (90-115 bpm), and rest thresholds.",
    type: "CARE_PLAN",
    status: "IN_REVIEW",
    classification: "PUBLIC",
    current_version: 1,
    patient_mrn: "MRN-PA-90241",
    patient_name: "Eleanor Vance",
    owner: MOCK_CLINICIAN,
    created_by: MOCK_CLINICIAN,
    tags: ["Exercise", "Cardio-Rehab", "Telemetry"],
    metadata: { target_hr_zone: "90-115 bpm" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    is_locked: false,
    progressPercentage: 40,
    activeStage: "Phase 1: Supervised Aerobic Conditioning",
    physicianNote: "Reviewing treadmill telemetry logs. Elevation in heart rate during warm-up is well-tolerated with no ischemic symptoms.",
    lastSyncedAgo: "4 mins ago",
    targetVitals: [
      { metric: "Exercise HR Zone", target: "90-115 BPM", current: "98 BPM" },
      { metric: "Recovery Time", target: "< 3 mins to baseline", current: "2.2 mins" },
    ],
    milestones: [
      { id: "m-301", title: "Pre-Exercise Blood Pressure Verification", target: "Resting check", isCompleted: true, completedAt: "Today, 10:00 AM", category: "telemetry" },
      { id: "m-302", title: "20-Min Target Zone Treadmill Session", target: "HR 90-115 BPM", isCompleted: false, category: "lifestyle" },
      { id: "m-303", title: "Post-Activity Hydration & Pulse Recovery", target: "< 85 BPM within 5m", isCompleted: false, category: "telemetry" },
    ],
  },
];

export default function UserWhiteboardsPage() {
  const { user } = useAuthStore();
  const [whiteboards, setWhiteboards] = useState<EnhancedCarePlan[]>(DEMO_CARE_PLANS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [livePing, setLivePing] = useState(14);
  const [selectedDiagram, setSelectedDiagram] = useState<EnhancedCarePlan | null>(null);
  const [showDiscussModal, setShowDiscussModal] = useState(false);
  const [discussPlan, setDiscussPlan] = useState<EnhancedCarePlan | null>(null);
  const [discussMessage, setDiscussMessage] = useState("");
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // WebSocket Live Updates
  const handleWsEvent = useCallback((event: { event_type: string; payload?: Record<string, unknown> }) => {
    if (
      event.event_type === "whiteboard_updated" ||
      event.event_type === "care_plan_version_bump" ||
      event.event_type === "care_milestone_toggled"
    ) {
      const p = event.payload || {};
      const planTitle = String(p.title || "Your Care Trajectory");
      showToast(`⚡ Real-Time Update: ${planTitle} updated by Dr. Sarah Lin.`);
    }
  }, []);

  const { status: wsStatus } = useUserWebSocket(handleWsEvent);

  // Ping jitter simulation
  useEffect(() => {
    const pingTimer = setInterval(() => {
      setLivePing(12 + Math.floor(Math.random() * 8));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  // Toggle milestone completion in real-time
  const handleToggleMilestone = (planId: string, milestoneId: string) => {
    setWhiteboards((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        const updatedMilestones = plan.milestones.map((m) => {
          if (m.id !== milestoneId) return m;
          const nextState = !m.isCompleted;
          return {
            ...m,
            isCompleted: nextState,
            completedAt: nextState ? "Just now" : undefined,
          };
        });

        const completedCount = updatedMilestones.filter((m) => m.isCompleted).length;
        const newPct = Math.round((completedCount / updatedMilestones.length) * 100);

        return {
          ...plan,
          milestones: updatedMilestones,
          progressPercentage: newPct,
          lastSyncedAgo: "Just now",
        };
      })
    );

    showToast(`✓ Milestone status synced with Care Team EHR in ${livePing}ms.`);
  };

  const handleSendCareInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussMessage.trim() || !discussPlan) return;

    setIsSendingInquiry(true);
    setTimeout(() => {
      setIsSendingInquiry(false);
      setShowDiscussModal(false);
      setDiscussMessage("");
      showToast(`✓ Inquiry regarding "${discussPlan.title}" securely delivered to Dr. Sarah Lin, MD.`);
    }, 500);
  };

  const filtered = whiteboards.filter((wb) => {
    const matchesSearch =
      wb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wb.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wb.patient_mrn && wb.patient_mrn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      wb.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "ALL" || wb.type === selectedType;
    const matchesStatus = selectedStatus === "ALL" || wb.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto min-w-0 w-full overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-md">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-6 lg:p-7 shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-emerald-500 to-sky-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 mt-0.5 shadow-2xs">
              <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
                  My Care Plans &amp; Health Journey
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs font-semibold border border-emerald-200 shrink-0 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live EHR Care Sync Active
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-mono border border-sky-200">
                  <Wifi className="h-3 w-3 text-sky-600" />
                  {livePing}ms latency
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Real-time visual care trajectories, recovery milestones, and educational pathways coordinated directly with your cardiology attending team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDiscussPlan(whiteboards[0]);
                setShowDiscussModal(true);
              }}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold gap-1.5 shadow-2xs w-full sm:w-auto"
            >
              <MessageSquare className="h-3.5 w-3.5 text-teal-600" /> Discuss Plan with Cardiologist
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search care plans, protocols, milestones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
            <div className="relative min-w-0">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value="ALL">All Board Types</option>
                <option value="CARE_PLAN">Care Plan</option>
                <option value="PATIENT_JOURNEY">Patient Journey</option>
                <option value="CLINICAL_WORKFLOW">Clinical Workflow</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative min-w-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DRAFT">Draft</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Care Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {filtered.map((plan) => (
          <Card
            key={plan.id}
            className="bg-white border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between overflow-hidden rounded-2xl"
          >
            <div>
              {/* Card Header Top */}
              <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-semibold">
                      {plan.type.replace("_", " ")}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-semibold ${
                        plan.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-purple-50 text-purple-800 border-purple-200"
                      }`}
                    >
                      {plan.status === "APPROVED" ? "✓ Approved by Doctor" : "Under Clinical Review"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.is_locked && (
                      <span title="Locked by Attending Physician" className="text-amber-600">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600">
                      v{plan.current_version}.0
                    </span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {plan.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>

                {/* Progress Bar & Stage */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-teal-600" />
                      {plan.activeStage}
                    </span>
                    <span className="font-mono font-bold text-teal-700">{plan.progressPercentage}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${plan.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Milestones Section */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-teal-600" />
                    Today&apos;s Active Milestones
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Tap checkmark to sync</span>
                </div>

                <div className="space-y-2">
                  {plan.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(plan.id, m.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        m.isCompleted
                          ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                          : "bg-slate-50 hover:bg-teal-50/40 border-slate-200/80 text-slate-800"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          m.isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                            : "border-slate-300 bg-white hover:border-teal-400"
                        }`}
                      >
                        {m.isCompleted && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium leading-tight ${m.isCompleted ? "line-through text-emerald-800 font-normal" : "text-slate-900"}`}>
                          {m.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 flex-wrap">
                          <span className="bg-white/80 px-1.5 py-0.2 rounded border border-slate-200 font-mono">
                            {m.target}
                          </span>
                          {m.completedAt && (
                            <span className="text-emerald-700 font-medium">
                              ✓ {m.completedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attending Physician Note */}
                <div className="mt-3 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                    <span>Cardiology Care Note</span>
                  </div>
                  <p className="text-[11px] text-teal-800 leading-relaxed font-normal">
                    &quot;{plan.physicianNote}&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDiagram(plan)}
                className="flex-1 text-xs gap-1.5 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200"
              >
                <Eye className="h-3.5 w-3.5 text-teal-600" /> View Trajectory
              </Button>
              <Link href={`/user/whiteboards/${plan.id}`} className="flex-1">
                <Button
                  size="sm"
                  className="w-full text-xs gap-1.5 font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  Open Board <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Interactive Visual Care Trajectory Modal */}
      {selectedDiagram && (
        <ResponsiveModal
          isOpen={!!selectedDiagram}
          onClose={() => setSelectedDiagram(null)}
          title={selectedDiagram.title}
          subtitle={`Interactive Recovery Pathway · Coordinated by ${selectedDiagram.owner?.name || "Dr. Sarah Lin, MD"}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Visual Roadmap Steps */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 text-slate-900 space-y-4 shadow-sm">
              <div className="flex items-center justify-between text-xs border-b border-teal-100 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-teal-600 animate-pulse" />
                  <span className="font-bold text-teal-900">Live Recovery Trajectory Roadmap</span>
                </div>
                <span className="text-[11px] text-teal-700 font-mono font-medium">EHR Synced</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                {[
                  { stage: "Stage 1", title: "Acute Stabilization", status: "Completed", icon: CheckCircle2, color: "text-emerald-600" },
                  { stage: "Stage 2", title: "Ambulatory Progression", status: "Active (65%)", icon: Radio, color: "text-amber-600", active: true },
                  { stage: "Stage 3", title: "Cardio Rehab Phase", status: "Upcoming", icon: Target, color: "text-slate-500" },
                  { stage: "Stage 4", title: "Long-term Maintenance", status: "Target", icon: Award, color: "text-slate-400" },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      step.active
                        ? "bg-white border-amber-400 shadow-sm ring-1 ring-amber-400/30"
                        : "bg-white/80 border-slate-200"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{step.stage}</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">{step.title}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px]">
                      <step.icon className={`h-3 w-3 ${step.color} ${step.active ? "animate-pulse" : ""}`} />
                      <span className={`font-semibold ${step.color}`}>{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Vitals Thresholds */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-teal-600" />
                Prescribed Clinical Telemetry Targets
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {selectedDiagram.targetVitals.map((v, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-center space-y-1 shadow-2xs">
                    <p className="text-[11px] text-slate-500 font-medium">{v.metric}</p>
                    <p className="text-xs font-bold text-teal-800">Target: {v.target}</p>
                    <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block font-semibold">
                      Current: {v.current}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-600" /> Verified by Cardiology Protocol
              </span>
              <Button
                size="sm"
                onClick={() => setSelectedDiagram(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Close Pathway
              </Button>
            </div>
          </div>
        </ResponsiveModal>
      )}

      {/* Care Team Inquiry Modal */}
      <ResponsiveModal
        isOpen={showDiscussModal}
        onClose={() => setShowDiscussModal(false)}
        title="Discuss Care Plan with Attending Doctor"
        subtitle={`Message directly to ${discussPlan?.owner?.name || "Dr. Sarah Lin, MD"}`}
        maxWidth="md"
      >
        <form onSubmit={handleSendCareInquiry} className="space-y-4">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
            <p className="font-bold">Referenced Care Plan:</p>
            <p className="text-[11px] text-teal-800">{discussPlan?.title}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Your Inquiry or Question</label>
            <textarea
              value={discussMessage}
              onChange={(e) => setDiscussMessage(e.target.value)}
              placeholder="E.g., I wanted to ask about the walking duration target for next week..."
              rows={4}
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-teal-600 resize-none font-normal"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-600" /> Direct Encrypted Line
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDiscussModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSendingInquiry}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
              >
                {isSendingInquiry ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Transmitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Send to Doctor
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}

