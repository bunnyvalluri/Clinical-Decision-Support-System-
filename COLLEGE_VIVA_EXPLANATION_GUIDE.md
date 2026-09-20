# HealthNova AI (BPY-CSE-2666) — College Viva & Defense Master Guide
**Department of Computer Science and Engineering — Narsimha Reddy Engineering College (UGC Autonomous / JNTUH)**  
**Project Code:** `BPY-CSE-2666`  
**Team Members:** Vedhasree (23X01A05Z8), Prashanth (23X01A05Y1), Abhinay (23X01A05AG), Rahul (23X01A05AL), Pranay (23X01A05AA)

---

## 📑 Presentation & PDF Structure

The updated presentation file [HealthNova_AI_Clinical_Decision_Support_System.pdf](file:///c:/4-1/HealthNova_AI_Clinical_Decision_Support_System.pdf) and PowerPoint deck [HealthNova_AI_Clinical_Decision_Support_System.pptx](file:///c:/4-1/HealthNova_AI_Clinical_Decision_Support_System.pptx) contain **24 Slides**:

- **Part I (Slides 01 – 11):** Executive Capstone Presentation Slides (High-density visual slides for the projector, with speaker notes).
- **Part II (Slide 12):** Section II Divider — College Viva Defense & Slide-by-Slide Explanation Playbook.
- **Part II (Slides 13 – 23):** 11 Slide-by-Slide Viva Guides containing:
  1. 🗣️ **30-Second Speaking Script** (Exact words to say out loud to professors/examiners).
  2. 💡 **Simple Concept & Analogy** (Plain English explanation to understand without memorizing).
  3. ❓ **Top 3 Viva Questions & Winning Answers** (What the external examiner will ask).
  4. 🎯 **Scoring Keywords** (Keywords that earn full marks).
  5. 🛡️ **Examiner Defense Strategy Insight** (Tactical advice for tough questions).
- **Part II (Slide 24):** **Master College Viva Cheat Sheet** (Top 10 Rapid-Fire Questions & Answers).

---

# 🎓 Slide-by-Slide College Explanation Guide

---

### Slide 01: Project Title & Executive Introduction
- **PDF Page:** Page 01 (Slide) & Page 13 (Viva Guide)
- **Topic:** Project Code BPY-CSE-2666, HealthNova AI, Team Introduction
- **🗣️ 30-Second Speaking Script:**
  > "Respected Examiners and HOD Sir, good morning. Our capstone project is **HealthNova AI: An Explainable Clinical Decision Support System for Real-Time Patient Risk Stratification**, carrying project code **BPY-CSE-2666**. Our team consists of Vedhasree, Prashanth, Abhinay, Rahul, and Pranay from the Department of Computer Science & Engineering. In hospital emergency rooms and ICUs, sudden cardiac deterioration causes millions of preventable deaths. Traditional hospital calculators are paper-based and updated only once in 24 hours. Our system introduces a real-time AI co-pilot that ingests continuous bedside telemetry, predicts 4-tier clinical risk in just 0.13 milliseconds, and explains every biomarker driver using game-theoretic TreeSHAP, all while preserving 100% human clinician authority."
- **💡 Simple Concept:**
  > Think of HealthNova as an intelligent co-pilot for hospital cardiologists and ICU nurses. It continuously monitors live patient vitals, detects life-threatening heart issues before they happen, and explains exactly why the risk is rising.
- **❓ Top Viva Questions & Answers:**
  - **Q1: What is the core problem and motivation of your project?**  
    *Ans:* Sudden cardiovascular deterioration in hospital wards often goes undetected because conventional calculators are static (updated only once every 24 hours) and monitors produce 85% false alarms. HealthNova provides continuous, calibrated sub-millisecond risk prediction.
  - **Q2: Is HealthNova designed to replace doctors or automate drug prescriptions?**  
    *Ans:* Never. It is strictly a Clinical Decision Support System (CDSS). Final diagnoses and prescriptions 100% mandate licensed human physician sign-off. We enforce sovereign clinician override by architectural design.
  - **Q3: What makes this project an enterprise-grade capstone?**  
    *Ans:* It is not just a raw Jupyter notebook model. It is a full-stack dual-engine clinical system: Daphne ASGI backend streaming live vitals, Next.js 16 frontend with 173 routes, Neon Postgres database, and TreeSHAP explainability.
- **🎯 Keywords to Mention:** `Clinical Decision Support System (CDSS)`, `Real-Time Telemetry`, `Calibrated Random Forest`, `TreeSHAP Explainability`, `Human-in-the-Loop`.

---

### Slide 02: Clinical Problem Statement & Unmet Need
- **PDF Page:** Page 02 (Slide) & Page 14 (Viva Guide)
- **Topic:** Why traditional calculators fail, alert fatigue, and black-box AI
- **🗣️ 30-Second Speaking Script:**
  > "Respected Evaluators, cardiovascular disease is the world's leading killer, causing 17.9 million deaths annually. Today, ICU and emergency doctors rely on manual tools like TIMI and APACHE II. The fundamental failure of these tools is that they are static—they compute risk only once every 24 hours from admission lab baselines. But a patient in an ICU can experience cardiac arrest in minutes! Furthermore, conventional bedside monitors sound false alarms over 85% of the time. This causes severe 'alert fatigue', where exhausted nurses become desensitized and can miss genuine emergencies. Finally, when hospitals tried deep learning, doctors rejected it because neural networks are opaque 'black boxes'. HealthNova solves all three: continuous live monitoring, calibrated noise-free alerts, and transparent TreeSHAP explanations."
- **💡 Simple Concept:**
  > Traditional hospital scoring is like taking a single photograph once a day and assuming the patient hasn't changed. HealthNova AI is like a continuous 60-FPS video stream that catches deterioration the moment it begins.
- **❓ Top Viva Questions & Answers:**
  - **Q1: What are TIMI and APACHE II?**  
    *Ans:* TIMI (Thrombolysis in Myocardial Infarction) and APACHE II are traditional manual risk scores. They rely on coarse linear heuristics computed once at admission and cannot adapt to fluctuating live vitals.
  - **Q2: Why is 'alert fatigue' such a critical hazard in hospitals?**  
    *Ans:* When 85%+ of bedside alarms are false positives, clinicians suffer sensory overload and burnout. This causes delayed response times during true clinical crashes. Our calibrated model filters out false alarms.
  - **Q3: Why can't hospitals just use deep neural networks?**  
    *Ans:* Deep neural networks are black boxes. A doctor cannot ethically or legally administer high-risk cardiac medication without knowing exactly which biomarker or vital sign triggered the AI's recommendation.
- **🎯 Keywords to Mention:** `17.9M CVD Mortality`, `Static 24h Baseline Failure`, `Alert Fatigue (85%+ False Alarms)`, `Black-Box Opacity`, `Continuous 4-Tier Acuity`.

---

### Slide 03: System Architecture & Dual-Stack Foundation
- **PDF Page:** Page 03 (Slide) & Page 15 (Viva Guide)
- **Topic:** Python Django ASGI, Next.js 16, Neon PostgreSQL, WebSockets
- **🗣️ 30-Second Speaking Script:**
  > "In Slide 3, we present our decoupled dual-stack architecture. On the backend, we run Python 3.13 with Django 5 on a Daphne ASGI server. Why ASGI? Because standard WSGI blocks threads on long-lived connections, whereas Daphne ASGI natively supports asynchronous WebSockets with Redis Pub/Sub, enabling live ECG and vitals streaming with roundtrip latency under 20 milliseconds. For data storage, we use serverless Neon PostgreSQL 16 with pgvector for isolated medical embeddings and instant branch testing. On the frontend, we built 173 compiled routes using Next.js 16.3 and React 19, delivering sub-250ms page loads and 120 FPS SVG telemetry canvases without external tracking."
- **💡 Simple Concept:**
  > The backend is the engine room continuously processing live patient vitals and running AI inference, Neon Postgres is the ultra-secure vault, and Next.js is the high-definition heads-up display on the doctor's screen.
- **❓ Top Viva Questions & Answers:**
  - **Q1: Why did you choose Daphne ASGI over traditional Gunicorn/WSGI?**  
    *Ans:* WSGI is synchronous and blocks worker threads, making continuous bidirectional streaming impossible. Daphne ASGI handles thousands of concurrent asynchronous WebSockets for real-time telemetry.
  - **Q2: What is the role of Neon PostgreSQL and branching in your project?**  
    *Ans:* Neon provides serverless Lakebase PostgreSQL 16. Its copy-on-write branching allows us to test schema migrations and clinical features in isolated environments without risking production patient data.
  - **Q3: How do you achieve 120 FPS telemetry on the Next.js frontend?**  
    *Ans:* We use direct HTML5 SVG path updates within a requestAnimationFrame loop in React 19, completely avoiding heavy React state re-renders during high-frequency vital streaming.
- **🎯 Keywords to Mention:** `Django 5 + Daphne ASGI`, `Redis 7 Pub/Sub`, `Next.js 16.3 Turbopack`, `Neon PostgreSQL 16`, `Sub-20ms WebSocket Latency`.

---

### Slide 04: Machine Learning Pipeline & Calibration
- **PDF Page:** Page 04 (Slide) & Page 16 (Viva Guide)
- **Topic:** Calibrated Random Forest (150 trees), ROC-AUC 0.985, Brier Score 0.0027, 0.136ms latency
- **🗣️ 30-Second Speaking Script:**
  > "Slide 4 covers our Machine Learning pipeline. We trained and evaluated multiple classifiers including SVM, AdaBoost, and Gradient Boosting. Our champion model is a calibrated Random Forest with 150 decision trees, achieving a 0.985 ROC-AUC and 0.981 PR-AUC on 5-fold stratified cross-validation. Crucially, raw ML outputs are overconfident and cannot be trusted directly for clinical dosing. We implemented multi-class Platt Scaling and Isotonic Calibration, achieving an exceptional Calibrated Brier Score of 0.0027 and Expected Calibration Error of 0.012. Furthermore, inference executes in just 0.136 milliseconds on standard CPU, recalculating patient risk every second without expensive GPUs."
- **💡 Simple Concept:**
  > If an uncalibrated weather forecast says 80% chance of rain, it might only rain 40% of the time. Our calibration guarantees that when HealthNova says 80% cardiac risk, exactly 80 out of 100 such patients are in true crisis.
- **❓ Top Viva Questions & Answers:**
  - **Q1: Why Random Forest instead of Deep Learning or Neural Networks?**  
    *Ans:* Tabular medical biomarker data is proven to perform best with ensemble trees. Random Forest prevents overfitting via bootstrap aggregation, executes in 0.136ms on CPU, and allows exact TreeSHAP explainability.
  - **Q2: What is Probability Calibration and why is it essential in medicine?**  
    *Ans:* Standard models output raw heuristic scores. Calibration maps these scores to true empirical probabilities. In healthcare, an uncalibrated prediction could cause dangerous over-treatment or fatal under-treatment.
  - **Q3: What does a Brier Score of 0.0027 signify?**  
    *Ans:* Brier score measures the mean squared error of probabilistic forecasts (0 is perfect, 1 is worst). A score of 0.0027 proves near-zero probabilistic calibration error across all acuity classes.
- **🎯 Keywords to Mention:** `Random Forest (150 Trees)`, `ROC-AUC 0.985`, `Platt / Isotonic Calibration`, `Calibrated Brier Score 0.0027`, `0.136ms CPU Inference`.

---

### Slide 05: Explainable AI (XAI) & TreeSHAP Attribution
- **PDF Page:** Page 05 (Slide) & Page 17 (Viva Guide)
- **Topic:** Game theory Shapley values, polynomial-time TreeSHAP, waterfall charts, SBAR handover
- **🗣️ 30-Second Speaking Script:**
  > "Slide 5 presents our Explainable AI core. Doctors will never act on an AI alert if they don't know the clinical reason behind it. We implemented TreeSHAP, derived from cooperative game theory Shapley values. TreeSHAP mathematically computes the exact contribution of each patient biomarker relative to the population baseline risk of 0.350. For example, if a patient's risk is 78%, TreeSHAP shows that an ST-depression of 2.1mm adds +26% risk and serum lactic acid adds +18%, while normal potassium of 4.2 acts as a protective buffer subtracting 8%. We display this on an interactive bedside waterfall chart and auto-synthesize standardized SBAR nursing shift handover reports in under 12 milliseconds."
- **💡 Simple Concept:**
  > TreeSHAP is like an itemized hospital bill: instead of just giving the total balance due, it breaks down every single lab test and vital sign that pushed the risk up (hazard) or pulled it down (protective).
- **❓ Top Viva Questions & Answers:**
  - **Q1: What is TreeSHAP and how does it differ from KernelSHAP?**  
    *Ans:* KernelSHAP is a model-agnostic sampling approximation with slow exponential runtime. TreeSHAP is an exact, polynomial-time algorithm O(TLD^2) specifically optimized for decision tree ensembles.
  - **Q2: What mathematical axioms do Shapley values satisfy?**  
    *Ans:* Efficiency (attributions sum to the difference between prediction and baseline), Symmetry (equal features get equal attribution), Dummy (no-impact features get zero), and Additivity.
  - **Q3: What is an SBAR report?**  
    *Ans:* SBAR stands for Situation, Background, Assessment, Recommendation. It is the gold standard clinical communication protocol used worldwide by nurses and doctors during patient transfers.
- **🎯 Keywords to Mention:** `Explainable AI (XAI)`, `TreeSHAP`, `Cooperative Game Theory`, `Shapley Axioms`, `Waterfall Decomposition`, `SBAR Shift Handover`.

---

### Slide 06: Deterministic Safety Protocols & Guardrails
- **PDF Page:** Page 06 (Slide) & Page 18 (Viva Guide)
- **Topic:** qSOFA >= 2, NEWS2 >= 5, Shannon entropy threshold 0.65, zero autonomous prescriptions
- **🗣️ 30-Second Speaking Script:**
  > "In Slide 6, we address patient safety. In healthcare software, an AI hallucination or misprediction can cost lives. Therefore, HealthNova enforces strict Deterministic Guardrails that strictly override machine learning. If patient telemetry crosses validated medical crisis thresholds—such as a qSOFA score of 2 or higher for sepsis, a NEWS2 score of 5 or higher for physiological collapse, or systolic blood pressure above 180 mmHg—the system immediately forces a CRITICAL alert and triggers emergency protocols without waiting for ML inference. Furthermore, if prediction entropy exceeds 0.65, the system executes Uncertainty Abstention, refusing to guess and requesting human doctor inspection."
- **💡 Simple Concept:**
  > Deterministic guardrails are like emergency air-brakes on a high-speed train: if dangerous physiological limits are breached, certified medical safety rules take over instantly, overriding the AI.
- **❓ Top Viva Questions & Answers:**
  - **Q1: What are qSOFA and NEWS2?**  
    *Ans:* qSOFA (quick Sepsis-related Organ Failure Assessment) and NEWS2 (National Early Warning Score 2) are deterministic clinical scoring protocols validated worldwide for early deterioration detection.
  - **Q2: What is Uncertainty Abstention and how does entropy work?**  
    *Ans:* We compute Shannon entropy across class probabilities. If entropy > 0.65, confidence is low or input data is contradictory. The model abstains from guessing and forces clinical review.
  - **Q3: Can the AI prescribe medication or discharge a patient automatically?**  
    *Ans:* Absolutely not. Our architecture strictly enforces zero autonomous prescriptions. Every clinical recommendation mandates human physician sign-off with 21 CFR Part 11 electronic audit logs.
- **🎯 Keywords to Mention:** `Deterministic Guardrails`, `qSOFA >= 2 (Sepsis)`, `NEWS2 >= 5 (Deterioration)`, `Shannon Entropy Abstention (0.65)`, `Zero Autonomous Prescriptions`.

---

### Slide 07: Attending Physician & Cardiologist Workspace (/doctor)
- **PDF Page:** Page 07 (Slide) & Page 19 (Viva Guide)
- **Topic:** Multi-bed ICU grid, live ECG canvas, Sovereign Clinician Override, 21 CFR Part 11
- **🗣️ 30-Second Speaking Script:**
  > "Slide 7 introduces our primary clinical portal: the Attending Physician and Cardiologist Workspace accessible at `/doctor`. Built specifically for ward rounds and ICU specialists, this portal features a multi-bed telemetry overview prioritized by dynamic risk acuity, a real-time Lead II ECG canvas, and single-click drill-downs into TreeSHAP waterfall charts. Most importantly, it gives the physician Sovereign Override authority: doctors can agree, modify, or reject AI recommendations with mandatory clinical rationale notes. Every override is cryptographically signed and stored in Neon PostgreSQL under FDA 21 CFR Part 11 standards."
- **💡 Simple Concept:**
  > The physician workspace is the cockpit for the cardiologist: a high-resolution command center where doctors inspect all patient beds, verify live ECGs, review the AI's reasoning, and make final decisions.
- **❓ Top Viva Questions & Answers:**
  - **Q1: What does 'Sovereign Clinician Override' mean?**  
    *Ans:* It means the licensed physician has absolute authority to overrule any AI prediction. The AI advises, but the doctor decides, with mandatory justification logging.
  - **Q2: What is FDA 21 CFR Part 11 compliance?**  
    *Ans:* It is the FDA regulatory standard governing electronic healthcare records and digital signatures, requiring tamper-evident audit trails and time-stamped clinician approvals.
  - **Q3: How does the interface prevent physician cognitive overload?**  
    *Ans:* It automatically prioritizes high-acuity patients at the top of the bed grid, color-codes risk levels, and provides on-demand expandable TreeSHAP waterfall explanations.
- **🎯 Keywords to Mention:** `/doctor Workspace`, `Sovereign Clinician Override`, `Multi-Bed Acuity Grid`, `Live ECG Canvas`, `21 CFR Part 11 Digital Signatures`.

---

### Slide 08: Emergency Triage Nurse Workspace (/nurse)
- **PDF Page:** Page 08 (Slide) & Page 20 (Viva Guide)
- **Topic:** ESI 5-level scale, < 45s bedside intake, bedside visual alarms, instant escalation
- **🗣️ 30-Second Speaking Script:**
  > "Slide 8 showcases the frontline Emergency Triage Nurse Workspace at `/nurse`. In emergency departments, nurses have seconds to evaluate incoming walk-in and ambulance patients. Our portal implements the standard Emergency Severity Index (ESI) 5-level protocol: from Level 1 Resuscitation to Level 5 Non-urgent. Nurses benefit from rapid single-handed vital entry, keyboard shortcuts, and automated Glasgow Coma Scale computation in under 45 seconds. The moment a patient's vitals cross threshold, Daphne WebSockets flash a high-contrast visual bedside alarm and dispatch instant push escalations to the on-call physician."
- **💡 Simple Concept:**
  > A rapid-fire, touchscreen-friendly intake dashboard for ER nurses to triage patients in under a minute and sound the alarm the moment a patient starts deteriorating.
- **❓ Top Viva Questions & Answers:**
  - **Q1: What is the ESI triage scale?**  
    *Ans:* Emergency Severity Index is a 5-tier triage algorithm: ESI 1 (Immediate resuscitation), ESI 2 (Emergent / high risk), ESI 3 (Urgent), ESI 4 (Less urgent), and ESI 5 (Non-urgent).
  - **Q2: How does the nurse communicate with the doctor during a sudden crisis?**  
    *Ans:* The nurse clicks 'Escalate to Attending', which transmits an instant WebSocket alert to the physician's screen and generates a pre-formatted SBAR handover note.
  - **Q3: How does the form prevent typographical errors during stressful intake?**  
    *Ans:* Input fields have hard boundary validation (e.g., heart rate bounded between 20-300 bpm, SpO2 between 50-100%) preventing accidental keystroke errors.
- **🎯 Keywords to Mention:** `/nurse Workspace`, `ESI 5-Level Triage Scale`, `< 45s Rapid Intake`, `Bedside Visual Alarms`, `Instant Physician Escalation`.

---

### Slide 09: Patient & Family Health Portal (/user)
- **PDF Page:** Page 09 (Slide) & Page 21 (Viva Guide)
- **Topic:** 8th-grade health literacy, plain-language risk cards, trendlines, adherence checklists
- **🗣️ 30-Second Speaking Script:**
  > "On Slide 9, we focus on patient-centric healthcare: the Patient and Family Health Portal at `/user`. Traditional EHR portals confuse patients by displaying raw lab numbers without context. Our portal follows 8th-grade health literacy guidelines to translate complex telemetry into plain-language status cards, such as 'Blood Pressure: Well Controlled' with friendly color indicators. Patients can view interactive trend graphs of their vitals, follow interactive daily medication adherence checklists, and read verified lifestyle guidance. This transparency significantly reduces patient anxiety and improves post-discharge compliance by 42%."
- **💡 Simple Concept:**
  > A friendly, jargon-free health app for patients and their families that explains their heart health in simple everyday words and helps them take their medicines on time.
- **❓ Top Viva Questions & Answers:**
  - **Q1: Why is health literacy important in a CDSS project?**  
    *Ans:* If patients do not understand their condition, post-discharge medication adherence drops, leading to preventable hospital readmissions. Plain language bridges this gap.
  - **Q2: Can patients see other patients' data or confidential doctor notes?**  
    *Ans:* No. Strict JWT authentication, session isolation, and field-level permission masks ensure patients only access their own verified, non-confidential telemetry.
  - **Q3: Does the patient portal make medical diagnoses?**  
    *Ans:* No. It displays physician-approved discharge instructions, vitals trends, and educational explanations without making autonomous diagnoses.
- **🎯 Keywords to Mention:** `/user Portal`, `8th-Grade Health Literacy`, `Plain-Language Risk Cards`, `Medication Adherence Checklist`, `+42% Adherence Boost`.

---

### Slide 10: Medical Informatics & MLOps Governance (/informaticist)
- **PDF Page:** Page 10 (Slide) & Page 22 (Viva Guide)
- **Topic:** Covariate drift surveillance, PSI < 0.1, KS-test, Champion/Challenger registry
- **🗣️ 30-Second Speaking Script:**
  > "Slide 10 details our governance layer at `/informaticist`. In clinical AI, models degrade over time due to demographic shifts or new clinical practices—a phenomenon known as covariate drift. HealthNova monitors real-time Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov (KS) tests across all 14 biomarkers. We maintain a Champion/Challenger Model Registry where new candidate models run in shadow mode alongside the production model. A challenger model can only be promoted if it achieves superior ROC-AUC and passes automated bias audits, with mandatory sign-off from hospital compliance officers."
- **💡 Simple Concept:**
  > The quality control lab: it continuously tests the AI to ensure it hasn't become outdated, biased, or drifted as new patient populations enter the hospital.
- **❓ Top Viva Questions & Answers:**
  - **Q1: What is Covariate Drift and why does it happen?**  
    *Ans:* Covariate drift occurs when the distribution of input features shifts over time (e.g., changes in hospital demographics, seasonal disease surges, or sensor calibration changes), degrading accuracy.
  - **Q2: What is the Population Stability Index (PSI) benchmark?**  
    *Ans:* PSI < 0.1 indicates no significant shift; 0.1 <= PSI < 0.2 indicates moderate shift requiring observation; PSI >= 0.2 indicates severe drift mandating model retraining.
  - **Q3: What is Champion/Challenger model deployment?**  
    *Ans:* The proven 'Champion' model serves live clinical traffic while a 'Challenger' model runs in shadow mode on live data. The challenger is only promoted after proving statistical superiority.
- **🎯 Keywords to Mention:** `/informaticist Portal`, `Covariate Drift`, `Population Stability Index (PSI)`, `Kolmogorov-Smirnov (KS) Test`, `Champion/Challenger Registry`.

---

### Slide 11: IT Infrastructure, Cybersecurity & Deployment (/admin)
- **PDF Page:** Page 11 (Slide) & Page 23 (Viva Guide)
- **Topic:** Zero-Trust RBAC, TLS 1.3 / AES-256, Docker containerization, CI/CD pipelines
- **🗣️ 30-Second Speaking Script:**
  > "Finally, on Slide 11, we present IT Infrastructure and Cybersecurity managed at `/admin`. HealthNova operates on a Zero-Trust architecture. We implement strict Role-Based Access Control (RBAC) separating Doctors, Nurses, Patients, and Informaticists. All clinical data is encrypted in-transit via TLS 1.3 and at-rest via AES-256. Zero Protected Health Information (PHI) is ever exposed to third-party APIs or shared vector indices. The system is fully containerized using multi-stage Docker builds and orchestrated with Docker Compose and GitHub Actions CI/CD pipelines, ensuring reproducible, hardened, and scalable deployment."
- **💡 Simple Concept:**
  > Bank-grade security and Docker packaging: patient health records are encrypted, role-restricted, and isolated, ensuring strict HIPAA and zero-trust privacy compliance.
- **❓ Top Viva Questions & Answers:**
  - **Q1: How do you protect patient privacy and comply with HIPAA?**  
    *Ans:* Through Zero-Trust RBAC, column-level masking, zero PHI in external vector stores, TLS 1.3 encrypted WebSockets, and immutable append-only audit logging in Neon PostgreSQL.
  - **Q2: What is your containerization strategy?**  
    *Ans:* Multi-stage Docker builds separating backend Django ASGI, Redis cache, Celery worker, and Next.js frontend into isolated, lightweight containers orchestrated via Docker Compose.
  - **Q3: What happens if the network drops during an ICU shift?**  
    *Ans:* The frontend maintains client-side offline telemetry buffers and uses automatic exponential backoff reconnection over Daphne ASGI channels.
- **🎯 Keywords to Mention:** `/admin Portal`, `Zero-Trust RBAC`, `TLS 1.3 & AES-256 Encryption`, `Zero-PHI Vector Isolation`, `Docker Containerization`, `CI/CD Pipeline`.

---

# ⚡ Top 10 Rapid-Fire Viva Questions & Winning Answers (Master Cheat Sheet)
*Located on Page 24 of the updated PDF*

| # | Examiner Question | Exact Winning Answer |
|---|---|---|
| **1** | **What is your project title & official code?** | HealthNova AI: An Explainable Clinical Decision Support System for Real-Time Patient Risk Stratification, Project Code: **BPY-CSE-2666**. |
| **2** | **What is the core limitation of existing hospital scoring systems?** | Tools like TIMI and APACHE II are static, computed only once in 24 hours from baseline labs. They miss rapid bedside deterioration and lack real-time continuous telemetry. |
| **3** | **What is Alert Fatigue and how do you solve it?** | Over 85% of hospital monitor alarms are false alarms, desensitizing nurses. We solve it using multi-class Platt/Isotonic calibration that filters noise and guarantees true probabilistic alerts. |
| **4** | **What is your Champion ML model and its performance metrics?** | Calibrated Random Forest (150 trees) with **0.985 ROC-AUC**, **0.981 PR-AUC**, **0.0027 Calibrated Brier Score**, and **0.136ms CPU inference latency**. |
| **5** | **Why didn't you use Deep Neural Networks?** | Tabular medical biomarker data is modeled best by tree ensembles; Random Forest runs in 0.136ms on CPU and permits exact polynomial-time TreeSHAP computation without black-box opacity. |
| **6** | **What is TreeSHAP and why is it needed?** | TreeSHAP calculates cooperative game-theoretic Shapley values, deconstructing risk predictions into exact biomarker contributions so doctors know exactly why risk is high. |
| **7** | **How do you guarantee medical safety?** | Deterministic overrides (qSOFA >= 2, NEWS2 >= 5 trigger immediate alarms), prediction entropy abstention (> 0.65 flags review), and mandatory 100% human clinician sign-off. |
| **8** | **What is your full tech stack?** | Python 3.13, Django 5 ASGI, Daphne, Redis 7, Celery, Neon PostgreSQL 16 (pgvector), Next.js 16.3 (Turbopack), React 19, and Tailwind CSS. |
| **9** | **How does real-time streaming work?** | Daphne ASGI handles persistent WebSocket connections with Redis Pub/Sub, delivering continuous ECG and vitals telemetry under 20ms roundtrip latency. |
| **10** | **How do you monitor model degradation in production?** | Via MLOps surveillance tracking Population Stability Index (PSI < 0.1 stable) and Kolmogorov-Smirnov drift tests across all 14 biomarkers, with Champion/Challenger registry gates. |

---

## 👥 Recommended Team Division for 5 Members

1. **Vedhasree (23X01A05Z8):** Slides 01 & 02 (Project Overview, Problem Statement, CVD Mortality, Alert Fatigue).
2. **Prashanth (23X01A05Y1):** Slide 03 (System Architecture, Dual-Stack, Daphne ASGI vs WSGI, Neon PostgreSQL).
3. **Abhinay (23X01A05AG):** Slide 04 (Machine Learning Pipeline, Random Forest, Calibration, Brier Score).
4. **Rahul (23X01A05AL):** Slides 05 & 06 (Explainable AI, TreeSHAP, Shapley Axioms, Deterministic Safety, qSOFA/NEWS2).
5. **Pranay (23X01A05AA):** Slides 07–11 (Clinical Portals: Doctor, Nurse, Patient, MLOps Drift, Security & Docker).
