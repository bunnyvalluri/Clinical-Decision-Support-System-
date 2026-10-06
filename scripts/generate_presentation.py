"""
HealthNova AI — Executive Clinical Decision Support System (BPY-CSE-2666)
Generates ULTRA-SHORT, MINIMAL, EASY-TO-EXPLAIN Presentation (7 slides):
1) Introduction
2) Architecture of our project
3) Working process
4) Technologies
5) Workflow
6) Conclusion

Design:
- Ultra-short 3-5 word bullet points
- Big, readable fonts (19pt titles, 14pt bullets)
- Clean card layout with generous spacing
- Zero dense text / zero long paragraphs
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
    # Slide 1: Navy (Title & Team)
    {"bg": "#F8FAFC", "primary": "#0F172A", "secondary": "#1E3A8A", "accent": "#0284C7", "card_bg": "#FFFFFF", "card_border": "#CBD5E1", "text_main": "#0F172A", "text_muted": "#475569", "tag": "EXECUTIVE CAPSTONE DEFENSE"},
    # Slide 2: Rose (1. Introduction)
    {"bg": "#FFF1F2", "primary": "#9F1239", "secondary": "#BE123C", "accent": "#E11D48", "card_bg": "#FFFFFF", "card_border": "#FECDD3", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "1) INTRODUCTION"},
    # Slide 3: Indigo (2. Architecture)
    {"bg": "#EEF2FF", "primary": "#312E81", "secondary": "#4338CA", "accent": "#6366F1", "card_bg": "#FFFFFF", "card_border": "#C7D2FE", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "2) ARCHITECTURE OF OUR PROJECT"},
    # Slide 4: Emerald (3. Working Process)
    {"bg": "#ECFDF5", "primary": "#064E3B", "secondary": "#047857", "accent": "#059669", "card_bg": "#FFFFFF", "card_border": "#A7F3D0", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "3) WORKING PROCESS"},
    # Slide 5: Purple (4. Technologies)
    {"bg": "#FAF5FF", "primary": "#581C87", "secondary": "#7E22CE", "accent": "#9333EA", "card_bg": "#FFFFFF", "card_border": "#E9D5FF", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "4) TECHNOLOGIES"},
    # Slide 6: Ocean (5. Workflow)
    {"bg": "#F0F9FF", "primary": "#0C4A6E", "secondary": "#0284C7", "accent": "#0369A1", "card_bg": "#FFFFFF", "card_border": "#BAE6FD", "text_main": "#1E293B", "text_muted": "#64748B", "tag": "5) WORKFLOW"},
    # Slide 7: Slate (6. Conclusion)
    {"bg": "#F1F5F9", "primary": "#0F172A", "secondary": "#334155", "accent": "#475569", "card_bg": "#FFFFFF", "card_border": "#CBD5E1", "text_main": "#0F172A", "text_muted": "#64748B", "tag": "6) CONCLUSION"}
]

SLIDES_DATA = [
    # Slide 1: Cover & Team Introduction
    {
        "title": "NARSIMHA REDDY ENGINEERING COLLEGE",
        "subtitle": "Department of Computer Science & Engineering • Major Capstone Project (BPY-CSE-2666)",
        "lead": "HealthNova AI: An Explainable Clinical Decision Support System for Real-Time Patient Risk Stratification",
        "cards": []
    },
    # Slide 2: 1) Introduction
    {
        "title": "1) Introduction — Problem & Solution",
        "subtitle": "Why Traditional Scores Fail & How HealthNova AI Solves It",
        "lead": "Continuous, explainable AI to detect cardiac deterioration in real time.",
        "cards": [
            {
                "title": "Traditional Scores Fail",
                "bullets": [
                    "24-Hour Delay: TIMI & APACHE II update only once daily",
                    "Misses Acute Crashes: ICU patients deteriorate in minutes",
                    "Static Paper Reports: Cannot process continuous live vitals"
                ],
                "pill": "Problem: 24h Static Delay"
            },
            {
                "title": "Alarm Fatigue & Black Box",
                "bullets": [
                    "85%+ False Alarms: Causes severe nurse burnout and fatigue",
                    "Black-Box Deep AI: Neural networks hide the reason 'why'",
                    "Clinician Distrust: Doctors reject unexplained predictions"
                ],
                "pill": "Barrier: False Alarms & Black Box"
            },
            {
                "title": "The HealthNova Solution",
                "bullets": [
                    "Real-Time 4-Tier Risk: Continuous Low, Mod, High, Critical",
                    "Sub-12ms XAI: TreeSHAP explains every biomarker factor",
                    "100% Doctor in the Loop: Hard medical fail-safes override AI"
                ],
                "pill": "Solution: Real-Time Explainable CDSS"
            }
        ]
    },
    # Slide 3: 2) Architecture of our project
    {
        "title": "2) Architecture of Our Project",
        "subtitle": "Decoupled Dual-Stack Foundation",
        "lead": "High-speed Python ASGI streaming paired with Next.js 16 and Neon PostgreSQL.",
        "cards": [
            {
                "title": "Python ASGI Backend",
                "bullets": [
                    "Python 3.13 & Django 5: Core asynchronous clinical logic",
                    "Daphne & Redis 7: Live WebSockets with < 20ms latency",
                    "Celery Task Queues: Non-blocking background analytics"
                ],
                "pill": "Backend: Django ASGI • Daphne • Redis 7"
            },
            {
                "title": "Neon PostgreSQL 16",
                "bullets": [
                    "Authoritative Database: Single trusted source for all data",
                    "pgvector Extension: Instant semantic protocol retrieval",
                    "Zero-Trust Security: Complete zero-PHI privacy isolation"
                ],
                "pill": "Database: Neon PostgreSQL 16 • pgvector"
            },
            {
                "title": "Next.js 16 Workspaces",
                "bullets": [
                    "Next.js 16 & React 19: 173 fast compiled hospital routes",
                    "120 FPS SVG Canvas: Fluid bedside ECG waveform display",
                    "Sub-250ms Load Times: Zero external tracking for privacy"
                ],
                "pill": "Frontend: Next.js 16.3 • React 19"
            }
        ]
    },
    # Slide 4: 3) Working process
    {
        "title": "3) Working Process — Real-Time Pipeline",
        "subtitle": "From Raw Bedside Vitals to Calibrated Risk & TreeSHAP Attribution",
        "lead": "Live vitals stream into calibrated Random Forest (0.136ms CPU) and TreeSHAP explains drivers.",
        "cards": [
            {
                "title": "1. Live Ingestion",
                "bullets": [
                    "Live Vitals Stream: Ingests HR, BP, SpO2, and GCS signals",
                    "Data Cleaning: Outlier filtering & z-score normalization",
                    "Instant Vector: 14 clinical features prepped in < 0.1ms"
                ],
                "pill": "Step 1: Live Ingestion & Cleaning"
            },
            {
                "title": "2. Calibrated ML Inference",
                "bullets": [
                    "Random Forest (150 Trees): Champion 0.985 ROC-AUC score",
                    "Platt Scaling: True probabilities (0.0027 Brier error)",
                    "0.136ms CPU Speed: Ultra-fast with zero GPU cost"
                ],
                "pill": "Step 2: 0.136ms CPU ML Prediction"
            },
            {
                "title": "3. TreeSHAP & Safety",
                "bullets": [
                    "TreeSHAP in < 12ms: Breaks down exact biomarker hazard drivers",
                    "Emergency Overrides: qSOFA >= 2 & NEWS2 >= 5 trigger alerts",
                    "Uncertainty Guard: Flags review if entropy > 0.65"
                ],
                "pill": "Step 3: TreeSHAP XAI & Overrides"
            }
        ]
    },
    # Slide 5: 4) Technologies
    {
        "title": "4) Technologies — Core Stack",
        "subtitle": "Modern Full-Stack Ecosystem",
        "lead": "Production-grade stack built for sub-second performance, explainability, and security.",
        "cards": [
            {
                "title": "Backend & Streaming",
                "bullets": [
                    "Python 3.13: Core high-performance programming runtime",
                    "Django 5 & Daphne: ASGI real-time WebSocket server",
                    "Redis 7 & Celery: In-memory pub/sub and task workers"
                ],
                "pill": "Backend: Python 3.13 • Daphne • Redis 7"
            },
            {
                "title": "AI & Explainability",
                "bullets": [
                    "Scikit-Learn: 150-tree Random Forest classifier engine",
                    "Platt Calibration: Multi-class probability scaling module",
                    "TreeSHAP (shap): Game-theoretic feature attribution"
                ],
                "pill": "AI/ML: Scikit-Learn • TreeSHAP • Platt"
            },
            {
                "title": "Frontend, DB & DevOps",
                "bullets": [
                    "Next.js 16.3 & React 19: Turbopack SSR/CSR workspaces",
                    "Neon PostgreSQL 16: Serverless cloud DB with pgvector",
                    "Docker Microservices: Multi-stage container builds (< 180MB)"
                ],
                "pill": "Client/DB: Next.js 16 • Neon PG • Docker"
            }
        ]
    },
    # Slide 6: 5) Workflow
    {
        "title": "5) Workflow — Care Pathway",
        "subtitle": "From Emergency Intake to Doctor Review & MLOps Audit",
        "lead": "Closed-loop care pathway connecting Nurse Triage, AI Ingestion, Doctor Review, and MLOps.",
        "cards": [
            {
                "title": "Phase 1: Nurse Triage",
                "bullets": [
                    "< 45s Vital Intake: Rapid bedside data entry (/nurse)",
                    "Automated ESI Triage: Immediate 5-level acuity assignment",
                    "Direct Live Push: Streams vitals to ICU monitor grid"
                ],
                "pill": "Phase 1: Bedside Nurse Intake"
            },
            {
                "title": "Phase 2: AI Evaluation",
                "bullets": [
                    "Zero-PHI Minimizer: Strips patient identity for privacy",
                    "Sub-Millisecond Risk: 4-tier acuity calculated in 0.136ms",
                    "Safety Rule Engine: Deterministic qSOFA & NEWS2 check"
                ],
                "pill": "Phase 2: Swarm Ingestion & Evaluation"
            },
            {
                "title": "Phase 3: Doctor & MLOps",
                "bullets": [
                    "ICU Ward Grid (/doctor): Attending doctor reviews live ECG",
                    "100% Human Sign-Off: Mandatory clinician verification",
                    "MLOps Drift Audit: Continuous PSI < 0.1 covariate monitoring"
                ],
                "pill": "Phase 3: Human Sign-Off & Audit"
            }
        ]
    },
    # Slide 7: 6) Conclusion
    {
        "title": "6) Conclusion — Key Results & Scope",
        "subtitle": "Validated Breakthroughs, Doctor Sovereignty & Next Steps",
        "lead": "HealthNova AI proves that fast, calibrated, explainable AI empowers doctors to save lives.",
        "cards": [
            {
                "title": "Key Achievements",
                "bullets": [
                    "Champion 0.985 ROC-AUC: High precision on acute crises",
                    "0.136ms CPU Latency: Instant risk recalculation bedside",
                    "Zero Alert Fatigue: Platt calibration eliminates false alarms"
                ],
                "pill": "Results: 0.985 ROC-AUC • 0.136ms Speed"
            },
            {
                "title": "Safety & Doctor Control",
                "bullets": [
                    "100% Doctor Authority: Zero autonomous prescriptions",
                    "Deterministic Overrides: Hard rules protect crashing patients",
                    "FDA 21 CFR Part 11: Tamper-proof immutable audit ledger"
                ],
                "pill": "Safety: 100% Clinician Sovereignty"
            },
            {
                "title": "Future Roadmap",
                "bullets": [
                    "Multimodal AI: Ingest raw 12-lead ECG & DICOM image scans",
                    "Federated Learning: Multi-hospital collaborative training",
                    "Edge Deployment: Bedside micro-controllers for rural clinics"
                ],
                "pill": "Future: Multimodal & Federated Edge"
            }
        ]
    }
]

def build_title_slide(slide):
    # Background
    bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = hex_to_rgb("#F8FAFC")
    bg_shape.line.fill.background()

    # Top accent stripes
    top_stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.14))
    top_stripe.fill.solid()
    top_stripe.fill.fore_color.rgb = hex_to_rgb("#1E3A8A")
    top_stripe.line.fill.background()

    top_sub = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(0.14), Inches(13.333), Inches(0.04))
    top_sub.fill.solid()
    top_sub.fill.fore_color.rgb = hex_to_rgb("#0284C7")
    top_sub.line.fill.background()

    # Institution card
    inst_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.28), Inches(12.333), Inches(1.30))
    inst_card.fill.solid()
    inst_card.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
    inst_card.line.color.rgb = hex_to_rgb("#CBD5E1")
    inst_card.line.width = Pt(1.5)

    inst_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.28), Inches(0.12), Inches(1.30))
    inst_bar.fill.solid()
    inst_bar.fill.fore_color.rgb = hex_to_rgb("#0284C7")
    inst_bar.line.fill.background()

    inst_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.32), Inches(11.95), Inches(1.22))
    inst_tf = inst_box.text_frame
    inst_tf.word_wrap = True
    inst_tf.margin_left = Inches(0)
    inst_tf.margin_top = Inches(0)

    p_col = inst_tf.paragraphs[0]
    p_col.alignment = PP_ALIGN.CENTER
    r_col = p_col.add_run()
    r_col.text = "NARSIMHA REDDY ENGINEERING COLLEGE"
    r_col.font.size = Pt(22)
    r_col.font.bold = True
    r_col.font.color.rgb = hex_to_rgb("#0F172A")
    r_col.font.name = "Segoe UI"

    p_aff = inst_tf.add_paragraph()
    p_aff.space_before = Pt(2)
    p_aff.alignment = PP_ALIGN.CENTER
    r_aff = p_aff.add_run()
    r_aff.text = "(UGC - AUTONOMOUS INSTITUTION  •  APPROVED BY AICTE, NEW DELHI  •  AFFILIATED TO JNTUH)"
    r_aff.font.size = Pt(9)
    r_aff.font.bold = True
    r_aff.font.color.rgb = hex_to_rgb("#64748B")
    r_aff.font.name = "Segoe UI"

    p_dept = inst_tf.add_paragraph()
    p_dept.space_before = Pt(3)
    p_dept.alignment = PP_ALIGN.CENTER
    r_dept = p_dept.add_run()
    r_dept.text = "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"
    r_dept.font.size = Pt(13)
    r_dept.font.bold = True
    r_dept.font.color.rgb = hex_to_rgb("#1E3A8A")
    r_dept.font.name = "Segoe UI"

    p_badge = inst_tf.add_paragraph()
    p_badge.space_before = Pt(2)
    p_badge.alignment = PP_ALIGN.CENTER
    r_badge = p_badge.add_run()
    r_badge.text = "MAJOR CAPSTONE PROJECT PRESENTATION  •  ACADEMIC YEAR 2026–2027"
    r_badge.font.size = Pt(9)
    r_badge.font.bold = True
    r_badge.font.color.rgb = hex_to_rgb("#0284C7")
    r_badge.font.name = "Segoe UI"

    # Project detail card
    proj_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(1.72), Inches(12.333), Inches(2.15))
    proj_card.fill.solid()
    proj_card.fill.fore_color.rgb = hex_to_rgb("#FFFFFF")
    proj_card.line.color.rgb = hex_to_rgb("#CBD5E1")
    proj_card.line.width = Pt(1.5)

    proj_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(1.72), Inches(0.12), Inches(2.15))
    proj_bar.fill.solid()
    proj_bar.fill.fore_color.rgb = hex_to_rgb("#1E3A8A")
    proj_bar.line.fill.background()

    proj_box = slide.shapes.add_textbox(Inches(0.80), Inches(1.80), Inches(11.75), Inches(2.00))
    proj_tf = proj_box.text_frame
    proj_tf.word_wrap = True
    proj_tf.margin_left = Inches(0)
    proj_tf.margin_top = Inches(0)

    p_ptag = proj_tf.paragraphs[0]
    r_ptag = p_ptag.add_run()
    r_ptag.text = "PROJECT CODE: BPY-CSE-2666  •  CLINICAL DECISION SUPPORT SYSTEM (CDSS)"
    r_ptag.font.size = Pt(10)
    r_ptag.font.bold = True
    r_ptag.font.color.rgb = hex_to_rgb("#0284C7")
    r_ptag.font.name = "Segoe UI"

    p_ptitle = proj_tf.add_paragraph()
    p_ptitle.space_before = Pt(3)
    r_ptitle = p_ptitle.add_run()
    r_ptitle.text = "HealthNova AI: Patient Risk Level Prediction System"
    r_ptitle.font.size = Pt(22)
    r_ptitle.font.bold = True
    r_ptitle.font.color.rgb = hex_to_rgb("#0F172A")
    r_ptitle.font.name = "Segoe UI"

    p_psub = proj_tf.add_paragraph()
    p_psub.space_before = Pt(3)
    r_psub = p_psub.add_run()
    r_psub.text = "Explainable Clinical Acuity Stratification with Multi-Class ML & TreeSHAP Attribution"
    r_psub.font.size = Pt(12)
    r_psub.font.bold = True
    r_psub.font.color.rgb = hex_to_rgb("#334155")
    r_psub.font.name = "Segoe UI"

    p_pnarr = proj_tf.add_paragraph()
    p_pnarr.space_before = Pt(5)
    r_pnarr = p_pnarr.add_run()
    r_pnarr.text = "Continuous bedside telemetry monitoring combining Daphne ASGI real-time channels with calibrated Random Forest inference to prevent emergency department & ICU deterioration. Features sub-millisecond CPU inference (0.136ms), 0.985 ROC-AUC, 0.0027 calibrated Brier score, and sub-12ms game-theoretic TreeSHAP explainability."
    r_pnarr.font.size = Pt(10.5)
    r_pnarr.font.color.rgb = hex_to_rgb("#475569")
    r_pnarr.font.name = "Segoe UI"

    p_ptech = proj_tf.add_paragraph()
    p_ptech.space_before = Pt(5)
    r_ptech = p_ptech.add_run()
    r_ptech.text = "Core Stack: Python 3.13 • Django 5 ASGI • Daphne • Redis 7 • Next.js 16.3 • React 19 • Neon PostgreSQL 16 • pgvector • Scikit-Learn • TreeSHAP"
    r_ptech.font.size = Pt(9.5)
    r_ptech.font.bold = True
    r_ptech.font.color.rgb = hex_to_rgb("#1E3A8A")
    r_ptech.font.name = "Segoe UI"

    # Team members section header
    team_lbl_box = slide.shapes.add_textbox(Inches(0.50), Inches(4.00), Inches(12.333), Inches(0.30))
    team_lbl_tf = team_lbl_box.text_frame
    team_lbl_tf.margin_left = Inches(0)
    team_lbl_tf.margin_top = Inches(0)
    tp = team_lbl_tf.paragraphs[0]
    tr = tp.add_run()
    tr.text = "PROJECT PRESENTATION TEAM  (DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING)"
    tr.font.size = Pt(11)
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
    card_h = Inches(2.45)
    card_y = Inches(4.40)
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

        avatar_size = Inches(0.75)
        avatar_x = card_x + (card_w - avatar_size) / 2
        avatar_y = card_y + Inches(0.20)
        avatar = slide.shapes.add_shape(MSO_SHAPE.OVAL, avatar_x, avatar_y, avatar_size, avatar_size)
        avatar.fill.solid()
        avatar.fill.fore_color.rgb = hex_to_rgb("#EFF6FF")
        avatar.line.color.rgb = hex_to_rgb("#BAE6FD")
        avatar.line.width = Pt(1.5)

        av_tf = avatar.text_frame
        av_tf.margin_left = Inches(0)
        av_tf.margin_top = Inches(0.10)
        av_p = av_tf.paragraphs[0]
        av_p.alignment = PP_ALIGN.CENTER
        av_r = av_p.add_run()
        av_r.text = member["init"]
        av_r.font.size = Pt(15)
        av_r.font.bold = True
        av_r.font.color.rgb = hex_to_rgb(member["color"])
        av_r.font.name = "Segoe UI"

        c_text_box = slide.shapes.add_textbox(card_x + Inches(0.08), card_y + Inches(1.05), card_w - Inches(0.16), card_h - Inches(1.10))
        c_tf = c_text_box.text_frame
        c_tf.word_wrap = True
        c_tf.margin_left = Inches(0)
        c_tf.margin_top = Inches(0)

        cp1 = c_tf.paragraphs[0]
        cp1.alignment = PP_ALIGN.CENTER
        cr1 = cp1.add_run()
        cr1.text = member["name"]
        cr1.font.size = Pt(15)
        cr1.font.bold = True
        cr1.font.color.rgb = hex_to_rgb("#0F172A")
        cr1.font.name = "Segoe UI"

        cp2 = c_tf.add_paragraph()
        cp2.space_before = Pt(4)
        cp2.alignment = PP_ALIGN.CENTER
        cr2 = cp2.add_run()
        cr2.text = member["htno"]
        cr2.font.size = Pt(12)
        cr2.font.bold = True
        cr2.font.color.rgb = hex_to_rgb("#0284C7")
        cr2.font.name = "Consolas"

        cp3 = c_tf.add_paragraph()
        cp3.space_before = Pt(4)
        cp3.alignment = PP_ALIGN.CENTER
        cr3 = cp3.add_run()
        cr3.text = "B.Tech CSE • 4th Year"
        cr3.font.size = Pt(9.5)
        cr3.font.bold = True
        cr3.font.color.rgb = hex_to_rgb("#475569")
        cr3.font.name = "Segoe UI"

        cp4 = c_tf.add_paragraph()
        cp4.space_before = Pt(2)
        cp4.alignment = PP_ALIGN.CENTER
        cr4 = cp4.add_run()
        cr4.text = "Narsimha Reddy Engg College"
        cr4.font.size = Pt(8.5)
        cr4.font.color.rgb = hex_to_rgb("#64748B")
        cr4.font.name = "Segoe UI"

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

    print(f"Building presentation with exact 6 agenda topics ({len(SLIDES_DATA)} total slides, ultra-short matter)...")
    for idx, (data, theme) in enumerate(zip(SLIDES_DATA, SLIDE_THEMES), start=1):
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
        pill_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.50), Inches(0.30), Inches(4.5), Inches(0.36))
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
        pill_run.text = f"SECTION {idx-1} / 6  •  {theme['tag']}"
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
        r_title.font.size = Pt(24)
        r_title.font.bold = True
        r_title.font.color.rgb = hex_to_rgb(theme["primary"])
        r_title.font.name = "Segoe UI"

        p_sub = header_tf.add_paragraph()
        p_sub.space_before = Pt(2)
        r_sub = p_sub.add_run()
        r_sub.text = data["subtitle"]
        r_sub.font.size = Pt(12)
        r_sub.font.bold = True
        r_sub.font.color.rgb = hex_to_rgb(theme["secondary"])
        r_sub.font.name = "Segoe UI"

        p_lead = header_tf.add_paragraph()
        p_lead.space_before = Pt(2)
        r_lead = p_lead.add_run()
        r_lead.text = f"💡 Key Takeaway: {data['lead']}"
        r_lead.font.size = Pt(10.5)
        r_lead.font.bold = True
        r_lead.font.color.rgb = hex_to_rgb(theme["text_muted"])
        r_lead.font.name = "Segoe UI"

        # 5. 3 Tall, High-Impact Cards (Width 3.96", Height 4.85")
        card_w = Inches(3.96)
        card_h = Inches(4.85)
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

            c_text_box = slide.shapes.add_textbox(card_x + Inches(0.22), card_y + Inches(0.22), card_w - Inches(0.44), card_h - Inches(0.70))
            c_tf = c_text_box.text_frame
            c_tf.word_wrap = True
            c_tf.margin_left = Inches(0)
            c_tf.margin_top = Inches(0)

            # Badge
            cp0 = c_tf.paragraphs[0]
            cr0 = cp0.add_run()
            cr0.text = f"POINT 0{c_idx+1}"
            cr0.font.size = Pt(10.5)
            cr0.font.bold = True
            cr0.font.color.rgb = hex_to_rgb(theme["secondary"])
            cr0.font.name = "Segoe UI"

            # Title
            cp1 = c_tf.add_paragraph()
            cp1.space_before = Pt(6)
            cr1 = cp1.add_run()
            cr1.text = card["title"]
            cr1.font.size = Pt(19)
            cr1.font.bold = True
            cr1.font.color.rgb = hex_to_rgb(theme["primary"])
            cr1.font.name = "Segoe UI"

            # Bullets (Ultra-short, big readable fonts, high-contrast)
            for bullet in card.get("bullets", []):
                bp = c_tf.add_paragraph()
                bp.space_before = Pt(22)
                
                # Split prefix if contains colon for emphasis
                if ":" in bullet:
                    prefix, rest = bullet.split(":", 1)
                    br1 = bp.add_run()
                    br1.text = f"✔ {prefix.strip()}:"
                    br1.font.size = Pt(13.5)
                    br1.font.bold = True
                    br1.font.color.rgb = hex_to_rgb(theme["primary"])
                    br1.font.name = "Segoe UI"
                    
                    br2 = bp.add_run()
                    br2.text = f" {rest.strip()}"
                    br2.font.size = Pt(13)
                    br2.font.color.rgb = hex_to_rgb(theme["text_muted"])
                    br2.font.name = "Segoe UI"
                else:
                    br = bp.add_run()
                    br.text = f"✔  {bullet}"
                    br.font.size = Pt(13.5)
                    br.font.color.rgb = hex_to_rgb(theme["text_muted"])
                    br.font.name = "Segoe UI"

            # Bottom Pill (Anchored neatly at the bottom)
            pill_w = card_w - Inches(0.36)
            pill_h = Inches(0.34)
            pill_x = card_x + Inches(0.18)
            pill_y = card_y + card_h - Inches(0.44)

            c_pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, pill_x, pill_y, pill_w, pill_h)
            c_pill.fill.solid()
            c_pill.fill.fore_color.rgb = hex_to_rgb(theme["bg"])
            c_pill.line.color.rgb = hex_to_rgb(theme["card_border"])
            c_pill.line.width = Pt(1)

            c_pill_tf = c_pill.text_frame
            c_pill_tf.margin_left = Inches(0)
            c_pill_tf.margin_top = Inches(0.04)
            c_pp = c_pill_tf.paragraphs[0]
            c_pp.alignment = PP_ALIGN.CENTER
            c_pr = c_pp.add_run()
            c_pr.text = card.get("pill", "")
            c_pr.font.size = Pt(9.5)
            c_pr.font.bold = True
            c_pr.font.color.rgb = hex_to_rgb(theme["accent"])
            c_pr.font.name = "Segoe UI"

        # 6. Footer
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
    print(f"Presentation successfully created at: {output_path} (Exactly {len(SLIDES_DATA)} slides)")

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
    
    for folder in ["presentation_slides", "frontend/public/presentation"]:
        if os.path.exists(folder):
            shutil.rmtree(folder)
        os.makedirs(folder, exist_ok=True)
    
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(dpi=150)
        out_name = f"slide_{i:02d}.png"
        pix.save(os.path.join("presentation_slides", out_name))
        pix.save(os.path.join("frontend/public/presentation", out_name))
    
    print(f"Rendered exactly {len(doc)} slide images successfully!")

if __name__ == "__main__":
    out_pptx = os.path.abspath("HealthNova_AI_Clinical_Decision_Support_System.pptx")
    out_pdf = os.path.abspath("HealthNova_AI_Clinical_Decision_Support_System.pdf")
    
    # 1. Build PPTX
    build_presentation(out_pptx)
    
    # 2. Mirror PPTX to frontend/public/
    shutil.copy2(out_pptx, "frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pptx")
    print("Mirrored PPTX to frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pptx")
    
    # 3. Convert to PDF
    convert_pptx_to_pdf(out_pptx, out_pdf)
    
    # 4. Mirror PDF to frontend/public/
    shutil.copy2(out_pdf, "frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pdf")
    print("Mirrored PDF to frontend/public/HealthNova_AI_Clinical_Decision_Support_System.pdf")
    
    # 5. Export high-res PNG slide images
    export_slide_images(out_pdf)

    print("ALL DONE: ULTRA-SHORT, MINIMAL PRESENTATION IS READY!")
