"use client";

import * as React from "react";
import { InformaticistLayout } from "@/components/layout/InformaticistLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchIntelligence } from "@/components/web/SearchIntelligence";
import { CrawlManager } from "@/components/web/CrawlManager";
import { EvidenceResearchWorkspace } from "@/components/web/EvidenceResearchWorkspace";
import { Cpu, Search, Globe, BookOpen } from "lucide-react";

export default function InformaticistResearchPage() {
  return (
    <InformaticistLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medical Informatics & ML Research Workbench</h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
              <Cpu className="h-3.5 w-3.5" />
              Advanced Web Retrieval
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Literature mining, clinical trial evidence synthesis, and dataset candidate discovery via Firecrawl.
          </p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
            <TabsTrigger value="search" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <Search className="mr-1.5 h-3.5 w-3.5" /> Literature Search
            </TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> ML & Trial Evidence
            </TabsTrigger>
            <TabsTrigger value="crawl" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs">
              <Globe className="mr-1.5 h-3.5 w-3.5" /> Site Crawler & Ingestion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="pt-4">
            <SearchIntelligence role="MEDICAL_INFORMATICIST" />
          </TabsContent>

          <TabsContent value="evidence" className="pt-4">
            <EvidenceResearchWorkspace role="MEDICAL_INFORMATICIST" defaultMode="ML_RESEARCH" />
          </TabsContent>

          <TabsContent value="crawl" className="pt-4">
            <CrawlManager />
          </TabsContent>
        </Tabs>
      </div>
    </InformaticistLayout>
  );
}
