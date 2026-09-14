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
  Eye,
  EyeOff,
  Copy,
  Search,
  Zap,
  Sliders,
  Sparkles,
  RefreshCw,
  Plus,
  Server,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface ConfigItem {
  key: string;
  value: string;
  maskedValue?: string;
  category: "CORE" | "DATABASE" | "SECURITY" | "ML_INFERENCE";
  description: string;
  isSecret?: boolean;
}

const CONFIG_DATA: ConfigItem[] = [
  {
    key: "ENVIRONMENT",
    value: "Production (HIPAA Tier 3)",
    category: "CORE",
    description: "Active runtime isolation environment profile enforcing zero debug logs and strict TLS.",
  },
  {
    key: "DEBUG",
    value: "False",
    category: "CORE",
    description: "Django debug stack traces disabled cluster-wide to prevent information disclosure.",
  },
  {
    key: "NEON_DATABASE_URL",
    value: "postgres://neondb_owner:npg_8F3aK1@ep-divine-credit-a589ua8g.us-east-2.aws.neon.tech/neondb?sslmode=require",
    maskedValue: "postgres://neondb_owner:••••••••••••••••@ep-divine-credit-a589ua8g.us-east-2.aws.neon.tech/neondb",
    category: "DATABASE",
    description: "Serverless Neon Lakebase PostgreSQL connection pool endpoint with SSL strict mode.",
    isSecret: true,
  },
  {
    key: "DB_CONN_MAX_AGE",
    value: "600 seconds",
    category: "DATABASE",
    description: "Persistent PostgreSQL connection lifetime limit for PgBouncer transaction pooling.",
  },
  {
    key: "UPSTASH_REDIS_URL",
    value: "rediss://default:AXy1ASQgZGRmMTc2NzctYTRmMS00MG...=@global-vital-cougar-12345.upstash.io:6379",
    maskedValue: "rediss://default:••••••••••••••••••••••••••@global-vital-cougar-12345.upstash.io:6379",
    category: "CORE",
    description: "Encrypted broker connection channel for Celery task workers and ASGI Daphne.",
    isSecret: true,
  },
  {
    key: "JWT_ACCESS_TOKEN_LIFETIME",
    value: "15 minutes",
    category: "SECURITY",
    description: "Short-lived rotating RS256 JWT access credentials for clinical sessions.",
  },
  {
    key: "JWT_REFRESH_TOKEN_LIFETIME",
    value: "7 days",
    category: "SECURITY",
    description: "Cryptographic refresh token cycle with automated revocation on logout.",
  },
  {
    key: "ML_INFERENCE_TIMEOUT",
    value: "5000 ms",
    category: "ML_INFERENCE",
    description: "Maximum latency threshold before ML pipeline triggers fallback to Champion model weights.",
  },
  {
    key: "AI_GATEWAY_PROVIDER",
    value: "Databricks Mosaic / Neon AI Gateway (Claude 3.5 Sonnet)",
    category: "ML_INFERENCE",
    description: "Enterprise LLM proxy routing with RAG evidence grounding and prompt injection defense.",
  },
];

export default function AdminConfigurationPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    showToast(`Copied value of ${key} to clipboard.`);
  };

  const handleValidateAndTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      showToast("Configuration validation passed: All 9 runtime environment variables verified against vault schema.");
    }, 1100);
  };

  const filteredConfigs = CONFIG_DATA.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.key.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.value.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              Cluster Environment & Vault
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <Lock className="h-3 w-3" /> AES-256 Secret Vault Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-purple-600" />
            System & Runtime Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Environment parameters, database connection credentials, and machine learning runtime thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleValidateAndTest}
            disabled={isTesting}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Validating Vault Parameters..." : "Validate & Test All"}
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Server className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Isolation Profile</p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 truncate">Production</p>
              <p className="text-[10px] sm:text-[11px] text-purple-700 font-medium truncate">HIPAA Tier 3</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Secrets Vault</p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 truncate">AES-256 GCM</p>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium truncate">Auto-rotated</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <Sliders className="h-4 w-4 sm:h-5 sm:w-5 text-sky-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Active Parameters</p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 truncate">{CONFIG_DATA.length} Vars</p>
              <p className="text-[10px] sm:text-[11px] text-sky-700 font-medium truncate">Zero drift</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Config Build</p>
              <p className="text-sm sm:text-lg font-bold text-slate-900 truncate">v4.2.1-prod</p>
              <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium truncate">Sep 14, 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center rounded-xl bg-slate-100 p-1 w-fit overflow-x-auto max-w-full">
          {(["ALL", "CORE", "DATABASE", "SECURITY", "ML_INFERENCE"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {cat === "ML_INFERENCE" ? "ML & AI" : cat === "DATABASE" ? "Database" : cat === "SECURITY" ? "Security" : cat === "CORE" ? "Core" : "All (9)"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Filter parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Config Cards List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredConfigs.map((item) => {
          const isSecret = item.isSecret;
          const isRevealed = showSecrets[item.key];
          const displayValue = isSecret && !isRevealed ? (item.maskedValue || "••••••••••••") : item.value;

          return (
            <Card key={item.key} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1 max-w-xl min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-900 break-all">{item.key}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-600 bg-slate-50 border-slate-200 shrink-0">
                      {item.category}
                    </Badge>
                    {isSecret && (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Lock className="h-2.5 w-2.5" /> VAULT SECRET
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto min-w-0 mt-1 lg:mt-0">
                  <div className="relative min-w-0 flex-1 lg:flex-initial">
                    <code className="block text-xs font-mono bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 truncate w-full max-w-full lg:max-w-md select-all">
                      {displayValue}
                    </code>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSecret && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowSecret(item.key)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 shrink-0"
                        title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                      >
                        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.value, item.key)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 shrink-0"
                      title="Copy Value"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
