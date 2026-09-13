"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Search, ChevronRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function NursePatientsPage() {
  const { predictions } = useClinicalStore();
  const [search, setSearch] = React.useState("");

  const patients = React.useMemo(() => {
    const seen = new Set<string>();
    return predictions.filter((p) => { if (seen.has(p.patient_mrn)) return false; seen.add(p.patient_mrn); return true; });
  }, [predictions]);

  const filtered = patients.filter((p) =>
    p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_mrn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients…" className="pl-9 bg-white" />
      </div>
      <div className="space-y-2">
        {filtered.map((p) => (
          <Link key={p.patient_id} href={`/nurse/patients/${p.patient_id}`} className="block">
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-sm transition-all flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{p.patient_name}</p>
                <p className="text-xs text-slate-500">MRN: {p.patient_mrn} · Age {p.age ?? p.clinical_factors?.age ?? "—"}</p>
              </div>
              <Badge className={`border text-xs ${p.risk_level === "HIGH" ? "bg-rose-50 text-rose-700 border-rose-200" : p.risk_level === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                {p.risk_level}
              </Badge>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
