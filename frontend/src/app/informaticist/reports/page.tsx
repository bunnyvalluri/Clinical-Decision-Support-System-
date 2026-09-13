"use client";

import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function InformaticistReportsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <Card>
        <CardContent className="py-16 text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="text-slate-500">Informatics reports will appear here once generated.</p>
        </CardContent>
      </Card>
    </div>
  );
}
