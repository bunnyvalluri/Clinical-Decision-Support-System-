"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Plus, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { webIntelligenceService } from "@/services/webIntelligenceService";
import type { DomainPolicy } from "@/types/webIntelligence";

export default function AdminWebSourcesPage() {
  const [policies, setPolicies] = React.useState<DomainPolicy[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newDomain, setNewDomain] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("Medical Literature");
  const [newTier, setNewTier] = React.useState("TIER_1");
  const [newStatus, setNewStatus] = React.useState<"APPROVED" | "BLOCKED">("APPROVED");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchPolicies = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await webIntelligenceService.getSources();
      setPolicies(res.policies || []);
    } catch (err: any) {
      console.error("Failed to load domain policies:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setIsSubmitting(true);
    try {
      await webIntelligenceService.addDomainPolicy({
        domain: newDomain.trim(),
        category: newCategory.trim(),
        trust_tier: newTier as any,
        status: newStatus,
        allowed_roles: ["DOCTOR", "NURSE", "MEDICAL_INFORMATICIST", "IT_ADMIN"],
        reason: "Registered by administrator via console.",
      });
      setNewDomain("");
      fetchPolicies();
    } catch (err: any) {
      alert("Failed to create policy: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/admin/web-intelligence">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                Approved Domain Policies & Trust Registry
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Configure strict domain allowlists, blocklists, and trust tier classifications for web intelligence.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={fetchPolicies} disabled={isLoading} className="text-xs bg-white border-slate-200">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Add Policy Form */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-blue-600" /> Register New Domain Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPolicy} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="e.g. pubmed.ncbi.nlm.nih.gov"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="bg-white border-slate-200 text-xs text-slate-900"
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Category (e.g. Cardiology)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-white border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 w-full"
                >
                  <option value="TIER_1">TIER_1 (Gov/WHO)</option>
                  <option value="TIER_2">TIER_2 (Academic)</option>
                  <option value="TIER_3">TIER_3 (Reputable)</option>
                  <option value="TIER_4">TIER_4 (General)</option>
                </select>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 w-full"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
              <div>
                <Button type="submit" disabled={isSubmitting || !newDomain.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9">
                  Save Policy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Domain Policies Registry</CardTitle>
            <CardDescription className="text-xs text-slate-500">Persistent policies stored in Neon PostgreSQL.</CardDescription>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No custom domain policies registered. Built-in healthcare TIER_1 and TIER_2 rules are active.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 bg-slate-50/50">
                      <TableHead className="text-xs font-semibold text-slate-700">Domain</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Trust Tier</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((p) => (
                      <TableRow key={p.id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-medium text-xs text-slate-900 font-mono">{p.domain}</TableCell>
                        <TableCell className="text-xs text-slate-600">{p.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[11px]">
                            {p.trust_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.status === "APPROVED" ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> APPROVED
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-[11px]">
                              <XCircle className="mr-1 h-3 w-3" /> BLOCKED
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
