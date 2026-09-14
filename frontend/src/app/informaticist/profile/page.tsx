"use client";

import * as React from "react";
import { useAuthStore } from "@/features/auth/authStore";
import {
  Award,
  BadgeCheck,
  Brain,
  Building2,
  CheckCircle2,
  Copy,
  Cpu,
  Fingerprint,
  Key,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InformaticistProfilePage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = React.useState(false);

  const keyString = "0x7F81A4B9C82E5D1A3F019B882419C8F029471AB6";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(keyString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
              <Brain className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{user?.full_name || "Alex Rivera, MSc"}</h1>
                <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-xs">
                  Lead Clinical Informaticist
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-xs">
                  SaMD Level 2 Officer
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Department of Clinical Informatics &amp; Machine Learning Engineering · St. Jude Medical Center
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                <span>License: <strong className="text-slate-200 font-mono">{user?.license_number || "BIO-10923"}</strong></span>
                <span>Role: <strong className="text-slate-200">Lead Informaticist &amp; Data Scientist</strong></span>
                <span>Session: <strong className="text-emerald-400">Authenticated (2FA Enforced)</strong></span>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Email Address</p>
                <p className="text-xs font-medium text-slate-900 mt-0.5">{user?.email || "alex.rivera@hospital.org"}</p>
                <p className="text-[10px] text-slate-400">Internal Hospital LDAP</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Building2 className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Clinical Department</p>
                <p className="text-xs font-medium text-slate-900 mt-0.5">{user?.department || "Clinical Informatics & Data Science"}</p>
                <p className="text-[10px] text-slate-400">Division of Digital Health</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Board Certification</p>
                <p className="text-xs font-medium text-slate-900 mt-0.5">AMIA / ABPM Clinical Informatics</p>
                <p className="text-[10px] text-emerald-600 font-medium">Valid through 2029</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Regulatory Authorizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              SaMD Security &amp; Deployment Authorizations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Role-based access permissions assigned to this user profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {[
              { label: "Production Model Promotion (Zero-Downtime)", desc: "Authority to promote candidate models to champion status", status: "AUTHORIZED", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "Population Drift Override & Retraining Trigger", desc: "Override PSI threshold triggers and launch shadow retraining DAGs", status: "AUTHORIZED", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "21 CFR Part 11 Electronic Attestation", desc: "Cryptographic sign-off on regulatory model validation dossiers", status: "AUTHORIZED", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "Raw Patient Telemetry & FHIR Access", desc: "Inspection of de-identified feature store vectors", status: "AUTHORIZED", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{p.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${p.badge}`}>
                  {p.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assigned MLOps Pipelines */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-600" />
              Assigned Pipelines &amp; Systems
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Active clinical machine learning pipelines under this lead&apos;s direct supervision.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {[
              { name: "RandomForestClassifier v1.0.0 (Champion)", desc: "Acute Inpatient Sepsis & Shock Telemetry (14,820 inferences)", status: "HEALTHY", uptime: "99.99%" },
              { name: "XGBoost-SepsisEarly v1.2.0 (Shadow)", desc: "Shadow mode testing against live ICU streams", status: "CANDIDATE", uptime: "99.95%" },
              { name: "FHIR R4 Streaming Ingestion Pipeline", desc: "Kafka / HL7 message parser and MICE imputation store", status: "NORMAL", uptime: "100.0%" },
              { name: "Clinical AI LLM Safety Evaluator", desc: "RAG grounding validator cross-referencing SSC-2021 guidelines", status: "ACTIVE", uptime: "100.0%" },
            ].map((sys, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{sys.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sys.desc}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    {sys.status}
                  </Badge>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sys.uptime}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cryptographic Signature Key Card */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-600" />
            21 CFR Part 11 Electronic Signature Key
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Hardware-bound cryptographic token used to validate model promotions and audit reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Public Signing Key Fingerprint (Ed25519):</p>
            <p className="font-mono text-xs font-bold text-slate-900 mt-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
              {keyString}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyKey}
            className="text-xs h-8 border-slate-200 shrink-0"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "Copied to Clipboard" : "Copy Signature Key"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
