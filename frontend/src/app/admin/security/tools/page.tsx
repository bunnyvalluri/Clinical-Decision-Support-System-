"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sliders,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { securityService, SecurityHealth } from "@/services/securityService";

export default function SecurityToolsPage() {
  const [tools, setTools] = React.useState<any[]>([]);
  const [health, setHealth] = React.useState<SecurityHealth | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      securityService.getTools().catch(() => ({ tools: [] })),
      securityService.getHealth().catch(() => null),
    ]).then(([toolData, healthData]) => {
      setTools(toolData.tools || []);
      setHealth(healthData);
    }).finally(() => setLoading(false));
  }, []);

  const strixTool = health
    ? {
        name: "Strix-SecOps-Engine",
        version: health.strix.version,
        purpose: "Official usestrix/strix AI penetration-testing engine. Executes authorized scans in isolated workspaces with default-deny policy enforcement.",
        network_access: "Authorized target scope only (default-deny; no internet scanning)",
        risk_level: "CONTROLLED (Policy-Governed, Isolated Sandbox)",
        status: health.strix.status === "AVAILABLE" ? "ACTIVE" : "FALLBACK_ADAPTER_ACTIVE",
        isStrix: true,
        available: health.strix.available,
      }
    : null;

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
            <h1 className="text-2xl font-bold text-slate-900">Security Tool Inventory</h1>
            <p className="text-xs text-slate-500">
              Pinned security engines and adapters with explicit capability boundaries.
            </p>
          </div>
        </div>
      </div>

      {health?.kill_switch_active && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            Emergency kill-switch is <strong>ACTIVE</strong>. All security scanning is currently halted.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading tool inventory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strix engine card — always first */}
          {strixTool && (
            <Card className="bg-white border-blue-200 shadow-sm ring-1 ring-blue-100">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-base font-semibold text-slate-900">{strixTool.name}</CardTitle>
                    <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">Official Strix</Badge>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono border-slate-200">
                    v{strixTool.version}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">{strixTool.purpose}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Binary Available:</span>
                  <span className={`font-semibold ${strixTool.available ? "text-emerald-700" : "text-amber-700"}`}>
                    {strixTool.available ? "YES — Native CLI" : "NO — Using Fallback Adapter"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Network Access:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px]">{strixTool.network_access}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Risk Classification:</span>
                  <span className="font-semibold text-blue-700">{strixTool.risk_level}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Execution Status:</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${strixTool.available ? "text-emerald-600" : "text-amber-600"}`}>
                    <Activity className="w-3.5 h-3.5" />
                    {strixTool.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing tools from backend */}
          {tools.map((tool, idx) => (
            <Card key={idx} className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">{tool.name}</CardTitle>
                  <Badge variant="outline" className="text-xs font-mono border-slate-200">
                    v{tool.version}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">{tool.purpose}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Network Access:</span>
                  <span className="font-semibold text-slate-800">{tool.network_access}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Risk Classification:</span>
                  <span className="font-semibold text-emerald-700">{tool.risk_level}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Execution Status:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {tool.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {!strixTool && tools.length === 0 && (
            <div className="col-span-2 py-16 text-center text-slate-400 text-sm">
              No security tool inventory available. Security service may be unavailable.
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Security Tool Policy Boundaries</span>
        </div>
        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
          <li>Strix executes ONLY against targets in the approved allowlist. Default-deny enforced.</li>
          <li>All scan processes run in ephemeral, secret-free workspaces with no production credential access.</li>
          <li>Production scanning is disabled by default and requires dual-custody IT Admin authorization.</li>
          <li>AI tool calls are routed through the AI Gateway — never bypass organizational model governance.</li>
          <li>Security tool operations are completely isolated from clinical request paths and patient data.</li>
        </ul>
      </div>
    </div>
  );
}
