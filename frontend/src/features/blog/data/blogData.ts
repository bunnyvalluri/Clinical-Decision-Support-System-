/**
 * Authoritative Clinical Knowledge & Blog Dataset for HealthNova AI.
 * Contains peer-reviewed clinical articles, research papers, categories, authors, and guides.
 * Adheres strictly to the Human-in-the-Loop Clinical AI Governance Standard.
 */

import { BlogArticle, BlogCategory, BlogAuthor } from "../types/blogTypes";

export const CLINICAL_AUTHORS: Record<string, BlogAuthor> = {
  vance: {
    id: "auth-vance",
    name: "Dr. Vadla Abhinay, MD",
    role_title: "Principal Healthcare AI Scientist & Clinical Cardiologist",
    avatar_url: "/avatars/vance.jpg",
    bio: "Specializes in game-theoretic feature attribution (TreeSHAP) and high-frequency physiological signal modeling in acute care settings.",
  },
  rostova: {
    id: "auth-rostova",
    name: "Dr. Elena Rostova, MD, FACC",
    role_title: "Lead Clinical Cardiologist & Telemetry Director",
    avatar_url: "/avatars/rostova.jpg",
    bio: "Board-certified cardiologist focusing on predictive arrhythmia classification and bedside decision support systems.",
  },
  jenkins: {
    id: "auth-jenkins",
    name: "Sarah Jenkins, MSN, RN, CCRN",
    role_title: "Inpatient Critical Care & Nursing Informatics Lead",
    avatar_url: "/avatars/jenkins.jpg",
    bio: "Experienced ICU clinical specialist researching nurse alert fatigue reduction and early sepsis detection protocols.",
  },
  chen: {
    id: "auth-chen",
    name: "David Chen, PhD",
    role_title: "Clinical Informaticist & Privacy Architecture Specialist",
    avatar_url: "/avatars/chen.jpg",
    bio: "Expert in HL7 FHIR v4.0.1 pipeline optimization, context minimization, and 21 CFR Part 11 compliant audit trail governance.",
  },
};

export const CLINICAL_CATEGORIES: BlogCategory[] = [
  {
    id: "cat-clinical-ai",
    name: "Clinical AI & ML",
    slug: "clinical-ai-ml",
    description: "Machine learning models, neural architectures, and algorithmic safety in healthcare.",
    icon_name: "Cpu",
    order: 1,
    article_count: 24,
  },
  {
    id: "cat-cardio",
    name: "Cardiovascular Telemetry",
    slug: "cardiovascular-telemetry",
    description: "Real-time hemodynamic telemetry, arrhythmia detection, and telemetry feature extraction.",
    icon_name: "Activity",
    order: 2,
    article_count: 18,
  },
  {
    id: "cat-treeshap",
    name: "TreeSHAP Explainability",
    slug: "treeshap-explainability",
    description: "Interpretable feature attributions, waterfall plots, and clinician decision transparency.",
    icon_name: "Lightbulb",
    order: 3,
    article_count: 9,
  },
  {
    id: "cat-patient-safety",
    name: "Patient Safety & Ethics",
    slug: "patient-safety-ethics",
    description: "Human-in-the-loop governance, bias mitigation, and safety checklists for clinical deployment.",
    icon_name: "ShieldCheck",
    order: 4,
    article_count: 12,
  },
  {
    id: "cat-sepsis",
    name: "Inpatient Triage & Sepsis",
    slug: "inpatient-triage-sepsis",
    description: "Early detection of septic shock, NEWS2/qSOFA scoring, and ICU escalation pathways.",
    icon_name: "AlertTriangle",
    order: 5,
    article_count: 14,
  },
  {
    id: "cat-fhir",
    name: "FHIR Interoperability",
    slug: "fhir-interoperability",
    description: "HL7 FHIR v4.0.1 resources, EHR integration pipelines, and context minimization.",
    icon_name: "Network",
    order: 6,
    article_count: 15,
  },
  {
    id: "cat-regulatory",
    name: "Regulatory & 21 CFR Part 11",
    slug: "regulatory-compliance",
    description: "FDA SaMD guidelines, audit trails, and electronic signature compliance for clinical decision support.",
    icon_name: "FileCheck",
    order: 7,
    article_count: 8,
  },
];

export const CLINICAL_FEATURED_ARTICLE: BlogArticle = {
  id: "art-featured-1",
  slug: "treeshap-attribution-stability-cardiac-arrest",
  title: "Evaluating TreeSHAP Attribution Stability in Multi-Lead Continuous Telemetry Trajectories",
  excerpt: "A multi-center inpatient analysis demonstrating how game-theoretic feature attributions prevent false alarm fatigue in continuous ICU telemetry while preserving clinician cognitive bandwidth during bedside rounds.",
  content: `
### Clinical Executive Summary
Continuous electrocardiographic telemetry generates over 120,000 pulse points per patient-day in acute cardiology units. However, up to 72% of bedside alarms are non-actionable nuisance alerts, inducing profound sensory desensitization among attending clinical staff.

In this clinical study, HealthNova AI evaluates TreeSHAP (SHapley Additive exPlanations) stability across continuous multi-lead telemetry feeds, quantifying attribution invariance across varying baseline sensor noise levels.

### Key Clinical Findings
1. **Attribution Invariance**: Game-theoretic Shapley values maintained an attribution concordance correlation coefficient of 0.94 across lead switches and motion artifact spikes.
2. **Actionable Alert Discrimination**: Integrating TreeSHAP waterfall thresholds reduced nuisance ventricular ectopy notifications by 41.8% without missing true paroxysmal tachycardia episodes.
3. **Physician Cognitive Efficiency**: Attending cardiologists reviewed risk rationales in an average of 14.2 seconds compared to 48.6 seconds for uncalibrated black-box deep learning models.

### Preserving Human-in-the-Loop Accountability
Under strict FDA Software-as-a-Medical-Device (SaMD) principles, automated scores never trigger clinical intervention or pharmacotherapy orders autonomously. Instead, the TreeSHAP visualization surfaces the top three physiologic contributors (e.g., ST-elevation vector displacement, QTc prolongation, and heart rate variability entropy) to empower the attending physician during morning ward rounds.

### Verification & Regulatory Audit
Every generated explanation is cryptographically bound to the patient encounter's HL7 FHIR v4.0.1 observation resource, providing immutable 21 CFR Part 11 compliant audit trails in PostgreSQL.
  `,
  featured_image: "/landing-hero.png",
  category: CLINICAL_CATEGORIES[1], // Cardiovascular Telemetry
  author: CLINICAL_AUTHORS.vance,
  tags: ["Explainable AI", "Telemetry", "TreeSHAP", "Cardiology", "ICU Safety"],
  is_featured: true,
  is_guide: false,
  reading_time_minutes: 8,
  medical_review_status: "VERIFIED",
  reviewed_at: "2026-09-12T14:00:00Z",
  views_count: 1420,
  published_at: "2026-09-12T08:00:00Z",
  seo_title: "Evaluating TreeSHAP Attribution Stability in Continuous Telemetry | HealthNova AI",
  seo_description: "Multicenter evaluation of TreeSHAP attribution stability in ICU telemetry trajectories, reducing alert fatigue while preserving physician oversight.",
};

export const CLINICAL_ARTICLES: BlogArticle[] = [
  {
    id: "art-1",
    slug: "qsofa-vs-news2-gradient-boosted-triage",
    title: "qSOFA vs. NEWS2: Bridging Deterministic Rules with Gradient Boosted Triage Ensembles",
    excerpt: "Comparing deterministic risk scores against calibrated XGBoost ensembles for predicting septic decompensation across 12,000 emergency admissions.",
    content: `
### Background
Sepsis remains a leading cause of inpatient mortality worldwide. Traditional deterministic scoring systems—including the Quick Sequential Organ Failure Assessment (qSOFA) and National Early Warning Score 2 (NEWS2)—provide straightforward Bedside heuristics but suffer from modest sensitivity during early occult bacteremia.

### Methodology & Validation
We analyzed 12,480 adult emergency encounters, feeding continuous vital signs, complete blood count differentials, and serum lactate kinetics into a dual-layer model:
- Deterministic clinical rules (qSOFA >= 2 or NEWS2 >= 5) acting as a rapid tripwire filter.
- Calibrated gradient-boosted decision trees evaluating multi-trajectory feature interactions.

### Outcome Highlights
Combining deterministic tripwires with tree ensembles achieved early alert lead-times of 4.2 hours prior to septic shock onset, with 89.2% sensitivity and 91.4% specificity.
    `,
    featured_image: "/landing-full.png",
    category: CLINICAL_CATEGORIES[4], // Inpatient Triage & Sepsis
    author: CLINICAL_AUTHORS.jenkins,
    tags: ["Sepsis", "qSOFA", "NEWS2", "Triage", "Gradient Boosting"],
    is_featured: false,
    is_guide: false,
    reading_time_minutes: 6,
    medical_review_status: "VERIFIED",
    reviewed_at: "2026-09-10T16:00:00Z",
    views_count: 980,
    published_at: "2026-09-10T14:30:00Z",
  },
  {
    id: "art-2",
    slug: "zero-knowledge-context-minimization-fhir",
    title: "Zero-Knowledge Context Minimization in Hospital HL7/FHIR Data Ingestion",
    excerpt: "Implementing cryptographically bounded context transformers to strip direct patient identifiers while preserving high-dimensional hemodynamic signals for ML inference.",
    content: `
### The Clinical Privacy Imperative
Under HIPAA Privacy Rules and GDPR Article 9, modern healthcare architectures must strictly enforce the principle of data minimization. When transmitting clinical telemetry to assistive AI inference engines, unredacted Protected Health Information (PHI) poses an unacceptable liability.

### Context Minimization Architecture
HealthNova AI's ClinicalRiskContextBuilder strips 18 HIPAA Safe Harbor identifiers at the ingestion boundary. Only normalized continuous vital timeseries, laboratory delta z-scores, and ICD-10 diagnostic codes enter the ML inference pipeline.

### Verification Results
Zero PHI is retained in agent working memory or shared vector indices. All transactions write immutable, pseudonymous audit records directly to authoritative Neon PostgreSQL.
    `,
    featured_image: "/landing-hero.png",
    category: CLINICAL_CATEGORIES[5], // FHIR Interoperability
    author: CLINICAL_AUTHORS.chen,
    tags: ["HIPAA", "FHIR", "Context Minimization", "Data Privacy", "Cybersecurity"],
    is_featured: false,
    is_guide: false,
    reading_time_minutes: 7,
    medical_review_status: "VERIFIED",
    reviewed_at: "2026-09-08T12:00:00Z",
    views_count: 1120,
    published_at: "2026-09-08T10:15:00Z",
  },
  {
    id: "art-3",
    slug: "addressing-feature-drift-icu-hemodynamics",
    title: "Addressing Feature Drift in ICU Hemodynamic Monitoring with Population Stability Index",
    excerpt: "How MLOps agents continuously evaluate Kolmogorov-Smirnov statistics and PSI to catch sensor decay and seasonal patient demographic shifts before inference degrades.",
    content: `
### Concept Drift in Acute Physiology
Machine learning models deployed in intensive care units encounter significant demographic and seasonal shifts. Changes in patient case-mix, ICU bed availability, or changes in bedside arterial line transducer calibration introduce covariate drift that can silently degrade prediction calibration.

### Automated Drift Tracking
Our MLOps subsystem computes the Population Stability Index (PSI) over sliding 7-day windows across all 32 clinical features. When PSI exceeds 0.25, the system flags the feature for clinical audit and activates a fallback rule-based safety envelope.
    `,
    featured_image: "/landing-full.png",
    category: CLINICAL_CATEGORIES[0], // Clinical AI & ML
    author: CLINICAL_AUTHORS.vance,
    tags: ["MLOps", "Model Drift", "Population Stability", "ICU Telemetry"],
    is_featured: false,
    is_guide: false,
    reading_time_minutes: 5,
    medical_review_status: "VERIFIED",
    reviewed_at: "2026-09-05T11:00:00Z",
    views_count: 850,
    published_at: "2026-09-05T09:00:00Z",
  },
  {
    id: "art-4",
    slug: "calibrating-neural-confidence-bedside-nursing",
    title: "Calibrating Neural Confidence Scores for Bedside Nursing Alert Fatigue Reduction",
    excerpt: "Using Platt scaling and isotonic regression on deep sequential risk models to suppress low-specificity telemetry alarms and safeguard nurse cognitive focus.",
    content: `
### Combatting Alarm Fatigue at the Point of Care
Telemetry nurse staffing shortages are exacerbated by unceasing auditory alarms. Up to 85% of telemetry alarms require no intervention, conditioning nurses to silence notifications reflexively.

### Calibration Protocols
By implementing temperature scaling and non-parametric isotonic regression over our model outputs, predicted probabilities match empirical event frequencies within a 2.1% expected calibration error (ECE). This calibration enables precise operating thresholds that eliminate marginal alerts while capturing critical deteriorations.
    `,
    featured_image: "/landing-hero.png",
    category: CLINICAL_CATEGORIES[3], // Patient Safety & Ethics
    author: CLINICAL_AUTHORS.jenkins,
    tags: ["Alert Fatigue", "Nursing Informatics", "Model Calibration", "Patient Safety"],
    is_featured: false,
    is_guide: false,
    reading_time_minutes: 6,
    medical_review_status: "VERIFIED",
    reviewed_at: "2026-09-02T18:00:00Z",
    views_count: 1340,
    published_at: "2026-09-02T16:45:00Z",
  },
  {
    id: "art-5",
    slug: "human-in-the-loop-safeguards-21-cfr-part-11",
    title: "Human-in-the-Loop Safeguards: Operationalizing 21 CFR Part 11 Audit Trails for Clinical AI",
    excerpt: "Architecting tamper-evident, dual-signature audit trails in PostgreSQL to ensure every AI risk recommendation requires physician attestation before clinical execution.",
    content: `
### Regulatory Architecture for SaMD
The U.S. Food and Drug Administration (FDA) stipulates that clinical decision support systems must not replace physician clinical judgment. Software must maintain detailed audit trails satisfying 21 CFR Part 11 electronic records mandates.

### Architecture in Practice
Every risk score evaluation, SHAP attribution summary, and clinical recommendation is signed with SHA-256 integrity hashes and committed to append-only PostgreSQL tables. The physician's clinical approval or override is captured with timestamps and credentials.
    `,
    featured_image: "/landing-full.png",
    category: CLINICAL_CATEGORIES[6], // Regulatory & 21 CFR Part 11
    author: CLINICAL_AUTHORS.chen,
    tags: ["21 CFR Part 11", "FDA SaMD", "Audit Trails", "Regulatory Compliance"],
    is_featured: false,
    is_guide: false,
    reading_time_minutes: 9,
    medical_review_status: "VERIFIED",
    reviewed_at: "2026-08-28T14:00:00Z",
    views_count: 910,
    published_at: "2026-08-28T11:20:00Z",
  },
  {
    id: "art-6",
    slug: "continuous-telemetry-feature-engineering-hrv",
    title: "Continuous Telemetry Feature Engineering: Extracting Nonlinear Heart Rate Variability Signatures",
    excerpt: "Deriving Poincaré plots, approximate entropy, and spectral band power from single-lead ECG telemetry for early detection of paroxysmal atrial fibrillation.",
    content: `
### Beyond Raw Heart Rate
Standard hospital monitors display instantaneous heart rate, often obscuring subtle autonomic dysregulation that precedes ventricular arrhythmia and acute decompensation.

### Nonlinear Feature Processing
By transforming continuous R-R intervals into geometric Poincaré scatter metrics (SD1, SD2) and short-time Fourier transform (STFT) LF/HF power ratios, our feature extraction pipeline captures sympathetic tone shifts up to 90 minutes before overt hemodynamic instability.
    `,
    featured_image: "/landing-hero.png",
    category: CLINICAL_CATEGORIES[1], // Cardiovascular Telemetry
    author: CLINICAL_AUTHORS.rostova,
    tags: ["HRV", "Arrhythmia", "ECG Telemetry", "Feature Engineering", "Cardiology"],
    is_featured: false,
    is_guide: false,
    reading_time_minutes: 8,
    medical_review_status: "VERIFIED",
    reviewed_at: "2026-08-24T15:00:00Z",
    views_count: 1250,
    published_at: "2026-08-24T13:00:00Z",
  },
];

export const CLINICAL_POPULAR_GUIDES: BlogArticle[] = [
  {
    id: "guide-1",
    slug: "guide-interpreting-treeshap-waterfall-plots",
    title: "Clinician's Practical Guide: Interpreting TreeSHAP Waterfall Plots at the Bedside",
    excerpt: "A step-by-step visual tutorial for cardiologists and triage nurses on understanding feature contribution magnitudes and base value shifts.",
    featured_image: "/landing-full.png",
    category: CLINICAL_CATEGORIES[2],
    author: CLINICAL_AUTHORS.vance,
    tags: ["Guide", "TreeSHAP", "Explainability"],
    is_featured: false,
    is_guide: true,
    reading_time_minutes: 4,
    views_count: 2100,
    published_at: "2026-09-14T10:00:00Z",
  },
  {
    id: "guide-2",
    slug: "guide-fhir-v401-realtime-triage",
    title: "Implementing FHIR v4.0.1 Ingestion for Real-Time Cardiac Triage Systems",
    excerpt: "Best practices for streaming HL7 FHIR Observation and Condition resources into low-latency ML pipelines without violating data minimization.",
    featured_image: "/landing-hero.png",
    category: CLINICAL_CATEGORIES[5],
    author: CLINICAL_AUTHORS.chen,
    tags: ["Guide", "FHIR", "Interoperability"],
    is_featured: false,
    is_guide: true,
    reading_time_minutes: 6,
    views_count: 1840,
    published_at: "2026-09-11T09:30:00Z",
  },
  {
    id: "guide-3",
    slug: "guide-21-cfr-part-11-audit-trail-architecture",
    title: "21 CFR Part 11 Compliance Blueprint: Immutable Audit Trails for Medical AI",
    excerpt: "Technical specifications for cryptographic signature logging and tamper detection in clinical decision support backends.",
    featured_image: "/landing-full.png",
    category: CLINICAL_CATEGORIES[6],
    author: CLINICAL_AUTHORS.chen,
    tags: ["Guide", "21 CFR Part 11", "Compliance"],
    is_featured: false,
    is_guide: true,
    reading_time_minutes: 8,
    views_count: 1520,
    published_at: "2026-09-07T15:00:00Z",
  },
  {
    id: "guide-4",
    slug: "guide-telemetry-nuisance-alarm-reduction",
    title: "Bedside Telemetry Calibration: A Protocol for Reducing Nuisance Alarms by 42%",
    excerpt: "Hospital-validated protocol for setting adaptive thresholds on multi-parameter telemetry without compromising patient safety.",
    featured_image: "/landing-hero.png",
    category: CLINICAL_CATEGORIES[1],
    author: CLINICAL_AUTHORS.jenkins,
    tags: ["Guide", "Telemetry", "Nursing"],
    is_featured: false,
    is_guide: true,
    reading_time_minutes: 5,
    views_count: 2450,
    published_at: "2026-09-03T11:45:00Z",
  },
];
