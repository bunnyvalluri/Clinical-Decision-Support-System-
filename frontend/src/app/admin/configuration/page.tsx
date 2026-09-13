"use client";

import * as React from "react";
import {
  Settings,
  Shield,
  Database,
  Cpu,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConfigItem {
  key: string;
  value: string;
  category: "CORE" | "DATABASE" | "SECURITY" | "ML_INFERENCE";
  description: string;
}

const CONFIG_DATA: ConfigItem[] = [
  { key: "ENVIRONMENT", value: "Production (HIPAA Tier 3)", category: "CORE", description: "Active runtime isolation environment profile." },
  { key: "DEBUG", value: "False", category: "CORE", description: "Django debug stack traces disabled for security." },
  { key: "NEON_DATABASE_URL", value: "postgres://neondb_owner:••••••••@ep-dry-water.us-east-2.neon.tech/neondb", category: "DATABASE", description: "Serverless Neon Lakebase PostgreSQL connection." },
  { key: "DB_CONN_MAX_AGE", value: "600 seconds", category: "DATABASE", description: "Persistent PostgreSQL connection lifetime limit." },
  { key: "UPSTASH_REDIS_TLS", value: "Enabled (rediss://)", category: "CORE", description: "Encrypted broker channel for Celery and ASGI Daphne." },
  { key: "JWT_ACCESS_TOKEN_LIFETIME", value: "15 minutes", category: "SECURITY", description: "Short-lived rotating OAuth2/JWT access credentials." },
  { key: "JWT_REFRESH_TOKEN_LIFETIME", value: "7 days", category: "SECURITY", description: "Encrypted refresh token cycle with blacklist on logout." },
  { key: "ML_INFERENCE_TIMEOUT", value: "5000 ms", category: "ML_INFERENCE", description: "Maximum threshold before ML pipeline fails over to champion RF." },
  { key: "AI_GATEWAY_PROVIDER", value: "Databricks Mosaic / Azure OpenAI", category: "ML_INFERENCE", description: "Upstream LLM gateway for clinician clinical chat assistance." },
];

export default function AdminConfigurationPage() {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-800" />
            System & Runtime Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Environment variables, database connection parameters, and security threshold flags.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Parameters Verified
            </span>
          )}
          <Button onClick={handleSave} size="sm" className="text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800">
            <Save className="h-3.5 w-3.5" /> Validate & Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {CONFIG_DATA.map((item) => (
          <Card key={item.key} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-900">{item.key}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold text-slate-500 border-slate-200">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200">
                  {item.value}
                </code>
                <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
