"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Plus, CheckCircle2, AlertTriangle, Globe, Lock } from "lucide-react";
import apiClient from "@/services/apiClient";

interface BrowserTaskDialogProps {
  onTaskCreated?: (task: any) => void;
  trigger?: React.ReactNode;
}

export function BrowserTaskDialog({ onTaskCreated, trigger }: BrowserTaskDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [taskType, setTaskType] = React.useState("EXTRACT_LAB_REPORT");
  const [goal, setGoal] = React.useState("");
  const [targetUrl, setTargetUrl] = React.useState("");
  const [selectedDestination, setSelectedDestination] = React.useState("");
  const [destinations, setDestinations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      loadDestinations();
    }
  }, [open]);

  const loadDestinations = async () => {
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/destinations/");
      const data = res.data?.results || res.data || [];
      setDestinations(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedDestination) {
        setSelectedDestination(data[0].id || data[0].hostname);
        if (data[0].hostname) {
          setTargetUrl(`https://${data[0].hostname}/portal`);
        }
      }
    } catch (err: any) {
      console.warn("Could not load destinations", err);
    }
  };

  const handleDestinationChange = (val: string) => {
    setSelectedDestination(val);
    const dest = destinations.find((d) => d.id === val || d.hostname === val);
    if (dest && dest.hostname) {
      setTargetUrl(`https://${dest.hostname}/portal`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        task_type: taskType,
        goal: goal.trim(),
        target_url: targetUrl.trim(),
        destination_id: selectedDestination || undefined,
        runtime_provider: "jev-ultrafast",
        allowed_operations: ["NAVIGATE", "CLICK", "INPUT", "EXTRACT_TEXT", "SCREENSHOT"],
        risk_level: "LOW",
        max_steps: 30,
        max_duration_seconds: 120,
      };

      const res = await apiClient.post<any>("/ai/agents/browser/tasks/", payload);
      const created = res.data;
      setSuccess("Task created successfully under strict security policy.");
      if (onTaskCreated) {
        onTaskCreated(created);
      }
      setTimeout(() => {
        setOpen(false);
        setGoal("");
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || "Failed to create task.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Browser Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border border-slate-200 shadow-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Dispatch Controlled Browser Task
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Jev Ultrafast runtime executes verified actions against approved clinical portals.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200 text-amber-900 text-xs">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <AlertTitle className="font-semibold text-amber-800">Healthcare AI Boundary Invariant</AlertTitle>
              <AlertDescription className="text-amber-700 mt-1">
                Jev is an execution runtime only. Autonomous clinical diagnoses, prescriptions, guideline alterations, and unapproved mutations are strictly prohibited.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="bg-rose-50 border-rose-200 text-rose-800 text-sm">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Task Type</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-800 h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="EXTRACT_LAB_REPORT">Extract Lab Report (Read-Only)</SelectItem>
                    <SelectItem value="VERIFY_PATIENT_IDENTITY">Verify Patient Identity (Read-Only)</SelectItem>
                    <SelectItem value="FETCH_REGISTRY_RECORD">Fetch Registry Record (Read-Only)</SelectItem>
                    <SelectItem value="SUBMIT_PRIOR_AUTH">Submit Prior Auth (Controlled Mutation)</SelectItem>
                    <SelectItem value="SCHEDULE_CLINICAL_FOLLOWUP">Schedule Follow-up (Controlled Mutation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Approved Destination</Label>
                <Select value={selectedDestination} onValueChange={handleDestinationChange}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-800 h-9">
                    <SelectValue placeholder="Choose destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {destinations.length > 0 ? (
                      destinations.map((d) => (
                        <SelectItem key={d.id || d.hostname} value={d.id || d.hostname}>
                          {d.hostname} ({d.purpose || "Clinical Portal"})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="sandbox.healthnova.local">sandbox.healthnova.local (Sandbox)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Target URL (Allowlist Governed)</Label>
              <Input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://lab-portal.hospital.org/results"
                className="bg-white border-slate-200 text-slate-800 font-mono text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Clinical Automation Goal</Label>
              <Textarea
                required
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="E.g. Search for blood biochemistry report dated 2026-09-20 and extract panel values..."
                className="bg-white border-slate-200 text-slate-800 text-sm"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Runtime: <strong>Jev Ultrafast (Sub-50ms)</strong></span>
              </div>
              <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-[10px]">
                Strict Action-Space Only
              </Badge>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3">
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
              disabled={loading || !goal.trim() || !targetUrl.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {loading ? "Validating & Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
