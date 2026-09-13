"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useAuthStore } from "@/features/auth/authStore";

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
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill out all required personal and clinical fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm p-0.5">
            <Image
              src="/logo.png"
              alt="PatientRisk Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain rounded-lg"
              priority
            />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">PatientRisk</span>
            <span className="text-[10px] uppercase font-mono font-semibold text-sky-600 tracking-wider">Predict • Prevent • Support</span>
          </div>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Clinical Staff Registration
        </h2>
        <p className="text-xs text-slate-500">
          Register for authorized clinical decision support and patient telemetry access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Staff Account Registered!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your medical credentials have been provisioned. Redirecting to clinician sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="error" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

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

              <Input
                label="Hospital Staff Email"
                type="email"
                placeholder="e.g. e.vance@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="h-4 w-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Clinical Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "DOCTOR" | "NURSE" | "ANALYST")}
                  options={[
                    { value: "DOCTOR", label: "Physician / Cardiologist" },
                    { value: "NURSE", label: "Triage / ICU Nurse" },
                    { value: "ANALYST", label: "Medical Data Analyst" },
                  ]}
                />
                <Select
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={[
                    { value: "Cardiology", label: "Cardiology" },
                    { value: "ICU", label: "Intensive Care Unit (ICU)" },
                    { value: "Emergency", label: "Emergency Medicine" },
                    { value: "General Medicine", label: "General Medicine" },
                  ]}
                />
              </div>

              <Input
                label="Medical License / Staff ID"
                placeholder="e.g. MD-882190"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                prefixIcon={<ShieldCheck className="h-4 w-4" />}
                helperText="Required for physician verification and audit logs"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  prefixIcon={<Lock className="h-4 w-4" />}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  prefixIcon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="default"
                isLoading={isLoading}
                className="w-full gap-2 text-sm shadow-sm mt-4"
              >
                <span>Complete Staff Registration</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            <span>Already registered? </span>
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold">
              Clinician Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
