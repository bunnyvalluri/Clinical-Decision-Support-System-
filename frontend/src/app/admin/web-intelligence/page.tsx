"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrawlManager } from "@/components/web/CrawlManager";
import { SearchIntelligence } from "@/components/web/SearchIntelligence";
import { WebHealthDashboard } from "@/components/web/WebHealthDashboard";
import { Globe, Server, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminWebIntelligencePage() {
  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Globe className="h-6 w-6 text-blue-600" />
              Web Intelligence Administration
            </h1>
            <p className="text-xs text-slate-500">
              Manage Firecrawl scraping infrastructure, domain security policies, and asynchronous Celery crawls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/web-intelligence/sources">
              <Button variant="outline" size="sm" className="text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                Domain Policies
              </Button>
            </Link>
            <Link href="/admin/web-intelligence/health">
              <Button variant="outline" size="sm" className="text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                <Activity className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Live Telemetry
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="crawls" className="w-full">
          <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
            <TabsTrigger value="crawls" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <Globe className="mr-1.5 h-3.5 w-3.5" /> Crawl & Ingestion Jobs
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <Activity className="mr-1.5 h-3.5 w-3.5" /> Diagnostic Web Search
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <Server className="mr-1.5 h-3.5 w-3.5" /> Telemetry Snapshot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crawls" className="pt-4">
            <CrawlManager />
          </TabsContent>

          <TabsContent value="search" className="pt-4">
            <SearchIntelligence role="IT_ADMIN" />
          </TabsContent>

          <TabsContent value="health" className="pt-4">
            <WebHealthDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
