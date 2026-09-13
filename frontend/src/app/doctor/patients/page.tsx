"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

import {
  ResponsivePageContainer,
  ResponsiveToolbar,
  ResponsiveTable,
  ResponsiveTableColumn,
} from "@/components/responsive";

const STATUS_CONFIG = {
  HIGH: { color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", label: "High Risk" },
  MEDIUM: { color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Moderate Risk" },
  LOW: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Low Risk" },
};

interface PatientItem {
  id: string;
  name: string;
  mrn: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  age: number;
  lastSeen: string;
  predictionCount: number;
}

export default function DoctorPatientsPage() {
  const { predictions } = useClinicalStore();
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("ALL");

  // Derive unique patients from predictions
  const patients: PatientItem[] = React.useMemo(() => {
    const seen = new Set<string>();
    return predictions
      .filter((p) => {
        if (seen.has(p.patient_mrn)) return false;
        seen.add(p.patient_mrn);
        return true;
      })
      .map((p) => ({
        id: p.patient_id,
        name: p.patient_name,
        mrn: p.patient_mrn,
        risk: p.risk_level as "HIGH" | "MEDIUM" | "LOW",
        age: p.age ?? p.clinical_factors?.age ?? 65,
        lastSeen: p.created_at || p.timestamp,
        predictionCount: predictions.filter((x) => x.patient_mrn === p.patient_mrn).length,
      }));
  }, [predictions]);

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "ALL" || p.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const columns: ResponsiveTableColumn<PatientItem>[] = [
    {
      key: "patient",
      header: "Patient",
      priority: "high",
      sticky: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{p.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              MRN: {p.mrn} · Age: {p.age}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "risk",
      header: "Risk Tier",
      priority: "high",
      render: (p) => {
        const conf = STATUS_CONFIG[p.risk] || STATUS_CONFIG.LOW;
        return (
          <Badge className={`text-xs border font-medium ${conf.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${conf.dot}`} />
            {conf.label}
          </Badge>
        );
      },
    },
    {
      key: "predictions",
      header: "Predictions",
      priority: "medium",
      render: (p) => (
        <span className="text-xs text-slate-600 font-medium">
          {p.predictionCount} assessment{p.predictionCount !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "lastSeen",
      header: "Last Evaluated",
      priority: "low",
      render: (p) => (
        <span className="text-xs text-slate-500">
          {new Date(p.lastSeen).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      priority: "high",
      className: "text-right",
      render: (p) => (
        <Link href={`/doctor/patients/${p.id}`}>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 touch-target">
            <span>Chart</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ResponsivePageContainer
      title="My Patients"
      subtitle={`${patients.length} assigned clinical patients`}
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 touch-target text-xs sm:text-sm">
          <Plus className="h-4 w-4" />
          <span>New Patient</span>
        </Button>
      }
    >
      <ResponsiveToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient name or MRN…"
        filters={
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "All Risks", value: "ALL" },
              { label: "High Risk", value: "HIGH" },
              { label: "Moderate Risk", value: "MEDIUM" },
              { label: "Low Risk", value: "LOW" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRiskFilter(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  riskFilter === opt.value
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
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
        keyExtractor={(p) => p.id}
        mobileCardRender={(p) => {
          const conf = STATUS_CONFIG[p.risk] || STATUS_CONFIG.LOW;
          return (
            <Link key={p.id} href={`/doctor/patients/${p.id}`} className="block">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between gap-3 active:scale-[0.99]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 border ${conf.color}`}>
                        {conf.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      MRN: {p.mrn} · Age: {p.age}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
            </Link>
          );
        }}
      />
    </ResponsivePageContainer>
  );
}
