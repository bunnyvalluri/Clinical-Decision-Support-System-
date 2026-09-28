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
  Bed,
  Flame,
  Check,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { whiteboardApi } from "@/features/clinical-whiteboard/services/whiteboardApi";
import {
  ClinicalWhiteboard,
  WhiteboardType,
  DataClassification,
  WhiteboardStatus,
} from "@/features/clinical-whiteboard/types/whiteboard";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import ClinicalReviewModal from "@/features/clinical-whiteboard/components/ClinicalReviewModal";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Whiteboard Command Bar
 */
function WhiteboardEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Phosphor background grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
      ctx.lineWidth = 0.75;
      const gridSize = 12;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG Waveform
      ctx.strokeStyle = isSpike ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 1.75;
      ctx.shadowColor = isSpike ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.7)";
      ctx.shadowBlur = 4;

      ctx.beginPath();
      const points = 160;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * width;
        const progress = (i + step) % 50;

        let yOffset = 0;
        if (progress > 18 && progress < 21) {
          yOffset = -5; // P-wave
        } else if (progress >= 21 && progress <= 23) {
          yOffset = 3; // Q-wave
        } else if (progress > 23 && progress < 27) {
          yOffset = isSpike ? -26 : -18; // R-wave spike
        } else if (progress >= 27 && progress <= 29) {
          yOffset = 6; // S-wave
        } else if (progress > 32 && progress < 39) {
          yOffset = -8; // T-wave
        } else {
          yOffset = (Math.random() - 0.5) * 1.5; // Baseline noise
        }

        const y = midY + yOffset;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      step = (step + 0.6) % 50;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bpm, isSpike]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] p-1 shadow-inner">
      <canvas ref={canvasRef} width={220} height={44} className="block w-full h-10" />
      <div className="absolute top-1 right-1.5 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
        <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
        <span>LEAD II: {bpm} BPM</span>
      </div>
    </div>
  );
}

/**
 * Pre-configured Nursing & Triage Pathway Templates
 */
const NURSE_PATHWAY_TEMPLATES = [
  {
    id: "tpl-esi-triage",
    title: "Emergency ESI 1–5 Rapid Triage Protocol",
    description: "Emergency Severity Index algorithmic branching, vital signs boundaries, and STAT physician escalation pathways.",
    type: "TRIAGE_WORKFLOW" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    tags: ["ESI-1", "Emergency", "Resuscitation", "STAT"],
    badge: "ER Standard",
  },
  {
    id: "tpl-sepsis-bundle",
    title: "Bedside Sepsis Hour-1 Bundle & MAP Titration",
    description: "SSC 2024 compliance: blood cultures prior to IV antibiotics, 30 mL/kg crystalloid bolus, and vasopressor titration targeting MAP ≥ 65.",
    type: "CARE_PLAN" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    tags: ["Sepsis", "ICU", "MAP", "Lactate", "NEWS2"],
    badge: "Critical Care",
  },
  {
    id: "tpl-shift-handover",
    title: "RN Shift Handover & SBAR Continuity Protocol",
    description: "Inter-shift SBAR communication protocol, high-alert medication double-check verification, and code status confirmation.",
    type: "TEAM_COLLABORATION" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    tags: ["SBAR", "Handover", "Patient Safety", "High-Alert Meds"],
    badge: "Patient Safety",
  },
  {
    id: "tpl-fall-prevention",
    title: "Inpatient Fall Risk & Post-Fall Assessment Protocol",
    description: "Morse Fall Scale assessment, bed alarm protocol, assisted ambulation tiering, and post-fall neurological evaluation.",
    type: "CLINICAL_WORKFLOW" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    tags: ["Fall Risk", "Morse Scale", "Bed Alarm", "Post-Fall"],
    badge: "Med-Surg",
  },
  {
    id: "tpl-acs-pathway",
    title: "Bedside Chest Pain / Acute Coronary Syndrome Pathway",
    description: "10-minute 12-lead ECG protocol, continuous Lead II telemetry monitoring, serial troponin draws, and cath-lab activation triggers.",
    type: "CARE_PLAN" as WhiteboardType,
    classification: "INTERNAL" as DataClassification,
    tags: ["STEMI", "NSTEMI", "Troponin", "Telemetry", "Cath Lab"],
    badge: "Telemetry",
  },
];

const INITIAL_NURSE_WHITEBOARDS: ClinicalWhiteboard[] = [
  {
    id: "wb-nr-01",
    title: "Ward 4B Bedside Sepsis Resuscitation & MAP Protocol",
    description: "Interactive real-time clinical care pathway for managing severe sepsis, antibiotic delivery timing, and ICU transfer triggers.",
    type: "CARE_PLAN",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 4,
    is_locked: false,
    owner: { id: "u-1", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN (BSN, CCRN)" },
    created_by: { id: "u-1", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN (BSN, CCRN)" },
    clinical_reviewer: { id: "u-doc-1", username: "gvance", email: "gvance@hospital.org", role: "DOCTOR", name: "Dr. Gregory Vance, MD (Critical Care)" },
    reviewed_at: "2026-09-28T08:15:00Z",
    review_notes: "Validated against SSC 2024 Guidelines. Approved for immediate bedside use on Ward 4B and Step-Down.",
    patient_name: "Elena Rostova",
    patient_mrn: "MRN-89421",
    tags: ["Sepsis", "Ward-4B", "ICU", "NEWS2-9", "Vasopressors"],
    metadata: { unit: "ICU", room: "ICU-04", activeNurses: 3 },
    created_at: "2026-09-26T10:00:00Z",
    updated_at: "2026-09-28T08:15:00Z",
  },
  {
    id: "wb-nr-02",
    title: "Emergency Department ESI Level 1–2 Rapid Triage Map",
    description: "Real-time decision tree for immediate trauma bay activation, stroke code alerts, and acute STEMI door-to-balloon synchronization.",
    type: "TRIAGE_WORKFLOW",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 6,
    is_locked: false,
    owner: { id: "u-2", username: "arivera", email: "arivera@hospital.org", role: "NURSE", name: "Alex Rivera, RN (CEN)" },
    created_by: { id: "u-2", username: "arivera", email: "arivera@hospital.org", role: "NURSE", name: "Alex Rivera, RN (CEN)" },
    clinical_reviewer: { id: "u-doc-2", username: "lmorales", email: "lmorales@hospital.org", role: "DOCTOR", name: "Dr. Lisa Morales, MD" },
    reviewed_at: "2026-09-27T14:30:00Z",
    tags: ["ED", "ESI-Triage", "Trauma", "Code-Blue"],
    metadata: { unit: "Emergency", traumaBays: 4 },
    created_at: "2026-09-25T11:00:00Z",
    updated_at: "2026-09-27T14:30:00Z",
  },
  {
    id: "wb-nr-03",
    title: "Post-Cath Telemetry Bedside Observation & Groin Site Care",
    description: "Post-PCI monitoring protocol: distal pulse palpation, hematoma surveillance, ACT titration, and bedrest timeline.",
    type: "CARE_PLAN",
    classification: "INTERNAL",
    status: "IN_REVIEW",
    current_version: 2,
    is_locked: false,
    owner: { id: "u-1", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN (BSN, CCRN)" },
    created_by: { id: "u-1", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN (BSN, CCRN)" },
    patient_name: "Arthur Pendleton",
    patient_mrn: "MRN-67210",
    tags: ["Telemetry", "Post-Cath", "Groin Site", "Heparin"],
    metadata: { unit: "Telemetry 3B", room: "3B-212" },
    created_at: "2026-09-27T16:00:00Z",
    updated_at: "2026-09-28T07:45:00Z",
  },
  {
    id: "wb-nr-04",
    title: "Night-to-Day Shift RN Handover & SBAR Board — Ward 3",
    description: "Collaborative whiteboard tracking critical pending labs, IV infusions, telemetry alarm histories, and DNR/DNI orders for 18 floor beds.",
    type: "TEAM_COLLABORATION",
    classification: "INTERNAL",
    status: "APPROVED",
    current_version: 8,
    is_locked: false,
    owner: { id: "u-3", username: "kpatel", email: "kpatel@hospital.org", role: "NURSE", name: "Kavita Patel, RN (Charge Nurse)" },
    created_by: { id: "u-3", username: "kpatel", email: "kpatel@hospital.org", role: "NURSE", name: "Kavita Patel, RN (Charge Nurse)" },
    tags: ["SBAR", "Shift-Handover", "Ward-3", "Floor-Census"],
    metadata: { bedsTracked: 18, shift: "0700-1900 Day Shift" },
    created_at: "2026-09-28T06:30:00Z",
    updated_at: "2026-09-28T07:00:00Z",
  },
];

export default function NurseWhiteboardsPage() {
  const { status: wsStatus } = useUserWebSocket();
  const [whiteboards, setWhiteboards] = React.useState<ClinicalWhiteboard[]>(INITIAL_NURSE_WHITEBOARDS);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newType, setNewType] = React.useState<WhiteboardType>("TRIAGE_WORKFLOW");
  const [newClassification, setNewClassification] = React.useState<DataClassification>("INTERNAL");
  const [newPatientMRN, setNewPatientMRN] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Review Modal State
  const [reviewingWb, setReviewingWb] = React.useState<ClinicalWhiteboard | null>(null);
  const [notificationMsg, setNotificationMsg] = React.useState<string | null>(null);

  // Template Launcher
  const handleLaunchTemplate = async (template: (typeof NURSE_PATHWAY_TEMPLATES)[0]) => {
    try {
      setLoading(true);
      const newWb: ClinicalWhiteboard = {
        id: `wb-nr-${Date.now()}`,
        title: `${template.title} — Unit Active Instance`,
        description: template.description,
        type: template.type,
        classification: template.classification,
        status: "DRAFT",
        current_version: 1,
        is_locked: false,
        owner: { id: "u-nurse", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN" },
        created_by: { id: "u-nurse", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN" },
        tags: [...template.tags, "Live Instance"],
        metadata: { templateSource: template.id, createdAt: new Date().toISOString() },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setWhiteboards((prev) => [newWb, ...prev]);
      setNotificationMsg(`✅ Launched clinical pathway: "${template.title}". Ready for real-time collaborative editing.`);
      setTimeout(() => setNotificationMsg(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Create Whiteboard Form
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const created: ClinicalWhiteboard = {
        id: `wb-nr-${Date.now()}`,
        title: newTitle,
        description: newDescription || "Nursing bedside care pathway & clinical protocol diagram.",
        type: newType,
        classification: newClassification,
        status: "DRAFT",
        current_version: 1,
        is_locked: false,
        owner: { id: "u-nurse", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN" },
        created_by: { id: "u-nurse", username: "sjenkins", email: "sjenkins@hospital.org", role: "NURSE", name: "Sarah Jenkins, RN" },
        patient_mrn: newPatientMRN || undefined,
        tags: [newType.replace("_", "-").toLowerCase(), "Nurse-Initiated"],
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewPatientMRN("");
      setWhiteboards((prev) => [created, ...prev]);
      setNotificationMsg(`✅ Created new pathway: "${created.title}".`);
      setTimeout(() => setNotificationMsg(null), 5000);
    } catch (e) {
      console.error("Failed to create pathway", e);
    } finally {
      setCreating(false);
    }
  };

  // Review & Sign-Off Submit
  const handleReviewSubmitted = (updatedWb: ClinicalWhiteboard) => {
    setWhiteboards((prev) => prev.map((w) => (w.id === updatedWb.id ? updatedWb : w)));
    setReviewingWb(null);
    setNotificationMsg(`✅ Clinical sign-off recorded for "${updatedWb.title}". Status: ${updatedWb.status}.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Filtered List
  const filteredWhiteboards = React.useMemo(() => {
    return whiteboards.filter((w) => {
      if (selectedType !== "ALL" && w.type !== selectedType) return false;
      if (selectedStatus !== "ALL" && w.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = w.title.toLowerCase().includes(q);
        const matchDesc = w.description?.toLowerCase().includes(q);
        const matchOwner = w.owner.name.toLowerCase().includes(q);
        const matchMrn = w.patient_mrn?.toLowerCase().includes(q);
        const matchTags = w.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchOwner && !matchMrn && !matchTags) return false;
      }
      return true;
    });
  }, [whiteboards, selectedType, selectedStatus, search]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Dynamic Toast Notification */}
      {notificationMsg && (
        <div className="bg-sky-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-between shadow-md sticky top-0 z-50 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <PenTool className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Triage Protocols &amp; Care Pathways
                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-semibold">
                    Real-Time Collab
                  </Badge>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time interactive triage algorithms, bedside care plans, shift handover SBAR boards, and nurse sign-off.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <WhiteboardEcgMonitor bpm={78} isSpike={false} />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{wsStatus === "connected" ? "Live Collab Active" : "Socket Synchronized"}</span>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Triage Pathway
            </Button>
          </div>
        </div>

        {/* 1-Click Nursing Clinical Template Launchers */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              Evidence-Based Nursing Protocol Templates (1-Click Launch)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {NURSE_PATHWAY_TEMPLATES.map((tpl) => (
              <Card
                key={tpl.id}
                className="bg-white border-slate-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => handleLaunchTemplate(tpl)}
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-semibold bg-sky-50 text-sky-700 border-sky-200">
                      {tpl.badge}
                    </Badge>
                    <Play className="h-3.5 w-3.5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {tpl.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tpl.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] text-slate-600 font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters & Navigation Tabs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Category:
            </span>
            {[
              { id: "ALL", label: "All Pathways" },
              { id: "TRIAGE_WORKFLOW", label: "Triage & ER" },
              { id: "CARE_PLAN", label: "Bedside Care Plans" },
              { id: "TEAM_COLLABORATION", label: "Shift Handovers" },
              { id: "CLINICAL_WORKFLOW", label: "Clinical Workflows" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedType === tab.id
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pathway, patient MRN, nurse, tags…"
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 h-9"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved &amp; Active</option>
                <option value="IN_REVIEW">Under Clinical Review</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Whiteboards Pathway Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWhiteboards.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <PenTool className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No pathways matched filters</h3>
              <p className="text-xs text-slate-400 mt-1">Try resetting the category filter or searching for another term.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedType("ALL");
                  setSelectedStatus("ALL");
                  setSearch("");
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredWhiteboards.map((wb) => {
              const isApproved = wb.status === "APPROVED";
              const isInReview = wb.status === "IN_REVIEW";

              return (
                <div
                  key={wb.id}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2.5">
                    {/* Header Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] font-bold border ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isInReview
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {wb.status}
                          </Badge>

                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                            {wb.type.replace("_", " ")}
                          </Badge>

                          <span className="text-xs text-slate-400">v{wb.current_version}</span>
                        </div>

                        <Link
                          href={`/nurse/whiteboards/${wb.id}`}
                          className="font-bold text-slate-900 text-base group-hover:text-sky-600 transition-colors line-clamp-1 block pt-1"
                        >
                          {wb.title}
                        </Link>
                      </div>

                      <Link href={`/nurse/whiteboards/${wb.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 group-hover:text-sky-600">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {wb.description}
                    </p>

                    {/* Patient & Unit Context */}
                    {wb.patient_mrn && (
                      <div className="flex items-center gap-2 text-xs bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-100 font-medium">
                        <User className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>
                          Patient: {wb.patient_name || "Assigned Patient"} ({wb.patient_mrn})
                        </span>
                      </div>
                    )}

                    {/* Review Notes or Sign-off banner */}
                    {wb.clinical_reviewer && (
                      <div className="flex items-start gap-2 text-[11px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-100">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Sign-Off: {wb.clinical_reviewer.name}</span>
                          {wb.review_notes && <p className="text-emerald-700 mt-0.5 italic">"{wb.review_notes}"</p>}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {wb.tags?.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{wb.owner.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewingWb(wb)}
                        className="h-7 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                        Nurse Sign-Off
                      </Button>

                      <Link href={`/nurse/whiteboards/${wb.id}`}>
                        <Button size="sm" className="h-7 text-[11px] bg-sky-600 hover:bg-sky-700 text-white gap-1">
                          Open Canvas
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Whiteboard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="h-5 w-5 text-sky-600" />
                Create New Triage Protocol or Care Pathway
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathway Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rapid Sepsis Screening & Antibiotic Pathway — Ward 4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Description</label>
                <textarea
                  rows={2}
                  placeholder="Summarize the patient population, trigger criteria, and expected clinical actions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as WhiteboardType)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="TRIAGE_WORKFLOW">Triage Workflow</option>
                    <option value="CARE_PLAN">Bedside Care Plan</option>
                    <option value="TEAM_COLLABORATION">Shift Handover (SBAR)</option>
                    <option value="CLINICAL_WORKFLOW">Clinical Workflow</option>
                    <option value="DECISION_TREE">Decision Tree</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient MRN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MRN-89421"
                    value={newPatientMRN}
                    onChange={(e) => setNewPatientMRN(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  size="sm"
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : "Create & Open Pathway"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Review & Sign-Off Modal */}
      {reviewingWb && (
        <ClinicalReviewModal
          isOpen={!!reviewingWb}
          whiteboard={reviewingWb}
          userRole="NURSE"
          onClose={() => setReviewingWb(null)}
          onReviewSubmit={async (action, notes) => {
            const updatedStatus: WhiteboardStatus =
              action === "APPROVE" ? "APPROVED" : action === "REQUEST_CHANGES" ? "IN_REVIEW" : "IN_REVIEW";
            const updated: ClinicalWhiteboard = {
              ...reviewingWb,
              status: updatedStatus,
              clinical_reviewer: {
                id: "u-nurse",
                username: "sjenkins",
                email: "sjenkins@hospital.org",
                role: "NURSE",
                name: "Sarah Jenkins, RN (BSN, CCRN)",
              },
              reviewed_at: new Date().toISOString(),
              review_notes: notes || undefined,
            };
            handleReviewSubmitted(updated);
          }}
        />
      )}
    </div>
  );
}
