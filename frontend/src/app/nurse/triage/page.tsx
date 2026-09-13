"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardList, ChevronRight, Clock, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  ResponsivePageContainer,
  ResponsiveToolbar,
  ResponsiveTable,
  ResponsiveTableColumn,
} from "@/components/responsive";

type TriageStatus = "WAITING" | "TRIAGE_IN_PROGRESS" | "TRIAGED" | "ESCALATED" | "COMPLETED";

interface TriageItem {
  id: string;
  patient: string;
  age: number;
  chief: string;
  status: TriageStatus;
  priority: string;
  arrived: string;
}

const STATUS_CONFIG: Record<TriageStatus, { label: string; color: string; bg: string }> = {
  WAITING: { label: "Waiting", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  TRIAGE_IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  TRIAGED: { label: "Triaged", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  ESCALATED: { label: "Escalated", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
  COMPLETED: { label: "Completed", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
};

const DEMO_TRIAGE: TriageItem[] = [
  { id: "t-001", patient: "Robert Chen", age: 67, chief: "Chest pain, shortness of breath", status: "WAITING", priority: "HIGH", arrived: "08:32" },
  { id: "t-002", patient: "Maria Santos", age: 45, chief: "Dizziness, irregular heartbeat", status: "TRIAGE_IN_PROGRESS", priority: "MEDIUM", arrived: "08:41" },
  { id: "t-003", patient: "James Wilson", age: 78, chief: "Syncope episode", status: "WAITING", priority: "HIGH", arrived: "09:05" },
  { id: "t-004", patient: "Priya Patel", age: 32, chief: "Headache, nausea", status: "TRIAGED", priority: "LOW", arrived: "09:12" },
  { id: "t-005", patient: "David Kim", age: 55, chief: "Severe dyspnea", status: "ESCALATED", priority: "HIGH", arrived: "09:20" },
];

export default function NurseTriagePage() {
  const [filter, setFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState<string>("");

  const filtered = DEMO_TRIAGE.filter((t) => {
    const matchFilter = filter === "ALL" || t.status === filter;
    const matchSearch =
      t.patient.toLowerCase().includes(search.toLowerCase()) ||
      t.chief.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    WAITING: DEMO_TRIAGE.filter((t) => t.status === "WAITING").length,
    ESCALATED: DEMO_TRIAGE.filter((t) => t.status === "ESCALATED").length,
    IN_PROGRESS: DEMO_TRIAGE.filter((t) => t.status === "TRIAGE_IN_PROGRESS").length,
  };

  const columns: ResponsiveTableColumn<TriageItem>[] = [
    {
      key: "patient",
      header: "Patient",
      priority: "high",
      sticky: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.priority === "HIGH" ? "bg-rose-50" : t.priority === "MEDIUM" ? "bg-amber-50" : "bg-emerald-50"}`}>
            <ClipboardList className={`h-5 w-5 ${t.priority === "HIGH" ? "text-rose-600" : t.priority === "MEDIUM" ? "text-amber-600" : "text-emerald-600"}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{t.patient}</p>
            <p className="text-[11px] text-slate-500">Age: {t.age}</p>
          </div>
        </div>
      ),
    },
    {
      key: "chief",
      header: "Chief Complaint",
      priority: "medium",
      render: (t) => <span className="text-xs text-slate-700 max-w-xs block truncate">{t.chief}</span>,
    },
    {
      key: "status",
      header: "Status",
      priority: "high",
      render: (t) => {
        const conf = STATUS_CONFIG[t.status];
        return <Badge className={`border text-xs ${conf.bg} ${conf.color}`}>{conf.label}</Badge>;
      },
    },
    {
      key: "arrived",
      header: "Arrived",
      priority: "low",
      render: (t) => <span className="text-xs text-slate-500 font-mono">{t.arrived}</span>,
    },
    {
      key: "action",
      header: "Action",
      priority: "high",
      className: "text-right",
      render: (t) => (
        <Link href={`/nurse/triage/${t.id}`}>
          <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 hover:border-sky-300 text-sky-700 hover:bg-sky-50 gap-1 touch-target">
            <span>Triage</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ResponsivePageContainer
      title="Triage Queue"
      subtitle={`Real-time emergency department triage status — ${DEMO_TRIAGE.length} patients`}
      actions={
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span>Live Telemetry</span>
        </div>
      }
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Waiting in Lobby", count: counts.WAITING, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Bedside Triage Active", count: counts.IN_PROGRESS, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "Critical Escalations", count: counts.ESCALATED, color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
        ].map(({ label, count, color, bg }) => (
          <Card key={label} className={`border ${bg} shadow-2xs`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResponsiveToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search patients by name or symptoms…"
        filters={
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "All Patients", value: "ALL" },
              { label: "Waiting", value: "WAITING" },
              { label: "In Progress", value: "TRIAGE_IN_PROGRESS" },
              { label: "Triaged", value: "TRIAGED" },
              { label: "Escalated", value: "ESCALATED" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  filter === opt.value
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      <ResponsiveTable
        data={filtered}
        columns={columns}
        keyExtractor={(t) => t.id}
        mobileCardRender={(t) => {
          const conf = STATUS_CONFIG[t.status];
          return (
            <Link key={t.id} href={`/nurse/triage/${t.id}`} className="block">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-sky-300 transition-all flex items-center justify-between gap-3 active:scale-[0.99]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.priority === "HIGH" ? "bg-rose-50" : t.priority === "MEDIUM" ? "bg-amber-50" : "bg-emerald-50"}`}>
                    <ClipboardList className={`h-5 w-5 ${t.priority === "HIGH" ? "text-rose-600" : t.priority === "MEDIUM" ? "text-amber-600" : "text-emerald-600"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm truncate">{t.patient}</p>
                      <Badge className={`border text-[10px] px-1.5 py-0 ${conf.bg} ${conf.color}`}>
                        {conf.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Age {t.age} · {t.chief}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden xs:inline">{t.arrived}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </Link>
          );
        }}
      />
    </ResponsivePageContainer>
  );
}
