"""
HealthNova AI — Executive Clinical Decision Support System (BPY-CSE-2666)
Generates an EXACT 11-slide presentation optimized for college defense:
- Content is SHORT, PUNCHY, and EASY TO EXPLAIN to professors and examiners.
- Font sizes are enlarged for high-contrast projector readability.
- Exports native 11-page PDF: HealthNova_AI_Clinical_Decision_Support_System.pdf
- Leaves NO .pptx files in the workspace.
"""

import os
import shutil
import glob
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def hex_to_rgb(hex_str: str) -> RGBColor:
    hex_str = hex_str.lstrip('#')
    return RGBColor(*(int(hex_str[i:i+2], 16) for i in (0, 2, 4)))

SLIDE_THEMES = [
    # Slide 1: Navy
    {"bg": "#F8FAFC", "primary": "#0F172A", "secondary": "#1E3A8A", "accent": "#0284C7", "card_bg": "#FFFFFF", "card_border": "#CBD5E1", "text_main": "#0F172A", "text_muted": "#475569", "tag": "EXECUTIVE CAPSTONE DEFENSE"},
    # Slide 2: Rose
    {"bg": "#FFF1F2", "primary": "#9F1239", "secondary": "#BE123C", "accent": "#E11D48", "card_bg": "#FFFFFF", "card_border": "#FECDD3", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "CLINICAL PROBLEM STATEMENT"},
    # Slide 3: Indigo
    {"bg": "#EEF2FF", "primary": "#312E81", "secondary": "#4338CA", "accent": "#6366F1", "card_bg": "#FFFFFF", "card_border": "#C7D2FE", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "SYSTEM ARCHITECTURE & DUAL-STACK"},
    # Slide 4: Emerald
    {"bg": "#ECFDF5", "primary": "#064E3B", "secondary": "#047857", "accent": "#059669", "card_bg": "#FFFFFF", "card_border": "#A7F3D0", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "MACHINE LEARNING & CALIBRATION"},
    # Slide 5: Teal
    {"bg": "#F0FDFA", "primary": "#134E4A", "secondary": "#0F766E", "accent": "#0D9488", "card_bg": "#FFFFFF", "card_border": "#99F6E4", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "EXPLAINABLE AI (XAI) & TREESHAP"},
    # Slide 6: Amber
    {"bg": "#FFFBEB", "primary": "#78350F", "secondary": "#B45309", "accent": "#D97706", "card_bg": "#FFFFFF", "card_border": "#FDE68A", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "SAFETY PROTOCOLS & GOVERNANCE"},
    # Slide 7: Ocean
    {"bg": "#F0F9FF", "primary": "#0C4A6E", "secondary": "#0284C7", "accent": "#0369A1", "card_bg": "#FFFFFF", "card_border": "#BAE6FD", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "ATTENDING PHYSICIAN WORKSPACE"},
    # Slide 8: Sky
    {"bg": "#E0F2FE", "primary": "#0369A1", "secondary": "#0284C7", "accent": "#0EA5E9", "card_bg": "#FFFFFF", "card_border": "#7DD3FC", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "EMERGENCY TRIAGE NURSE WORKSPACE"},
    # Slide 9: Mint
    {"bg": "#F0FDF4", "primary": "#14532D", "secondary": "#15803D", "accent": "#16A34A", "card_bg": "#FFFFFF", "card_border": "#BBF7D0", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "PATIENT & FAMILY HEALTH PORTAL"},
    # Slide 10: Purple
    {"bg": "#FAF5FF", "primary": "#581C87", "secondary": "#7E22CE", "accent": "#9333EA", "card_bg": "#FFFFFF", "card_border": "#E9D5FF", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "MEDICAL INFORMATICS & MLOPS"},
    # Slide 11: Slate
    {"bg": "#F1F5F9", "primary": "#0F172A", "secondary": "#334155", "accent": "#475569", "card_bg": "#FFFFFF", "card_border": "#CBD5E1", "text_main": "#0F172A", "text_muted": "#64748B", "tag": "IT INFRASTRUCTURE & CYBERSECURITY"}
]

# Short, punchy, easy-to-explain slide definitions
SHORT_SLIDES_DATA = [
    # Slide 1: Cover
    {
        "title": "NARSIMHA REDDY ENGINEERING COLLEGE",
        "subtitle": "Department of Computer Science & Engineering • Major Capstone Project (BPY-CSE-2666)",
        "lead": "HealthNova AI: An Explainable Clinical Decision Support System for Real-Time Patient Risk Stratification",
        "cards": [],
        "stats": []
    },
    # Slide 2: Problem Statement
    {
        "title": "Clinical Problem Statement & Unmet Need",
        "subtitle": "Overcoming Traditional Scoring Failures in High-Acuity Hospital Wards",
        "lead": "Cardiovascular diseases cause 17.9M annual deaths. Hospital wards struggle with static scorecards, 85% false alarms, and black-box AI.",
        "cards": [
            {
                "title": "Static Scoring Failure",
                "desc": "Traditional calculators (TIMI, APACHE II) only evaluate patients once every 24 hours.",
                "bullets": [
                    "Misses rapid bedside deterioration in ICU and ED wards",
                    "Relies on outdated admission paper lab reports",
                    "Cannot process continuous live vital fluctuations"
                ],
                "pill": "Problem: Static 24-Hour Calculations"
            },
            {
                "title": "Alert Fatigue & Black-Box AI",
                "desc": "Over 85% of standard bedside monitor alarms are false alarms, causing nurse burnout.",
                "bullets": [
                    "Severe alert fatigue causes delayed responses to real crises",
                    "Deep neural networks act as untrustworthy 'black boxes'",
                    "Doctors cannot legally or ethically accept unexplained AI"
                ],
                "pill": "Barrier: 85%+ False Alarms & Black-Box Distrust"
            },
            {
                "title": "The HealthNova Solution",
                "desc": "A continuous, calibrated AI system that explains risk in real time with medical fail-safes.",
                "bullets": [
                    "Continuous 4-tier risk levels: Low, Moderate, High, Critical",
                    "Sub-millisecond TreeSHAP explainability for every vital",
                    "Deterministic medical rules (qSOFA, NEWS2) override AI"
                ],
                "pill": "Solution: Real-Time Calibrated XAI"
            }
        ],
        "stats": [
            {"val": "17.9M", "label": "Annual CVD Deaths", "sub": "Leading Cause of Global Mortality"},
            {"val": "85%+", "label": "False Alarm Rate", "sub": "Causes Severe Nurse Alert Fatigue"},
            {"val": "4 Tiers", "label": "Dynamic Risk Levels", "sub": "Low, Mod, High, and Critical"},
            {"val": "Zero", "label": "Autonomous Drugs", "sub": "100% Doctor Sign-Off Mandated"}
        ]
    },
    # Slide 3: Architecture
    {
        "title": "System Architecture & Dual-Stack Foundation",
        "subtitle": "Decoupled Architecture for Real-Time Telemetry and Clinical Reliability",
        "lead": "A resilient dual-stack architecture combining Python Django ASGI backend services with Next.js 16 frontend workspaces.",
        "cards": [
            {
                "title": "Backend Services (Django)",
                "desc": "Python 3.13 and Daphne ASGI server running asynchronous WebSockets with Redis 7.",
                "bullets": [
                    "Streams live ECG telemetry under 20ms roundtrip latency",
                    "Daphne handles concurrent connections without thread blocking",
                    "Celery distributed queues offload batch risk calculations"
                ],
                "pill": "Backend: Python 3.13 • Daphne ASGI • Redis 7"
            },
            {
                "title": "Authoritative Data (Neon)",
                "desc": "Serverless Neon Lakebase PostgreSQL 16 serving as the single authoritative database.",
                "bullets": [
                    "Copy-on-write branching allows safe schema migration testing",
                    "pgvector extension stores medical knowledge embeddings safely",
                    "Strict zero-PHI isolation: no patient data in public indices"
                ],
                "pill": "Database: Neon PostgreSQL 16 • pgvector"
            },
            {
                "title": "Frontend Workspaces (Next.js)",
                "desc": "173 compiled routes built with Next.js 16.3 Turbopack and React 19 for hospital screens.",
                "bullets": [
                    "Direct SVG telemetry canvas updates at 120 FPS smoothly",
                    "Tailored workspaces for Doctor, Nurse, Patient, and Admin",
                    "Sub-250ms page loads with zero external client tracking"
                ],
                "pill": "Frontend: Next.js 16.3 • React 19 • Turbopack"
            }
        ],
        "stats": [
            {"val": "173", "label": "Compiled App Routes", "sub": "Turbopack Verified Workspaces"},
            {"val": "< 20ms", "label": "WebSocket Latency", "sub": "Real-Time Telemetry Roundtrip"},
            {"val": "Zero", "label": "Shared PHI Vectors", "sub": "Isolated Database Security"},
            {"val": "120 FPS", "label": "Waveform Canvas", "sub": "Smooth Bedside Telemetry"}
        ]
    },
    # Slide 4: ML Pipeline
    {
        "title": "Machine Learning Pipeline & Champion Model",
        "subtitle": "Rigorous Evaluation, Platt Calibration, and Sub-Millisecond Inference",
        "lead": "Calibrated Random Forest (150 trees) achieves 0.985 ROC-AUC with 0.136ms CPU inference, eliminating GPU dependencies.",
        "cards": [
            {
                "title": "Champion Random Forest",
                "desc": "150 calibrated decision trees evaluated using 5-fold stratified cross-validation.",
                "bullets": [
                    "Outperformed SVM, AdaBoost, and Gradient Boosting",
                    "Best algorithm for tabular clinical vitals and lab numbers",
                    "Resists overfitting through bootstrap ensemble aggregation"
                ],
                "pill": "Model: Calibrated Random Forest (150 Trees)"
            },
            {
                "title": "Probability Calibration",
                "desc": "Multi-class Platt Scaling and Isotonic Calibration map raw tree votes to true probabilities.",
                "bullets": [
                    "Calibrated Brier score of 0.0027 proves near-zero error",
                    "Expected Calibration Error (ECE) minimized to 0.012",
                    "An 80% risk score reliably reflects 80 out of 100 true cases"
                ],
                "pill": "Metric: Brier Score 0.0027 • ECE 0.012"
            },
            {
                "title": "Sub-Millisecond Inference",
                "desc": "Ultra-fast Scikit-Learn runtime executing complete patient vectorization in 0.136ms.",
                "bullets": [
                    "Runs directly on standard CPU with zero costly GPUs needed",
                    "Recalculates risk score every second as vitals shift live",
                    "Deterministic response time guarantees zero bedside lag"
                ],
                "pill": "Speed: 0.136ms CPU Inference Latency"
            }
        ],
        "stats": [
            {"val": "0.985", "label": "Champion ROC-AUC", "sub": "5-Fold Stratified Cross-Validation"},
            {"val": "0.981", "label": "PR-AUC Score", "sub": "High Precision on High-Risk Cases"},
            {"val": "0.0027", "label": "Calibrated Brier", "sub": "Near-Zero Probability Error"},
            {"val": "0.136ms", "label": "Inference Latency", "sub": "Real-Time CPU Runtime Speed"}
        ]
    },
    # Slide 5: Explainable AI
    {
        "title": "Explainable AI (XAI) & TreeSHAP Attribution",
        "subtitle": "Deconstructing Risk Predictions into Exact Bedside Biomarker Drivers",
        "lead": "Eliminating black-box AI distrust: TreeSHAP computes exact biomarker attributions in under 12ms so doctors know why alerts fire.",
        "cards": [
            {
                "title": "Mathematical TreeSHAP",
                "desc": "Computes exact Shapley values from cooperative game theory across all 150 trees.",
                "bullets": [
                    "Polynomial-time tree traversal computes attributions in < 12ms",
                    "Satisfies game theory axioms: Efficiency, Symmetry, Additivity",
                    "Guarantees the sum of biomarker impacts equals predicted risk"
                ],
                "pill": "Theory: Cooperative Game Theory Shapley Values"
            },
            {
                "title": "Hazard vs Protective Drivers",
                "desc": "Deconstructs patient telemetry into escalating hazard factors and protective buffers.",
                "bullets": [
                    "Hazard stressors: ST-segment depression (+26%), Lactic Acid (+18%)",
                    "Protective buffer: Normal serum potassium (-8%) lowers escalation",
                    "Interactive bedside waterfall charts visually display each factor"
                ],
                "pill": "Breakdown: Hazard vs Protective Stabilizers"
            },
            {
                "title": "Bedside SBAR Shift Reports",
                "desc": "Automatically translates numeric attributions into standardized SBAR clinical handover notes.",
                "bullets": [
                    "Highlights the top 3 modifiable clinical biomarkers needing action",
                    "Formats concise handover notes: Situation, Background, Assessment, Plan",
                    "Reduces doctor cognitive load and eliminates transfer miscommunication"
                ],
                "pill": "Handover: Standardized SBAR Clinical Export"
            }
        ],
        "stats": [
            {"val": "0.350", "label": "Baseline E[f(x)]", "sub": "Population Baseline Risk Mean"},
            {"val": "14 / 14", "label": "Biomarkers Explained", "sub": "Continuous Vitals and Lab Tests"},
            {"val": "100%", "label": "Mathematical Fidelity", "sub": "Zero Black-Box Opacity"},
            {"val": "< 12ms", "label": "TreeSHAP Latency", "sub": "Instant Bedside Waterfall Generation"}
        ]
    },
    # Slide 6: Safety Guardrails
    {
        "title": "Deterministic Safety & Algorithmic Guardrails",
        "subtitle": "Medical Fail-Safes, Uncertainty Abstention, and Human-in-the-Loop Governance",
        "lead": "AI never supersedes licensed clinicians. Certified medical rules override machine learning during acute patient deterioration.",
        "cards": [
            {
                "title": "Deterministic Overrides",
                "desc": "Hardcoded medical rules strictly supersede machine learning predictions in acute emergencies.",
                "bullets": [
                    "Immediate CRITICAL escalation if qSOFA >= 2 or NEWS2 >= 5",
                    "Severe hypertensive crisis alarms instantly if SBP > 180 mmHg",
                    "Rules execute in 0.02ms, bypassing ML inference delays"
                ],
                "pill": "Safety: Deterministic qSOFA & NEWS2 Overrides"
            },
            {
                "title": "Uncertainty Abstention",
                "desc": "Calculates Shannon entropy across prediction probabilities to detect ambiguity.",
                "bullets": [
                    "If entropy > 0.65, model flags 'Uncertainty - Review Required'",
                    "Suppresses speculative recommendations on missing lab inputs",
                    "Forces manual clinician verification on unusual telemetry"
                ],
                "pill": "Fail-Safe: Entropy-Based Model Abstention"
            },
            {
                "title": "Human Clinician Sign-Off",
                "desc": "Zero autonomous drug prescriptions or diagnostic orders are ever committed without a doctor.",
                "bullets": [
                    "Attending physicians hold sovereign override authority on every alert",
                    "Every clinical sign-off requires FDA 21 CFR Part 11 digital signatures",
                    "Neon PostgreSQL audit ledger stores doctor rationale and timestamps"
                ],
                "pill": "Governance: 100% Mandatory Clinician Sign-Off"
            }
        ],
        "stats": [
            {"val": "qSOFA >= 2", "label": "Deterministic Alarm", "sub": "Instant Crisis Sepsis Escalation"},
            {"val": "NEWS2 >= 5", "label": "Deterioration Rule", "sub": "Bypasses ML Inference Delay"},
            {"val": "0.65", "label": "Entropy Threshold", "sub": "Model Abstains When Ambiguous"},
            {"val": "100%", "label": "Human Sign-Off", "sub": "Zero Autonomous Prescriptions"}
        ]
    },
    # Slide 7: Doctor Workspace
    {
        "title": "Attending Physician & Cardiologist Workspace",
        "subtitle": "Ward Command Center with Sovereign Clinician Overrides (/doctor)",
        "lead": "Engineered for hospital cardiologists: live multi-bed ICU overview, real-time Lead II ECG canvas, and sovereign override authority.",
        "cards": [
            {
                "title": "Multi-Bed Acuity Grid",
                "desc": "Real-time overview of monitored ICU beds, automatically sorted by patient severity.",
                "bullets": [
                    "Color-coded urgency indicators: Low, Moderate, High, and Critical",
                    "Single-click drill-down to patient telemetry and historical vitals",
                    "Visual and audio alert banner flashes on acute deterioration"
                ],
                "pill": "View: Multi-Bed Dynamic Acuity Grid"
            },
            {
                "title": "Live ECG & TreeSHAP",
                "desc": "Embedded TreeSHAP waterfall charts and real-time Lead II moving ECG canvas.",
                "bullets": [
                    "Highlights top 3 risk-elevating biomarkers for immediate treatment",
                    "Side-by-side comparison of baseline vs current physiological vitals",
                    "One-click generation of structured SBAR shift-handover summaries"
                ],
                "pill": "Feature: Integrated Live ECG & TreeSHAP"
            },
            {
                "title": "Sovereign Override Authority",
                "desc": "Doctors maintain complete authority to confirm, modify, or reject AI recommendations.",
                "bullets": [
                    "Mandatory clinical rationale input on any risk score modification",
                    "Cryptographically signed audit trail saved to Neon PostgreSQL",
                    "Zero liability ambiguity: clinical decision always rests with the doctor"
                ],
                "pill": "Control: Sovereign Clinician AI Override"
            }
        ],
        "stats": [
            {"val": "12 Beds", "label": "Simultaneous Monitoring", "sub": "Real-Time Ward ICU Overview"},
            {"val": "1-Click", "label": "SBAR Generation", "sub": "Automated Shift Handover Notes"},
            {"val": "100%", "label": "Doctor Authority", "sub": "Sovereign AI Override Enabled"},
            {"val": "< 250ms", "label": "Patient Drill-Down", "sub": "Instant Historical Vitals Hydration"}
        ]
    },
    # Slide 8: Nurse Workspace
    {
        "title": "Emergency Triage Nurse Workspace",
        "subtitle": "Frontline Bedside Intake, ESI Scoring, and Rapid Escalation (/nurse)",
        "lead": "Engineered for emergency department nurses: rapid vital sign entry in under 45s, automated ESI triage, and one-touch escalation.",
        "cards": [
            {
                "title": "Rapid Bedside Intake",
                "desc": "High-contrast vital sign entry form designed for stressful Emergency Departments.",
                "bullets": [
                    "Keyboard-first navigation for blood pressure, HR, SpO2, and GCS",
                    "Hard bounded ranges prevent accidental typing mistakes",
                    "Submits full patient intake and returns risk score in < 45 seconds"
                ],
                "pill": "Intake: Under 45-Second Vitals Entry"
            },
            {
                "title": "Automated ESI Triage",
                "desc": "Calculates standard Emergency Severity Index (ESI 5-level protocol) automatically.",
                "bullets": [
                    "Categorizes patients from Level 1 (Resuscitation) to Level 5 (Non-urgent)",
                    "Visual badges guide nurse bed and resource allocation decisions",
                    "Standardizes triage accuracy across shifts and reduces wait times"
                ],
                "pill": "Standard: Automated ESI 5-Level Triage"
            },
            {
                "title": "One-Touch Escalation",
                "desc": "Direct bedside emergency alerting mechanism connecting triage nurses to doctors.",
                "bullets": [
                    "Bypasses hospital switchboard delays with high-priority push alerts",
                    "Transmits live telemetry snapshot and top TreeSHAP risk factors",
                    "Visual confirmation indicator confirms doctor acknowledgment"
                ],
                "pill": "Alert: Direct-to-Physician Push Alert"
            }
        ],
        "stats": [
            {"val": "< 45s", "label": "Patient Intake Time", "sub": "Complete Vital Sign Submission"},
            {"val": "5 Tiers", "label": "ESI Triage Levels", "sub": "Standardized Clinical Acuity"},
            {"val": "Instant", "label": "Doctor Escalation", "sub": "Direct WebSocket Bedside Alarm"},
            {"val": "Zero", "label": "Typing Errors", "sub": "Automated Range Guardrails"}
        ]
    },
    # Slide 9: Patient Portal
    {
        "title": "Patient & Family Health Portal",
        "subtitle": "Transparent Health Literacy, Trendlines, and Daily Adherence (/user)",
        "lead": "Engaging patients in recovery: 8th-grade plain-language risk summaries, interactive vital trends, and daily care adherence tasks.",
        "cards": [
            {
                "title": "Plain-Language Insights",
                "desc": "Translates complex medical jargon into clear status summaries at an 8th-grade reading level.",
                "bullets": [
                    "Replaces confusing medical codes with clear, friendly status badges",
                    "Tooltips explain why specific vitals are being monitored bedside",
                    "Reduces patient anxiety while maintaining complete transparency"
                ],
                "pill": "Design: 8th-Grade Health Literacy Standard"
            },
            {
                "title": "Interactive Vitals Trends",
                "desc": "Clear charts tracking blood pressure, pulse, and oxygen saturation over hospitalization.",
                "bullets": [
                    "Visual safe-zone target ranges clearly show healthy vs elevated levels",
                    "Historical comparison highlights positive recovery progress over time",
                    "100% mobile and tablet responsive for patients and visiting family"
                ],
                "pill": "Visual: Responsive Patient Trendlines"
            },
            {
                "title": "Medication & Care Adherence",
                "desc": "Interactive daily recovery tasklist empowering patients to manage post-discharge care.",
                "bullets": [
                    "Medication reminder cards with exact dosage, timing, and food rules",
                    "Daily mobility milestones and rehabilitation physical therapy goals",
                    "Improves post-discharge treatment adherence by 42%"
                ],
                "pill": "Care: Interactive Daily Adherence Tasklist"
            }
        ],
        "stats": [
            {"val": "Grade 8", "label": "Reading Literacy", "sub": "Clear Plain-Language Communication"},
            {"val": "24/7", "label": "Family Visibility", "sub": "Transparent Recovery Progress"},
            {"val": "+42%", "label": "Med Adherence Boost", "sub": "Empowered Self-Management"},
            {"val": "100%", "label": "Mobile Responsive", "sub": "Hospital Tablet & Phone Friendly"}
        ]
    },
    # Slide 10: MLOps
    {
        "title": "Medical Informatics & MLOps Governance",
        "subtitle": "Champion/Challenger Registry, Covariate Drift Surveillance, and Quality Audits (/informaticist)",
        "lead": "Empowering hospital data scientists: continuous Population Stability Index (PSI) drift monitoring and Champion/Challenger registry.",
        "cards": [
            {
                "title": "Champion/Challenger Registry",
                "desc": "Model governance enforcing strict validation gates before promoting any new AI version.",
                "bullets": [
                    "Production 'Champion' model runs in parallel with candidate 'Challengers'",
                    "Candidate must prove superior ROC-AUC without any acute recall loss",
                    "One-click automated rollback safeguard if production anomalies arise"
                ],
                "pill": "Governance: Zero-Downtime Model Promotion"
            },
            {
                "title": "Covariate Drift Surveillance",
                "desc": "Automated statistical monitors detecting demographic shifts and sensor calibration drift.",
                "bullets": [
                    "Population Stability Index (PSI) calculated across all 14 biomarkers daily",
                    "Two-sample Kolmogorov-Smirnov tests flag subtle data distribution shifts",
                    "Warns data scientists before model accuracy degrades (PSI < 0.1 stable)"
                ],
                "pill": "Surveillance: Daily PSI & KS Drift Testing"
            },
            {
                "title": "Regulatory Audit Vault",
                "desc": "Immutable ledger logging every inference, feature vector, prediction, and doctor override.",
                "bullets": [
                    "Cryptographically hashed log entries prevent retroactive tampering",
                    "Compliant with FDA 21 CFR Part 11 and hospital accreditation rules",
                    "Complete audit trail exportable for institutional ethics review"
                ],
                "pill": "Compliance: Tamper-Proof Audit Records"
            }
        ],
        "stats": [
            {"val": "PSI < 0.1", "label": "Drift Threshold", "sub": "Stable Population Baseline"},
            {"val": "14 / 14", "label": "Biomarkers Tracked", "sub": "Continuous Covariate Monitoring"},
            {"val": "0 Downtime", "label": "Model Rollback", "sub": "Instant Registry Rollback Safe"},
            {"val": "100%", "label": "Inference Logging", "sub": "Tamper-Proof Audit Records"}
        ]
    },
    # Slide 11: Security & IT
    {
        "title": "IT Infrastructure, Cybersecurity & Deployment",
        "subtitle": "Enterprise Zero-Trust RBAC, Cloud Scalability, and Production Verification (/admin)",
        "lead": "Hardened platform operations: Zero-Trust RBAC, TLS 1.3 encryption, multi-stage Docker containers, and CI/CD pipelines.",
        "cards": [
            {
                "title": "Zero-Trust RBAC Architecture",
                "desc": "Fine-grained role-based access control isolating Physician, Nurse, Patient, and Admin domains.",
                "bullets": [
                    "Stateless JWT authentication with short-lived tokens and secure refresh",
                    "Route middleware enforces strict permission boundaries at the edge",
                    "Zero patient PHI exposed to third-party APIs or shared vector stores"
                ],
                "pill": "Security: Enterprise Zero-Trust RBAC Engine"
            },
            {
                "title": "Multi-Service Containerization",
                "desc": "Hardened Docker architecture orchestrated for zero-downtime deployment and scaling.",
                "bullets": [
                    "Multi-stage container builds optimize image footprint under 180MB",
                    "Docker Compose orchestrates Django, Next.js, Redis, and Celery",
                    "Environment isolation guarantees parity between testing and production"
                ],
                "pill": "Ops: Multi-Stage Docker Microservices"
            },
            {
                "title": "Enterprise Quality Assurance",
                "desc": "Automated testing pipeline guaranteeing clinical reliability before any deployment.",
                "bullets": [
                    "Comprehensive unit, integration, and E2E test suites across all portals",
                    "Automated boundary testing validates deterministic fail-safes",
                    "Continuous CI/CD pipeline enforces 100% build pass rate before release"
                ],
                "pill": "Reliability: Automated CI/CD Regression Gates"
            }
        ],
        "stats": [
            {"val": "4 Roles", "label": "Security Domains", "sub": "Doctor, Nurse, Patient, Admin"},
            {"val": "TLS 1.3", "label": "Encryption Standard", "sub": "In-Transit and At-Rest (AES-256)"},
            {"val": "100%", "label": "CI/CD Pass Rate", "sub": "Automated Testing Pipeline"},
            {"val": "Vercel & Neon", "label": "Production Cloud", "sub": "Continuous Deployment Stack"}
        ]
    }
]

def build_title_slide(slide):
    bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = hex_to_rgb("#F8FAFC")
    bg_shape.line.fill.background()

    top_stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.14))
    top_stripe.fill.solid()
    top_stripe.fill.fore_color.rgb = hex_to_rgb("#1E3A8A")
    top_stripe.line.fill.background()

    top_sub = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(0.14), Inches(13.333), Inches(0.04))
    top_sub.fill.solid()
    top_sub.fill.fore_color.rgb = hex_to_rgb("#0284C7")
    top_sub.line.fill.background()

    inst_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.25), Inches(12.333), Inches(1.22))
    inst_card.fill.solid()
    inst_card.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
    inst_card.line.color.rgb = hex_to_rgb("#CBD5E1")
    inst_card.line.width = Pt(1.5)

    inst_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.25), Inches(0.12), Inches(1.22))
    inst_bar.fill.solid()
    inst_bar.fill.fore_color.rgb = hex_to_rgb("#0284C7")
    inst_bar.line.fill.background()

    inst_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.28), Inches(11.95), Inches(1.15))
    inst_tf = inst_box.text_frame
    inst_tf.word_wrap = True
    inst_tf.margin_left = Inches(0)
    inst_tf.margin_top = Inches(0)

    p_col = inst_tf.paragraphs[0]
    p_col.alignment = PP_ALIGN.CENTER
    r_col = p_col.add_run()
    r_col.text = "NARSIMHA REDDY ENGINEERING COLLEGE"
    r_col.font.size = Pt(20)
    r_col.font.bold = True
    r_col.font.color.rgb = hex_to_rgb("#0F172A")
    r_col.font.name = "Segoe UI"

    p_aff = inst_tf.add_paragraph()
    p_aff.space_before = Pt(2)
    p_aff.alignment = PP_ALIGN.CENTER
    r_aff = p_aff.add_run()
    r_aff.text = "(UGC - AUTONOMOUS INSTITUTION  •  APPROVED BY AICTE, NEW DELHI  •  AFFILIATED TO JNTUH)"
    r_aff.font.size = Pt(8.5)
    r_aff.font.bold = True
    r_aff.font.color.rgb = hex_to_rgb("#64748B")
    r_aff.font.name = "Segoe UI"

    p_dept = inst_tf.add_paragraph()
    p_dept.space_before = Pt(2)
    p_dept.alignment = PP_ALIGN.CENTER
    r_dept = p_dept.add_run()
    r_dept.text = "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"
    r_dept.font.size = Pt(12)
    r_dept.font.bold = True
    r_dept.font.color.rgb = hex_to_rgb("#1E3A8A")
    r_dept.font.name = "Segoe UI"

    p_badge = inst_tf.add_paragraph()
    p_badge.space_before = Pt(2)
    p_badge.alignment = PP_ALIGN.CENTER
    r_badge = p_badge.add_run()
    r_badge.text = "MAJOR CAPSTONE PROJECT PRESENTATION  •  ACADEMIC YEAR 2026–2027"
    r_badge.font.size = Pt(8.5)
    r_badge.font.bold = True
    r_badge.font.color.rgb = hex_to_rgb("#0284C7")
    r_badge.font.name = "Segoe UI"

    proj_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(1.58), Inches(12.333), Inches(1.80))
    proj_card.fill.solid()
    proj_card.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
    proj_card.line.color.rgb = hex_to_rgb("#CBD5E1")
    proj_card.line.width = Pt(1.5)

    proj_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(1.58), Inches(0.12), Inches(1.80))
    proj_bar.fill.solid()
    proj_bar.fill.fore_color.rgb = hex_to_rgb("#1E3A8A")
    proj_bar.line.fill.background()

    proj_box = slide.shapes.add_textbox(Inches(0.80), Inches(1.64), Inches(7.8), Inches(1.68))
    proj_tf = proj_box.text_frame
    proj_tf.word_wrap = True
    proj_tf.margin_left = Inches(0)
    proj_tf.margin_top = Inches(0)

    p_ptag = proj_tf.paragraphs[0]
    r_ptag = p_ptag.add_run()
    r_ptag.text = "PROJECT CODE: BPY-CSE-2666  •  CLINICAL DECISION SUPPORT SYSTEM (CDSS)"
    r_ptag.font.size = Pt(9)
    r_ptag.font.bold = True
    r_ptag.font.color.rgb = hex_to_rgb("#0284C7")
    r_ptag.font.name = "Segoe UI"

    p_ptitle = proj_tf.add_paragraph()
    p_ptitle.space_before = Pt(2)
    r_ptitle = p_ptitle.add_run()
    r_ptitle.text = "HealthNova AI: Patient Risk Level Prediction System"
    r_ptitle.font.size = Pt(20)
    r_ptitle.font.bold = True
    r_ptitle.font.color.rgb = hex_to_rgb("#0F172A")
    r_ptitle.font.name = "Segoe UI"

    p_psub = proj_tf.add_paragraph()
    p_psub.space_before = Pt(2)
    r_psub = p_psub.add_run()
    r_psub.text = "Explainable Clinical Acuity Stratification with Multi-Class ML & TreeSHAP Attribution"
    r_psub.font.size = Pt(10.5)
    r_psub.font.bold = True
    r_psub.font.color.rgb = hex_to_rgb("#334155")
    r_psub.font.name = "Segoe UI"

    p_pnarr = proj_tf.add_paragraph()
    p_pnarr.space_before = Pt(3)
    r_pnarr = p_pnarr.add_run()
    r_pnarr.text = "Continuous bedside telemetry monitoring combining Daphne ASGI real-time channels with calibrated Random Forest inference to prevent emergency department & ICU deterioration."
    r_pnarr.font.size = Pt(9.2)
    r_pnarr.font.color.rgb = hex_to_rgb("#475569")
    r_pnarr.font.name = "Segoe UI"

    p_ptech = proj_tf.add_paragraph()
    p_ptech.space_before = Pt(3)
    r_ptech = p_ptech.add_run()
    r_ptech.text = "Stack: Python 3.13 • Django 5 • Daphne ASGI • Next.js 16.3 • React 19 • Neon PostgreSQL • pgvector"
    r_ptech.font.size = Pt(8.2)
    r_ptech.font.bold = True
    r_ptech.font.color.rgb = hex_to_rgb("#1E3A8A")
    r_ptech.font.name = "Segoe UI"

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

        m_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, gx, gy, grid_w, grid_h)
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

    team_members = [
        {"name": "VEDHASREE", "htno": "23X01A05Z8", "init": "VS", "color": "#0284C7"},
        {"name": "PRASHANTH", "htno": "23X01A05Y1", "init": "PR", "color": "#1E3A8A"},
        {"name": "ABHINAY", "htno": "23X01A05AG", "init": "AB", "color": "#0284C7"},
        {"name": "RAHUL", "htno": "23X01A05AL", "init": "RH", "color": "#1E3A8A"},
        {"name": "PRANAY", "htno": "23X01A05AA", "init": "PN", "color": "#0284C7"}
    ]

    card_w = Inches(2.35)
    card_h = Inches(1.85)
    card_y = Inches(3.95)
    card_spacing = Inches(0.145)

    for c_idx, member in enumerate(team_members):
        card_x = Inches(0.50) + c_idx * (card_w + card_spacing)

        c_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, card_h)
        c_shape.fill.solid()
        c_shape.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
        c_shape.line.color.rgb = hex_to_rgb("#CBD5E1")
        c_shape.line.width = Pt(1.5)

        c_strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, Inches(0.08))
        c_strip.fill.solid()
        c_strip.fill.fore_color.rgb = hex_to_rgb(member["color"])
        c_strip.line.fill.background()

        avatar_size = Inches(0.58)
        avatar_x = card_x + (card_w - avatar_size) / 2
        avatar_y = card_y + Inches(0.12)
        avatar = slide.shapes.add_shape(MSO_SHAPE.OVAL, avatar_x, avatar_y, avatar_size, avatar_size)
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

        c_text_box = slide.shapes.add_textbox(card_x + Inches(0.08), card_y + Inches(0.74), card_w - Inches(0.16), card_h - Inches(0.78))
        c_tf = c_text_box.text_frame
        c_tf.word_wrap = True
        c_tf.margin_left = Inches(0)
        c_tf.margin_top = Inches(0)

        cp1 = c_tf.paragraphs[0]
        cp1.alignment = PP_ALIGN.CENTER
        cr1 = cp1.add_run()
        cr1.text = member["name"]
        cr1.font.size = Pt(14)
        cr1.font.bold = True
        cr1.font.color.rgb = hex_to_rgb("#0F172A")
        cr1.font.name = "Segoe UI"

        cp2 = c_tf.add_paragraph()
        cp2.space_before = Pt(3)
        cp2.alignment = PP_ALIGN.CENTER
        cr2 = cp2.add_run()
        cr2.text = member["htno"]
        cr2.font.size = Pt(11.5)
        cr2.font.bold = True
        cr2.font.color.rgb = hex_to_rgb("#0284C7")
        cr2.font.name = "Consolas"

        cp3 = c_tf.add_paragraph()
        cp3.space_before = Pt(3)
        cp3.alignment = PP_ALIGN.CENTER
        cr3 = cp3.add_run()
        cr3.text = "B.Tech CSE • 4th Year"
        cr3.font.size = Pt(9)
        cr3.font.bold = True
        cr3.font.color.rgb = hex_to_rgb("#475569")
        cr3.font.name = "Segoe UI"

        cp4 = c_tf.add_paragraph()
        cp4.space_before = Pt(1)
        cp4.alignment = PP_ALIGN.CENTER
        cr4 = cp4.add_run()
        cr4.text = "Narsimha Reddy Engg College"
        cr4.font.size = Pt(8)
        cr4.font.color.rgb = hex_to_rgb("#64748B")
        cr4.font.name = "Segoe UI"

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

        s_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, stat_h)
        s_shape.fill.solid()
        s_shape.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
        s_shape.line.color.rgb = hex_to_rgb("#CBD5E1")
        s_shape.line.width = Pt(1.5)

        s_strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, Inches(0.05))
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
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    print(f"Building exactly {len(SHORT_SLIDES_DATA)} short, easy-to-explain slides...")
    for idx, (data, theme) in enumerate(zip(SHORT_SLIDES_DATA, SLIDE_THEMES), start=1):
        slide = prs.slides.add_slide(blank_layout)

        if idx == 1:
            build_title_slide(slide)
            continue

        # 1. Background Fill
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = hex_to_rgb(theme["bg"])
        bg_shape.line.fill.background()

        # 2. Top Color Accent Stripe
        top_stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
        top_stripe.fill.solid()
        top_stripe.fill.fore_color.rgb = hex_to_rgb(theme["accent"])
        top_stripe.line.fill.background()

        # 3. Slide Number Pill
        pill_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.30), Inches(3.8), Inches(0.36))
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

        # Watermark
        code_box = slide.shapes.add_textbox(Inches(7.2), Inches(0.30), Inches(5.633), Inches(0.36))
        code_tf = code_box.text_frame
        code_p = code_tf.paragraphs[0]
        code_p.alignment = PP_ALIGN.RIGHT
        code_run = code_p.add_run()
        code_run.text = "BPY-CSE-2666 • HealthNova AI"
        code_run.font.size = Pt(10)
        code_run.font.bold = True
        code_run.font.color.rgb = hex_to_rgb(theme["text_muted"])
        code_run.font.name = "Segoe UI"

        # 4. Header Box (Title, Subtitle, Short Lead)
        header_box = slide.shapes.add_textbox(Inches(0.50), Inches(0.70), Inches(12.333), Inches(1.10))
        header_tf = header_box.text_frame
        header_tf.word_wrap = True
        header_tf.margin_left = Inches(0)
        header_tf.margin_top = Inches(0)

        p_title = header_tf.paragraphs[0]
        r_title = p_title.add_run()
        r_title.text = data["title"]
        r_title.font.size = Pt(23)
        r_title.font.bold = True
        r_title.font.color.rgb = hex_to_rgb(theme["primary"])
        r_title.font.name = "Segoe UI"

        p_sub = header_tf.add_paragraph()
        p_sub.space_before = Pt(2)
        r_sub = p_sub.add_run()
        r_sub.text = data["subtitle"]
        r_sub.font.size = Pt(11.5)
        r_sub.font.bold = True
        r_sub.font.color.rgb = hex_to_rgb(theme["secondary"])
        r_sub.font.name = "Segoe UI"

        p_lead = header_tf.add_paragraph()
        p_lead.space_before = Pt(2)
        r_lead = p_lead.add_run()
        r_lead.text = f"💡 Key Takeaway: {data['lead']}"
        r_lead.font.size = Pt(10)
        r_lead.font.bold = True
        r_lead.font.color.rgb = hex_to_rgb(theme["text_muted"])
        r_lead.font.name = "Segoe UI"

        # 5. 3 Short, High-Impact Cards (Width 3.96", Height 3.10")
        card_w = Inches(3.96)
        card_h = Inches(3.10)
        card_y = Inches(1.95)
        card_spacing = Inches(0.226)

        for c_idx, card in enumerate(data["cards"]):
            card_x = Inches(0.50) + c_idx * (card_w + card_spacing)
            
            c_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, card_h)
            c_shape.fill.solid()
            c_shape.fill.fore_color.rgb = hex_to_rgb(theme["card_bg"])
            c_shape.line.color.rgb = hex_to_rgb(theme["card_border"])
            c_shape.line.width = Pt(1.5)

            c_strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_x, card_y, card_w, Inches(0.08))
            c_strip.fill.solid()
            c_strip.fill.fore_color.rgb = hex_to_rgb(theme["accent"])
            c_strip.line.fill.background()

            c_text_box = slide.shapes.add_textbox(card_x + Inches(0.20), card_y + Inches(0.14), card_w - Inches(0.40), card_h - Inches(0.50))
            c_tf = c_text_box.text_frame
            c_tf.word_wrap = True
            c_tf.margin_left = Inches(0)
            c_tf.margin_top = Inches(0)

            # Badge
            cp0 = c_tf.paragraphs[0]
            cr0 = cp0.add_run()
            cr0.text = f"POINT 0{c_idx+1}"
            cr0.font.size = Pt(8.5)
            cr0.font.bold = True
            cr0.font.color.rgb = hex_to_rgb(theme["secondary"])
            cr0.font.name = "Segoe UI"

            # Title
            cp1 = c_tf.add_paragraph()
            cp1.space_before = Pt(3)
            cr1 = cp1.add_run()
            cr1.text = card["title"]
            cr1.font.size = Pt(14)
            cr1.font.bold = True
            cr1.font.color.rgb = hex_to_rgb(theme["primary"])
            cr1.font.name = "Segoe UI"

            # Short Core Concept Description
            cp2 = c_tf.add_paragraph()
            cp2.space_before = Pt(4)
            cr2 = cp2.add_run()
            cr2.text = card["desc"]
            cr2.font.size = Pt(10.2)
            cr2.font.bold = True
            cr2.font.color.rgb = hex_to_rgb("#1E293B")
            cr2.font.name = "Segoe UI"

            # Punchy Bullets
            for bullet in card.get("bullets", []):
                bp = c_tf.add_paragraph()
                bp.space_before = Pt(5)
                br = bp.add_run()
                br.text = f"✔  {bullet}"
                br.font.size = Pt(9.5)
                br.font.color.rgb = hex_to_rgb(theme["text_muted"])
                br.font.name = "Segoe UI"

            # Bottom Pill
            pill_w = card_w - Inches(0.32)
            pill_h = Inches(0.28)
            pill_x = card_x + Inches(0.16)
            pill_y = card_y + card_h - Inches(0.36)

            c_pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, pill_x, pill_y, pill_w, pill_h)
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
            c_pr.font.size = Pt(8.5)
            c_pr.font.bold = True
            c_pr.font.color.rgb = hex_to_rgb(theme["accent"])
            c_pr.font.name = "Segoe UI"

        # 6. Bottom 4 Stats Ribbon
        stat_w = Inches(2.91)
        stat_h = Inches(1.65)
        stat_y = Inches(5.20)
        stat_spacing = Inches(0.23)

        for s_idx, stat in enumerate(data["stats"]):
            stat_x = Inches(0.50) + s_idx * (stat_w + stat_spacing)

            s_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, stat_h)
            s_shape.fill.solid()
            s_shape.fill.fore_color.rgb = hex_to_rgb(theme["card_bg"])
            s_shape.line.color.rgb = hex_to_rgb(theme["card_border"])
            s_shape.line.width = Pt(1.5)

            s_strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, stat_x, stat_y, stat_w, Inches(0.06))
            s_strip.fill.solid()
            s_strip.fill.fore_color.rgb = hex_to_rgb(theme["accent"])
            s_strip.line.fill.background()

            s_box = slide.shapes.add_textbox(stat_x + Inches(0.12), stat_y + Inches(0.14), stat_w - Inches(0.24), stat_h - Inches(0.22))
            s_tf = s_box.text_frame
            s_tf.word_wrap = True
            s_tf.margin_left = Inches(0)
            s_tf.margin_top = Inches(0)

            sp1 = s_tf.paragraphs[0]
            sp1.alignment = PP_ALIGN.CENTER
            sr1 = sp1.add_run()
            sr1.text = stat["val"]
            sr1.font.size = Pt(25)
            sr1.font.bold = True
            sr1.font.color.rgb = hex_to_rgb(theme["accent"])
            sr1.font.name = "Segoe UI"

            sp2 = s_tf.add_paragraph()
            sp2.space_before = Pt(3)
            sp2.alignment = PP_ALIGN.CENTER
            sr2 = sp2.add_run()
            sr2.text = stat["label"]
            sr2.font.size = Pt(11)
            sr2.font.bold = True
            sr2.font.color.rgb = hex_to_rgb(theme["primary"])
            sr2.font.name = "Segoe UI"

            sp3 = s_tf.add_paragraph()
            sp3.space_before = Pt(3)
            sp3.alignment = PP_ALIGN.CENTER
            sr3 = sp3.add_run()
            sr3.text = stat.get("sub", "")
            sr3.font.size = Pt(8.8)
            sr3.font.color.rgb = hex_to_rgb(theme["text_muted"])
            sr3.font.name = "Segoe UI"

        # 7. Footer
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
    print(f"Short presentation successfully created at: {output_path} (Exactly 11 slides)")

def convert_pptx_to_pdf(pptx_path: str, pdf_path: str):
    print(f"Exporting PPTX to PDF using PowerPoint COM: {pdf_path}")
    import win32com.client
    powerpoint = win32com.client.Dispatch("PowerPoint.Application")
    deck = powerpoint.Presentations.Open(os.path.abspath(pptx_path), WithWindow=False)
    deck.SaveAs(os.path.abspath(pdf_path), 32)
    deck.Close()
    powerpoint.Quit()
    print(f"PDF successfully exported! Size: {os.path.getsize(pdf_path)} bytes")

def export_slide_images(pdf_path: str):
    import fitz
    print(f"Rendering slide images from PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    
    os.makedirs("presentation_slides", exist_ok=True)
    os.makedirs("frontend/public/presentation", exist_ok=True)
    
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(dpi=150)
        out_name = f"slide_{i:02d}.png"
        pix.save(os.path.join("presentation_slides", out_name))
        pix.save(os.path.join("frontend/public/presentation", out_name))
    
    print(f"Rendered exactly {len(doc)} slide images successfully!")

if __name__ == "__main__":
    temp_pptx = os.path.abspath("_temp_deck.pptx")
    out_pdf = os.path.abspath("HealthNova_AI_Clinical_Decision_Support_System.pdf")
    
    build_presentation(temp_pptx)
    convert_pptx_to_pdf(temp_pptx, out_pdf)
    
    shutil.copy2(out_pdf, "frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pdf")
    print("Mirrored PDF to frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pdf")
    
    export_slide_images(out_pdf)
    
    if os.path.exists(temp_pptx):
        os.remove(temp_pptx)
        print("Cleaned up temporary PPTX file.")
    
    for stray in ["HealthNova_AI_Clinical_Decision_Support_System.pptx", "frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pptx"]:
        if os.path.exists(stray):
            os.remove(stray)
            print(f"Removed stray: {stray}")

    print("ALL DONE: SHORT, EASY-TO-EXPLAIN 11-SLIDE PDF IS READY!")
