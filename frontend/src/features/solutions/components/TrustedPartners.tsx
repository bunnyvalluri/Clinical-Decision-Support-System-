"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Award, Building, Cloud, Sparkles } from "lucide-react";

interface PartnerItem {
  name: string;
  category: string;
  initials: string;
  colorScheme: string;
}

const PARTNERS: PartnerItem[] = [
  {
    name: "Mayo Clinic",
    category: "Clinical Research Network",
    initials: "MC",
    colorScheme: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    name: "Cleveland Clinic",
    category: "Heart & Vascular Institute",
    initials: "CC",
    colorScheme: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    name: "Johns Hopkins Medicine",
    category: "Patient Safety & Quality",
    initials: "JHM",
    colorScheme: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  {
    name: "Stanford Health Care",
    category: "Informatics & AI Research",
    initials: "SHC",
    colorScheme: "bg-rose-50 text-rose-800 border-rose-200",
  },
  {
    name: "AWS Healthcare",
    category: "HIPAA Cloud Infrastructure",
    initials: "AWS",
    colorScheme: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    name: "Google Cloud Health",
    category: "Healthcare API & FHIR",
    initials: "GCP",
    colorScheme: "bg-sky-50 text-sky-800 border-sky-200",
  },
];

export function TrustedPartners() {
  return (
    <section className="py-14 bg-slate-50/50 border-b border-slate-200/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800">
              TRUSTED BY LEADING HEALTHCARE ORGANIZATIONS
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Collaborating on clinical decision support, secure FHIR integrations, and healthcare AI governance.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors whitespace-nowrap"
          >
            <span>View All Partners</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Logos & Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5 transition-all text-center group"
            >
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-xs font-mono mb-2 border ${partner.colorScheme} group-hover:scale-105 transition-transform`}
              >
                {partner.initials}
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                {partner.name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                {partner.category}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
