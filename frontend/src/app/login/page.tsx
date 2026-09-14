"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  HeartPulse,
  Key,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  Zap,
  Building2,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, getRoleHomeRoute, type RoleType } from "@/features/auth/authStore";

const DEMO_ROLES = [
  {
    role: "DOCTOR" as RoleType,
    initials: "MD",
    badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-700",
    borderHover: "hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/20",
    accentBg: "bg-emerald-600 hover:bg-emerald-700",
    title: "Attending Physician / Cardiologist",
    department: "Cardiology & Intensive Care Unit",
    credentials: "dr.elena.vance@hospital.org",
    scope: "Full EHR, TreeSHAP feature attributions, sovereign overrides",
    icon: Stethoscope,
  },
  {
    role: "NURSE" as RoleType,
    initials: "RN",
    badgeColor: "bg-sky-50 border-sky-200 text-sky-700",
    borderHover: "hover:border-sky-500 hover:shadow-md hover:bg-sky-50/20",
    accentBg: "bg-sky-600 hover:bg-sky-700",
    title: "Emergency Triage Nurse",
    department: "Emergency Medicine & Bedside Triage",
    credentials: "s.jenkins@hospital.org",
    scope: "Rapid triage scoring, vital signs entry, acute deterioration alerts",
    icon: HeartPulse,
  },
  {
    role: "ANALYST" as RoleType,
    initials: "MI",
    badgeColor: "bg-purple-50 border-purple-200 text-purple-700",
    borderHover: "hover:border-purple-500 hover:shadow-md hover:bg-purple-50/20",
    accentBg: "bg-purple-600 hover:bg-purple-700",
    title: "Medical Informaticist / MLOps",
    department: "Clinical Informatics & Algorithmic Governance",
    credentials: "alex.rivera@hospital.org",
    scope: "Champion/Challenger registry, KS drift surveillance, 21 CFR Part 11 audits",
    icon: Activity,
  },
  {
    role: "ADMIN" as RoleType,
    initials: "IT",
    badgeColor: "bg-slate-100 border-slate-300 text-slate-800",
    borderHover: "hover:border-slate-600 hover:shadow-md hover:bg-slate-50",
    accentBg: "bg-slate-900 hover:bg-slate-800",
    title: "IT Infrastructure Administrator",
    department: "IT Systems & Clinical Cybersecurity",
    credentials: "m.chen@hospital.org",
    scope: "Zero-trust RBAC matrix, Neon DB pools, Celery workers, intrusion alarms",
    icon: ShieldCheck,
  },
  {
    role: "PATIENT" as RoleType,
    initials: "PT",
    badgeColor: "bg-teal-50 border-teal-200 text-teal-700",
    borderHover: "hover:border-teal-500 hover:shadow-md hover:bg-teal-50/20",
    accentBg: "bg-teal-600 hover:bg-teal-700",
    title: "Patient / Family Health Portal",
    department: "Cardiology Patient Remote Monitoring",
    credentials: "eleanor.ward@patient.hospital.org",
    scope: "Personal telemetry trends, AI risk report cards, physician messages",
    icon: Users,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, loginAsRole } = useAuthStore();

  const [activeTab, setActiveTab] = React.useState<"sandbox" | "credentials">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedRole, setCopiedRole] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your registered hospital email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const profile = await loginWithCredentials(email.trim(), password);
      router.push(getRoleHomeRoute(profile.role));
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string; error?: string } } };
      setError(
        apiErr?.response?.data?.detail ||
        apiErr?.response?.data?.error ||
        "Authentication failed. Please verify your hospital credentials or use the 1-Click Sandbox."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: RoleType) => {
    loginAsRole(role);
    router.push(getRoleHomeRoute(role));
  };

  const handlePrefill = (roleItem: typeof DEMO_ROLES[0]) => {
    setEmail(roleItem.credentials);
    setPassword("ClinicalSecure#2026");
    setActiveTab("credentials");
  };

  const handleCopyCredentials = (e: React.MouseEvent, creds: string, role: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(creds);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-teal-500/20 selection:text-teal-900 antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* Left Column: Brand, Clinical Authority & Telemetry Showcase       */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-white text-slate-900 relative flex-col justify-between p-8 xl:p-12 overflow-hidden border-r border-slate-200/90 shadow-sm">
        {/* Subtle Ambient Backdrops */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none opacity-80" />

        {/* Top Branding */}
        <div className="relative z-10 space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm group-hover:border-teal-500 transition-all">
              <Image
                src="/logo.png"
                alt="PatientRisk CDSS Logo"
                width={44}
                height={44}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950 group-hover:text-teal-700 transition-colors">
                  PatientRisk
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  CDSS v2.0
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 tracking-wider block">
                Clinical Decision Support System
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-semibold text-emerald-800 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              FDA SaMD Class II Aligned
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-medium text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              21 CFR Part 11 &amp; HIPAA § 164.312
            </span>
          </div>
        </div>

        {/* Center Authority & Live Simulated Telemetry Widget */}
        <div className="relative z-10 space-y-6 my-auto py-6">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-3xl font-black tracking-tight text-slate-950 leading-tight">
              Clinical Intelligence &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-sky-600">
                Diagnostic Sovereignty
              </span>
            </h1>
            <p className="text-xs xl:text-sm text-slate-600 leading-relaxed">
              Multi-parameter real-time patient risk stratification, TreeSHAP clinical feature attributions, and sovereign clinician override workflows.
            </p>
          </div>

          {/* Real-time Telemetry Pulse Simulation Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 via-white to-teal-50/30 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
                  Live ICU Telemetry Feed
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                0.12ms Latency
              </span>
            </div>

            {/* High-Fidelity ECG Waveform */}
            <div className="relative h-14 w-full overflow-hidden rounded-xl bg-slate-950 px-3 flex items-center shadow-inner">
              <svg className="h-10 w-full" viewBox="0 0 320 40" preserveAspectRatio="none">
                <path
                  d="M0,20 L30,20 L35,18 L40,22 L45,20 L50,20 L55,10 L60,32 L65,4 L70,26 L75,20 L85,20 L95,17 L105,20 L130,20 L135,18 L140,22 L145,20 L150,20 L155,10 L160,32 L165,4 L170,26 L175,20 L185,20 L195,17 L205,20 L230,20 L235,18 L240,22 L245,20 L250,20 L255,10 L260,32 L265,4 L270,26 L275,20 L285,20 L295,17 L305,20 L320,20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute right-3 top-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold bg-slate-900/90 px-2 py-0.5 rounded-md border border-emerald-500/30 backdrop-blur-xs">
                <HeartPulse className="h-3 w-3 animate-pulse text-rose-400" />
                <span>72 BPM · 99% SpO2 · 120/80</span>
              </div>
            </div>

            {/* TreeSHAP Feature Attributions Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase font-bold">
                <span>Key Predictive Biomarkers</span>
                <span className="text-teal-700 font-semibold">TreeSHAP Impact</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                  <span className="font-semibold text-slate-800">Troponin I (High-Sensitivity)</span>
                  <span className="font-mono font-bold text-rose-600">+38% Risk</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white border border-slate-100">
                  <span className="font-semibold text-slate-800">Serum Lactate (Venous)</span>
                  <span className="font-mono font-bold text-amber-600">+24% Risk</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Inference Calibration</span>
                <span className="font-bold text-teal-700">98.4% Platt Calibrated</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Regulatory Standard</span>
                <span className="font-bold text-sky-700">SaMD Class II BPY-2666</span>
              </div>
            </div>
          </div>

          {/* Attending Physician Endorsement */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              EV
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">Dr. Elena Vance, MD</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-slate-500">
                  NPI-948201
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 truncate">Chief of Cardiology &amp; ICU Telemetry</p>
              <p className="text-[10px] text-slate-600 italic mt-0.5 leading-snug line-clamp-2">
                &quot;The platform gives our intensive care team immediate risk visibility while preserving clinician diagnostic sovereignty.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Compliance Bar */}
        <div className="relative z-10 pt-4 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span>HL7 FHIR v4.0.1</span>
            <span>•</span>
            <span>TLS 1.3 AES-256</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
          </div>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right Column: Workstation Authentication Form                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-5 sm:p-10 xl:p-14 overflow-y-auto">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200/70">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180 text-teal-600" />
            <span>Return to Hospital Portal</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono font-medium text-slate-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Node 04 · US-East-2 · TLS 1.3 Strict</span>
          </div>
        </div>

        {/* Center Main Workstation Container */}
        <div className="max-w-xl w-full mx-auto space-y-6 my-auto py-4">
          {/* Mobile Logo Branding (visible on < 1024px) */}
          <div className="lg:hidden text-center space-y-2 mb-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                <Image src="/logo.png" alt="PatientRisk Logo" width={36} height={36} className="rounded-lg object-contain" />
              </div>
              <div className="text-left">
                <span className="text-base font-extrabold text-slate-950 block leading-tight">PatientRisk CDSS</span>
                <span className="text-[10px] text-slate-500 font-mono block">Clinical Decision Support</span>
              </div>
            </Link>
          </div>

          {/* Header Title */}
          <div className="space-y-1.5 text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Clinical Workstation Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Authorized clinical staff access to active ward telemetry, patient cohorts, and algorithmic risk models.
            </p>
          </div>

          {/* Interactive Mode Segmented Switch */}
          <div className="p-1 rounded-xl bg-slate-200/80 border border-slate-300/70 grid grid-cols-2 gap-1 text-xs select-none shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("credentials")}
              className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "credentials"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-teal-600" />
              <span>Enterprise Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sandbox")}
              className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "sandbox"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>1-Click Sandbox (Instant)</span>
            </button>
          </div>

          {/* TAB 1: 1-Click Fast Sandbox Selector */}
          {activeTab === "sandbox" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3.5 text-left animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Evaluation Sandbox Accounts
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold self-start sm:self-auto">
                  Instant Authorization Active
                </span>
              </div>

              <div className="space-y-2.5">
                {DEMO_ROLES.map((roleItem) => {
                  const Icon = roleItem.icon;
                  return (
                    <div
                      key={roleItem.role}
                      onClick={() => handleQuickDemo(roleItem.role)}
                      className={`group p-3.5 rounded-xl border border-slate-200 bg-white ${roleItem.borderHover} transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-xl ${roleItem.badgeColor} border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                              {roleItem.title}
                            </h4>
                            {roleItem.role === "PATIENT" && (
                              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[9px] py-0">
                                Patient Portal
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{roleItem.department}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{roleItem.scope}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCredentials(e, roleItem.credentials, roleItem.role)}
                          title="Copy Email"
                          className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-600 transition-colors flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedRole === roleItem.role ? "Copied" : "Copy"}</span>
                        </button>
                        <Button
                          size="sm"
                          className={`text-xs h-8 px-3 font-bold text-white shadow-xs ${roleItem.accentBg}`}
                        >
                          <span>Launch</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
                <span>Want to test custom credentials?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("credentials")}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Switch to Credentials Form →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Credentials Authentication Form */}
          {activeTab === "credentials" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-left animate-in fade-in duration-200 space-y-4">
              {/* Quick-Fill Pills for convenient credential testing */}
              <div className="space-y-1.5 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  Quick-Fill Verified Credentials:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_ROLES.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handlePrefill(r)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 transition-colors cursor-pointer"
                    >
                      {r.initials} · {r.role === "PATIENT" ? "Patient" : r.role}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="error" onDismiss={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <Input
                  label="Hospital Staff or Patient Email"
                  type="email"
                  placeholder="e.g. dr.elena.vance@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                  required
                />

                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      prefixIcon={<Lock className="h-4 w-4" />}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <span>Remember terminal session</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-teal-700 hover:text-teal-800 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  isLoading={isLoading}
                  className="w-full gap-2 text-xs sm:text-sm font-bold shadow-sm bg-teal-600 hover:bg-teal-700 text-white border border-teal-700 mt-2 py-2.5 transition-all cursor-pointer"
                >
                  <span>Sign In to Clinical Decision Support</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </Button>

                {/* Institutional SSO Options */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-[10px] font-mono text-slate-400">
                      Federated Identity Providers
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickDemo("DOCTOR")}
                  className="w-full text-xs font-semibold border-slate-200 hover:bg-slate-50 gap-2 h-9"
                >
                  <Building2 className="h-4 w-4 text-slate-600" />
                  <span>Single Sign-On (Epic EHR / SMART on FHIR)</span>
                </Button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                <span>New clinical practitioner or patient? </span>
                <Link
                  href="/register"
                  className="text-teal-700 hover:text-teal-800 font-bold transition-colors"
                >
                  Register new account →
                </Link>
              </div>
            </div>
          )}

          {/* HIPAA & Regulatory Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-[11px] text-slate-600 text-center leading-relaxed">
            <span className="font-bold text-slate-800">HIPAA Security Notice (45 CFR § 164.312):</span> Protected Health Information access is cryptographically audited with role-based access enforcement.
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-[11px] text-slate-400 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PatientRisk CDSS Enterprise v1.0.0</span>
          <span>Project BPY-CSE-2666 • Assistive Software as a Medical Device</span>
        </div>
      </div>
    </div>
  );
}
