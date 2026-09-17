"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { WebHealthDashboard } from "@/components/web/WebHealthDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdminWebHealthPage() {
  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/web-intelligence">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Firecrawl Health & Telemetry</h1>
            <p className="text-xs text-slate-500">
              Comprehensive telemetry, circuit breaker metrics, and queue analytics.
            </p>
          </div>
        </div>

        <WebHealthDashboard />
      </div>
    </AdminLayout>
  );
}
