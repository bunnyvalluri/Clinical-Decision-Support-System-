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
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
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
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // If matching demo or user entered credentials:
    setTimeout(() => {
      if (!email || !password) {
        setError("Please provide both your hospital email and password.");
        setIsLoading(false);
        return;
      }

      // Check role based on email or default to Doctor
      if (email.includes("nurse")) {
        loginAsRole("NURSE");
      } else if (email.includes("admin")) {
        loginAsRole("ADMIN");
      } else if (email.includes("analyst")) {
        loginAsRole("ANALYST");
      } else {
        loginAsRole("DOCTOR");
      }

      router.push("/dashboard");
    }, 600);
  };

  const handleDemoSignIn = (role: "DOCTOR" | "NURSE" | "ANALYST" | "ADMIN") => {
    loginAsRole(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
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
          Clinician Access & Authentication
        </h2>
        <p className="text-xs text-slate-500">
          Sign in to access real-time patient risk telemetry and XAI models.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Instant Role Demo Buttons */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">1-Click Fast Clinician Sign In:</span>
            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600">Evaluation Mode</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("DOCTOR")}
              className="justify-start gap-2 text-xs border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-700"
            >
              <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />
              <span>Dr. Vance (Doctor)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("NURSE")}
              className="justify-start gap-2 text-xs border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-700"
            >
              <Activity className="h-3.5 w-3.5 text-blue-600" />
              <span>S. Jenkins (Nurse)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("ADMIN")}
              className="justify-start gap-2 text-xs border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-slate-700"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
              <span>Hospital Admin</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("ANALYST")}
              className="justify-start gap-2 text-xs border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-slate-700"
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>A. Rivera (Analyst)</span>
            </Button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
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

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefixIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Remember workstation session
              </label>
              <Link
                href="/forgot-password"
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="default"
              isLoading={isLoading}
              className="w-full gap-2 text-sm shadow-sm mt-2"
            >
              <span>Sign In to Clinical Decision Support</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            <span>New hospital clinical staff? </span>
            <Link
              href="/register"
              className="text-emerald-600 hover:text-emerald-700 font-bold"
            >
              Request staff account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400">
          Protected health information (PHI) is monitored under HIPAA Title II. Unauthorized access is
          strictly prohibited and audited.
        </div>
      </div>
    </div>
  );
}
