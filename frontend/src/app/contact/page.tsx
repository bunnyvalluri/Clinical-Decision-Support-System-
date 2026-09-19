"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Send,
  Award,
  BookOpen,
  Activity,
  UserCheck,
  ArrowRight,
  Sparkles,
  Building2,
  Lock,
  Radio,
  FileText,
  AlertCircle,
  Sliders,
  Zap,
} from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/button";

interface DepartmentRouting {
  name: string;
  code: string;
  lead: string;
  phone: string;
  sla: string;
  icon: React.ElementType;
}

const HOSPITAL_DEPARTMENTS: DepartmentRouting[] = [
  {
    name: "Acute Coronary Care Unit (CCU)",
    code: "WARD-CCU-04",
    lead: "Dr. Vadla Abhinay, MD",
    phone: "ext. 402",
    sla: "Sub-second Telemetry",
    icon: HeartPulse,
  },
  {
    name: "Cardiovascular Electrophysiology",
    code: "LAB-EP-02",
    lead: "Cardiac Pacing & Arrhythmia Core",
    phone: "ext. 418",
    sla: "12-Lead Holter Active",
    icon: Activity,
  },
  {
    name: "Sepsis & ICU Triage Center",
    code: "ICU-TRIAGE-B",
    lead: "Rapid Response Medical Staff",
    phone: "ext. 911 (STAT)",
    sla: "24/7 Continuous Monitoring",
    icon: ShieldCheck,
  },
  {
    name: "Clinical AI & Informatics Bureau",
    code: "AI-INFORMATICS-1",
    lead: "Model Registry & TreeSHAP Hub",
    phone: "ext. 550",
    sla: "FHIR v4.0.1 Synchronized",
    icon: Radio,
  },
];

export default function ContactDoctorPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "clinical-consultation",
    urgency: "routine",
    mrn: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Universal Institutional Navbar */}
      <PublicNavbar />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb Navigation Strip */}
        <section aria-label="Breadcrumb navigation" className="w-full border-b border-slate-200/80 bg-white py-2.5">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-teal-700 transition-colors">
                Home
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">Doctor Profile &amp; Contact</span>
            </nav>
          </div>
        </section>

        {/* 2. Doctor Hero Section: Institutional Medical Consultation Standard */}
        <section aria-labelledby="doctor-profile-title" className="relative pt-8 sm:pt-14 pb-12 sm:pb-16 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)] border-b border-slate-200/80">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Doctor Image & Clinical Status HUD (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-md">
                  {/* Outer Frame with Clean Medical Shadow */}
                  <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group p-2 bg-white">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
                      <Image
                        src="/doctor-hero.jpg"
                        alt="Dr. Vadla Abhinay, MD - Chief of Cardiology and Attending Physician"
                        width={600}
                        height={600}
                        priority
                        className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                      />

                      {/* On-Duty Status Badge */}
                      <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-slate-900">On Duty • Clinical Unit</span>
                      </div>

                      {/* Vitals Telemetry Badge */}
                      <div className="absolute bottom-3.5 right-3.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-600 animate-pulse" />
                        <span className="text-xs font-mono text-teal-900 font-bold">12-Lead Holter Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification & License Pill Below Image */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                        VA
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-950">Board Certified Cardiologist</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">License: CA-MD-98421 • NPI: 1092834710</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                      Verified M.D.
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor Details & Biography (7 cols) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold font-mono">
                    <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                    <span>Attending Physician &amp; Clinical Lead</span>
                  </div>

                  <h1 id="doctor-profile-title" className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                    Dr. Vadla Abhinay, <span className="text-teal-600">MD</span>
                  </h1>

                  <p className="text-lg sm:text-xl font-bold text-slate-800">
                    Chief of Cardiology &amp; ICU Telemetry Director
                  </p>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                    Dr. Vadla Abhinay is a board-certified cardiologist leading the Clinical Decision Support
                    initiative at HealthNova AI. With extensive experience across acute coronary care units,
                    cardiovascular telemetry, and bedside decision intelligence, Dr. Abhinay oversees patient
                    risk stratification, multi-lead Holter diagnostics, and human-in-the-loop validation
                    protocols.
                  </p>
                </div>

                {/* Key Credentials Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <Award className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Education</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950">M.D. Cardiology</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Johns Hopkins Medicine</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <HeartPulse className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Specialty</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950">ICU Telemetry</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Arrhythmia &amp; Sepsis</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Governance</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950">Human Sign-Off</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">100% Attending Gate</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Research</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950">TreeSHAP AI</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Peer-Reviewed Papers</div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a href="#consultation-form">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 shadow-sm text-sm h-12 rounded-xl transition-all border-0 gap-2 cursor-pointer"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Request Clinical Consultation</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                  <a href="#department-info">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-sm h-12 rounded-xl shadow-2xs gap-2 transition-all cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-teal-600" />
                      <span>Clinic Location &amp; Hours</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Clinical Focus & Diagnostic Domains */}
        <section aria-label="Clinical Specializations" className="py-14 sm:py-18 bg-white border-b border-slate-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                Clinical Expertise
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3">
                Core Clinical Domains &amp; Diagnostic Focus
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Delivering evidence-based cardiovascular care supported by calibrated machine learning insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                      <Activity className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      Sub-20ms Engine
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mb-2">High-Frequency Holter &amp; ECG Telemetry</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    Continuous multi-lead cardiac surveillance, QTc dispersion analysis, ST-segment elevation tracking,
                    and sub-20ms bedside arrhythmia classification.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-teal-800 font-semibold">
                  <span>Standard: AHA/ACC ECG Guidelines</span>
                  <span className="bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Continuous</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      qSOFA / NEWS2 Gate
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mb-2">Acute Sepsis &amp; Hemodynamic Risk</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    Deterministic qSOFA and NEWS2 scoring integration with machine learning trajectories for early shock
                    prevention and bundle authorization.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-emerald-800 font-semibold">
                  <span>Standard: Surviving Sepsis 2021</span>
                  <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+4.2h Lead</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      Shapley Additive
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mb-2">Explainable AI (TreeSHAP) Verification</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    Transparent clinical feature attribution, ensuring every AI risk score highlights the exact patient
                    biomarkers driving deterioration signals.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-sky-800 font-semibold">
                  <span>Standard: Zero Black-Box Opacity</span>
                  <span className="bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">100% Transparent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Interactive Consultation & Contact Form */}
        <section id="consultation-form" aria-labelledby="consultation-heading" className="py-14 sm:py-18 bg-slate-50/60 border-b border-slate-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Form Left Side: Direct Contact Details */}
              <div id="department-info" className="lg:col-span-5 space-y-6 text-left">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Direct Contact Channels
                  </span>
                  <h2 id="consultation-heading" className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3">
                    Reach Dr. Vadla Abhinay&apos;s Clinic
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Submit a clinical case review request, outpatient appointment inquiry, or institutional consultation.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-950">Clinical Office Location</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Heart &amp; Vascular Pavilion, Suite 402<br />
                        Acute Telemetry Wing • Inpatient Tower B
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-950">Consultation Hours</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Monday – Friday: 08:00 AM – 05:30 PM EST<br />
                        Acute Sepsis Telemetry: 24/7 Continuous Surveillance
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-950">Encrypted Clinical Inbox</h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">
                        dr.abhinay.vadla@hospital.org
                      </p>
                      <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                        HL7 FHIR v4 Secure Gateway Connected
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-950">Direct Clinic Telephone</h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">
                        +1 (800) 432-5884 ext. 402
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        For inpatient emergencies, notify the Rapid Response Team directly.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Right Side: Interactive Inquiry Submission */}
              <div className="lg:col-span-7 text-left">
                <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                        <Send className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">Clinical Consultation Request</h3>
                        <p className="text-[11px] text-slate-500">Direct transmission to Dr. Vadla Abhinay&apos;s triage desk</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      SECURE EHR
                    </span>
                  </div>

                  {isSuccess ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-950">Consultation Request Dispatched</h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                        Your inquiry has been encrypted and routed to Dr. Vadla Abhinay&apos;s clinical coordinator.
                        A confirmation and scheduling notice will be delivered to <span className="font-semibold text-slate-900">{formData.email}</span> within 2 hours.
                      </p>
                      <Button
                        onClick={() => {
                          setIsSuccess(false);
                          setFormData({
                            name: "",
                            email: "",
                            phone: "",
                            inquiryType: "clinical-consultation",
                            urgency: "routine",
                            mrn: "",
                            message: "",
                          });
                        }}
                        variant="outline"
                        className="mt-4 border-slate-300 text-xs font-bold"
                      >
                        Send Another Clinical Note
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="name" className="text-xs font-bold text-slate-800 block">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="name"
                            type="text"
                            required
                            placeholder="e.g. Dr. Robert Chen / Eleanor Vance"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="email" className="text-xs font-bold text-slate-800 block">
                            Work / Medical Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="email"
                            type="email"
                            required
                            placeholder="clinician@hospital.org"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="phone" className="text-xs font-bold text-slate-800 block">
                            Contact Telephone
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="mrn" className="text-xs font-bold text-slate-800 block">
                            Patient MRN (Optional)
                          </label>
                          <input
                            id="mrn"
                            type="text"
                            placeholder="MRN-882910"
                            value={formData.mrn}
                            onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="inquiryType" className="text-xs font-bold text-slate-800 block">
                            Inquiry Category <span className="text-rose-500">*</span>
                          </label>
                          <select
                            id="inquiryType"
                            value={formData.inquiryType}
                            onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                          >
                            <option value="clinical-consultation">Cardiovascular Clinical Consultation</option>
                            <option value="holter-review">12-Lead Holter / Telemetry Review</option>
                            <option value="sepsis-protocol">ICU Sepsis Decision Support Guidance</option>
                            <option value="institutional">Institutional Health System Inquiry</option>
                            <option value="research">Academic &amp; TreeSHAP Research Partnership</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="urgency" className="text-xs font-bold text-slate-800 block">
                            Priority Tier <span className="text-rose-500">*</span>
                          </label>
                          <select
                            id="urgency"
                            value={formData.urgency}
                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                          >
                            <option value="routine">Routine Clinical Follow-Up (Within 48h)</option>
                            <option value="priority">Priority Case Review (Within 12h)</option>
                            <option value="urgent">Urgent Ward Consultation (Same Day)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="message" className="text-xs font-bold text-slate-800 block">
                          Clinical Notes &amp; Symptoms Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="message"
                          required
                          rows={4}
                          placeholder="Summarize pertinent clinical findings, telemetry observations, or inquiry details..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 resize-y"
                        />
                      </div>

                      {/* Safety Invariant Note */}
                      <p className="text-[11px] text-slate-500 leading-tight">
                        All communications are encrypted using TLS 1.3 in compliance with HIPAA § 164.312.
                        Zero unredacted patient PHI is exported outside authorized hospital systems.
                      </p>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 rounded-xl shadow-xs border-0 text-xs gap-2 transition-all cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Encrypting &amp; Dispatching to Dr. Abhinay...</span>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>Transmit Consultation Request to Dr. Vadla Abhinay, MD</span>
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Hospital Department Directory */}
        <section aria-label="Hospital Department Routing" className="py-14 sm:py-18 bg-white border-b border-slate-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                Hospital System Directory
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3">
                Coordinated Departmental Care Units
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Direct extension numbers and on-duty escalation channels for specialized clinical units.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {HOSPITAL_DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.code}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {dept.code}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-950 leading-snug">{dept.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{dept.lead}</p>
                    </div>

                    <div className="pt-3 mt-4 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-teal-800">{dept.phone}</span>
                      <span className="text-[9px] text-slate-500">{dept.sla}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Mandatory Clinical Safety Invariant Banner */}
        <section aria-label="Clinical Disclaimer" className="py-6 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-start sm:items-center gap-3 text-xs text-slate-600 max-w-3xl mx-auto text-center">
              <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
              <p>
                <strong>Clinical Governance Invariant:</strong> HealthNova AI decisions provide calibrated risk insights
                and do not replace professional medical judgment. All clinical prescriptions and diagnoses require direct human
                clinician evaluation and sign-off by Dr. Vadla Abhinay, MD or authorized attending staff.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Universal Institutional Footer */}
      <PublicFooter />
    </div>
  );
}
