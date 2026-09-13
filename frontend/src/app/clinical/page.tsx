"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Eye, HeartPulse, Plus, Search, Users } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function ClinicalRecordsPage() {
  const router = useRouter();
  const { patients } = useClinicalStore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredRecords = patients.filter((patient) => {
    const term = searchTerm.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(term) ||
      patient.last_name.toLowerCase().includes(term) ||
      patient.mrn.toLowerCase().includes(term) ||
      patient.room_number.toLowerCase().includes(term)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-emerald-600" />
              Clinical Records & Bedside Observations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative inpatient encounters, hemodynamic recordings, and laboratory telemetry.
            </p>
          </div>

          <Link href="/clinical/new">
            <Button
              variant="default"
              size="sm"
              className="text-xs gap-1.5 shadow-sm self-start md:self-auto"
            >
              <Plus className="h-4 w-4" />
              Record New Observations
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search records by name or MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredRecords.length} recorded patient encounters
          </span>
        </div>

        {/* Clinical Records Table */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medical Record (MRN)</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Blood Pressure</TableHead>
                  <TableHead>Heart Rate</TableHead>
                  <TableHead>Oxygen Sat (SpO2)</TableHead>
                  <TableHead>Blood Glucose</TableHead>
                  <TableHead>Risk Tier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {patient.mrn}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Attending: {patient.primary_doctor}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      {patient.department} • <span className="text-slate-500">{patient.room_number}</span>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-slate-800">
                      {patient.systolic_bp}/{patient.diastolic_bp} mmHg
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-700">
                      {patient.heart_rate} bpm
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-700">
                      {patient.spo2}%
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-700">
                      {patient.blood_glucose} mg/dL
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/clinical/new?patientId=${patient.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50">
                          Update Vitals
                        </Button>
                      </Link>
                      <Link href={`/predictions/new?patientId=${patient.id}`}>
                        <Button variant="default" size="sm" className="h-7 text-xs shadow-sm">
                          Assess Risk
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
