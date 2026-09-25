"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Globe, Shield, Power, Activity, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KillSwitchControl } from "@/components/ai/browser/KillSwitchControl";
import { ProviderStatusCard } from "@/components/ai/browser/ProviderStatusCard";
import { DestinationAllowlistTable } from "@/components/ai/browser/DestinationAllowlistTable";

export default function AdminBrowserAgentsServicePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Browser Automation Services Administration
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Runtime configuration, provider health, circuit breakers, and allowlist routing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/security/browser-agents">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Security Envelope
            </Button>
          </Link>
          <Link href="/admin/audit/browser-agents">
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs">
              <Activity className="w-3.5 h-3.5 mr-1" />
              Audit Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Kill Switches */}
      <KillSwitchControl />

      {/* Provider Status */}
      <ProviderStatusCard />

      {/* Destination Allowlist */}
      <DestinationAllowlistTable />
    </div>
  );
}
