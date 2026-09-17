"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sliders,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { securityService } from "@/services/securityService";

export default function SecurityToolsPage() {
  const [tools, setTools] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    securityService
      .getTools()
      .then((data) => setTools(data.tools || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-sm">Loading tool inventory...</div>
        ) : (
          tools.map((tool, idx) => (
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
          ))
        )}
      </div>
    </div>
  );
}
