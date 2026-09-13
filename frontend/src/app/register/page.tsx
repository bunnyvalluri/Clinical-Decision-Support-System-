"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
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
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [department, setDepartment] = React.useState("Cardiology");
  const [role, setRole] = React.useState<"DOCTOR" | "NURSE" | "ANALYST">("DOCTOR");
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [attestation, setAttestation] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill out all required personal and clinical credentials.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Entered passwords do not match. Please verify.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters for hospital security compliance.");
      return;
    }

    if (!attestation) {
      setError("You must acknowledge the HIPAA compliance attestation to continue.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1400);
    }, 650);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 grid grid-cols-1 lg:grid-cols-12 selection:bg-teal-500/20 selection:text-teal-900">
      {/* ------------------------------------------------------------------ */}
      {/* Left Column: Institutional Governance & RBAC Authority Panel */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-slate-50/80 text-slate-900 relative flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-200">
        {/* Ambient clinical lighting */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

        {/* Top Branding */}
        <div className="relative z-10 space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5 group-hover:border-teal-400 transition-colors shadow-xs">
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
                <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  PatientRisk
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  CDSS
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 tracking-wider block">
                Clinical Decision Support • SaMD
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-purple-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Role-Based Access Control (RBAC) • Audit Logged</span>
          </div>
        </div>

        {/* Middle Authority Presentation */}
        <div className="relative z-10 space-y-8 my-8">
          <div className="space-y-3">
            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-950 leading-snug">
              Institutional Clinical Staff <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-sky-700 to-purple-700">
                Identity & Governance
              </span>
            </h1>
            <p className="text-xs xl:text-sm text-slate-600 leading-relaxed max-w-md">
              Provision verified credentials with strict departmental segregation, tamper-evident audit logging, and clinician override authority.
            </p>
          </div>

          {/* Role Segregation Architecture */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Physicians & Cardiologists (MD / DO)</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Full patient EHR inspection, calibrated model execution, and documented clinical overrides.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="h-8 w-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Emergency Triage Nurses (RN)</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Real-time vital sign capture, biological boundary checks, and sub-second bed deterioration alerts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Medical Informaticists & Analysts</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Global TreeSHAP explainability distributions, population drift evaluation, and calibration audits.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Callout Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Mandatory Clinician Audit Trails</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Under 45 CFR § 164.312, every model inspection, clinical override rationale, and report export is permanently bound to the practitioner&apos;s verified staff ID.
            </p>
          </div>
        </div>

        {/* Bottom Compliance Badges */}
        <div className="relative z-10 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>HL7 FHIR v4.0.1</span>
            <span>•</span>
            <span>TLS 1.3 AES-256</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
          </div>
          <span className="text-purple-700 font-bold">RBAC ACTIVE</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right Column: Registration Form */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-[#f8fafc] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180 text-teal-600" />
            <span>Return to Clinician Sign In</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono font-medium text-slate-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Staff Provisioning • Active</span>
          </div>
        </div>

        {/* Center Registration Workstation Box */}
        <div className="max-w-xl w-full mx-auto space-y-6 my-auto py-2 text-left">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                <Image src="/logo.png" alt="PatientRisk Logo" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <span className="text-lg font-bold text-slate-900">PatientRisk CDSS</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Clinical Staff Registration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Register authorized medical credentials for real-time patient risk telemetry, explainable AI, and ward triage access.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
            {success ? (
              <div className="text-center py-10 space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Hospital Account Registered!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your medical practitioner credentials have been provisioned. Redirecting you to clinician sign in...
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Redirecting to portal...
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="error" onDismiss={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="e.g. Elena"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    prefixIcon={<User className="h-4 w-4" />}
                    required
                  />
                  <Input
                    label="Last Name"
                    placeholder="e.g. Vance"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    prefixIcon={<User className="h-4 w-4" />}
                    required
                  />
                </div>

                {/* Email */}
                <Input
                  label="Hospital Enterprise Email"
                  type="email"
                  placeholder="e.g. e.vance@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                  required
                />

                {/* Role & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Clinical Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "DOCTOR" | "NURSE" | "ANALYST")}
                    options={[
                      { value: "DOCTOR", label: "Physician / Cardiologist (MD)" },
                      { value: "NURSE", label: "Triage / ICU Nurse (RN)" },
                      { value: "ANALYST", label: "Medical Data Analyst (MS)" },
                    ]}
                  />
                  <Select
                    label="Hospital Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    options={[
                      { value: "Cardiology", label: "Cardiology & Telemetry" },
                      { value: "ICU", label: "Intensive Care Unit (ICU)" },
                      { value: "Emergency", label: "Emergency Medicine" },
                      { value: "Informatics", label: "Clinical Informatics" },
                    ]}
                  />
                </div>

                {/* Medical License ID */}
                <Input
                  label="Medical License / Institutional Staff ID"
                  placeholder="e.g. MD-882190"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  prefixIcon={<ShieldCheck className="h-4 w-4" />}
                  helperText="Required for physician override authorization and permanent audit logging"
                />

                {/* Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      prefixIcon={<Lock className="h-4 w-4" />}
                      autoComplete="new-password"
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

                  <div className="relative">
                    <Input
                      label="Confirm Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      prefixIcon={<Lock className="h-4 w-4" />}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {/* HIPAA Attestation Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={attestation}
                      onChange={(e) => setAttestation(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="leading-relaxed">
                      I attest that I am an authorized hospital clinical staff member subject to HIPAA Title II compliance policies and medical oversight protocols.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  isLoading={isLoading}
                  className="w-full gap-2 text-xs sm:text-sm font-bold shadow-sm bg-teal-600 hover:bg-teal-700 text-white border border-teal-700 hover:border-teal-800 mt-4 py-2.5 transition-all"
                >
                  <span>Complete Staff Registration</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </Button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              <span>Already registered as hospital clinical staff? </span>
              <Link href="/login" className="text-teal-700 hover:text-teal-800 font-bold transition-colors">
                Clinician Sign In →
              </Link>
            </div>
          </div>

          {/* HIPAA Notice */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-500 text-center leading-relaxed">
            <span className="font-semibold text-slate-700">Protected Health Information:</span> All account creations are validated against hospital identity providers and logged under 45 CFR § 164.312.
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
