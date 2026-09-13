"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, HeartPulse, Download, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const HISTORY_ROWS = [
  { id: "v-101", date: "2026-09-13 08:30", sbp: 134, dbp: 86, hr: 76, spo2: 97, source: "USER_ENTERED", status: "NORMAL" },
  { id: "v-102", date: "2026-09-12 19:45", sbp: 132, dbp: 84, hr: 72, spo2: 98, source: "USER_ENTERED", status: "NORMAL" },
  { id: "v-103", date: "2026-09-11 09:00", sbp: 136, dbp: 88, hr: 78, spo2: 98, source: "CLINICIAN", status: "NORMAL" },
  { id: "v-104", date: "2026-09-10 14:30", sbp: 132, dbp: 84, hr: 74, spo2: 98, source: "CLINICIAN", status: "NORMAL" },
  { id: "v-105", date: "2026-09-08 08:15", sbp: 142, dbp: 90, hr: 82, spo2: 96, source: "USER_ENTERED", status: "BORDERLINE" },
];

export default function VitalsHistoryPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/user/vitals">
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Vitals
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-teal-600" />
            Complete Physiological Measurements History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Auditable trail of all self-reported and clinician-verified vital signs.
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200">
          <Download className="h-3.5 w-3.5 text-slate-600" /> Export CSV
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Blood Pressure</TableHead>
                <TableHead>Heart Rate</TableHead>
                <TableHead>SpO2</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HISTORY_ROWS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs font-mono text-slate-500">{row.date}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {row.sbp} / {row.dbp} <span className="font-normal text-slate-400">mmHg</span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">{row.hr} bpm</TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">{row.spo2}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 border-slate-200">
                      {row.source === "USER_ENTERED" ? "Self-Reported" : "Clinical Verified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/user/vitals/${row.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                        View
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
  );
}
