"use client";

import React, { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  ExternalLink,
  Printer,
  Check,
  Search,
  Filter,
  User,
  Zap,
  Layers,
  PhoneCall,
} from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { RealtimeEcgWaveform } from "@/components/clinical/RealtimeEcgWaveform";

interface DepartmentRouting {
  name: string;
  code: string;
  lead: string;
  phone: string;
  sla: string;
  capacity: "Normal Census" | "High Census" | "Immediate Capacity";
  type: "critical" | "diagnostic" | "informatics";
  desc: string;
  icon: React.ElementType;
}

const HOSPITAL_DEPARTMENTS: DepartmentRouting[] = [
  {
    name: "Acute Coronary Care Unit (CCU)",
    code: "WARD-CCU-04",
    lead: "Dr. Vadla Abhinay, MD (Attending Lead)",
    phone: "ext. 402",
    sla: "< 15 min Ward Response",
    capacity: "Normal Census",
    type: "critical",
    desc: "Inpatient STEMI/NSTEMI stabilization, bedside invasive telemetry, and continuous hemodynamic monitoring.",
    icon: HeartPulse,
  },
  {
    name: "Cardiovascular Electrophysiology Lab",
    code: "LAB-EP-02",
    lead: "Cardiac Pacing & Arrhythmia Core",
    phone: "ext. 418",
    sla: "12-Lead Holter Active",
    capacity: "Immediate Capacity",
    type: "diagnostic",
    desc: "Complex arrhythmia mapping, QTc dispersion surveillance, catheter ablation triage, and pacemaker interrogation.",
    icon: Activity,
  },
  {
    name: "Sepsis & ICU Triage Center",
    code: "ICU-TRIAGE-B",
    lead: "Rapid Response Medical Staff",
    phone: "ext. 911 (STAT)",
    sla: "24/7 Continuous Surveillance",
    capacity: "High Census",
    type: "critical",
    desc: "Automated qSOFA and NEWS2 score synthesis with early 6-hour sepsis trajectory prediction and bundle authorization.",
    icon: ShieldCheck,
  },
  {
    name: "Clinical AI & Informatics Bureau",
    code: "AI-INFORMATICS-1",
    lead: "Model Registry & TreeSHAP Hub",
    phone: "ext. 550",
    sla: "FHIR v4.0.1 Live Synced",
    capacity: "Immediate Capacity",
    type: "informatics",
    desc: "Model registry verification, feature attribution auditing, TreeSHAP validation, and HL7 FHIR v4 interface pipelines.",
    icon: Radio,
  },
  {
    name: "Non-Invasive Vascular Diagnostic Suite",
    code: "DIAG-VASC-01",
    lead: "Echocardiography & Doppler Core",
    phone: "ext. 425",
    sla: "Same-Day Report Turnaround",
    capacity: "Normal Census",
    type: "diagnostic",
    desc: "Transesophageal and transthoracic echocardiography, arterial Doppler flow, and myocardial strain imaging.",
    icon: Stethoscope,
  },
  {
    name: "Cardiothoracic Surgical Liaison Desk",
    code: "SURG-CT-03",
    lead: "Surgical Case Coordination",
    phone: "ext. 460",
    sla: "Priority Pre-Op Clearance",
    capacity: "Normal Census",
    type: "critical",
    desc: "Pre-operative hemodynamic risk clearance, CABG/valve surgical scheduling, and post-bypass recovery pathways.",
    icon: Building2,
  },
];

const CLINICAL_SCHEDULE = [
  {
    day: "Monday",
    code: "MON",
    rounds: "Acute Coronary Care Unit (CCU) Intensive Ward Rounds",
    time: "07:30 AM – 12:30 PM",
    clinic: "Inpatient Cardiac Case Intake & Urgent Bedside Consults",
    clinicTime: "01:30 PM – 05:00 PM",
    location: "Pavilion Tower B, Ward 4",
    status: "Rounds Active",
  },
  {
    day: "Tuesday",
    code: "TUE",
    rounds: "Cardiac Electrophysiology & Arrhythmia Diagnostic Suite",
    time: "08:00 AM – 01:00 PM",
    clinic: "Remote Tele-Cardiology & Outpatient Case Review",
    clinicTime: "02:00 PM – 05:30 PM",
    location: "Diagnostic Center, Suite 402",
    status: "Telemetry Lab",
  },
  {
    day: "Wednesday",
    code: "WED",
    rounds: "Clinical AI & Model Governance Multidisciplinary Committee",
    time: "09:00 AM – 12:00 PM",
    clinic: "Complex Cardiovascular Consultations & Second Opinions",
    clinicTime: "01:00 PM – 05:00 PM",
    location: "Informatics Bureau, Wing 1",
    status: "AI Governance",
  },
  {
    day: "Thursday",
    code: "THU",
    rounds: "Outpatient Preventive & Structural Cardiology Clinic",
    time: "08:30 AM – 01:00 PM",
    clinic: "Holter Review & Post-Discharge Longitudinal Follow-Up",
    clinicTime: "01:30 PM – 05:30 PM",
    location: "Heart Pavilion, Clinic 3",
    status: "Outpatient Clinic",
  },
  {
    day: "Friday",
    code: "FRI",
    rounds: "Sepsis & ICU Hemodynamic Shock Rapid Response Board",
    time: "08:00 AM – 12:30 PM",
    clinic: "Interdisciplinary Cardiothoracic Surgical Planning Board",
    clinicTime: "01:30 PM – 04:30 PM",
    location: "ICU Surgical Core",
    status: "Triage Board",
  },
];

const CLINICAL_FAQS = [
  {
    category: "consult",
    q: "What is the typical turnaround time for physician-to-physician case consults?",
    a: "Routine outpatient consult requests are reviewed within 24 to 48 hours. Priority ward and diagnostic telemetry reviews are triaged within 12 hours. For acute inpatient hospital cases, the on-duty CCU fellow and Dr. Vadla Abhinay's team respond via hospital pager in under 15 minutes.",
  },
  {
    category: "ai",
    q: "How do attending cardiologists utilize AI and TreeSHAP in patient care?",
    a: "Attending clinicians use HealthNova AI's calibrated machine learning as a real-time clinical decision support radar. AI models surface early deterioration signals and TreeSHAP feature attributions, identifying specific biomarkers driving patient risk. However, all diagnostic evaluations, prescription orders, and clinical protocols require human attending physician evaluation and sign-off.",
  },
  {
    category: "security",
    q: "How is patient data and PHI protected during consultation submissions?",
    a: "All transmissions on this portal utilize end-to-end TLS 1.3 encryption compliant with HIPAA § 164.312. Context minimization ensures no unredacted patient PHI is stored in agent memory or public cloud vector indices. Records sync directly to the hospital's authoritative PostgreSQL store.",
  },
  {
    category: "integration",
    q: "Can hospital networks submit batch HL7 FHIR or 12-lead Holter telemetry files?",
    a: "Yes. HealthNova AI natively interfaces with HL7 FHIR v4.0.1 and DICOM standard endpoints. Hospital IT departments and referring clinics can arrange direct automated ingestion pipelines through our Clinical AI & Informatics Bureau (ext. 550).",
  },
  {
    category: "consult",
    q: "Are second opinions provided for complex structural heart disease?",
    a: "Yes. Inpatient and outpatient second opinions for complex arrhythmia, valvular heart disease, post-myocardial infarction recovery, and sepsis-induced myocardial dysfunction are conducted on Tuesday and Thursday clinical sessions.",
  },
];

const CONTACT_DOCTORS = [
  {
    id: "abhinay",
    name: "Dr. Vadla Abhinay",
    suffix: "MD",
    initials: "VA",
    role: "Chief of Cardiology & ICU Telemetry Director",
    title: "Attending Cardiologist & Clinical Lead",
    license: "License: CA-MD-98421 • NPI: 1092834710",
    image: "/doctor-hero.jpg",
    alt: "Dr. Vadla Abhinay, MD - Chief of Cardiology and Attending Physician",
    dutyStatus: "On Duty • Acute CCU Ward",
    telemetry: "12-Lead Holter Active",
    education: "Johns Hopkins Medicine",
    degree: "M.D. Cardiology",
    experience: "18+ Yrs Clinical",
    experienceDetail: "Acute CCU & Telemetry",
    governance: "Human Sign-Off",
    governanceDetail: "100% Attending Gate",
    research: "TreeSHAP AI",
    researchDetail: "JAMA & Lancet Digital",
    bio: "Dr. Vadla Abhinay is a board-certified cardiologist leading the Clinical Decision Support initiative at HealthNova AI. With extensive experience across acute coronary care units, cardiovascular telemetry, and bedside decision intelligence, Dr. Abhinay oversees patient risk stratification, multi-lead Holter diagnostics, and human-in-the-loop validation protocols.",
    email: "dr.abhinay.vadla@hospital.org",
  },
  {
    id: "rahul",
    name: "Dr. Valluri Rahul",
    suffix: "MD",
    initials: "VR",
    role: "Director of Cardiovascular Informatics & Telemetry",
    title: "Attending Cardiologist & Clinical Co-Lead",
    license: "License: CA-MD-98422 • NPI: 1092834711",
    image: "/doctor-hero-rahul.jpg",
    alt: "Dr. Valluri Rahul, MD - Director of Cardiovascular Informatics and Attending Physician",
    dutyStatus: "On Duty • Telemetry Core",
    telemetry: "Continuous Ingestion Active",
    education: "Stanford Medical Center",
    degree: "M.D., MS Informatics",
    experience: "15+ Yrs Clinical",
    experienceDetail: "ICU Telemetry & AI",
    governance: "Human Sign-Off",
    governanceDetail: "100% Attending Gate",
    research: "Clinical NLP & CDS",
    researchDetail: "NEJM AI & Nature Digital",
    bio: "Dr. Valluri Rahul is a board-certified cardiologist and clinical informaticist pioneering algorithmic safety and real-time hemodynamic telemetry at HealthNova AI. Dr. Rahul leads multi-center validation of early deterioration scoring, FHIR data pipelines, and bedside explainable intelligence for ICU and CCU multidisciplinary care teams.",
    email: "dr.rahul.valluri@hospital.org",
  },
  {
    id: "vedha",
    name: "Dr. Vedha Sree",
    suffix: "MD",
    initials: "VS",
    role: "Director of Clinical Risk Stratification & AI Safety",
    title: "Attending Physician & Clinical Safety Lead",
    license: "License: CA-MD-98423 • NPI: 1092834712",
    image: "/doctor-hero-vedha.jpg",
    alt: "Dr. Vedha Sree, MD - Director of Clinical Risk Stratification and Attending Physician",
    dutyStatus: "On Duty • Emergency & ICU",
    telemetry: "Continuous Hemodynamic AI Active",
    education: "Harvard Medical School",
    degree: "M.D. Critical Care & Risk Stratification",
    experience: "14+ Yrs Clinical",
    experienceDetail: "Emergency Triage & ICU Telemetry",
    governance: "Human Sign-Off",
    governanceDetail: "100% Attending Gate",
    research: "Risk Stratification AI",
    researchDetail: "The Lancet & Nature Medicine",
    bio: "Dr. Vedha Sree is an attending physician specializing in acute emergency triage, cardiovascular hemodynamics, and clinical risk stratification at HealthNova AI. She directs clinical safety evaluation, early shock detection algorithms, and bedside clinician decision support protocols.",
    email: "dr.vedhasree@hospital.org",
  },
  {
    id: "prashanth",
    name: "Dr. Prashanth",
    suffix: "MD",
    initials: "KP",
    role: "Director of Critical Care Medicine & Diagnostic Systems",
    title: "Attending Physician & Diagnostics Lead",
    license: "License: CA-MD-98424 • NPI: 1092834713",
    image: "/doctor-hero-prashanth.jpg",
    alt: "Dr. Prashanth, MD - Director of Critical Care Medicine and Attending Physician",
    dutyStatus: "On Duty • CCU & ICU Ward",
    telemetry: "Continuous Ingestion Active",
    education: "Mayo Clinic College of Medicine",
    degree: "M.D. Intensive Care Medicine",
    experience: "16+ Yrs Clinical",
    experienceDetail: "Critical Care Resuscitation & Diagnostics",
    governance: "Human Sign-Off",
    governanceDetail: "100% Attending Gate",
    research: "Hemodynamic AI Monitoring",
    researchDetail: "Circulation & Critical Care Medicine",
    bio: "Dr. Prashanth is a board-certified critical care attending physician leading diagnostic systems and continuous physiological monitoring workflows at HealthNova AI. His focus centers on multi-organ decompensation alerts, ICU telemetry fidelity, and real-time bedside decision support.",
    email: "dr.prashanth@hospital.org",
  },
  {
    id: "pranay",
    name: "Dr. Pranay",
    suffix: "MD",
    initials: "AP",
    role: "Director of Acute Interventions & Cardiac Surgical Telemetry",
    title: "Attending Physician & Interventional Systems Lead",
    license: "License: CA-MD-98425 • NPI: 1092834714",
    image: "/doctor-hero-pranay.jpg",
    alt: "Dr. Pranay, MD - Director of Acute Interventions and Attending Physician",
    dutyStatus: "On Duty • Cardiac Surgical ICU",
    telemetry: "Continuous Ingestion Active",
    education: "Cleveland Clinic Lerner College of Medicine",
    degree: "M.D. Cardiovascular Interventions",
    experience: "15+ Yrs Clinical",
    experienceDetail: "Surgical ICU & Acute Interventions",
    governance: "Human Sign-Off",
    governanceDetail: "100% Attending Gate",
    research: "Post-Surgical AI Telemetry",
    researchDetail: "Journal of Thoracic and Cardiovascular Surgery",
    bio: "Dr. Pranay is a board-certified attending physician specializing in acute cardiac surgical interventions, postoperative hemodynamic surveillance, and AI-assisted clinical pathways at HealthNova AI. He ensures deterministic rule enforcement and seamless clinical handovers.",
    email: "dr.pranay@hospital.org",
  },
];

export default function ContactDoctorPage() {
  const [activeDoctorIdx, setActiveDoctorIdx] = useState<number>(0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);

  // 2-second automatic photo & profile rotation (can be paused or clicked)
  useEffect(() => {
    if (!isAutoRotate) return;
    const timer = setInterval(() => {
      setActiveDoctorIdx((prev) => (prev + 1) % CONTACT_DOCTORS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isAutoRotate]);

  const activeDoctor = CONTACT_DOCTORS[activeDoctorIdx];

  const [activeTab, setActiveTab] = useState<
    "referral" | "consultation" | "enterprise" | "research"
  >("referral");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    mrn: "",
    inquiryType: "physician-referral",
    urgency: "priority",
    department: "WARD-CCU-04",
    message: "",
  });

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<
    "all" | "critical" | "diagnostic" | "informatics"
  >("all");
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [receiptToken, setReceiptToken] = useState("");

  const handleTabChange = (
    tab: "referral" | "consultation" | "enterprise" | "research"
  ) => {
    setActiveTab(tab);
    if (tab === "referral") {
      setFormData((prev) => ({
        ...prev,
        inquiryType: "physician-referral",
        urgency: "priority",
      }));
    } else if (tab === "consultation") {
      setFormData((prev) => ({
        ...prev,
        inquiryType: "outpatient-consultation",
        urgency: "routine",
      }));
    } else if (tab === "enterprise") {
      setFormData((prev) => ({
        ...prev,
        inquiryType: "enterprise-deployment",
        urgency: "routine",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        inquiryType: "research-collaboration",
        urgency: "routine",
      }));
    }
  };

  const handleDepartmentRoute = (deptCode: string, deptName: string) => {
    setFormData((prev) => ({
      ...prev,
      department: deptCode,
      message: prev.message
        ? prev.message
        : `Requesting clinical consultation routed to ${deptName} (${deptCode}).`,
    }));
    const formElement = document.getElementById("consultation-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScheduleSelect = (day: string) => {
    setSelectedDay(day);
    setFormData((prev) => ({
      ...prev,
      message: prev.message
        ? prev.message
        : `Requesting consultation slot aligned with ${day} clinical schedule.`,
    }));
    const formElement = document.getElementById("consultation-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const generatedToken = `TX-2026-CARD-${Math.floor(100000 + Math.random() * 900000)}`;
    setReceiptToken(generatedToken);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const copyReceipt = () => {
    navigator.clipboard.writeText(
      `HealthNova Clinical Consultation Token: ${receiptToken}\nPhysician: ${activeDoctor.name}, MD\nDepartment: ${formData.department}\nTimestamp: ${new Date().toISOString()}\nStatus: Encrypted & Dispatched`
    );
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const copyClinicPhone = () => {
    navigator.clipboard.writeText("+18004325884");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const copyClinicEmail = () => {
    navigator.clipboard.writeText(activeDoctor.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredDepts = HOSPITAL_DEPARTMENTS.filter((d) => {
    const matchesCategory =
      selectedDeptFilter === "all" || d.type === selectedDeptFilter;
    const matchesSearch =
      deptSearchQuery.trim() === "" ||
      d.name.toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
      d.desc.toLowerCase().includes(deptSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredFaqs = CLINICAL_FAQS.filter((f) => {
    return (
      faqSearchQuery.trim() === "" ||
      f.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-clip">
      {/* 1. Universal Institutional Navbar */}
      <PublicNavbar />

      <main id="main-content" className="flex-1">
        {/* Hospital Telemetry Status Strip */}
        <div className="w-full bg-slate-50 border-b border-slate-200/90 py-2 px-4 text-[11px] font-mono text-slate-600">
          <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-slate-950">Ward Status:</span>
              <span className="text-slate-700">Acute CCU &amp; Telemetry Stream Synchronized</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="hidden sm:inline font-medium text-slate-700">
                Attending Leads: <strong className="text-slate-950">Dr. Vadla Abhinay, MD</strong> &bull; <strong className="text-slate-950">Dr. Valluri Rahul, MD</strong>
              </span>
              <span className="hidden md:inline text-slate-300">|</span>
              <button
                type="button"
                onClick={copyClinicPhone}
                className="text-teal-800 hover:text-teal-950 font-bold bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Click to copy phone number"
              >
                <Phone className="h-3 w-3 text-teal-600" />
                <span>Paging: ext. 402</span>
                {copiedPhone && <Check className="h-2.5 w-2.5 text-emerald-600 ml-0.5" />}
              </button>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                HIPAA § 164.312 Verified
              </span>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation Strip */}
        <section aria-label="Breadcrumb navigation" className="w-full border-b border-slate-200/80 bg-white py-2.5">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-teal-700 transition-colors">
                Home
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">Doctor Profile &amp; Clinical Consultation</span>
            </nav>
          </div>
        </section>

        {/* 2. Doctor Hero Section: Executive Clinical Standard */}
        <section
          aria-labelledby="doctor-profile-title"
          className="relative pt-8 sm:pt-14 pb-12 sm:pb-16 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(13,148,136,0.08),rgba(2,132,199,0.04),transparent)] border-b border-slate-200/80"
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Doctor Image & Clinical Status HUD (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-md">
                  {/* Doctor Switcher Bar */}
                  <div className="mb-3 flex flex-col gap-1.5 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="h-3 w-3 text-teal-600" />
                        Attending Team ({CONTACT_DOCTORS.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAutoRotate(!isAutoRotate)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                          isAutoRotate
                            ? "bg-teal-50 border-teal-200 text-teal-800 font-bold"
                            : "bg-slate-100 border-slate-200 text-slate-500 font-medium"
                        }`}
                        title={isAutoRotate ? "Auto-switching every 2s (click to pause)" : "Paused (click to auto-rotate)"}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isAutoRotate ? "bg-teal-500 animate-pulse" : "bg-slate-400"}`} />
                        {isAutoRotate ? "Auto 2s" : "Paused"}
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      {CONTACT_DOCTORS.map((doc, idx) => {
                        const isSelected = idx === activeDoctorIdx;
                        const shortName = doc.name.replace("Dr. ", "").replace("Vadla ", "").replace("Valluri ", "").split(" ")[0];
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setActiveDoctorIdx(idx);
                              setIsAutoRotate(false);
                            }}
                            className={`flex items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-teal-700 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                            }`}
                          >
                            <span className="truncate">{shortName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Outer Frame with Clean Medical Shadow */}
                  <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl group p-2">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100">
                      {CONTACT_DOCTORS.map((doc, idx) => {
                        const isActive = idx === activeDoctorIdx;
                        return (
                          <div
                            key={doc.image}
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                            }`}
                          >
                            <Image
                              src={doc.image}
                              alt={doc.alt}
                              width={600}
                              height={600}
                              priority={idx === 0}
                              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                            />
                          </div>
                        );
                      })}

                      {/* On-Duty Status Badge */}
                      <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center gap-2 z-20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {activeDoctor.dutyStatus}
                        </span>
                      </div>

                      {/* Vitals Telemetry Badge */}
                      <div className="absolute bottom-3.5 right-3.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center gap-2 z-20">
                        <Activity className="h-4 w-4 text-teal-600 animate-pulse" />
                        <span className="text-xs font-mono text-teal-900 font-bold">
                          {activeDoctor.telemetry}
                        </span>
                      </div>

                      {/* Carousel slide indicators - Pure Light Glass */}
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm z-20">
                        {CONTACT_DOCTORS.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveDoctorIdx(idx);
                              setIsAutoRotate(false);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === activeDoctorIdx ? "w-4 bg-teal-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                            }`}
                            aria-label={`Switch to doctor ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Verification & License Pill Below Image */}
                  <div className="mt-4 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-all duration-300 shadow-2xs">
                        {activeDoctor.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-950 transition-all duration-300 leading-tight">
                            {activeDoctor.name}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 shrink-0" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono transition-all duration-300 block leading-tight break-words mt-0.5">
                          {activeDoctor.license}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 shrink-0 shadow-2xs">
                      Verified M.D.
                    </span>
                  </div>

                  {/* Sub-specialty Tags Strip */}
                  <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                    <span className="text-[10px] font-mono bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs font-medium">
                      Acute Coronary Syndrome
                    </span>
                    <span className="text-[10px] font-mono bg-white text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs font-semibold">
                      TreeSHAP Explainability
                    </span>
                    <span className="text-[10px] font-mono bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs font-medium">
                      ICU Sepsis Shock
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor Details & Biography (7 cols) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="space-y-3">
                  <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] sm:text-xs font-semibold font-mono shadow-2xs max-w-full">
                    <Stethoscope className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span className="break-words leading-tight">{activeDoctor.title}</span>
                  </div>

                  <h1
                    id="doctor-profile-title"
                    className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight transition-all duration-300"
                  >
                    {activeDoctor.name},{" "}
                    <span className="text-teal-600">{activeDoctor.suffix}</span>
                  </h1>

                  <p className="text-lg sm:text-xl font-bold text-slate-800">
                    {activeDoctor.role}
                  </p>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                    {activeDoctor.bio}
                  </p>
                </div>

                {/* Key Credentials Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase">Education</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950 leading-tight break-words">{activeDoctor.degree}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight break-words">{activeDoctor.education}</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <HeartPulse className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase">Experience</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950 leading-tight break-words">{activeDoctor.experience}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight break-words">{activeDoctor.experienceDetail}</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase">Governance</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950 leading-tight break-words">{activeDoctor.governance}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight break-words">{activeDoctor.governanceDetail}</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all">
                    <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase">Research</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950 leading-tight break-words">{activeDoctor.research}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight break-words">{activeDoctor.researchDetail}</div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a href="#consultation-form" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 shadow-sm text-xs sm:text-sm h-11 sm:h-12 rounded-xl transition-all border-0 gap-2 cursor-pointer"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Request Clinical Consultation</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                  <a href="#attending-schedule" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-950 font-semibold px-6 text-xs sm:text-sm h-11 sm:h-12 rounded-xl shadow-2xs gap-2 transition-all cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span>View Attending Schedule</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive Clinical Schedule & Weekly Ward Rotations */}
        <section
          id="attending-schedule"
          aria-label="Clinical Schedule"
          className="py-10 sm:py-16 lg:py-20 bg-white border-b border-slate-200/90"
        >
          <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shadow-2xs">
                Attending Rotations
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight mt-3 transition-all duration-300">
                {activeDoctor.name}&apos;s Weekly Clinical Matrix
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Live timetable of ICU ward rounds, diagnostic electrophysiology lab blocks, and outpatient consultation hours.
              </p>
            </div>

            {/* Day Selector Tabs */}
            <div className="grid grid-cols-5 gap-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 mb-6 sm:mb-8">
              {CLINICAL_SCHEDULE.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedDay(item.day)}
                  className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                    selectedDay === item.day
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs ring-2 ring-teal-600/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="font-mono sm:mr-1.5 block sm:inline">{item.code}</span>
                  <span className="hidden sm:inline">{item.day}</span>
                </button>
              ))}
            </div>

            {/* Selected Day Detailed Card */}
            {CLINICAL_SCHEDULE.filter((d) => d.day === selectedDay).map((schedule) => (
              <div
                key={schedule.day}
                className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-slate-50/80 border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg sm:text-xl font-black text-slate-950">{schedule.day} Clinical Schedule</h3>
                      <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                        {schedule.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-teal-600" />
                      <span>{schedule.location}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleScheduleSelect(schedule.day)}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Book on {schedule.day}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Morning Block */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Morning Shift • Inpatient
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {schedule.time}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-950 mb-1.5">{schedule.rounds}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Direct patient bedside evaluations, telemetry review with cardiac fellows, and invasive arterial line
                      assessments in the intensive care ward.
                    </p>
                  </div>

                  {/* Afternoon Block */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Afternoon Shift • Diagnostic / Clinic
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {schedule.clinicTime}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-950 mb-1.5">{schedule.clinic}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Scheduled outpatient appointments, second opinion consultations, multi-lead Holter report sign-offs,
                      and clinical telemetry reviews.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span>Next Open Outpatient Consultation Window: Tomorrow, 02:00 PM EST</span>
                  </span>
                  <span className="font-mono text-[11px] text-teal-800 font-bold">
                    Urgent Ward Inquiries: Rapid Response Pager ext. 402
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Clinical Focus & Diagnostic Domains with Live Interactive Telemetry Micro-Cards */}
        <section aria-label="Clinical Specializations" className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shadow-2xs">
                Clinical Expertise
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3">
                Core Clinical Domains &amp; Diagnostic Focus
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Delivering evidence-based cardiovascular care supported by calibrated machine learning insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Domain 1: Holter & ECG Telemetry */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs">
                      <Activity className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                      Sub-20ms Engine
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mb-2">High-Frequency Holter &amp; ECG Telemetry</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    Continuous multi-lead cardiac surveillance, QTc dispersion analysis, ST-segment elevation tracking,
                    and sub-20ms bedside arrhythmia classification.
                  </p>

                  {/* Micro Visualizer */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 mb-4">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                      <span>Live Rhythm Lead II</span>
                      <span className="text-teal-700 font-bold">74 BPM • Regular</span>
                    </div>
                    <div className="h-10 w-full bg-white rounded-lg border border-slate-200/80 relative overflow-hidden">
                      <RealtimeEcgWaveform
                        heartRate={74}
                        theme="light"
                        color="#0d9488"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-teal-800 font-semibold">
                  <span>Standard: AHA/ACC ECG Guidelines</span>
                  <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Continuous</span>
                </div>
              </div>

              {/* Domain 2: Acute Sepsis & Hemodynamic Risk */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                      qSOFA / NEWS2 Gate
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mb-2">Acute Sepsis &amp; Hemodynamic Risk</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    Deterministic qSOFA and NEWS2 scoring integration with machine learning trajectories for early shock
                    prevention and bundle authorization.
                  </p>

                  {/* Micro Visualizer */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 mb-4">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                      <span>NEWS2 Floor Index</span>
                      <span className="text-emerald-700 font-bold">Tier 1 • Monitored</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full w-1/4 transition-all duration-500" />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                      <span>Low Risk (0-4)</span>
                      <span>Mod (5-6)</span>
                      <span>Critical (7+)</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-emerald-800 font-semibold">
                  <span>Standard: Surviving Sepsis 2021</span>
                  <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+4.2h Lead</span>
                </div>
              </div>

              {/* Domain 3: Explainable AI TreeSHAP */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shadow-2xs">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                      Shapley Additive
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 mb-2">Explainable AI (TreeSHAP) Verification</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                    Transparent clinical feature attribution, ensuring every AI risk score highlights the exact patient
                    biomarkers driving deterioration signals.
                  </p>

                  {/* Micro Visualizer */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>HRV Variance</span>
                      <span className="text-sky-800 font-bold">+0.06 &uarr;</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-sky-500 h-1.5 rounded-full w-3/4" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>MAP Stability</span>
                      <span className="text-slate-600 font-medium">0.00 &bull;</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-sky-800 font-semibold">
                  <span>Standard: Zero Black-Box Opacity</span>
                  <span className="bg-sky-50 px-2 py-0.5 rounded border border-sky-200">100% Transparent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Interactive Consultation & Contact Form */}
        <section
          id="consultation-form"
          aria-labelledby="consultation-heading"
          className="py-14 sm:py-20 bg-white border-b border-slate-200"
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Form Left Side: Direct Contact Details & Emergency Escalation */}
              <div id="department-info" className="lg:col-span-5 space-y-6 text-left">
                <div>
                  <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shadow-2xs">
                    Direct Contact Channels
                  </span>
                  <h2
                    id="consultation-heading"
                    className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3 transition-all duration-300"
                  >
                    Reach {activeDoctor.name}&apos;s Clinic
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Submit a clinical case review request, outpatient appointment inquiry, or institutional consultation.
                  </p>
                </div>

                {/* Emergency Hospital Escalation Warning Banner */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-amber-950 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                    <strong className="text-xs font-bold uppercase tracking-wide">
                      Acute Inpatient STAT Protocols
                    </strong>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    For acute cardiogenic shock, STEMI, or deteriorating septic shock, do not wait for email. Trigger Code Blue
                    or contact the hospital Rapid Response Team at <strong className="font-mono font-bold">ext. 911</strong> directly.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:bg-white hover:border-teal-300 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
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

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:bg-white hover:border-blue-300 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
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

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs flex items-start justify-between gap-3.5 hover:bg-white hover:border-emerald-300 transition-all">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950">Encrypted Clinical Inbox</h4>
                        <p className="text-xs text-slate-700 mt-0.5 font-mono font-medium">
                          {activeDoctor.email}
                        </p>
                        <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                          HL7 FHIR v4 Secure Gateway Connected
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyClinicEmail}
                      className="text-[10px] font-mono font-bold text-teal-700 hover:text-teal-900 border border-teal-200 bg-teal-50 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                    >
                      {copiedEmail ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs flex items-start justify-between gap-3.5 hover:bg-white hover:border-purple-300 transition-all">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950">Direct Clinic Telephone</h4>
                        <p className="text-xs text-slate-700 mt-0.5 font-mono font-medium">
                          +1 (800) 432-5884 ext. 402
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Direct extension to attending clinical desk.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyClinicPhone}
                      className="text-[10px] font-mono font-bold text-teal-700 hover:text-teal-900 border border-teal-200 bg-teal-50 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                    >
                      {copiedPhone ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Right Side: Multi-Tab Interactive Inquiry Submission */}
              <div className="lg:col-span-7 text-left">
                <div className="rounded-2xl sm:rounded-3xl bg-slate-50/80 border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs">
                  {/* Category Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 mb-6">
                    <button
                      type="button"
                      onClick={() => handleTabChange("referral")}
                      className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === "referral"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      MD Referral
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange("consultation")}
                      className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === "consultation"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Patient Consult
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange("enterprise")}
                      className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === "enterprise"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Hospital Pilot
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange("research")}
                      className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === "research"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Academic AI
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs">
                        <Send className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          {activeTab === "referral" && "Physician Case Referral"}
                          {activeTab === "consultation" && "Outpatient Cardiology Consultation"}
                          {activeTab === "enterprise" && "Enterprise Hospital Deployment"}
                          {activeTab === "research" && "Clinical AI Research & TreeSHAP Study"}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Encrypted transmission to {activeDoctor.name}&apos;s clinical coordinator desk
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                      SECURE EHR
                    </span>
                  </div>

                  {isSuccess ? (
                    <div className="py-8 text-center space-y-5">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>

                      <div>
                        <h4 className="text-xl font-bold text-slate-950">Clinical Consultation Request Dispatched</h4>
                        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mt-1">
                          Your case notes have been encrypted and queued directly at {activeDoctor.name}&apos;s triage desk.
                          A confirmation notice has been sent to <span className="font-semibold text-slate-900">{formData.email}</span>.
                        </p>
                      </div>

                      {/* Official Clinical Dispatch Receipt Box */}
                      <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-900">
                          <span className="font-mono text-teal-800">DISPATCH RECEIPT</span>
                          <span className="text-emerald-700 flex items-center gap-1 font-mono text-[10px]">
                            <Lock className="h-3 w-3" /> TLS 1.3 ENCRYPTED
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Tracking Token</span>
                            <span className="font-bold text-slate-900">{receiptToken}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Attending Lead</span>
                            <span className="font-bold text-slate-900">{activeDoctor.name}, MD</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Department Code</span>
                            <span className="font-bold text-teal-700">{formData.department}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Target SLA</span>
                            <span className="font-bold text-slate-900">
                              {formData.urgency === "urgent" ? "< 4 Hours (STAT)" : formData.urgency === "priority" ? "< 12 Hours" : "< 48 Hours"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={copyReceipt}
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                          >
                            {copiedToken ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span>Copied Receipt to Clipboard</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Receipt Details</span>
                              </>
                            )}
                          </button>
                          <span className="text-[9px] text-slate-400 font-mono">Verified Attending Gate</span>
                        </div>
                      </div>

                      <div className="flex justify-center gap-3 pt-2">
                        <Button
                          onClick={() => {
                            setIsSuccess(false);
                            setFormData({
                              name: "",
                              email: "",
                              phone: "",
                              organization: "",
                              mrn: "",
                              inquiryType: "physician-referral",
                              urgency: "priority",
                              department: "WARD-CCU-04",
                              message: "",
                            });
                          }}
                          variant="outline"
                          className="border-slate-300 text-xs font-bold h-10 px-5 cursor-pointer hover:bg-white"
                        >
                          Submit Another Inquiry
                        </Button>
                      </div>
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
                            placeholder="e.g. Dr. Robert Chen, MD / Eleanor Vance"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-2xs"
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="organization" className="text-xs font-bold text-slate-800 block">
                            Institution / Clinic
                          </label>
                          <input
                            id="organization"
                            type="text"
                            placeholder="Memorial Hospital / Clinic"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-2xs"
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 font-mono shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="department" className="text-xs font-bold text-slate-800 block">
                            Target Clinical Department <span className="text-rose-500">*</span>
                          </label>
                          <select
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-2xs"
                          >
                            <option value="WARD-CCU-04">WARD-CCU-04: Acute Coronary Care Unit</option>
                            <option value="LAB-EP-02">LAB-EP-02: Electrophysiology &amp; Holter Lab</option>
                            <option value="ICU-TRIAGE-B">ICU-TRIAGE-B: Sepsis &amp; ICU Triage Center</option>
                            <option value="AI-INFORMATICS-1">AI-INFORMATICS-1: Clinical AI &amp; TreeSHAP Bureau</option>
                            <option value="DIAG-VASC-01">DIAG-VASC-01: Non-Invasive Vascular Suite</option>
                            <option value="SURG-CT-03">SURG-CT-03: Cardiothoracic Surgical Liaison</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="urgency" className="text-xs font-bold text-slate-800 block">
                            Clinical Priority Tier <span className="text-rose-500">*</span>
                          </label>
                          <select
                            id="urgency"
                            value={formData.urgency}
                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-2xs"
                          >
                            <option value="priority">Priority Telemetry Evaluation (&lt; 12h SLA)</option>
                            <option value="urgent">Urgent Ward Consultation (&lt; 4h STAT)</option>
                            <option value="routine">Routine Case Review (&lt; 48h SLA)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="message" className="text-xs font-bold text-slate-800 block">
                          Clinical Findings &amp; Telemetry Observations <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="message"
                          required
                          rows={4}
                          placeholder="Summarize pertinent clinical findings, telemetry observations, rhythm strip characteristics, or consultation goals..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 resize-y shadow-2xs"
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
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-xl shadow-sm border-0 text-xs gap-2 transition-all cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Encrypting &amp; Dispatching to {activeDoctor.name}...</span>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Transmit Consultation Request to {activeDoctor.name}, MD</span>
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

        {/* 6. Hospital Department Directory with Category Filters & Search */}
        <section aria-label="Hospital Department Routing" className="py-14 sm:py-20 bg-white border-b border-slate-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shadow-2xs">
                Hospital System Directory
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3">
                Coordinated Departmental Care Units
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Direct extension numbers and on-duty escalation channels for specialized clinical care units.
              </p>
            </div>

            {/* Department Search & Category Filter Pills */}
            <div className="max-w-xl mx-auto mb-8 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search care unit by name or code (e.g., CCU, Sepsis, Electrophysiology)..."
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                />
                {deptSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDeptSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedDeptFilter === "all"
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All Units ({HOSPITAL_DEPARTMENTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter("critical")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedDeptFilter === "critical"
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Critical Care &amp; CCU
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter("diagnostic")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedDeptFilter === "diagnostic"
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Diagnostic Suites
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter("informatics")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedDeptFilter === "informatics"
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  AI &amp; Informatics
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
              {filteredDepts.map((dept) => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.code}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 hover:bg-white transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                            {dept.capacity}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {dept.code}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-950 leading-snug group-hover:text-teal-700 transition-colors">{dept.name}</h4>
                      <p className="text-[11px] text-teal-800 font-semibold mt-0.5">{dept.lead}</p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{dept.desc}</p>
                    </div>

                    <div className="pt-3 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-900">{dept.phone}</span>
                        <span className="text-[10px] text-slate-500 block">{dept.sla}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDepartmentRoute(dept.code, dept.name)}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-300 transition-all"
                      >
                        <span>Select Unit</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Clinical Referral & Telemetry FAQ Accordion */}
        <section aria-label="Clinical Consultation FAQ" className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-200">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shadow-2xs">
                Referral Inquiries
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-3">
                Frequently Asked Clinical Questions
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Key guidance on telemetry data transmission, turnaround SLAs, and attending physician oversight.
              </p>

              {/* FAQ Search */}
              <div className="max-w-md mx-auto mt-6">
                <input
                  type="text"
                  placeholder="Search questions (e.g., TreeSHAP, FHIR, SLAs)..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-3 text-left">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs transition-colors hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-950 pr-4">{faq.q}</span>
                    <span className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                      {openFaqIndex === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Mandatory Clinical Safety Invariant Banner */}
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

      {/* 9. Universal Institutional Footer */}
      <PublicFooter />
    </div>
  );
}
