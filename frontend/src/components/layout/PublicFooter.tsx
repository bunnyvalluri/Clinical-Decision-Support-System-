import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HeartPulse, Lock, ShieldCheck } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-14">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-slate-200">
          {/* Brand & Identity Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                <Image
                  src="/logo.png"
                  alt="HealthNova AI Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                  {BRAND_CONFIG.brandName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Clinical Decision Support &bull; Patient Risk Intelligence
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Real-time machine learning risk prediction and TreeSHAP explainability engineered to assist hospital cardiologists, triage nurses, and multidisciplinary care teams.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 px-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2 text-[11px] font-mono font-medium text-emerald-700 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Authoritative Neon DB Live</span>
              </div>
            </div>
          </div>


          {/* Product Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/features" className="hover:text-teal-700 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#workflow" className="hover:text-teal-700 transition-colors">
                  Solutions & Care Pathway
                </Link>
              </li>
              <li>
                <Link href="/#simulator" className="hover:text-teal-700 transition-colors">
                  Risk Prediction Simulator
                </Link>
              </li>
              <li>
                <Link href="/about#difference" className="hover:text-teal-700 transition-colors">
                  Clinical Intelligence
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-teal-700 transition-colors">
                  AI Clinical Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Resources Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Company & Research
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:text-teal-700 transition-colors font-medium text-slate-900">
                  About Platform
                </Link>
              </li>
              <li>
                <Link href="/about#principles" className="hover:text-teal-700 transition-colors">
                  Guiding Principles
                </Link>
              </li>
              <li>
                <Link href="/about#technology" className="hover:text-teal-700 transition-colors">
                  Technology Foundation
                </Link>
              </li>
              <li>
                <Link href="/about#journey" className="hover:text-teal-700 transition-colors">
                  Research Journey
                </Link>
              </li>
              <li>
                <Link href="/about#faq" className="hover:text-teal-700 transition-colors">
                  Clinical FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Governance & Security
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/about#responsible-ai" className="hover:text-teal-700 transition-colors">
                  Responsible AI Policy
                </Link>
              </li>
              <li>
                <Link href="/#security" className="hover:text-teal-700 transition-colors">
                  HIPAA & 21 CFR Part 11
                </Link>
              </li>
              <li>
                <Link href="/about#workflow" className="hover:text-teal-700 transition-colors">
                  Human-in-the-Loop Safeguards
                </Link>
              </li>
              <li>
                <Link href="/admin/models" className="hover:text-teal-700 transition-colors">
                  ML Model Registry
                </Link>
              </li>
            </ul>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Lock className="h-3.5 w-3.5 text-teal-600" />
                  <span>Institutional Release</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Research newsletter enrollment opens during Phase 2 clinical validation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Attribution & Safety Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>
              &copy; {currentYear} {BRAND_CONFIG.brandName}. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-1 text-center sm:text-right text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0 hidden sm:inline" />
            <span>Assistive clinical decision support tool. Does NOT provide autonomous medical diagnosis or prescriptions.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
