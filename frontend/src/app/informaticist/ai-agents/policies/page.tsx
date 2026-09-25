"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileCheck, Plus, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import apiClient from "@/services/apiClient";

export default function InformaticistPoliciesPage() {
  const [policies, setPolicies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/policies/");
      const data = res.data?.results || res.data || [];
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load policies", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex items-center justify-between">
        <Link
          href="/informaticist/ai-agents"
          className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Agents Overview
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchPolicies}
          className="text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          Refresh Policies
        </Button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-4 px-6">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Browser Task Governance Policies
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Granular operational constraints defining maximum steps, allowed operations, role requirements, and clinician approval gates.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Policy Name</th>
                  <th className="py-3 px-4">Task Type</th>
                  <th className="py-3 px-4">Allowed Operations</th>
                  <th className="py-3 px-4">Max Steps</th>
                  <th className="py-3 px-4">Approval Required</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading policies...
                    </td>
                  </tr>
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Standard default policies active: Lab Extraction (Read-Only, Max 30 Steps), Prior Auth (Approval Required, Single Mutation).
                    </td>
                  </tr>
                ) : (
                  policies.map((p) => (
                    <tr key={p.id || p.name} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{p.task_type}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(p.allowed_operations || []).map((op: string) => (
                            <Badge key={op} variant="outline" className="text-[10px] bg-white border-slate-200">
                              {op}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{p.max_steps || 30}</td>
                      <td className="py-3 px-4">
                        {p.approval_required ? (
                          <Badge className="bg-amber-50 text-amber-800 border-amber-200">Yes</Badge>
                        ) : (
                          <span className="text-slate-500">Automated</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.enabled ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">Disabled</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
