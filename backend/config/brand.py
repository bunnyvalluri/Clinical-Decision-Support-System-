"""
HealthNova AI — Backend Brand Configuration

Single source of truth for backend services, emails, health checks,
PDF reports, and administration site branding.
"""

BRAND_NAME = "HealthNova AI"
BRAND_DISPLAY_NAME = "HealthNova AI"
BRAND_SHORT_NAME = "HN"
BRAND_TAGLINE = "AI-Powered Clinical Decision Support & Patient Risk Intelligence"
BRAND_SUBTITLE = BRAND_TAGLINE

BRAND_DESCRIPTION = (
    "HealthNova AI is an intelligent clinical decision-support platform that uses "
    "machine learning, AI, real-time patient information, explainable risk prediction "
    "and clinical intelligence to assist healthcare professionals in making informed decisions."
)

# API Documentation & Metadata
API_TITLE = "HealthNova AI API"
API_DESCRIPTION = "Clinical Decision Support & Patient Risk Intelligence API"
API_VERSION = "1.0.0"

# Django Admin Configuration
ADMIN_SITE_HEADER = "HealthNova AI Administration"
ADMIN_SITE_TITLE = "HealthNova AI"
ADMIN_INDEX_TITLE = "HealthNova AI Administration"

# Role Subtitles
ROLE_SUBTITLES = {
    "DOCTOR": "Clinical Decision Support",
    "NURSE": "Triage & Patient Risk Monitoring",
    "ANALYST": "Clinical Data & Model Intelligence",
    "MEDICAL_INFORMATICIST": "Clinical Data & Model Intelligence",
    "ADMIN": "Platform & Security Administration",
    "IT_ADMIN": "Platform & Security Administration",
    "PATIENT": "Personal Health Intelligence",
}

# Role AI Assistants
AI_ASSISTANTS = {
    "DOCTOR": "HealthNova AI Clinical Assistant",
    "NURSE": "HealthNova AI Triage Assistant",
    "ANALYST": "HealthNova AI Analytics Assistant",
    "MEDICAL_INFORMATICIST": "HealthNova AI Analytics Assistant",
    "ADMIN": "HealthNova AI Platform Assistant",
    "IT_ADMIN": "HealthNova AI Platform Assistant",
    "PATIENT": "HealthNova AI Health Assistant",
}

# Disclaimers
CLINICAL_SAFETY_DISCLAIMER = (
    "HealthNova AI provides clinical decision support and risk insights. "
    "It does not replace professional medical judgment."
)

REPORT_DISCLAIMER = (
    "This report is generated for clinical decision support and should be "
    "interpreted by an appropriately qualified healthcare professional."
)

# Academic Project Lineage
ACADEMIC_PRIMARY_TITLE = (
    "Enhancing Clinical Decision Support Systems Through Patient Risk Level "
    "Prediction Using Machine Learning Techniques"
)
ACADEMIC_SECONDARY_TITLE = (
    "Patient Risk Level Prediction Using Machine Learning for Intelligent "
    "Clinical Decision Support"
)
PROJECT_CODE = "BPY-CSE-2666"

# Contact Channels
SUPPORT_EMAIL = "support@healthnova.ai"
PRIVACY_EMAIL = "privacy@healthnova.ai"
DEFAULT_FROM_EMAIL = "noreply@healthnova.ai"
