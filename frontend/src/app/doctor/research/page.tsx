"use client";

import * as React from "react";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchIntelligence } from "@/components/web/SearchIntelligence";
import { EvidenceResearchWorkspace } from "@/components/web/EvidenceResearchWorkspace";
import { ShieldCheck, BookOpen, Search } from "lucide-react";

export default function DoctorResearchPage() {
  return (
    <DoctorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Evidence & Guideline Research</h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Providers Only
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Controlled external literature discovery via Firecrawl Web Intelligence. All synthesis is non-diagnostic evidence requiring human clinician review.
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
            <TabsTrigger value="evidence" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Evidence Synthesis Mode
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Medical Literature Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evidence" className="pt-4">
            <EvidenceResearchWorkspace role="DOCTOR" defaultMode="MEDICAL_EVIDENCE" />
          </TabsContent>

          <TabsContent value="search" className="pt-4">
            <SearchIntelligence role="DOCTOR" />
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
}
