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
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Mail,
  Radio,
  Server,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsRole } = useAuthStore();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      if (!email || !password) {
        setError("Please enter your registered hospital email and password.");
        setIsLoading(false);
        return;
      }

      // Check role based on email or default to Doctor
      if (email.toLowerCase().includes("nurse")) {
        loginAsRole("NURSE");
      } else if (email.toLowerCase().includes("admin")) {
        loginAsRole("ADMIN");
      } else if (email.toLowerCase().includes("analyst")) {
        loginAsRole("ANALYST");
      } else {
        loginAsRole("DOCTOR");
      }

      router.push("/dashboard");
    }, 500);
  };

  const handleQuickDemo = (role: "DOCTOR" | "NURSE" | "ANALYST" | "ADMIN") => {
    loginAsRole(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-teal-500/20 selection:text-teal-900">
      {/* ------------------------------------------------------------------ */}
      {/* Left Column: Brand & Clinical Authority Panel (Desktop) */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-slate-950 text-white relative flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-800">
        {/* Ambient clinical lighting effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        {/* Top Branding */}
        <div className="relative z-10 space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-0.5 group-hover:border-teal-400 transition-colors shadow-sm">
              <Image
                src="/logo.png"
                alt="PatientRisk Logo"
                width={44}
                height={44}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-teal-300 transition-colors">
                  PatientRisk
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800/80">
                  CDSS
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider block">
                Clinical Decision Support • SaMD
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>FDA SaMD Class II Aligned • HIPAA Title II</span>
          </div>
        </div>

        {/* Middle Authority Presentation */}
        <div className="relative z-10 space-y-8 my-8">
          <div className="space-y-3">
            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
              High-Acuity Telemetry & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-sky-400">
                Calibrated Explainable AI
              </span>
            </h1>
            <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-md">
              Continuous multi-class patient risk stratification, transparent TreeSHAP feature attributions, and human-in-the-loop clinical override workflows.
            </p>
          </div>

          {/* Core Institutional Highlights */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="h-8 w-8 rounded-lg bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Platt-Calibrated Multiclass Inference</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Brier score 0.0027 on held-out patient cohorts with 0.136ms sub-millisecond execution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="h-8 w-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Live TreeSHAP Factor Attributions</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Decomposes risk probabilities into signed clinical weights relative to baseline $E[f(x)]$.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Physician Override Sovereignty</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Mandatory documented rationales bound to PostgreSQL audit records preserve human agency.
                </p>
              </div>
            </div>
          </div>

          {/* Clinician Testimonial Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                EV
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Dr. Elena Vance, MD</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <span className="text-[10px] text-slate-400">Chief of Cardiology & ICU Telemetry</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed">
              &quot;The platform gives our intensive care team immediate risk visibility during acute admissions while preserving attending diagnostic sovereignty.&quot;
            </p>
          </div>
        </div>

        {/* Bottom Compliance Badges */}
        <div className="relative z-10 pt-4 border-t border-slate-800/90 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>HL7 FHIR v4.0.1</span>
            <span>•</span>
            <span>TLS 1.3 AES-256</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
          </div>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right Column: Authentication Form */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-[#f8fafc] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180 text-teal-600" />
            <span>Return to Hospital Home</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono font-medium text-slate-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Node 04 • TLS 1.3 Enforced</span>
          </div>
        </div>

        {/* Center Authentication Workstation Box */}
        <div className="max-w-lg w-full mx-auto space-y-8 my-auto py-4">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                <Image src="/logo.png" alt="PatientRisk Logo" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <span className="text-lg font-bold text-slate-900">PatientRisk CDSS</span>
            </Link>
          </div>

          <div className="space-y-2 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Clinician Authentication
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Authorized clinical staff access to active ward telemetry, patient cohorts, and algorithmic risk models.
            </p>
          </div>

          {/* 1-Click Fast Clinician Sandbox Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3 text-left">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  1-Click Sandbox Login
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600 border-slate-200">
                Evaluation Mode
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Doctor */}
              <button
                type="button"
                onClick={() => handleQuickDemo("DOCTOR")}
                className="group p-3 rounded-xl border border-slate-200/90 bg-white hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs">
                    MD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      Dr. Elena Vance
                    </h4>
                    <p className="text-[10px] text-slate-500">Cardiology & ICU</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>

              {/* Nurse */}
              <button
                type="button"
                onClick={() => handleQuickDemo("NURSE")}
                className="group p-3 rounded-xl border border-slate-200/90 bg-white hover:border-sky-400 hover:bg-sky-50/30 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-xs">
                    RN
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                      Sarah Jenkins
                    </h4>
                    <p className="text-[10px] text-slate-500">Emergency Triage</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-sky-600 transition-colors" />
              </button>

              {/* Informaticist */}
              <button
                type="button"
                onClick={() => handleQuickDemo("ANALYST")}
                className="group p-3 rounded-xl border border-slate-200/90 bg-white hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs">
                    BI
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      Alex Rivera
                    </h4>
                    <p className="text-[10px] text-slate-500">SHAP & Telemetry</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
              </button>

              {/* IT Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo("ADMIN")}
                className="group p-3 rounded-xl border border-slate-200/90 bg-white hover:border-purple-400 hover:bg-purple-50/30 hover:shadow-xs transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
                    IT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      Hospital Admin
                    </h4>
                    <p className="text-[10px] text-slate-500">Registry & Audit</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Form Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-[#f8fafc] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Lock className="h-3 w-3" />
              Or Sign In With Enterprise Credentials
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Credentials Authentication Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="error" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Input
                label="Hospital Staff Email"
                type="email"
                placeholder="e.g. dr.vance@hospital.org"
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
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Remember hospital terminal session</span>
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
                className="w-full gap-2 text-xs sm:text-sm font-bold shadow-md bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 mt-2 py-2.5 transition-all"
              >
                <span>Sign In to Clinical Decision Support</span>
                <ArrowRight className="h-4 w-4 text-teal-400" />
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              <span>New hospital clinical practitioner? </span>
              <Link
                href="/register"
                className="text-teal-700 hover:text-teal-800 font-bold transition-colors"
              >
                Request clinical staff account →
              </Link>
            </div>
          </div>

          {/* HIPAA & Compliance Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-500 text-center leading-relaxed">
            <span className="font-semibold text-slate-700">HIPAA Security Notice (45 CFR § 164.312):</span> Protected Health Information access is cryptographically audited. Unauthorized access is prohibited by federal statute.
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
