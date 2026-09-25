"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Globe, Shield, Plus, CheckCircle2, XCircle, AlertTriangle, Lock } from "lucide-react";
import apiClient from "@/services/apiClient";

export function DestinationAllowlistTable() {
  const [destinations, setDestinations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal form state
  const [open, setOpen] = React.useState(false);
  const [hostname, setHostname] = React.useState("");
  const [scheme, setScheme] = React.useState("https");
  const [port, setPort] = React.useState(443);
  const [purpose, setPurpose] = React.useState("");
  const [sensitivity, setSensitivity] = React.useState("INTERNAL");
  const [approvalRequired, setApprovalRequired] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/destinations/");
      const data = res.data?.results || res.data || [];
      setDestinations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load destinations.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDestinations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/ai/agents/browser/destinations/", {
        hostname: hostname.trim().toLowerCase(),
        scheme,
        port: Number(port),
        purpose: purpose.trim(),
        sensitivity,
        approval_required: approvalRequired,
        allowed_operations: ["NAVIGATE", "CLICK", "INPUT", "EXTRACT_TEXT", "SCREENSHOT"],
        is_active: true,
      });
      setOpen(false);
      setHostname("");
      setPurpose("");
      fetchDestinations();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to add destination.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSensitivityBadge = (sens: string) => {
    switch (sens) {
      case "RESTRICTED":
      case "HIGH":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Restricted</Badge>;
      case "CONFIDENTIAL":
      case "MEDIUM":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Confidential</Badge>;
      case "INTERNAL":
      case "LOW":
      default:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Internal</Badge>;
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg font-bold text-slate-900">
              Approved Destination Allowlist (SSRF Defense)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Browser automation is strictly default-deny. All private IPs, metadata endpoints, and unapproved FQDNs are blocked at network boundary.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDestinations}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                <Plus className="w-4 h-4 mr-1" />
                Add Approved Host
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white text-slate-900 border border-slate-200">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Authorize Clinical Destination
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Enter the verified FQDN of the external laboratory, registry, or hospital portal.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Hostname / FQDN</Label>
                    <Input
                      required
                      placeholder="e.g. labcorp-portal.hospital.org"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                      className="bg-white border-slate-200 text-slate-800 text-xs font-mono mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Scheme</Label>
                      <Input
                        value={scheme}
                        onChange={(e) => setScheme(e.target.value)}
                        className="bg-white border-slate-200 text-slate-800 text-xs font-mono mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Port</Label>
                      <Input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        className="bg-white border-slate-200 text-slate-800 text-xs font-mono mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Clinical Purpose</Label>
                    <Input
                      required
                      placeholder="e.g. Blood pathology results ingestion"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="bg-white border-slate-200 text-slate-800 text-xs mt-1"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {submitting ? "Authorizing..." : "Save Destination"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold text-slate-700">Hostname / Scheme</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Clinical Purpose</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Sensitivity</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Approval Required</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-500">
                  Loading approved destinations...
                </TableCell>
              </TableRow>
            ) : destinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-500">
                  No destinations configured. Automation is completely locked down.
                </TableCell>
              </TableRow>
            ) : (
              destinations.map((d) => (
                <TableRow key={d.id || d.hostname} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs font-medium text-slate-900">
                    <span className="text-slate-400">{d.scheme || "https"}://</span>
                    {d.hostname}
                    {d.port && d.port !== 443 && <span className="text-slate-400">:{d.port}</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">{d.purpose || "Clinical system access"}</TableCell>
                  <TableCell>{getSensitivityBadge(d.sensitivity)}</TableCell>
                  <TableCell>
                    {d.approval_required ? (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200">Yes</Badge>
                    ) : (
                      <span className="text-xs text-slate-500">Automated</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {d.is_active ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center w-fit gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 flex items-center w-fit gap-1">
                        <XCircle className="w-3 h-3" />
                        Suspended
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
