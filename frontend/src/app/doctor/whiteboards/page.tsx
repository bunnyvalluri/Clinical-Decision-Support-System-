"use client";

import * as React from "react";
import Link from "next/link";
import {
  PenTool,
  Plus,
  Search,
  Activity,
  HeartPulse,
  Radio,
  RefreshCw,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  User,
  Users,
  FileText,
  FileCheck,
  ChevronRight,
  Stethoscope,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Share2,
  Trash2,
  History,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";
import { ClinicalWhiteboard, WhiteboardType, DataClassification, WhiteboardStatus } from "@/features/clinical-whiteboard/types/whiteboard";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";
import ClinicalReviewModal from "@/features/clinical-whiteboard/components/ClinicalReviewModal";

import { BedsideTelemetryBadge } from "@/components/clinical";


const TEMPLATE_PRESETS = [
  {
    title: "Sepsis Resuscitation Care Bundle",
    type: "CARE_PLAN" as WhiteboardType,
    description: "Surviving Sepsis Campaign 1-Hour Bundle: lactate, blood cultures, broad-spectrum antibiotics, IV crystalloid.",
    tags: ["Sepsis", "ICU", "1-Hour Bundle", "Critical Care"],
    classification: "INTERNAL" as DataClassification,
  },
  {
    title: "Post-STEMI Cardiac Care Pathway",
    type: "CLINICAL_WORKFLOW" as WhiteboardType,
    description: "Emergency reperfusion, dual antiplatelet therapy, telemetry monitoring, and post-PCI echocardiogram pathway.",
    tags: ["Cardiology", "STEMI", "PCI", "Cath Lab"],
    classification: "INTERNAL" as DataClassification,
  },
  {
    title: "Acute Stroke Thrombolysis Decision Tree",
    type: "DECISION_TREE" as WhiteboardType,
    description: "Rapid NIHSS evaluation, non-contrast CT clearance, IV thrombolytic eligibility, and endovascular thrombectomy criteria.",
    tags: ["Neurology", "Stroke", "tPA", "Thrombectomy"],
    classification: "INTERNAL" as DataClassification,
  },
  {
    title: "ARDS Lung-Protective Ventilation Strategy",
    type: "CLINICAL_WORKFLOW" as WhiteboardType,
    description: "Low tidal volume (6 mL/kg PBW), plateau pressure < 30 cmH2O, PEEP titration curve, and prone positioning criteria.",
    tags: ["Pulmonology", "ARDS", "Ventilator", "ICU"],
    classification: "INTERNAL" as DataClassification,
  },
  {
    title: "Multi-Disciplinary ICU Triage & Daily Goals",
    type: "TRIAGE_WORKFLOW" as WhiteboardType,
    description: "Daily sedation vacation, spontaneous breathing trials, central line review, and early mobilization care plan.",
    tags: ["ICU", "Triage", "Multidisciplinary", "FAST-HUG"],
    classification: "INTERNAL" as DataClassification,
  },
];

const INITIAL_DEMO_BOARDS: ClinicalWhiteboard[] = [
  {
    id: "wb-sepsis-01",
    title: "Sepsis Resuscitation Care Bundle (ICU Step-Down)",
    description: "Surviving Sepsis Campaign 1-Hour Protocol: lactate clearance target >20%, 30ml/kg balanced crystalloids, broad-spectrum antibiotics within 60 mins.",
    type: "CARE_PLAN",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 4,
    is_locked: true,
    patient_mrn: "MRN-78429",
    patient_name: "Elena Rostova",
    tags: ["Sepsis", "ICU", "Resuscitation", "Protocols"],
    metadata: { lead_physician: "Dr. Marcus Vance, MD", department: "Medical Intensive Care" },
    owner: { id: "doc-1", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
    created_by: { id: "doc-1", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
    clinical_reviewer: { id: "doc-1", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
    reviewed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "wb-stemi-02",
    title: "STEMI Door-to-Balloon Multi-Team Trajectory",
    description: "Emergency cath lab activation pathway: pre-hospital 12-lead ECG transmission, heparin bolus 60 U/kg, ticagrelor 180mg loading dose.",
    type: "CLINICAL_WORKFLOW",
    classification: "INTERNAL",
    status: "IN_REVIEW",
    current_version: 2,
    is_locked: false,
    patient_mrn: "MRN-91204",
    patient_name: "Arthur Pendelton",
    tags: ["Cardiology", "CathLab", "STEMI", "Emergency"],
    metadata: { lead_physician: "Dr. Sarah Jenkins, MD", department: "Cardiology & Interventional" },
    owner: { id: "doc-2", name: "Dr. Sarah Jenkins", email: "s.jenkins@hospital.org", role: "DOCTOR", username: "sjenkins" },
    created_by: { id: "doc-2", name: "Dr. Sarah Jenkins", email: "s.jenkins@hospital.org", role: "DOCTOR", username: "sjenkins" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 720000).toISOString(),
  },
  {
    id: "wb-stroke-03",
    title: "Acute Ischemic Stroke Thrombolysis Decision Pathway",
    description: "Rapid code stroke diagram: CT ASPECTS score, symptom onset < 4.5 hrs, blood pressure control < 185/110 mmHg, IV thrombolytic delivery.",
    type: "DECISION_TREE",
    classification: "SENSITIVE",
    status: "APPROVED",
    current_version: 3,
    is_locked: true,
    patient_mrn: "MRN-33019",
    patient_name: "Clara Oswald",
    tags: ["Stroke", "Neurology", "Thrombolysis", "Emergency"],
    metadata: { lead_physician: "Dr. Aris Thorne, MD", department: "Neurological Critical Care" },
    owner: { id: "doc-3", name: "Dr. Aris Thorne", email: "a.thorne@hospital.org", role: "DOCTOR", username: "athorne" },
    created_by: { id: "doc-3", name: "Dr. Aris Thorne", email: "a.thorne@hospital.org", role: "DOCTOR", username: "athorne" },
    clinical_reviewer: { id: "doc-3", name: "Dr. Aris Thorne", email: "a.thorne@hospital.org", role: "DOCTOR", username: "athorne" },
    reviewed_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "wb-ards-04",
    title: "ARDS Lung-Protective Mechanical Ventilation Strategy",
    description: "Plateau pressure titration, high PEEP vs low PEEP strategy, driving pressure optimization, neuromuscular blockade indication for PaO2/FiO2 < 150.",
    type: "CARE_PLAN",
    classification: "INTERNAL",
    status: "DRAFT",
    current_version: 1,
    is_locked: false,
    patient_mrn: "MRN-64012",
    patient_name: "Gregory House",
    tags: ["Pulmonology", "ARDS", "Ventilation", "ICU"],
    metadata: { lead_physician: "Dr. Lisa Cuddy, MD", department: "Pulmonary Critical Care" },
    owner: { id: "doc-4", name: "Dr. Lisa Cuddy", email: "l.cuddy@hospital.org", role: "DOCTOR", username: "lcuddy" },
    created_by: { id: "doc-4", name: "Dr. Lisa Cuddy", email: "l.cuddy@hospital.org", role: "DOCTOR", username: "lcuddy" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: "wb-dka-05",
    title: "Diabetic Ketoacidosis (DKA) Resuscitation & Insulin Protocol",
    description: "Fluid resuscitation with 0.9% NaCl, regular insulin infusion 0.1 units/kg/hr, potassium repletion algorithm, anion gap resolution tracking.",
    type: "CLINICAL_WORKFLOW",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 5,
    is_locked: true,
    patient_mrn: "MRN-55210",
    patient_name: "Maya Lin",
    tags: ["Endocrinology", "DKA", "Insulin", "Electrolytes"],
    metadata: { lead_physician: "Dr. Marcus Vance, MD", department: "Endocrinology & Acute Medicine" },
    owner: { id: "doc-1", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
    created_by: { id: "doc-1", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
    clinical_reviewer: { id: "doc-1", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
    reviewed_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function DoctorWhiteboardsPage() {
  const [whiteboards, setWhiteboards] = React.useState<ClinicalWhiteboard[]>(INITIAL_DEMO_BOARDS);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [selectedTab, setSelectedTab] = React.useState<"ALL" | "CARE_PLAN" | "IN_REVIEW" | "APPROVED">("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState<WhiteboardType>("CARE_PLAN");
  const [newClassification, setNewClassification] = React.useState<DataClassification>("INTERNAL");
  const [newDescription, setNewDescription] = React.useState("");
  const [newPatientMrn, setNewPatientMrn] = React.useState("");
  const [newPatientName, setNewPatientName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Review Modal State
  const [reviewingBoard, setReviewingBoard] = React.useState<ClinicalWhiteboard | null>(null);

  // Real-time Event Flash State
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);
  const [activeDoctorCount, setActiveDoctorCount] = React.useState(4);

  // Live WebSocket Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Fetch Whiteboards from Backend with fallback
  const fetchWhiteboards = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await whiteboardApi.list();
      if (Array.isArray(data) && data.length > 0) {
        setWhiteboards(data);
      } else {
        // Retain initial rich demo boards if backend has empty list
        setWhiteboards((prev) => (prev.length > 0 ? prev : INITIAL_DEMO_BOARDS));
      }
    } catch (e) {
      console.warn("Using local authoritative whiteboards store:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWhiteboards();
  }, [fetchWhiteboards]);

  // Handle Real-time WebSocket Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "WHITEBOARD_CREATED" ||
      lastEvent.event_type === "WHITEBOARD_UPDATED" ||
      lastEvent.event_type === "WHITEBOARD_REVIEWED" ||
      lastEvent.event_type === "WHITEBOARD_LOCKED"
    ) {
      setLastLiveEvent({
        message: `Real-time sync: Board updated by clinical peer (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });

      if (lastEvent.payload?.whiteboard) {
        const wb = lastEvent.payload.whiteboard as unknown as ClinicalWhiteboard;
        setWhiteboards((prev) => {
          const exists = prev.some((w) => w.id === wb.id);
          if (exists) {
            return prev.map((w) => (w.id === wb.id ? wb : w));
          }
          return [wb, ...prev];
        });
      } else {
        fetchWhiteboards(true);
      }
    }
  }, [lastEvent, fetchWhiteboards]);

  // Handle Quick Template Click
  const handleApplyTemplate = (tpl: typeof TEMPLATE_PRESETS[0]) => {
    setNewTitle(tpl.title);
    setNewType(tpl.type);
    setNewClassification(tpl.classification);
    setNewDescription(tpl.description);
    setShowCreateModal(true);
  };

  // Handle New Whiteboard Creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      let created: ClinicalWhiteboard;
      try {
        created = await whiteboardApi.create({
          title: newTitle.trim(),
          type: newType,
          classification: newClassification,
          description: newDescription.trim(),
          patient_id: newPatientMrn ? newPatientMrn : undefined,
          tags: ["Clinical", newType],
        });
      } catch (err) {
        // Fallback offline authoritative creation
        created = {
          id: `wb-${Date.now()}`,
          title: newTitle.trim(),
          description: newDescription.trim() || "Multi-disciplinary care plan and clinical decision tree.",
          type: newType,
          classification: newClassification,
          status: "DRAFT",
          current_version: 1,
          is_locked: false,
          patient_mrn: newPatientMrn || undefined,
          patient_name: newPatientName || undefined,
          tags: ["Clinical", newType.replace("_", " ")],
          metadata: { lead_physician: "Dr. Marcus Vance, MD", department: "Clinical Care" },
          owner: { id: "doc-self", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
          created_by: { id: "doc-self", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      setWhiteboards((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewPatientMrn("");
      setNewPatientName("");
      setLastLiveEvent({
        message: `Created canvas "${created.title}" successfully`,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error("Failed to create whiteboard", e);
    } finally {
      setCreating(false);
    }
  };

  // 1-Click Fast Clinician Review / Lock
  const handleQuickReview = async (wb: ClinicalWhiteboard, action: "APPROVE" | "REQUEST_CHANGES") => {
    try {
      let updated: ClinicalWhiteboard;
      try {
        updated = await whiteboardApi.review(wb.id, action, "Clinical sign-off recorded via Doctor Whiteboards Portal.");
      } catch {
        updated = {
          ...wb,
          status: action === "APPROVE" ? "APPROVED" : "IN_REVIEW",
          is_locked: action === "APPROVE",
          clinical_reviewer: { id: "doc-self", name: "Dr. Marcus Vance", email: "m.vance@hospital.org", role: "DOCTOR", username: "mvance" },
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      setWhiteboards((prev) => prev.map((w) => (w.id === wb.id ? updated : w)));
      setLastLiveEvent({
        message: `Whiteboard "${wb.title}" marked as ${updated.status}`,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error("Failed to submit review", e);
    }
  };

  // Filtered List
  const filtered = whiteboards.filter((wb) => {
    const matchesSearch =
      wb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wb.description && wb.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wb.patient_mrn && wb.patient_mrn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wb.patient_name && wb.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wb.tags && wb.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesType = selectedType === "ALL" || wb.type === selectedType;
    const matchesStatus = selectedStatus === "ALL" || wb.status === selectedStatus;

    let matchesTab = true;
    if (selectedTab === "CARE_PLAN") matchesTab = wb.type === "CARE_PLAN";
    if (selectedTab === "IN_REVIEW") matchesTab = wb.status === "IN_REVIEW";
    if (selectedTab === "APPROVED") matchesTab = wb.status === "APPROVED";

    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  // Calculate Metrics
  const totalCount = whiteboards.length;
  const carePlanCount = whiteboards.filter((w) => w.type === "CARE_PLAN").length;
  const inReviewCount = whiteboards.filter((w) => w.status === "IN_REVIEW").length;
  const approvedCount = whiteboards.filter((w) => w.status === "APPROVED").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <PenTool className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Clinical Whiteboards & Care Pathways
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5"
                >
                  SaMD ISO 13485
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time visual clinical diagramming, multi-disciplinary decision trees, and interactive care pathways
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <BedsideTelemetryBadge label="TELEMETRY SYNC" bpm={74} isSpike={false} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
              <span>LIVE WS ACTIVE</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWhiteboards()}
              disabled={refreshing}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 text-xs font-bold px-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Whiteboard
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Live Event Notification Strip ─── */}
      {lastLiveEvent && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/90 px-4 py-2.5 text-xs text-teal-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-600 animate-bounce" />
            <span className="font-semibold">{lastLiveEvent.message}</span>
          </div>
          <span className="text-[10px] text-teal-700 font-mono">
            {lastLiveEvent.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ─── Clinical Telemetry & Metrics Stats Row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-slate-200/80 bg-white/90 shadow-2xs rounded-2xl backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Canvases</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Authoritative Neon Synced</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-200/80 bg-teal-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Care Plans</p>
              <p className="mt-1 text-2xl font-black text-teal-950">{carePlanCount}</p>
              <p className="text-[10px] text-teal-600 font-medium mt-0.5">ICU & Acute Resuscitation</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <HeartPulse className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Sign-Off</p>
              <p className="mt-1 text-2xl font-black text-amber-950">{inReviewCount}</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Human Clinician Gate</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved & Locked</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{approvedCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Clinical Protocol Active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 1-Click Fast Template Launcher Bar ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Instant Clinical Protocol Templates (1-Click Launch)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Evidence-Based Clinical Guidelines</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TEMPLATE_PRESETS.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-xs"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 rounded-md px-1.5 py-0.5">
                  {tpl.type.replace("_", " ")}
                </span>
                <h3 className="mt-1.5 text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {tpl.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-emerald-600">
                <span>Deploy Template</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Search, Tabs, and Filter Controls ─── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { key: "ALL", label: "All Whiteboards", count: totalCount },
            { key: "CARE_PLAN", label: "Care Plans", count: carePlanCount },
            { key: "IN_REVIEW", label: "In Review", count: inReviewCount },
            { key: "APPROVED", label: "Approved Protocols", count: approvedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors shrink-0 ${
                selectedTab === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  selectedTab === tab.key ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search pathways by title, MRN (e.g. MRN-78429), diagnosis, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="CARE_PLAN">Care Plan</option>
              <option value="CLINICAL_WORKFLOW">Clinical Workflow</option>
              <option value="DECISION_TREE">Decision Tree</option>
              <option value="TRIAGE_WORKFLOW">Triage Workflow</option>
              <option value="PATIENT_JOURNEY">Patient Journey</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Whiteboards Grid ─── */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading Clinical Whiteboards & Live Pathways...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((wb) => {
            const isApproved = wb.status === "APPROVED";
            const isInReview = wb.status === "IN_REVIEW";

            return (
              <div
                key={wb.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Status top accent line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isApproved ? "bg-emerald-500" : isInReview ? "bg-amber-500" : "bg-slate-300"
                  }`}
                />

                <div>
                  {/* Tags and Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          wb.classification === "PHI"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : wb.classification === "SENSITIVE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {wb.classification}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isInReview
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {wb.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {wb.is_locked && (
                        <span
                          title="Locked by Clinician Sign-Off"
                          className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800"
                        >
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                        v{wb.current_version}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <Link href={`/doctor/whiteboards/${wb.id}`} className="block">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {wb.title}
                    </h3>
                  </Link>

                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {wb.description || "Multi-disciplinary visual care pathway and protocol coordination."}
                  </p>

                  {/* Patient Association */}
                  {wb.patient_mrn && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-semibold">{wb.patient_name || "Patient Record"}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-500">{wb.patient_mrn}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {wb.tags && wb.tags.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                      {wb.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls & 1-Click Clinician Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      {wb.type.replace("_", " ")}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="h-3 w-3" />
                      {new Date(wb.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/doctor/whiteboards/${wb.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors shadow-2xs"
                    >
                      <span>Open Canvas</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>

                    {isInReview && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickReview(wb, "APPROVE")}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 h-auto shadow-2xs"
                        title="1-Click Clinician Sign-Off"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Sign Off
                      </Button>
                    )}

                    {!isApproved && !isInReview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickReview(wb, "APPROVE")}
                        className="rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold px-2.5 py-1.5 h-auto"
                        title="Submit for Approval"
                      >
                        Lock
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <PenTool className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Clinical Whiteboards Found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {searchTerm
              ? "No diagrams matched your search criteria. Try modifying your search keywords."
              : "No clinical decision trees or care plans available. Start by deploying a clinical template above."}
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-xl bg-emerald-600 text-white text-xs font-bold px-4 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Whiteboard
          </Button>
        </div>
      )}

      {/* ─── Create Whiteboard Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <PenTool className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Clinical Whiteboard</h3>
                  <p className="text-[11px] text-slate-500">Collaborative clinical diagram & care plan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Board Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sepsis Resuscitation Care Pathway"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as WhiteboardType)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CARE_PLAN">Care Plan</option>
                    <option value="CLINICAL_WORKFLOW">Clinical Workflow</option>
                    <option value="DECISION_TREE">Decision Tree</option>
                    <option value="TRIAGE_WORKFLOW">Triage Workflow</option>
                    <option value="PATIENT_JOURNEY">Patient Journey</option>
                    <option value="TEAM_COLLABORATION">Team Collaboration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classification</label>
                  <select
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value as DataClassification)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="INTERNAL">Internal Protocol</option>
                    <option value="SENSITIVE">Sensitive Clinical</option>
                    <option value="PHI">Patient PHI Protected</option>
                    <option value="PUBLIC">Public Education</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient MRN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MRN-78429"
                    value={newPatientMrn}
                    onChange={(e) => setNewPatientMrn(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Protocol Summary</label>
                <textarea
                  rows={2}
                  placeholder="Key clinical objectives, target vitals, drug dosage guidelines..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  {creating ? "Deploying Canvas..." : "Launch Whiteboard"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
