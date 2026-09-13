"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Eye,
  Filter,
  HeartPulse,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/emptyState";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import type { RiskLevel } from "@/types";

export default function PatientsPage() {
  const router = useRouter();
  const { patients } = useClinicalStore();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.room_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === "ALL" || patient.latest_risk_level === riskFilter;
    const matchesStatus = statusFilter === "ALL" || patient.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              Patient Directory & Registry
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Longitudinal EHR records, real-time risk tiers, and telemetry monitoring.
            </p>
          </div>

          <Link href="/patients/new">
            <Button
              variant="default"
              size="sm"
              className="text-xs gap-1.5 shadow-sm self-start md:self-auto"
            >
              <Plus className="h-4 w-4" />
              Admit New Patient
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by name, MRN, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="INPATIENT">Inpatient</option>
                <option value="ICU">ICU</option>
                <option value="OUTPATIENT">Outpatient</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients Data Table */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8 text-slate-400" />}
                title="No patients match filters"
                description="Try clearing search parameters or adjusting risk level filters."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearchTerm("");
                  setRiskFilter("ALL");
                  setStatusFilter("ALL");
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medical Record (MRN)</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Demographics</TableHead>
                    <TableHead>Department / Bed</TableHead>
                    <TableHead>Latest Risk Score</TableHead>
                    <TableHead>Resting Vitals</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {patient.mrn}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Dr: {patient.primary_doctor}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {patient.age}y • {patient.gender === "M" ? "Male" : "Female"} •{" "}
                        <span className="text-slate-500 font-mono">{patient.blood_type}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-slate-800 font-medium">{patient.department}</span>
                        <div className="text-[11px] text-slate-500 font-mono">{patient.room_number}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              patient.latest_risk_level === "CRITICAL"
                                ? "critical"
                                : patient.latest_risk_level === "HIGH"
                                ? "high"
                                : patient.latest_risk_level === "MEDIUM"
                                ? "medium"
                                : "low"
                            }
                          >
                            {patient.latest_risk_level}
                          </Badge>
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {(patient.latest_risk_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        BP: {patient.systolic_bp}/{patient.diastolic_bp} • HR: {patient.heart_rate} • SpO2: {patient.spo2}%
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Chart
                          </Button>
                        </Link>
                        <Link href={`/predictions/new?patientId=${patient.id}`}>
                          <Button variant="default" size="sm" className="h-7 text-xs shadow-sm">
                            <HeartPulse className="h-3.5 w-3.5 mr-1" />
                            Assess
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
