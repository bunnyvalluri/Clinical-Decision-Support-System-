"""
HealthNova AI — Executive Clinical Decision Support System (BPY-CSE-2666)
Generates an 11-slide widescreen presentation in 11 distinct clinical color themes.
Engineered with tight 0.50" margins and high-density content to eliminate all dead white space.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def hex_to_rgb(hex_str: str) -> RGBColor:
    hex_str = hex_str.lstrip('#')
    return RGBColor(*(int(hex_str[i:i+2], 16) for i in (0, 2, 4)))

# 11 Curated Distinct Color Palettes for the 11 Slides
SLIDE_THEMES = [
    # Slide 1: Executive Sapphire / Navy
    {
        "bg": "#F8FAFC",
        "primary": "#0F172A",
        "secondary": "#1E3A8A",
        "accent": "#0284C7",
        "card_bg": "#FFFFFF",
        "card_border": "#CBD5E1",
        "text_main": "#0F172A",
        "text_muted": "#475569",
        "tag": "EXECUTIVE CAPSTONE DEFENSE"
    },
    # Slide 2: Clinical Crimson / Rose
    {
        "bg": "#FFF1F2",
        "primary": "#9F1239",
        "secondary": "#BE123C",
        "accent": "#E11D48",
        "card_bg": "#FFFFFF",
        "card_border": "#FECDD3",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "CLINICAL PROBLEM STATEMENT"
    },
    # Slide 3: Engineering Indigo
    {
        "bg": "#EEF2FF",
        "primary": "#312E81",
        "secondary": "#4338CA",
        "accent": "#6366F1",
        "card_bg": "#FFFFFF",
        "card_border": "#C7D2FE",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "SYSTEM ARCHITECTURE & DUAL-STACK"
    },
    # Slide 4: Forest Emerald (ML Performance)
    {
        "bg": "#ECFDF5",
        "primary": "#064E3B",
        "secondary": "#047857",
        "accent": "#059669",
        "card_bg": "#FFFFFF",
        "card_border": "#A7F3D0",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "MACHINE LEARNING & CALIBRATION"
    },
    # Slide 5: Clinical Teal (XAI / TreeSHAP)
    {
        "bg": "#F0FDFA",
        "primary": "#134E4A",
        "secondary": "#0F766E",
        "accent": "#0D9488",
        "card_bg": "#FFFFFF",
        "card_border": "#99F6E4",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "EXPLAINABLE AI (XAI) & TREESHAP"
    },
    # Slide 6: Safety Amber (Deterministic Guardrails)
    {
        "bg": "#FFFBEB",
        "primary": "#78350F",
        "secondary": "#B45309",
        "accent": "#D97706",
        "card_bg": "#FFFFFF",
        "card_border": "#FDE68A",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "SAFETY PROTOCOLS & GOVERNANCE"
    },
    # Slide 7: Ocean Blue (Doctor / Cardiologist Portal)
    {
        "bg": "#F0F9FF",
        "primary": "#0C4A6E",
        "secondary": "#0284C7",
        "accent": "#0369A1",
        "card_bg": "#FFFFFF",
        "card_border": "#BAE6FD",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "ATTENDING PHYSICIAN WORKSPACE"
    },
    # Slide 8: Sky Cyan (Emergency Triage Nurse Portal)
    {
        "bg": "#E0F2FE",
        "primary": "#0369A1",
        "secondary": "#0284C7",
        "accent": "#0EA5E9",
        "card_bg": "#FFFFFF",
        "card_border": "#7DD3FC",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "EMERGENCY TRIAGE NURSE WORKSPACE"
    },
    # Slide 9: Mint Jade (Patient & Family Health Portal)
    {
        "bg": "#F0FDF4",
        "primary": "#14532D",
        "secondary": "#15803D",
        "accent": "#16A34A",
        "card_bg": "#FFFFFF",
        "card_border": "#BBF7D0",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "PATIENT & FAMILY HEALTH PORTAL"
    },
    # Slide 10: Royal Purple (Medical Informatics & MLOps)
    {
        "bg": "#FAF5FF",
        "primary": "#581C87",
        "secondary": "#7E22CE",
        "accent": "#9333EA",
        "card_bg": "#FFFFFF",
        "card_border": "#E9D5FF",
        "text_main": "#1E293B",
        "text_muted": "#64748B",
        "tag": "MEDICAL INFORMATICS & MLOPS"
    },
    # Slide 11: Slate Obsidian (IT Infrastructure & Security)
    {
        "bg": "#F1F5F9",
        "primary": "#0F172A",
        "secondary": "#334155",
        "accent": "#475569",
        "card_bg": "#FFFFFF",
        "card_border": "#CBD5E1",
        "text_main": "#0F172A",
        "text_muted": "#64748B",
        "tag": "IT INFRASTRUCTURE & CYBERSECURITY"
    }
]

SLIDES_DATA = [
    # Slide 1
    {
        "title": "NARSIMHA REDDY ENGINEERING COLLEGE",
        "subtitle": "Department of Computer Science & Engineering • Major Capstone Project (BPY-CSE-2666)",
        "lead": "HealthNova AI: An Explainable Clinical Decision Support System for Real-Time Patient Risk Stratification",
        "cards": [],
        "stats": []
    },
    # Slide 2
    {
        "title": "Clinical Problem Statement & Unmet Need",
        "subtitle": "Overcoming the Limitations of Traditional Scoring in High-Acuity Hospital Wards",
        "lead": "Cardiovascular diseases cause 17.9M deaths annually. In ED and ICU wards, clinicians face cognitive overload and rigid cutoffs.",
        "cards": [
            {
                "title": "Static Scoring Failure",
                "desc": "Traditional calculators (Framingham, TIMI, APACHE II) rely on static admission baselines rather than continuous telemetry.",
                "bullets": [
                    "Coarse linear heuristics miss active bedside clinical deterioration",
                    "Scores remain unchanged for 24+ hours while vitals fluctuate",
                    "Ignores non-linear interactions across multi-organ biomarkers"
                ],
                "pill": "Limitation: Static 24h Clinical Baselines"
            },
            {
                "title": "Alert Fatigue & Black-Box AI",
                "desc": "High false positive alarm rates desensitize bedside nurses, while opaque deep neural networks create trust barriers.",
                "bullets": [
                    "85%+ of standard EHR alarms are false positives causing burnout",
                    "Complex neural networks act as opaque 'black boxes' without audit",
                    "Doctors cannot ethically sign off on unexplained recommendations"
                ],
                "pill": "Barrier: 85%+ False Alarms & Skepticism"
            },
            {
                "title": "The HealthNova Solution",
                "desc": "A continuous, calibrated multi-class AI architecture with bedside explainability and deterministic clinical fail-safes.",
                "bullets": [
                    "Dynamic 4-tier stratification: Low, Moderate, High, and Critical",
                    "Exact TreeSHAP biomarker attributions computed in sub-milliseconds",
                    "Deterministic rules (qSOFA, NEWS2) override AI in acute crisis"
                ],
                "pill": "Paradigm: Continuous Calibrated XAI"
            }
        ],
        "stats": [
            {"val": "17.9M", "label": "Annual CVD Deaths", "sub": "Leading Global Mortality (WHO)"},
            {"val": "85%+", "label": "Alarm Fatigue Rate", "sub": "False Positive Telemetry Rate"},
            {"val": "4 Tiers", "label": "Dynamic Acuity Levels", "sub": "Low, Mod, High, and Critical"},
            {"val": "Zero", "label": "Autonomous Prescriptions", "sub": "100% Clinician Sign-Off Mandated"}
        ]
    },
    # Slide 3
    {
        "title": "System Architecture & Dual-Stack Foundation",
        "subtitle": "Decoupled Modern Architecture for Ultra-Low Latency Telemetry and High Reliability",
        "lead": "A resilient hybrid stack combining Python Django ASGI backend services with Next.js 16.3 React 19 frontend workspaces.",
        "cards": [
            {
                "title": "Backend Services (Python/Django)",
                "desc": "High-performance Django 5.0.14 running on Daphne ASGI with Redis 7 Pub/Sub and Celery distributed background workers.",
                "bullets": [
                    "Asynchronous WebSocket channels stream telemetry with < 20ms roundtrip",
                    "Celery queues offload batch scoring, calibration, and drift checks",
                    "REST API endpoints protected by JWT and strict RBAC permission matrices"
                ],
                "pill": "Runtime: Python 3.13 • Daphne ASGI • Redis 7"
            },
            {
                "title": "Authoritative Data (Neon PostgreSQL)",
                "desc": "Serverless Neon Lakebase PostgreSQL 16 serving as the single source of truth with zero patient PHI in shared indices.",
                "bullets": [
                    "Instant database branching enables zero-risk schema migrations",
                    "Pgvector extension stores clinical knowledge embeddings safely isolated",
                    "Connection pooling handles sudden ICU telemetry spikes seamlessly"
                ],
                "pill": "Data Layer: Neon Postgres 16 • pgvector"
            },
            {
                "title": "Frontend Workspaces (Next.js)",
                "desc": "173 prerendered and dynamic clinical routes built with Next.js 16.3 Turbopack, React 19, and Tailwind CSS tokens.",
                "bullets": [
                    "Custom SVG telemetry engines render continuous waveforms at 120 FPS",
                    "Role-tailored interfaces for Physicians, Triage Nurses, and Patients",
                    "Zero external client tracking, strict CSP, and sub-250ms page hydration"
                ],
                "pill": "Interface: Next.js 16.3 • React 19 • Turbopack"
            }
        ],
        "stats": [
            {"val": "173", "label": "App Routes Compiled", "sub": "Turbopack Verified Workspaces"},
            {"val": "< 20ms", "label": "Real-Time WebSocket Sync", "sub": "Daphne ASGI Channel Roundtrip"},
            {"val": "Zero", "label": "Shared PHI Vectors", "sub": "Authoritative Neon Isolate"},
            {"val": "100%", "label": "Responsive Clinical Portals", "sub": "Physician, Nurse, Patient, Admin"}
        ]
    },
    # Slide 4
    {
        "title": "Machine Learning Pipeline & Champion Model",
        "subtitle": "Rigorous Evaluation, Isotonic Calibration, and Sub-Millisecond Inference",
        "lead": "Evaluated against standard clinical cohorts with multi-class Platt/Isotonic calibration to prevent overconfident misclassifications.",
        "cards": [
            {
                "title": "Champion Model Selection",
                "desc": "Evaluated against standard clinical cohorts; Random Forest with 150 calibrated estimators achieved superior discrimination.",
                "bullets": [
                    "Outperformed AdaBoost, Gradient Boosting, and SVM on validation folds",
                    "Tuned tree depth balances sub-millisecond execution with accuracy",
                    "Bootstrap aggregating minimizes overfitting across out-of-distribution cases"
                ],
                "pill": "Architecture: Calibrated Random Forest (150 Trees)"
            },
            {
                "title": "Probabilistic Calibration",
                "desc": "Multi-class Platt and Isotonic calibration maps raw ensemble votes directly into true posterior clinical probabilities.",
                "bullets": [
                    "Calibrated Brier score of 0.0027 demonstrates near-perfect alignment",
                    "Expected Calibration Error (ECE) minimized to 0.012 across all quantiles",
                    "Guarantees a 70% risk output corresponds precisely to a 7-in-10 outcome"
                ],
                "pill": "Metric: Brier Score 0.0027 • ECE 0.012"
            },
            {
                "title": "Sub-Millisecond Inference",
                "desc": "Production-optimized Scikit-Learn runtime executing complete patient feature inference and vectorization in 0.136ms.",
                "bullets": [
                    "Lightweight CPU execution eliminates costly GPU accelerator dependencies",
                    "Seamlessly recalculates risk score every second as patient vitals shift",
                    "Pre-allocated vector pipelines guarantee deterministic runtime latency"
                ],
                "pill": "Execution: 0.136ms CPU Inference Latency"
            }
        ],
        "stats": [
            {"val": "0.985", "label": "Champion ROC-AUC", "sub": "5-Fold Stratified Cross-Validation"},
            {"val": "0.981", "label": "Precision-Recall AUC", "sub": "High Precision on Minority Classes"},
            {"val": "0.0027", "label": "Calibrated Brier Score", "sub": "Near-Zero Probabilistic Error"},
            {"val": "150", "label": "Calibrated Trees", "sub": "Ensemble Decision Estimators"}
        ]
    },
    # Slide 5
    {
        "title": "Explainable AI (XAI) & TreeSHAP Attribution",
        "subtitle": "Deconstructing Risk Scores into Quantifiable Biomarker Drivers for Every Patient",
        "lead": "Eliminating AI skepticism by translating complex ensemble tree splits into clear positive risk contributors and protective markers.",
        "cards": [
            {
                "title": "Mathematical TreeSHAP",
                "desc": "Computes exact Shapley values from cooperative game theory across all 150 decision trees relative to expected risk base value.",
                "bullets": [
                    "Polynomial-time tree traversal computes local attributions in < 12ms",
                    "Satisfies efficiency, symmetry, additivity, and dummy axioms",
                    "Guarantees that the sum of feature contributions equals predicted risk"
                ],
                "pill": "Theory: Cooperative Game Theory Shapley Values"
            },
            {
                "title": "Biomarker Risk Drivers",
                "desc": "Deconstructs patient telemetry into escalating hazard factors and protective stabilizing markers for immediate clinician review.",
                "bullets": [
                    "Acute stressors: ST-segment depression (+26%) and Lactic Acid (+18%)",
                    "Protective buffers: Normal Serum Potassium (-8%) moderates escalation",
                    "Interactive waterfall charts visually display each parameter bedside"
                ],
                "pill": "Decomposition: Hazard vs Protective Stabilizers"
            },
            {
                "title": "Bedside SBAR Synthesis",
                "desc": "Automatically translates numeric attributions into standardized SBAR clinician shift handoff reports.",
                "bullets": [
                    "Highlights top 3 modifiable clinical biomarkers requiring intervention",
                    "Synthesizes concise nursing shift-change reports with actionable targets",
                    "Reduces clinician cognitive load and eliminates transfer miscommunication"
                ],
                "pill": "Handover: Structured Bedside SBAR Export"
            }
        ],
        "stats": [
            {"val": "0.350", "label": "Baseline E[f(x)]", "sub": "Population Baseline Risk Mean"},
            {"val": "14", "label": "Clinical Biomarkers", "sub": "Continuous Vital Signs & Labs"},
            {"val": "100%", "label": "Mathematical Fidelity", "sub": "Zero Black-Box Opacity"},
            {"val": "< 12ms", "label": "TreeSHAP Latency", "sub": "Bedside Waterfall Generation"}
        ]
    },
    # Slide 6
    {
        "title": "Deterministic Safety & Algorithmic Guardrails",
        "subtitle": "Fail-Safe Clinical Invariants and Uncertainty-Based Abstention",
        "lead": "AI never supersedes licensed clinicians. Multi-agent validation intercepts dangerous inferences before they reach the bedside.",
        "cards": [
            {
                "title": "Deterministic Overrides",
                "desc": "Hardcoded medical rules strictly supersede machine learning predictions during acute physiological crisis or ward deterioration.",
                "bullets": [
                    "Immediate CRITICAL escalation if qSOFA >= 2 or NEWS2 >= 5",
                    "Severe hypertensive crisis triggers priority alarm if SBP > 180 mmHg",
                    "Zero opportunity for algorithmic hallucinations during active shock"
                ],
                "pill": "Guardrail: Deterministic qSOFA & NEWS2 Overrides"
            },
            {
                "title": "Uncertainty Abstention Gate",
                "desc": "When Shannon entropy across prediction probability classes exceeds the safety threshold, the system autonomously abstains.",
                "bullets": [
                    "Prevents overconfident classifications in ambiguous borderline cases",
                    "Flags case: 'Prediction requires review — high epistemic uncertainty'",
                    "Prompts attending physician to order confirmatory STAT laboratory workups"
                ],
                "pill": "Safety Gate: Shannon Entropy H >= 0.79 Abstention"
            },
            {
                "title": "Prompt Injection Defense",
                "desc": "Hardened input sanitization and semantic security scanners prevent prompt leakage, adversarial tampering, and unauthorized access.",
                "bullets": [
                    "Regex and semantic embeddings scan clinical inputs for injection attempts",
                    "Context minimization strips patient identifiers before agent orchestration",
                    "Strict tool allowlisting prevents arbitrary shell, SQL, or raw data export"
                ],
                "pill": "Security: Semantic Defense & Zero PHI Vectors"
            }
        ],
        "stats": [
            {"val": "H >= 0.79", "label": "Abstention Threshold", "sub": "Shannon Epistemic Uncertainty"},
            {"val": "100%", "label": "Human-in-the-Loop", "sub": "Zero Autonomous Prescriptions"},
            {"val": "21 CFR 11", "label": "Audit Traceability", "sub": "Immutable PostgreSQL Audit Logs"},
            {"val": "Zero", "label": "Direct PHI Exposure", "sub": "RBAC Context Minimization"}
        ]
    },
    # Slide 7
    {
        "title": "Attending Physician & Cardiologist Workspace",
        "subtitle": "Authoritative Clinical Decision Center with Sovereign Overrides (/doctor)",
        "lead": "Designed for hospital cardiologists to manage ICU wards, review high-acuity cases, and sign off on clinical directives.",
        "cards": [
            {
                "title": "ICU Ward Telemetry HUD",
                "desc": "Comprehensive multi-patient surveillance dashboard displaying real-time beds, calibrated acuity badges, and confidence intervals.",
                "bullets": [
                    "Color-coded risk badges (Low: Green, Med: Yellow, High: Orange, Crit: Red)",
                    "Instant drill-down reveals patient ECG strips, labs, and TreeSHAP waterfalls",
                    "Continuous 120 FPS SVG vital trends updated live via Daphne WebSockets"
                ],
                "pill": "Interface: Real-Time ICU Command Center"
            },
            {
                "title": "Mandatory Review Queue",
                "desc": "Patients stratified into High or Critical risk are automatically quarantined into a dedicated review queue requiring physician action.",
                "bullets": [
                    "Directives cannot be finalized until an attending physician signs off",
                    "Sorts patients by urgency and rate of vital deterioration (delta-NEWS2)",
                    "Eliminates overlooked cases during high-stress ward shifts and handovers"
                ],
                "pill": "Workflow: High-Acuity Gatekeeping Queue"
            },
            {
                "title": "Sovereign Clinical Overrides",
                "desc": "Physicians retain absolute authority to Concur, Override, or Request STAT repeat diagnostics with 21 CFR Part 11 digital signatures.",
                "bullets": [
                    "Mandatory clinical rationale input required when doctor overrides ML score",
                    "Generates immutable cryptographic SHA-256 audit entries in Neon DB",
                    "Ensures complete legal traceability, clinician autonomy, and compliance"
                ],
                "pill": "Authority: Sovereign Physician Overrides & Audit"
            }
        ],
        "stats": [
            {"val": "3-Action", "label": "Decision Matrix", "sub": "Concur, Override, or STAT Repeat"},
            {"val": "95% CI", "label": "Confidence Bounds", "sub": "Statistical Acuity Certainty"},
            {"val": "SHA-256", "label": "Signature Hash", "sub": "21 CFR Part 11 Legal Audit"},
            {"val": "< 20ms", "label": "Ward Synchronization", "sub": "Daphne WebSocket Broadcasts"}
        ]
    },
    # Slide 8
    {
        "title": "Emergency Triage Nurse Workspace",
        "subtitle": "Frontline Bedside Intake, ESI Scoring, and Deterioration Alarms (/nurse)",
        "lead": "Optimized for emergency department nurses requiring high-speed vital sign entry and instant physician escalation.",
        "cards": [
            {
                "title": "Rapid ESI Triage Intake",
                "desc": "Standardized Emergency Severity Index (ESI Levels 1 to 5) sorting incoming arrivals based on acute physiological stability.",
                "bullets": [
                    "Optimized for emergency nurses facing chaotic waiting rooms and surges",
                    "Immediate identification of resuscitation cases within 15 seconds",
                    "Automated bed assignment and priority routing directly to trauma bays"
                ],
                "pill": "Protocol: Standardized ESI Levels 1 to 5 Sorting"
            },
            {
                "title": "High-Density Vital Intake",
                "desc": "Streamlined bedside data entry modal capturing SBP/DBP, Pulse, SpO2, Resp Rate, and Temp with instant auto-scoring.",
                "bullets": [
                    "Complete vital signs entered and validated in under 5 seconds cleanly",
                    "Auto-computes deterministic NEWS2 score dynamically with color alerts",
                    "Validates input ranges to prevent clerical typographical errors during entry"
                ],
                "pill": "Intake: < 5s Rapid Bedside Vital Entry Modal"
            },
            {
                "title": "Sub-Second Doctor Escalation",
                "desc": "Single-tap bedside panic escalation pushes priority audible and visual alarms directly to the attending cardiologist's workstation.",
                "bullets": [
                    "Bypasses phone delays by delivering instant WebSocket notifications",
                    "Presents attending physician with incoming patient snapshot and vitals",
                    "Cuts average code blue response and resuscitation initiation times"
                ],
                "pill": "Response: Sub-Second WebSocket Doctor Paging"
            }
        ],
        "stats": [
            {"val": "ESI 1 - 5", "label": "Triage Acuity Protocol", "sub": "Emergency Severity Index"},
            {"val": "< 5 sec", "label": "Vitals Entry Time", "sub": "Streamlined Ergonomic Interface"},
            {"val": "Sub-sec", "label": "Doctor Alerting", "sub": "Instant WebSocket Bay Escalation"},
            {"val": "NEWS2", "label": "Deterioration Scoring", "sub": "Automated Early Warning System"}
        ]
    },
    # Slide 9
    {
        "title": "Patient & Family Health Portal",
        "subtitle": "Transparent Personal Health Intelligence and Care Adherence (/user)",
        "lead": "Engaging patients in their own recovery through accessible telemetry trends, plain-language risk cards, and daily care tasks.",
        "cards": [
            {
                "title": "7-Day Longitudinal Telemetry",
                "desc": "Patient-friendly visual telemetry curves displaying blood pressure and heart rate trends plotted against clinical target baselines.",
                "bullets": [
                    "Fluid 120 FPS SVG charts show progress toward target blood pressure",
                    "Visual highlights celebrate periods of stable vital control and adherence",
                    "Accessible from mobile, tablet, or desktop with zero-lag rendering"
                ],
                "pill": "Telemetry: 120 FPS 7-Day Longitudinal Trends"
            },
            {
                "title": "Plain-Language AI Summaries",
                "desc": "Demystifies clinical risk calculations by translating TreeSHAP attributions into reassuring, plain-language health explanations.",
                "bullets": [
                    "Replaces intimidating medical jargon with understandable guidance",
                    "Explains how daily hydration, salt reduction, and meds lower cardiac load",
                    "Empowers patients and family caregivers to actively participate in care"
                ],
                "pill": "Empowerment: Plain-Language AI Translations"
            },
            {
                "title": "Care Adherence & Telehealth",
                "desc": "Comprehensive daily health checklist combining scheduled medication reminders, morning vital checks, and telehealth consults.",
                "bullets": [
                    "Tracks medication compliance and alerts care team if doses are missed",
                    "One-touch launch for encrypted, HIPAA-compliant video consults",
                    "Enables seamless FHIR/CCDA electronic health record export"
                ],
                "pill": "Engagement: Care Tasks & Telehealth Access"
            }
        ],
        "stats": [
            {"val": "120 FPS", "label": "SVG Vital Curves", "sub": "Smooth Responsive Client Rendering"},
            {"val": "7-Day", "label": "Trend History", "sub": "Continuous Longitudinal Monitoring"},
            {"val": "HIPAA", "label": "Privacy Directives", "sub": "Granular Patient Consent Controls"},
            {"val": "FHIR", "label": "Data Portability", "sub": "Standardized Clinical Record Export"}
        ]
    },
    # Slide 10
    {
        "title": "Medical Informatics & MLOps Governance",
        "subtitle": "Champion/Challenger Registry, Covariate Drift Surveillance, and Quality Auditing (/informaticist)",
        "lead": "Empowering hospital data scientists and compliance officers to audit AI models and monitor population data shifts.",
        "cards": [
            {
                "title": "Champion / Challenger Registry",
                "desc": "Rigorous model governance framework preventing premature deployments and requiring statistical validation before replacement.",
                "bullets": [
                    "Candidate models run in shadow mode alongside champion on active streams",
                    "Promotion requires superior ROC-AUC, PR-AUC, and calibration across cohorts",
                    "Complete version rollback capability ensures zero hospital downtime"
                ],
                "pill": "Governance: Shadow Mode Champion/Challenger"
            },
            {
                "title": "Continuous Drift Surveillance",
                "desc": "Automated background monitoring of input distributions using Population Stability Index (PSI) and Kolmogorov-Smirnov tests.",
                "bullets": [
                    "Flags sensor recalibration errors, seasonal health shifts, or drift early",
                    "Triggers automated retraining alert if feature PSI exceeds 0.10 limit",
                    "Requires human ML engineer sign-off before retraining weights are saved"
                ],
                "pill": "Surveillance: Population Stability Index (PSI)"
            },
            {
                "title": "Clinical Studio & NocoDB",
                "desc": "Spreadsheet-style exploratory studio enabling non-SQL clinical queries across millions of telemetry rows with HIPAA obfuscation.",
                "bullets": [
                    "Allows medical directors to query cohort trends, false positives, and overrides",
                    "Automated de-identification filters strip patient names, MRNs, and DOBs",
                    "Generates regulatory compliance dossiers aligned with FDA Class II SaMD"
                ],
                "pill": "Auditing: NocoDB Clinical Studio & FDA Dossiers"
            }
        ],
        "stats": [
            {"val": "PSI < 0.1", "label": "Drift Safety Limit", "sub": "Population Stability Index Benchmark"},
            {"val": "KS-Test", "label": "Two-Sample Metric", "sub": "Distribution Divergence Surveillance"},
            {"val": "NocoDB", "label": "Clinical Studio", "sub": "Spreadsheet Exploratory Interface"},
            {"val": "Class II", "label": "SaMD Regulatory Dossier", "sub": "FDA Aligned Quality Governance"}
        ]
    },
    # Slide 11
    {
        "title": "IT Infrastructure, Cybersecurity & Deployment",
        "subtitle": "Enterprise Zero-Trust RBAC, Cloud Scalability, and Production Verification (/admin)",
        "lead": "Hardened platform operations ensuring high availability, sub-millisecond response times, and multi-cloud resilience.",
        "cards": [
            {
                "title": "Zero-Trust RBAC Security",
                "desc": "Strict role-based access control enforcing least-privilege boundaries across PATIENT, NURSE, DOCTOR, INFORMATICIST, and ADMIN.",
                "bullets": [
                    "Mandatory multi-factor authentication (MFA) and cryptographic token rotation",
                    "Audit trail logs every endpoint request, clinician override, and data access",
                    "Context minimization guarantees zero patient PHI leakage into prompts"
                ],
                "pill": "Cybersecurity: Zero-Trust RBAC & Session Tokens"
            },
            {
                "title": "High-Availability Cloud Stack",
                "desc": "Resilient serverless infrastructure combining Neon PostgreSQL connection pooling, Redis 7 caching, and Daphne ASGI workers.",
                "bullets": [
                    "Redis caching achieves >98% hit rate for frequent patient telemetry queries",
                    "Asynchronous Daphne server handles thousands of concurrent WebSockets",
                    "Neon autoscaling seamlessly adapts to sudden hospital surge events"
                ],
                "pill": "Infrastructure: Neon Postgres • Redis 7 • Celery"
            },
            {
                "title": "Production Vercel Deployment",
                "desc": "Continuous deployment on Vercel with 30/30 automated unit test suites passing in under 250ms with zero runtime warnings.",
                "bullets": [
                    "173 static and dynamic routes compiled cleanly with Next.js Turbopack",
                    "Automated CI/CD pipelines enforce React Doctor standards and PEP 8",
                    "Zero build errors, zero broken links, and 100% WCAG 2.1 AA accessibility"
                ],
                "pill": "Verification: 30/30 Test Suites Passed • Next.js 16.3"
            }
        ],
        "stats": [
            {"val": "30 / 30", "label": "Unit Tests Passed", "sub": "Sub-250ms Test Suite Execution"},
            {"val": "98%+", "label": "Redis Cache Hit Rate", "sub": "High-Throughput Telemetry Retrieval"},
            {"val": "Zero-Trust", "label": "RBAC Protection", "sub": "5 Role-Separated Clinical Gates"},
            {"val": "Vercel & Neon", "label": "Production Cloud", "sub": "Continuous Deployment Pipeline"}
        ]
    }
]

def build_title_slide(slide):
    # 1. Background Fill
    bg_shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5)
    )
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = hex_to_rgb("#F8FAFC")
    bg_shape.line.fill.background()

    # 2. Top Color Accent Stripes
    top_stripe = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.14)
    )
    top_stripe.fill.solid()
    top_stripe.fill.fore_color.rgb = hex_to_rgb("#1E3A8A")
    top_stripe.line.fill.background()

    top_sub = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, Inches(0.14), Inches(13.333), Inches(0.04)
    )
    top_sub.fill.solid()
    top_sub.fill.fore_color.rgb = hex_to_rgb("#0284C7")
    top_sub.line.fill.background()

    # 3. Institutional Header Card (Top) - Extended to 12.333" width for 0.50" margins
    inst_card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.25), Inches(12.333), Inches(1.22)
    )
    inst_card.fill.solid()
    inst_card.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
    inst_card.line.color.rgb = hex_to_rgb("#CBD5E1")
    inst_card.line.width = Pt(1.5)

    # Left accent bar on institutional card
    inst_bar = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.25), Inches(0.12), Inches(1.22)
    )
    inst_bar.fill.solid()
    inst_bar.fill.fore_color.rgb = hex_to_rgb("#0284C7")
    inst_bar.line.fill.background()

    inst_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.28), Inches(11.95), Inches(1.15))
    inst_tf = inst_box.text_frame
    inst_tf.word_wrap = True
    inst_tf.margin_left = Inches(0)
    inst_tf.margin_top = Inches(0)

    # College Name
    p_col = inst_tf.paragraphs[0]
    p_col.alignment = PP_ALIGN.CENTER
    r_col = p_col.add_run()
    r_col.text = "NARSIMHA REDDY ENGINEERING COLLEGE"
    r_col.font.size = Pt(20)
    r_col.font.bold = True
    r_col.font.color.rgb = hex_to_rgb("#0F172A")
    r_col.font.name = "Segoe UI"

    # Affiliation / Autonomy
    p_aff = inst_tf.add_paragraph()
    p_aff.space_before = Pt(2)
    p_aff.alignment = PP_ALIGN.CENTER
    r_aff = p_aff.add_run()
    r_aff.text = "(UGC - AUTONOMOUS INSTITUTION  •  APPROVED BY AICTE, NEW DELHI  •  AFFILIATED TO JNTUH)"
    r_aff.font.size = Pt(8.5)
    r_aff.font.bold = True
    r_aff.font.color.rgb = hex_to_rgb("#64748B")
    r_aff.font.name = "Segoe UI"

    # Department
    p_dept = inst_tf.add_paragraph()
    p_dept.space_before = Pt(2)
    p_dept.alignment = PP_ALIGN.CENTER
    r_dept = p_dept.add_run()
    r_dept.text = "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"
    r_dept.font.size = Pt(12)
    r_dept.font.bold = True
    r_dept.font.color.rgb = hex_to_rgb("#1E3A8A")
    r_dept.font.name = "Segoe UI"

    # Project Presentation Badge
    p_badge = inst_tf.add_paragraph()
    p_badge.space_before = Pt(2)
    p_badge.alignment = PP_ALIGN.CENTER
    r_badge = p_badge.add_run()
    r_badge.text = "MAJOR CAPSTONE PROJECT PRESENTATION  •  ACADEMIC YEAR 2026–2027"
    r_badge.font.size = Pt(8.5)
    r_badge.font.bold = True
    r_badge.font.color.rgb = hex_to_rgb("#0284C7")
    r_badge.font.name = "Segoe UI"

    # 4. Project Showcase Hero Card (Middle) - y=1.58, h=1.80 (ends at y=3.38)
    proj_card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(1.58), Inches(12.333), Inches(1.80)
    )
    proj_card.fill.solid()
    proj_card.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
    proj_card.line.color.rgb = hex_to_rgb("#CBD5E1")
    proj_card.line.width = Pt(1.5)

    proj_bar = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(1.58), Inches(0.12), Inches(1.80)
    )
    proj_bar.fill.solid()
    proj_bar.fill.fore_color.rgb = hex_to_rgb("#1E3A8A")
    proj_bar.line.fill.background()

    # Left Section of Hero Card (Project description & technical scope)
    proj_box = slide.shapes.add_textbox(Inches(0.80), Inches(1.64), Inches(7.8), Inches(1.68))
    proj_tf = proj_box.text_frame
    proj_tf.word_wrap = True
    proj_tf.margin_left = Inches(0)
    proj_tf.margin_top = Inches(0)

    # Sub-tag
    p_ptag = proj_tf.paragraphs[0]
    r_ptag = p_ptag.add_run()
    r_ptag.text = "PROJECT CODE: BPY-CSE-2666  •  CLINICAL DECISION SUPPORT SYSTEM (CDSS)"
    r_ptag.font.size = Pt(9)
    r_ptag.font.bold = True
    r_ptag.font.color.rgb = hex_to_rgb("#0284C7")
    r_ptag.font.name = "Segoe UI"

    # Project Title
    p_ptitle = proj_tf.add_paragraph()
    p_ptitle.space_before = Pt(2)
    r_ptitle = p_ptitle.add_run()
    r_ptitle.text = "HealthNova AI: Patient Risk Level Prediction System"
    r_ptitle.font.size = Pt(20)
    r_ptitle.font.bold = True
    r_ptitle.font.color.rgb = hex_to_rgb("#0F172A")
    r_ptitle.font.name = "Segoe UI"

    # Subtitle / Abstract
    p_psub = proj_tf.add_paragraph()
    p_psub.space_before = Pt(2)
    r_psub = p_psub.add_run()
    r_psub.text = "Explainable Clinical Acuity Stratification with Multi-Class ML & TreeSHAP Attribution"
    r_psub.font.size = Pt(10.5)
    r_psub.font.bold = True
    r_psub.font.color.rgb = hex_to_rgb("#334155")
    r_psub.font.name = "Segoe UI"

    # Narrative Paragraph filling the space
    p_pnarr = proj_tf.add_paragraph()
    p_pnarr.space_before = Pt(3)
    r_pnarr = p_pnarr.add_run()
    r_pnarr.text = "Continuous bedside telemetry monitoring combining Daphne ASGI real-time channels with calibrated Random Forest inference to prevent emergency department & ICU deterioration."
    r_pnarr.font.size = Pt(9.2)
    r_pnarr.font.color.rgb = hex_to_rgb("#475569")
    r_pnarr.font.name = "Segoe UI"

    # Tech stack pill line inside left box
    p_ptech = proj_tf.add_paragraph()
    p_ptech.space_before = Pt(3)
    r_ptech = p_ptech.add_run()
    r_ptech.text = "Stack: Python 3.13 • Django 5 • Daphne ASGI • Next.js 16.3 • React 19 • Neon PostgreSQL • pgvector"
    r_ptech.font.size = Pt(8.2)
    r_ptech.font.bold = True
    r_ptech.font.color.rgb = hex_to_rgb("#1E3A8A")
    r_ptech.font.name = "Segoe UI"

    # Right Section of Hero Card: 4-Grid Metric Showcase
    metric_items = [
        {"val": "0.985", "label": "Champion ROC-AUC", "sub": "5-Fold Stratified CV"},
        {"val": "0.0027", "label": "Calibrated Brier", "sub": "Near-Zero Prob Error"},
        {"val": "100%", "label": "Acute Recall", "sub": "Zero Missed Crises"},
        {"val": "0.136ms", "label": "Inference Latency", "sub": "CPU Scikit Runtime"}
    ]
    grid_w = Inches(1.85)
    grid_h = Inches(0.74)
    base_x = Inches(8.80)
    base_y = Inches(1.66)

    for m_idx, m_item in enumerate(metric_items):
        gx = base_x + (m_idx % 2) * (grid_w + Inches(0.12))
        gy = base_y + (m_idx // 2) * (grid_h + Inches(0.10))

        m_shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, gx, gy, grid_w, grid_h
        )
        m_shape.fill.solid()
        m_shape.fill.fore_color.rgb = hex_to_rgb("#F1F5F9")
        m_shape.line.color.rgb = hex_to_rgb("#CBD5E1")
        m_shape.line.width = Pt(1)

        m_box = slide.shapes.add_textbox(gx + Inches(0.06), gy + Inches(0.04), grid_w - Inches(0.12), grid_h - Inches(0.08))
        m_tf = m_box.text_frame
        m_tf.word_wrap = True
        m_tf.margin_left = Inches(0)
        m_tf.margin_top = Inches(0)

        mp0 = m_tf.paragraphs[0]
        mp0.alignment = PP_ALIGN.CENTER
        mr0 = mp0.add_run()
        mr0.text = m_item["val"]
        mr0.font.size = Pt(13)
        mr0.font.bold = True
        mr0.font.color.rgb = hex_to_rgb("#0284C7")
        mr0.font.name = "Segoe UI"

        mp1 = m_tf.add_paragraph()
        mp1.space_before = Pt(1)
        mp1.alignment = PP_ALIGN.CENTER
        mr1 = mp1.add_run()
        mr1.text = m_item["label"]
        mr1.font.size = Pt(7.5)
        mr1.font.bold = True
        mr1.font.color.rgb = hex_to_rgb("#0F172A")
        mr1.font.name = "Segoe UI"

        mp2 = m_tf.add_paragraph()
        mp2.space_before = Pt(1)
        mp2.alignment = PP_ALIGN.CENTER
        mr2 = mp2.add_run()
        mr2.text = m_item["sub"]
        mr2.font.size = Pt(7)
        mr2.font.color.rgb = hex_to_rgb("#64748B")
        mr2.font.name = "Segoe UI"

    # 5. Team Section Header - Completely clear from hero card (y=3.52, well below y=3.38)
    team_lbl_box = slide.shapes.add_textbox(Inches(0.50), Inches(3.52), Inches(12.333), Inches(0.28))
    team_lbl_tf = team_lbl_box.text_frame
    team_lbl_tf.margin_left = Inches(0)
    team_lbl_tf.margin_top = Inches(0)
    tp = team_lbl_tf.paragraphs[0]
    tr = tp.add_run()
    tr.text = "PROJECT PRESENTATION TEAM  (DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING)"
    tr.font.size = Pt(10.5)
    tr.font.bold = True
    tr.font.color.rgb = hex_to_rgb("#1E3A8A")
    tr.font.name = "Segoe UI"

    # 6. Team 5 Cards Grid - Clean academic format without fabricated roles
    team_members = [
        {"name": "VEDHASREE", "htno": "23X01A05Z8", "init": "VS", "color": "#0284C7"},
        {"name": "PRASHANTH", "htno": "23X01A05Y1", "init": "PR", "color": "#1E3A8A"},
        {"name": "ABHINAY", "htno": "23X01A05AG", "init": "AB", "color": "#0284C7"},
        {"name": "RAHUL", "htno": "23X01A05AL", "init": "RH", "color": "#1E3A8A"},
        {"name": "PRANAY", "htno": "23X01A05AA", "init": "PN", "color": "#0284C7"}
    ]

    card_w = Inches(2.35)
    card_h = Inches(1.85)
    card_y = Inches(4.00)
    card_spacing = Inches(0.145)

    for c_idx, member in enumerate(team_members):
        card_x = Inches(0.50) + c_idx * (card_w + card_spacing)

        # Card shape
        c_shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, card_h
        )
        c_shape.fill.solid()
        c_shape.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
        c_shape.line.color.rgb = hex_to_rgb("#CBD5E1")
        c_shape.line.width = Pt(1.5)

        # Top color strip
        c_strip = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, Inches(0.08)
        )
        c_strip.fill.solid()
        c_strip.fill.fore_color.rgb = hex_to_rgb(member["color"])
        c_strip.line.fill.background()

        # Avatar Initial Circle
        avatar_size = Inches(0.58)
        avatar_x = card_x + (card_w - avatar_size) / 2
        avatar_y = card_y + Inches(0.12)
        avatar = slide.shapes.add_shape(
            MSO_SHAPE.OVAL, avatar_x, avatar_y, avatar_size, avatar_size
        )
        avatar.fill.solid()
        avatar.fill.fore_color.rgb = hex_to_rgb("#EFF6FF")
        avatar.line.color.rgb = hex_to_rgb("#BAE6FD")
        avatar.line.width = Pt(1.5)

        av_tf = avatar.text_frame
        av_tf.margin_left = Inches(0)
        av_tf.margin_top = Inches(0.04)
        av_p = av_tf.paragraphs[0]
        av_p.alignment = PP_ALIGN.CENTER
        av_r = av_p.add_run()
        av_r.text = member["init"]
        av_r.font.size = Pt(12)
        av_r.font.bold = True
        av_r.font.color.rgb = hex_to_rgb(member["color"])
        av_r.font.name = "Segoe UI"

        # Card Content Frame
        c_text_box = slide.shapes.add_textbox(card_x + Inches(0.08), card_y + Inches(0.74), card_w - Inches(0.16), card_h - Inches(0.78))
        c_tf = c_text_box.text_frame
        c_tf.word_wrap = True
        c_tf.margin_left = Inches(0)
        c_tf.margin_top = Inches(0)

        # Member Name
        cp1 = c_tf.paragraphs[0]
        cp1.alignment = PP_ALIGN.CENTER
        cr1 = cp1.add_run()
        cr1.text = member["name"]
        cr1.font.size = Pt(14)
        cr1.font.bold = True
        cr1.font.color.rgb = hex_to_rgb("#0F172A")
        cr1.font.name = "Segoe UI"

        # Hall Ticket Box / Text
        cp2 = c_tf.add_paragraph()
        cp2.space_before = Pt(3)
        cp2.alignment = PP_ALIGN.CENTER
        cr2 = cp2.add_run()
        cr2.text = member["htno"]
        cr2.font.size = Pt(11.5)
        cr2.font.bold = True
        cr2.font.color.rgb = hex_to_rgb("#0284C7")
        cr2.font.name = "Consolas"

        # Department / Academic Year
        cp3 = c_tf.add_paragraph()
        cp3.space_before = Pt(3)
        cp3.alignment = PP_ALIGN.CENTER
        cr3 = cp3.add_run()
        cr3.text = "B.Tech CSE • 4th Year"
        cr3.font.size = Pt(9)
        cr3.font.bold = True
        cr3.font.color.rgb = hex_to_rgb("#475569")
        cr3.font.name = "Segoe UI"

        # College Line
        cp4 = c_tf.add_paragraph()
        cp4.space_before = Pt(1)
        cp4.alignment = PP_ALIGN.CENTER
        cr4 = cp4.add_run()
        cr4.text = "Narsimha Reddy Engg College"
        cr4.font.size = Pt(8)
        cr4.font.color.rgb = hex_to_rgb("#64748B")
        cr4.font.name = "Segoe UI"

    # 7. Project Key Performance Metrics Ribbon across bottom of Slide 1
    stat_items = [
        {"val": "0.985", "label": "Champion ROC-AUC", "sub": "5-Fold Stratified Cross-Validation"},
        {"val": "0.0027", "label": "Calibrated Brier Score", "sub": "Near-Zero Probabilistic Error"},
        {"val": "100%", "label": "Acute Risk Recall", "sub": "Zero Missed Medical Crises"},
        {"val": "0.136ms", "label": "Inference Latency", "sub": "Sub-Millisecond CPU Runtime"}
    ]
    stat_w = Inches(2.91)
    stat_h = Inches(0.95)
    stat_y = Inches(5.95)
    stat_spacing = Inches(0.23)

    for s_idx, s_item in enumerate(stat_items):
        stat_x = Inches(0.50) + s_idx * (stat_w + stat_spacing)

        s_shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, stat_h
        )
        s_shape.fill.solid()
        s_shape.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
        s_shape.line.color.rgb = hex_to_rgb("#CBD5E1")
        s_shape.line.width = Pt(1.5)

        # Micro accent strip
        s_strip = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, Inches(0.05)
        )
        s_strip.fill.solid()
        s_strip.fill.fore_color.rgb = hex_to_rgb("#0284C7")
        s_strip.line.fill.background()

        s_box = slide.shapes.add_textbox(stat_x + Inches(0.1), stat_y + Inches(0.1), stat_w - Inches(0.2), stat_h - Inches(0.18))
        s_tf = s_box.text_frame
        s_tf.word_wrap = True
        s_tf.margin_left = Inches(0)
        s_tf.margin_top = Inches(0)

        sp1 = s_tf.paragraphs[0]
        sp1.alignment = PP_ALIGN.CENTER
        sr1 = sp1.add_run()
        sr1.text = s_item["val"]
        sr1.font.size = Pt(17)
        sr1.font.bold = True
        sr1.font.color.rgb = hex_to_rgb("#0284C7")
        sr1.font.name = "Segoe UI"

        sp2 = s_tf.add_paragraph()
        sp2.space_before = Pt(1)
        sp2.alignment = PP_ALIGN.CENTER
        sr2 = sp2.add_run()
        sr2.text = s_item["label"]
        sr2.font.size = Pt(9)
        sr2.font.bold = True
        sr2.font.color.rgb = hex_to_rgb("#0F172A")
        sr2.font.name = "Segoe UI"

        sp3 = s_tf.add_paragraph()
        sp3.space_before = Pt(1)
        sp3.alignment = PP_ALIGN.CENTER
        sr3 = sp3.add_run()
        sr3.text = s_item["sub"]
        sr3.font.size = Pt(7.5)
        sr3.font.color.rgb = hex_to_rgb("#64748B")
        sr3.font.name = "Segoe UI"

    # 8. Footer
    footer_box = slide.shapes.add_textbox(Inches(0.50), Inches(7.02), Inches(12.333), Inches(0.30))
    footer_tf = footer_box.text_frame
    fp = footer_tf.paragraphs[0]
    fp.alignment = PP_ALIGN.CENTER
    fr = fp.add_run()
    fr.text = "Narsimha Reddy Engineering College  •  Maisammaguda, Secunderabad  •  HealthNova AI Project Code: BPY-CSE-2666"
    fr.font.size = Pt(8.5)
    fr.font.bold = True
    fr.font.color.rgb = hex_to_rgb("#64748B")
    fr.font.name = "Segoe UI"

def build_presentation(output_path: str):
    prs = Presentation()
    # 16:9 Widescreen standard: 13.333 x 7.5 inches
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide layout

    for idx, (data, theme) in enumerate(zip(SLIDES_DATA, SLIDE_THEMES), start=1):
        slide = prs.slides.add_slide(blank_layout)

        # Slide 1 uses dedicated ultra-professional Academic Title Layout
        if idx == 1:
            build_title_slide(slide)
            continue

        # 1. Background Fill
        bg_shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5)
        )
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = hex_to_rgb(theme["bg"])
        bg_shape.line.fill.background()

        # 2. Top Color Accent Stripe
        top_stripe = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12)
        )
        top_stripe.fill.solid()
        top_stripe.fill.fore_color.rgb = hex_to_rgb(theme["accent"])
        top_stripe.line.fill.background()

        # 3. Slide Number & Category Tag Pill
        pill_shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.32), Inches(3.6), Inches(0.36)
        )
        pill_shape.fill.solid()
        pill_shape.fill.fore_color.rgb = hex_to_rgb(theme["card_bg"])
        pill_shape.line.color.rgb = hex_to_rgb(theme["card_border"])
        pill_shape.line.width = Pt(1.5)
        
        pill_tf = pill_shape.text_frame
        pill_tf.word_wrap = True
        pill_tf.margin_left = Inches(0.15)
        pill_tf.margin_right = Inches(0.15)
        pill_tf.margin_top = Inches(0.04)
        pill_p = pill_tf.paragraphs[0]
        pill_p.alignment = PP_ALIGN.CENTER
        pill_run = pill_p.add_run()
        pill_run.text = f"SLIDE {idx:02d} / 11  •  {theme['tag']}"
        pill_run.font.size = Pt(9.5)
        pill_run.font.bold = True
        pill_run.font.color.rgb = hex_to_rgb(theme["secondary"])
        pill_run.font.name = "Segoe UI"

        # Project Code watermark in top right
        code_box = slide.shapes.add_textbox(Inches(7.2), Inches(0.32), Inches(5.633), Inches(0.36))
        code_tf = code_box.text_frame
        code_p = code_tf.paragraphs[0]
        code_p.alignment = PP_ALIGN.RIGHT
        code_run = code_p.add_run()
        code_run.text = "BPY-CSE-2666 • HealthNova AI"
        code_run.font.size = Pt(10)
        code_run.font.bold = True
        code_run.font.color.rgb = hex_to_rgb(theme["text_muted"])
        code_run.font.name = "Segoe UI"

        # 4. Slide Title & Subtitle Header Box - Full width from 0.50"
        header_box = slide.shapes.add_textbox(Inches(0.50), Inches(0.72), Inches(12.333), Inches(1.10))
        header_tf = header_box.text_frame
        header_tf.word_wrap = True
        header_tf.margin_left = Inches(0)
        header_tf.margin_top = Inches(0)

        # Title Paragraph
        p_title = header_tf.paragraphs[0]
        r_title = p_title.add_run()
        r_title.text = data["title"]
        r_title.font.size = Pt(23)
        r_title.font.bold = True
        r_title.font.color.rgb = hex_to_rgb(theme["primary"])
        r_title.font.name = "Segoe UI"

        # Subtitle Paragraph
        p_sub = header_tf.add_paragraph()
        p_sub.space_before = Pt(2)
        r_sub = p_sub.add_run()
        r_sub.text = data["subtitle"]
        r_sub.font.size = Pt(11)
        r_sub.font.bold = True
        r_sub.font.color.rgb = hex_to_rgb(theme["secondary"])
        r_sub.font.name = "Segoe UI"

        # Lead text
        p_lead = header_tf.add_paragraph()
        p_lead.space_before = Pt(2)
        r_lead = p_lead.add_run()
        r_lead.text = data["lead"]
        r_lead.font.size = Pt(10)
        r_lead.font.color.rgb = hex_to_rgb(theme["text_muted"])
        r_lead.font.name = "Segoe UI"

        # 5. Middle Section: 3 High-Density Feature Cards (Calibrated height & zero dead white space!)
        card_w = Inches(3.96)
        card_h = Inches(3.05)
        card_y = Inches(1.95)
        card_spacing = Inches(0.226)

        for c_idx, card in enumerate(data["cards"]):
            card_x = Inches(0.50) + c_idx * (card_w + card_spacing)
            
            # Card Box
            c_shape = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, card_h
            )
            c_shape.fill.solid()
            c_shape.fill.fore_color.rgb = hex_to_rgb(theme["card_bg"])
            c_shape.line.color.rgb = hex_to_rgb(theme["card_border"])
            c_shape.line.width = Pt(1.5)

            # Top border color strip on card
            c_strip = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, Inches(0.08)
            )
            c_strip.fill.solid()
            c_strip.fill.fore_color.rgb = hex_to_rgb(theme["accent"])
            c_strip.line.fill.background()

            # Card Content Frame
            c_text_box = slide.shapes.add_textbox(card_x + Inches(0.18), card_y + Inches(0.14), card_w - Inches(0.36), card_h - Inches(0.52))
            c_tf = c_text_box.text_frame
            c_tf.word_wrap = True
            c_tf.margin_left = Inches(0)
            c_tf.margin_top = Inches(0)

            # Card Number Badge
            cp0 = c_tf.paragraphs[0]
            cr0 = cp0.add_run()
            cr0.text = f"KEY CAPABILITY 0{c_idx+1}"
            cr0.font.size = Pt(8.5)
            cr0.font.bold = True
            cr0.font.color.rgb = hex_to_rgb(theme["secondary"])
            cr0.font.name = "Segoe UI"

            # Card Title
            cp1 = c_tf.add_paragraph()
            cp1.space_before = Pt(3)
            cr1 = cp1.add_run()
            cr1.text = card["title"]
            cr1.font.size = Pt(13.5)
            cr1.font.bold = True
            cr1.font.color.rgb = hex_to_rgb(theme["primary"])
            cr1.font.name = "Segoe UI"

            # Card Description
            cp2 = c_tf.add_paragraph()
            cp2.space_before = Pt(4)
            cr2 = cp2.add_run()
            cr2.text = card["desc"]
            cr2.font.size = Pt(9.8)
            cr2.font.color.rgb = hex_to_rgb(theme["text_main"])
            cr2.font.name = "Segoe UI"

            # Bullet points filling the card purposefully
            for bullet in card.get("bullets", []):
                bp = c_tf.add_paragraph()
                bp.space_before = Pt(4)
                br = bp.add_run()
                br.text = f"•  {bullet}"
                br.font.size = Pt(9.0)
                br.font.color.rgb = hex_to_rgb(theme["text_muted"])
                br.font.name = "Segoe UI"

            # Bottom Highlight Pill (Snug fit eliminating bottom dead space!)
            pill_w = card_w - Inches(0.32)
            pill_h = Inches(0.28)
            pill_x = card_x + Inches(0.16)
            pill_y = card_y + card_h - Inches(0.36)

            c_pill = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, pill_x, pill_y, pill_w, pill_h
            )
            c_pill.fill.solid()
            c_pill.fill.fore_color.rgb = hex_to_rgb(theme["bg"])
            c_pill.line.color.rgb = hex_to_rgb(theme["card_border"])
            c_pill.line.width = Pt(1)

            c_pill_tf = c_pill.text_frame
            c_pill_tf.margin_left = Inches(0)
            c_pill_tf.margin_top = Inches(0.02)
            c_pp = c_pill_tf.paragraphs[0]
            c_pp.alignment = PP_ALIGN.CENTER
            c_pr = c_pp.add_run()
            c_pr.text = card.get("pill", "")
            c_pr.font.size = Pt(8.2)
            c_pr.font.bold = True
            c_pr.font.color.rgb = hex_to_rgb(theme["accent"])
            c_pr.font.name = "Segoe UI"

        # 6. Bottom Ribbon: 4 Key Metrics / Clinical Stats - Extended height to 1.68" with top accent
        stat_w = Inches(2.91)
        stat_h = Inches(1.68)
        stat_y = Inches(5.18)
        stat_spacing = Inches(0.23)

        for s_idx, stat in enumerate(data["stats"]):
            stat_x = Inches(0.50) + s_idx * (stat_w + stat_spacing)

            s_shape = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, stat_h
            )
            s_shape.fill.solid()
            s_shape.fill.fore_color.rgb = hex_to_rgb(theme["card_bg"])
            s_shape.line.color.rgb = hex_to_rgb(theme["card_border"])
            s_shape.line.width = Pt(1.5)

            # Top micro accent strip on stat card
            s_strip = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, Inches(0.06)
            )
            s_strip.fill.solid()
            s_strip.fill.fore_color.rgb = hex_to_rgb(theme["accent"])
            s_strip.line.fill.background()

            s_box = slide.shapes.add_textbox(stat_x + Inches(0.12), stat_y + Inches(0.16), stat_w - Inches(0.24), stat_h - Inches(0.24))
            s_tf = s_box.text_frame
            s_tf.word_wrap = True
            s_tf.margin_left = Inches(0)
            s_tf.margin_top = Inches(0)

            # Stat Value (Bold, prominent)
            sp1 = s_tf.paragraphs[0]
            sp1.alignment = PP_ALIGN.CENTER
            sr1 = sp1.add_run()
            sr1.text = stat["val"]
            sr1.font.size = Pt(25)
            sr1.font.bold = True
            sr1.font.color.rgb = hex_to_rgb(theme["accent"])
            sr1.font.name = "Segoe UI"

            # Stat Label
            sp2 = s_tf.add_paragraph()
            sp2.space_before = Pt(3)
            sp2.alignment = PP_ALIGN.CENTER
            sr2 = sp2.add_run()
            sr2.text = stat["label"]
            sr2.font.size = Pt(11)
            sr2.font.bold = True
            sr2.font.color.rgb = hex_to_rgb(theme["primary"])
            sr2.font.name = "Segoe UI"

            # Stat Subtitle Context
            sp3 = s_tf.add_paragraph()
            sp3.space_before = Pt(3)
            sp3.alignment = PP_ALIGN.CENTER
            sr3 = sp3.add_run()
            sr3.text = stat.get("sub", "")
            sr3.font.size = Pt(8.8)
            sr3.font.color.rgb = hex_to_rgb(theme["text_muted"])
            sr3.font.name = "Segoe UI"

        # Footer attribution banner
        footer_box = slide.shapes.add_textbox(Inches(0.50), Inches(6.98), Inches(12.333), Inches(0.32))
        footer_tf = footer_box.text_frame
        fp = footer_tf.paragraphs[0]
        fp.alignment = PP_ALIGN.CENTER
        fr = fp.add_run()
        fr.text = "HealthNova AI  •  Assistive Intelligence Only  •  Human-in-the-Loop Clinician Sign-Off Mandated  •  21 CFR Part 11 Aligned"
        fr.font.size = Pt(8.5)
        fr.font.bold = True
        fr.font.color.rgb = hex_to_rgb(theme["text_muted"])
        fr.font.name = "Segoe UI"

    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("HealthNova_AI_Clinical_Decision_Support_System.pptx")
    build_presentation(out_file)
