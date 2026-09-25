"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Power, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import apiClient from "@/services/apiClient";

export function KillSwitchControl() {
  const [switches, setSwitches] = React.useState<any>({
    global_enabled: true,
    jev_enabled: true,
    mutations_enabled: true,
  });
  const [loading, setLoading] = React.useState(true);
  const [toggling, setToggling] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/ai/agents/browser/kill-switch/");
      if (res.data) {
        setSwitches(res.data);
      }
    } catch (err: any) {
      console.warn("Could not fetch kill switches", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async (key: string, currentValue: boolean) => {
    setToggling(true);
    setMessage(null);
    try {
      const payload: any = {};
      payload[key] = !currentValue;
      const res = await apiClient.post<any>("/ai/agents/browser/kill-switch/", payload);
      setSwitches(res.data?.switches || payload);
      setMessage(`Kill switch '${key}' updated to ${!currentValue ? "ENABLED" : "DISABLED"}.`);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to toggle switch.");
    } finally {
      setToggling(false);
    }
  };

  const emergencyHaltAll = async () => {
    if (!confirm("CRITICAL: Halt ALL browser automation immediately across all runtimes?")) {
      return;
    }
    setToggling(true);
    try {
      await apiClient.post("/ai/agents/browser/kill-switch/", {
        global_enabled: false,
        jev_enabled: false,
        mutations_enabled: false,
        reason: "EMERGENCY_OPERATOR_HALT",
      });
      setSwitches({
        global_enabled: false,
        jev_enabled: false,
        mutations_enabled: false,
      });
      setMessage("EMERGENCY HALT TRIGGERED. All browser sessions terminated.");
    } catch (err: any) {
      alert("Halt failed: " + err.message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Power className="w-5 h-5 text-rose-600" />
            <CardTitle className="text-lg font-bold text-slate-900">
              Emergency Kill Switches & Circuit Breakers
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Deterministic circuit breaker locks all CDP sessions, task loops, and background workers within 250ms.
          </CardDescription>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={emergencyHaltAll}
          disabled={toggling || !switches.global_enabled}
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 shadow"
        >
          <ShieldAlert className="w-4 h-4 mr-1.5" />
          Emergency Halt All
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {message && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Global Kill Switch */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Global Automation</span>
                <Badge
                  className={
                    switches.global_enabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }
                >
                  {switches.global_enabled ? "ARMED & ACTIVE" : "HALTED"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Master circuit breaker. When disabled, rejects all new browser tasks and terminates running tasks immediately.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">BROWSER_AGENT_GLOBAL_ENABLED</span>
              <Switch
                checked={switches.global_enabled}
                onCheckedChange={() => handleToggle("global_enabled", switches.global_enabled)}
                disabled={toggling}
              />
            </div>
          </div>

          {/* Jev Ultrafast Runtime */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Jev Ultrafast Runtime</span>
                <Badge
                  className={
                    switches.jev_enabled
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }
                >
                  {switches.jev_enabled ? "READY" : "DISABLED"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Controls Jev CDP-based sub-50ms engine. If disabled, fallback to sandbox or mock browser harness.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">JEV_ENABLED</span>
              <Switch
                checked={switches.jev_enabled}
                onCheckedChange={() => handleToggle("jev_enabled", switches.jev_enabled)}
                disabled={toggling}
              />
            </div>
          </div>

          {/* Mutations Enabled */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Mutations & Submissions</span>
                <Badge
                  className={
                    switches.mutations_enabled
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }
                >
                  {switches.mutations_enabled ? "MUTATIONS PERMITTED" : "READ-ONLY ONLY"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Enforces read-only mode across all portals. All form submits, buttons, and state mutations are strictly blocked.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">BROWSER_MUTATIONS_ENABLED</span>
              <Switch
                checked={switches.mutations_enabled}
                onCheckedChange={() => handleToggle("mutations_enabled", switches.mutations_enabled)}
                disabled={toggling}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
