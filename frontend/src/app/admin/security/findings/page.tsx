"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { securityService, SecurityFinding } from "@/services/securityService";

export default function SecurityFindingsPage() {
  const [findings, setFindings] = React.useState<SecurityFinding[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const fetchFindings = async () => {
    try {
      const data = await securityService.getFindings();
      setFindings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFindings();
  }, []);

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = severityFilter === "ALL" || f.severity === severityFilter;
    const matchesSearch =
      searchTerm === "" ||
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.affected_endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen text-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/security">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Overview
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vulnerability Findings</h1>
            <p className="text-xs text-slate-500">
              Verified security findings audited by the 7-question validation gate.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by title or endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 text-xs h-9 bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <Button
              key={sev}
              size="sm"
              variant={severityFilter === sev ? "default" : "outline"}
              onClick={() => setSeverityFilter(sev)}
              className={`text-xs h-8 ${
                severityFilter === sev
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {sev}
            </Button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">
            Recorded Findings ({filteredFindings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading findings...</div>
          ) : filteredFindings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No security findings match your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-100 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Vulnerability / Title</th>
                    <th className="p-3">Affected Endpoint</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Target</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFindings.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            f.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : f.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {f.severity}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block">{f.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{f.vulnerability_type} {f.cwe_id ? `• ${f.cwe_id}` : ""}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600 max-w-xs truncate">{f.affected_endpoint}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            f.state === "VALIDATED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : f.state === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : f.state === "FALSE_POSITIVE"
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {f.state}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">{f.target_name}</td>
                      <td className="p-3 text-right">
                        <Link href={`/admin/security/findings/${f.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs text-indigo-600 hover:text-indigo-800 h-7">
                            Details →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
