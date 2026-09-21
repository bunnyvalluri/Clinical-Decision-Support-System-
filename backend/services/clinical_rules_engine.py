"""
Deterministic Clinical Rules Engine.
Evaluates standardized clinical scoring algorithms (qSOFA, NEWS2) and critical physiological thresholds.
Operates completely deterministically without statistical or LLM hallucination risk.
"""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from services.base import BaseService
from services.interfaces import DeterministicRuleAlert, IClinicalRuleEngine

logger = logging.getLogger("clinical.rules_engine")


class ClinicalRulesEngine(BaseService, IClinicalRuleEngine):
    """
    Evaluates validated clinical protocols and safety threshold triggers.
    Ensures safety overrides are applied regardless of machine learning model probability.
    """

    def evaluate(self, clinical_data: Dict[str, Any]) -> List[DeterministicRuleAlert]:
        """
        Run all deterministic rule evaluations against provided vital signs and laboratory findings.
        """
        alerts: List[DeterministicRuleAlert] = []

        # 1. qSOFA Evaluation
        qsofa_alert = self._evaluate_qsofa(clinical_data)
        if qsofa_alert:
            alerts.append(qsofa_alert)

        # 2. NEWS2 Score Evaluation
        news2_alert = self._evaluate_news2(clinical_data)
        if news2_alert:
            alerts.append(news2_alert)

        # 3. Acute Critical Thresholds
        alerts.extend(self._evaluate_critical_thresholds(clinical_data))

        return alerts

    def _evaluate_qsofa(self, data: Dict[str, Any]) -> Optional[DeterministicRuleAlert]:
        """
        quick Sepsis-related Organ Failure Assessment (qSOFA).
        Criteria:
        - Respiratory rate >= 22 /min
        - Altered mentation (GCS < 15 or altered_mental_status True)
        - Systolic BP <= 100 mmHg
        Score >= 2 indicates high mortality risk from sepsis.
        """
        score = 0
        criteria_met = []

        rr = data.get("respiratory_rate")
        if rr is not None and float(rr) >= 22:
            score += 1
            criteria_met.append(f"Tachypnea (RR {rr} >= 22/min)")

        sbp = data.get("systolic_bp") or data.get("blood_pressure_systolic")
        if sbp is not None and float(sbp) <= 100:
            score += 1
            criteria_met.append(f"Hypotension (SBP {sbp} <= 100 mmHg)")

        altered = data.get("altered_mental_status", False) or (
            data.get("glasgow_coma_scale") is not None
            and float(data.get("glasgow_coma_scale")) < 15
        )
        if altered:
            score += 1
            criteria_met.append("Altered mental status (GCS < 15)")

        if score >= 2:
            return DeterministicRuleAlert(
                rule_name="qSOFA Sepsis Risk Flag",
                rule_id="RULE-QSOFA-01",
                rule_version="1.0.0",
                evidence_source="Singer M, et al. Sepsis-3 International Consensus. JAMA 2016.",
                explanation="Quick SOFA score of 2 or more indicates significantly elevated in-hospital mortality from suspected infection.",
                severity="CRITICAL_EMERGENCY",
                trigger_criteria=f"qSOFA score {score}/3: {', '.join(criteria_met)}",
                recommended_action=(
                    "Immediate physician bedside evaluation recommended. "
                    "Screen for organ dysfunction and consider sepsis resuscitation bundle."
                ),
            )
        elif score == 1:
            return DeterministicRuleAlert(
                rule_name="qSOFA Borderline Flag",
                rule_id="RULE-QSOFA-02",
                rule_version="1.0.0",
                evidence_source="Singer M, et al. Sepsis-3 International Consensus. JAMA 2016.",
                explanation="qSOFA score of 1 indicates borderline risk requiring closer vital sign monitoring.",
                severity="MONITOR",
                trigger_criteria=f"qSOFA score 1/3: {', '.join(criteria_met)}",
                recommended_action="Increase monitoring frequency. Re-evaluate vitals in 1 hour.",
            )
        return None

    def _evaluate_news2(self, data: Dict[str, Any]) -> Optional[DeterministicRuleAlert]:
        """
        National Early Warning Score 2 (NEWS2).
        Aggregates physiological parameters to stratify acute clinical deterioration risk.
        """
        score = 0
        factors = []

        # Respiration Rate
        rr = data.get("respiratory_rate")
        if rr is not None:
            rr = float(rr)
            if rr <= 8 or rr >= 25:
                score += 3
                factors.append(f"Severe abnormal RR ({rr})")
            elif 21 <= rr <= 24:
                score += 2
                factors.append(f"Elevated RR ({rr})")
            elif 9 <= rr <= 11:
                score += 1
                factors.append(f"Low RR ({rr})")

        # SpO2
        spo2 = data.get("oxygen_saturation") or data.get("spo2")
        if spo2 is not None:
            spo2 = float(spo2)
            if spo2 <= 91:
                score += 3
                factors.append(f"Severe Hypoxemia (SpO2 {spo2}%)")
            elif 92 <= spo2 <= 93:
                score += 2
                factors.append(f"Moderate Hypoxemia (SpO2 {spo2}%)")
            elif 94 <= spo2 <= 95:
                score += 1
                factors.append(f"Mild Hypoxemia (SpO2 {spo2}%)")

        # Systolic BP
        sbp = data.get("systolic_bp") or data.get("blood_pressure_systolic")
        if sbp is not None:
            sbp = float(sbp)
            if sbp <= 90 or sbp >= 220:
                score += 3
                factors.append(f"Extreme SBP ({sbp} mmHg)")
            elif 91 <= sbp <= 100:
                score += 2
                factors.append(f"Low SBP ({sbp} mmHg)")
            elif 101 <= sbp <= 110:
                score += 1
                factors.append(f"Borderline SBP ({sbp} mmHg)")

        # Heart Rate
        hr = data.get("heart_rate")
        if hr is not None:
            hr = float(hr)
            if hr <= 40 or hr >= 131:
                score += 3
                factors.append(f"Extreme Heart Rate ({hr} bpm)")
            elif 111 <= hr <= 130:
                score += 2
                factors.append(f"Tachycardia ({hr} bpm)")
            elif (41 <= hr <= 50) or (91 <= hr <= 110):
                score += 1
                factors.append(f"Abnormal Heart Rate ({hr} bpm)")

        # Temperature
        temp = data.get("temperature")
        if temp is not None:
            temp = float(temp)
            if temp <= 35.0:
                score += 3
                factors.append(f"Hypothermia ({temp}°C)")
            elif temp >= 39.1:
                score += 2
                factors.append(f"Severe Hyperthermia ({temp}°C)")
            elif (35.1 <= temp <= 36.0) or (38.1 <= temp <= 39.0):
                score += 1
                factors.append(f"Pyrexia/Low Temp ({temp}°C)")

        if score >= 7:
            return DeterministicRuleAlert(
                rule_name="NEWS2 High Acute Deterioration Flag",
                rule_id="RULE-NEWS2-01",
                rule_version="2.0.0",
                evidence_source="Royal College of Physicians. National Early Warning Score (NEWS) 2. 2017.",
                explanation="NEWS2 score >= 7 represents high-grade clinical risk mandating urgent clinical team review.",
                severity="CRITICAL_EMERGENCY",
                trigger_criteria=f"Aggregate NEWS2 score {score} (High Risk): {'; '.join(factors)}",
                recommended_action=(
                    "Emergency assessment by clinical response team required. "
                    "Continuous physiological monitoring and ICU consult consideration."
                ),
            )
        elif score >= 5:
            return DeterministicRuleAlert(
                rule_name="NEWS2 Medium Clinical Deterioration Flag",
                rule_id="RULE-NEWS2-02",
                rule_version="2.0.0",
                evidence_source="Royal College of Physicians. National Early Warning Score (NEWS) 2. 2017.",
                explanation="NEWS2 score 5-6 indicates medium risk of clinical deterioration.",
                severity="URGENT_EVALUATION",
                trigger_criteria=f"Aggregate NEWS2 score {score} (Medium Risk): {'; '.join(factors)}",
                recommended_action=(
                    "Urgent review by ward physician. Escalation of monitoring frequency to minimum 1 hour."
                ),
            )
        elif score >= 3:
            return DeterministicRuleAlert(
                rule_name="NEWS2 Low Clinical Risk Flag",
                rule_id="RULE-NEWS2-03",
                rule_version="2.0.0",
                evidence_source="Royal College of Physicians. National Early Warning Score (NEWS) 2. 2017.",
                explanation="NEWS2 score 3-4 indicates low risk requiring routine nursing observation.",
                severity="MONITOR",
                trigger_criteria=f"Aggregate NEWS2 score {score} (Low Risk): {'; '.join(factors)}",
                recommended_action="Inform registered nurse; standard vital monitoring protocol.",
            )
        return None

    def _evaluate_critical_thresholds(
        self, data: Dict[str, Any]
    ) -> List[DeterministicRuleAlert]:
        """
        Deterministic red-flag safety checks on laboratory findings and acute values.
        """
        alerts: List[DeterministicRuleAlert] = []

        # Potassium
        potassium = data.get("potassium")
        if potassium is not None:
            k = float(potassium)
            if k >= 6.2:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Severe Hyperkalemia Safety Alert",
                        rule_id="RULE-CRIT-K-HIGH",
                        rule_version="1.0.0",
                        evidence_source="AHA Guidelines on Cardiopulmonary Resuscitation and ECC: Electrolyte Emergencies.",
                        explanation="Serum potassium >= 6.2 mmol/L carries immediate danger of lethal ventricular arrhythmias and asystole.",
                        severity="CRITICAL_EMERGENCY",
                        trigger_criteria=f"Potassium {k} mmol/L (>= 6.2 mmol/L)",
                        recommended_action=(
                            "Critical laboratory alert: Risk of lethal cardiac arrhythmias. "
                            "Immediate 12-lead ECG and membrane stabilization protocol."
                        ),
                    )
                )
            elif k <= 2.8:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Severe Hypokalemia Safety Alert",
                        rule_id="RULE-CRIT-K-LOW",
                        rule_version="1.0.0",
                        evidence_source="AHA Guidelines on Electrolyte Emergencies.",
                        explanation="Serum potassium <= 2.8 mmol/L impairs cardiac repolarization and risks torsades de pointes.",
                        severity="URGENT_EVALUATION",
                        trigger_criteria=f"Potassium {k} mmol/L (<= 2.8 mmol/L)",
                        recommended_action="Initiate urgent potassium replacement under cardiac monitoring.",
                    )
                )

        # Lactic Acid
        lactate = data.get("lactic_acid") or data.get("lactate")
        if lactate is not None:
            lac = float(lactate)
            if lac >= 4.0:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Severe Lactic Acidosis Alert",
                        rule_id="RULE-CRIT-LAC-HIGH",
                        rule_version="1.0.0",
                        evidence_source="Surviving Sepsis Campaign International Guidelines 2021.",
                        explanation="Serum lactate >= 4.0 mmol/L indicates severe tissue hypoperfusion / anaerobic metabolism in sepsis.",
                        severity="CRITICAL_EMERGENCY",
                        trigger_criteria=f"Serum Lactate {lac} mmol/L (>= 4.0 mmol/L)",
                        recommended_action=(
                            "Evidence of severe hypoperfusion / anaerobic metabolism. "
                            "Immediate fluid resuscitation and source identification protocol."
                        ),
                    )
                )
            elif lac >= 2.0:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Elevated Lactate Alert",
                        rule_id="RULE-CRIT-LAC-MED",
                        rule_version="1.0.0",
                        evidence_source="Surviving Sepsis Campaign International Guidelines 2021.",
                        explanation="Serum lactate 2.0-3.9 mmol/L suggests early tissue hypoperfusion.",
                        severity="MONITOR",
                        trigger_criteria=f"Serum Lactate {lac} mmol/L (>= 2.0 mmol/L)",
                        recommended_action="Repeat serum lactate in 2-4 hours; assess intravascular volume.",
                    )
                )

        # Blood Pressure Extremes
        sbp = data.get("systolic_bp") or data.get("blood_pressure_systolic")
        dbp = data.get("diastolic_bp") or data.get("blood_pressure_diastolic")
        if sbp is not None and dbp is not None:
            if float(sbp) >= 180 or float(dbp) >= 120:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Hypertensive Crisis Threshold Flag",
                        rule_id="RULE-CRIT-BP-HYPERTENSIVE",
                        rule_version="1.0.0",
                        evidence_source="ACC/AHA 2017 Guideline for High Blood Pressure in Adults.",
                        explanation="BP >= 180/120 mmHg indicates hypertensive crisis with risk of acute target organ damage.",
                        severity="CRITICAL_EMERGENCY",
                        trigger_criteria=f"BP {sbp}/{dbp} mmHg (>= 180/120 mmHg)",
                        recommended_action=(
                            "Immediate clinical evaluation for acute target organ damage "
                            "(encephalopathy, aortic dissection, acute coronary syndrome)."
                        ),
                    )
                )

        # Glucose Extremes
        glucose = data.get("glucose")
        if glucose is not None:
            glu = float(glucose)
            if glu < 50:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Severe Hypoglycemia Alarm",
                        rule_id="RULE-CRIT-GLU-LOW",
                        rule_version="1.0.0",
                        evidence_source="ADA Standards of Medical Care in Diabetes 2024.",
                        explanation="Blood glucose < 50 mg/dL causes neuroglycopenia, seizure, and coma risk.",
                        severity="CRITICAL_EMERGENCY",
                        trigger_criteria=f"Glucose {glu} mg/dL (< 50 mg/dL)",
                        recommended_action="Emergency administration of IV dextrose 50% or glucagon. Recheck in 15m.",
                    )
                )
            elif glu >= 450:
                alerts.append(
                    DeterministicRuleAlert(
                        rule_name="Severe Hyperglycemia Threshold Flag",
                        rule_id="RULE-CRIT-GLU-HIGH",
                        rule_version="1.0.0",
                        evidence_source="ADA Standards of Medical Care in Diabetes 2024.",
                        explanation="Blood glucose >= 450 mg/dL suggests impending DKA or HHS.",
                        severity="URGENT_EVALUATION",
                        trigger_criteria=f"Glucose {glu} mg/dL (>= 450 mg/dL)",
                        recommended_action="Evaluate for diabetic ketoacidosis (DKA) or hyperosmolar hyperglycemic state (HHS).",
                    )
                )

        return alerts
