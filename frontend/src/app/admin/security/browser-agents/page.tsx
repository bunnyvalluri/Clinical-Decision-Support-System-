"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, AlertTriangle, CheckCircle2, ShieldAlert, Globe, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DestinationAllowlistTable } from "@/components/ai/browser/DestinationAllowlistTable";
import { KillSwitchControl } from "@/components/ai/browser/KillSwitchControl";

export default function AdminBrowserAgentsSecurityPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Browser Security & SSRF Defense Gateway
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic network segmentation, IP validation, prompt injection containment, and PHI isolation.
              </p>
            </div>
          </div>
        </div>

        <Link href="/admin/services/agents/browser">
          <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Service Admin
          </Button>
        </Link>
      </div>

      {/* Security Policies Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">SSRF Defense Level</CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">ACTIVE - STRICT</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 text-xs text-slate-600 space-y-2">
            <p>
              • Pre-request DNS resolution with IP literal checks.
            </p>
            <p>
              • RFC1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) blocked.
            </p>
            <p>
              • Loopback (127.0.0.1) & Link-local (169.254.169.254) blocked.
            </p>
            <p>
              • HTTP 301/302 redirect destination re-validation.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">Prompt Injection Guard</CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">ISOLATED</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 text-xs text-slate-600 space-y-2">
            <p>
              • Jev action-space containment (Index/Action tuple only).
            </p>
            <p>
              • No raw LLM generation of CSS, XPath, or Javascript.
            </p>
            <p>
              • DOM text evaluated inside isolated headless context.
            </p>
            <p>
              • System prompt overrides on web pages ignored by parser.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="py-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">PHI Minimization & Scrubbing</CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">ZERO-PHI MEMORY</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 text-xs text-slate-600 space-y-2">
            <p>
              • DOM snapshots scrubbed of raw MRN/SSN strings.
            </p>
            <p>
              • Screenshots default-OFF; ephemeral storage only when enabled.
            </p>
            <p>
              • Zero patient PHI stored in shared vector embeddings.
            </p>
            <p>
              • Auth tokens stored in encrypted vault, wiped after session.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kill Switches */}
      <KillSwitchControl />

      {/* Destination Allowlist */}
      <DestinationAllowlistTable />
    </div>
  );
}
