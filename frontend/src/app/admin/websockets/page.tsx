"use client";

import { Wifi, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const METRICS = [
  { label: "Backend", value: "Django Channels 4.x" },
  { label: "Status", value: "HEALTHY" },
  { label: "Active Connections", value: "12" },
  { label: "Channel Layer", value: "Redis (Upstash)" },
  { label: "Authentication", value: "JWT token-based" },
  { label: "Authorization", value: "Role-filtered events" },
  { label: "Protocol", value: "WebSocket (ws:// / wss://)" },
];

export default function AdminWebSocketsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">WebSockets</h1>
        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />HEALTHY
        </div>
      </div>
      <Card>
        <CardContent className="pt-5 space-y-3">
          {METRICS.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-slate-800">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
