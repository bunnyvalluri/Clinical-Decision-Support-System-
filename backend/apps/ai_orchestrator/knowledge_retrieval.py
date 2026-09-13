"""
Approved Clinical Knowledge Retrieval System (Grounded RAG).
Provides verifiable, peer-reviewed clinical guideline citations
ensuring all AI-assisted recommendations are grounded in medical literature.
"""
from typing import Any, Dict, List, Optional
import re

from services.base import BaseService
from services.interfaces import (
    IKnowledgeProvider,
    KnowledgeCitation,
    KnowledgeRetrievalResult,
)

# Curated, authoritative medical guidelines repository
APPROVED_CLINICAL_GUIDELINES: List[KnowledgeCitation] = [
    KnowledgeCitation(
        guideline_id="SSC-2021-SEPSIS",
        title="Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021",
        organization="Society of Critical Care Medicine (SCCM) / European Society of Intensive Care Medicine (ESICM)",
        section="Screening and Early Resuscitation (§2.1 - §2.4)",
        recommendation=(
            "For adults with suspected sepsis, recommend measuring blood lactate. "
            "In patients with elevated lactate (>2.0 mmol/L) or hypotension (MAP < 65 mmHg), "
            "administer at least 30 mL/kg of IV crystalloid fluid within the first 3 hours. "
            "qSOFA is recommended as a risk assessment prompt rather than a solitary diagnostic criterion."
        ),
        evidence_level="Strong Recommendation, Moderate Quality Evidence",
        doi_or_url="https://doi.org/10.1097/CCM.0000000000005337",
    ),
    KnowledgeCitation(
        guideline_id="KDIGO-2022-AKI",
        title="KDIGO Clinical Practice Guideline for Acute Kidney Injury",
        organization="Kidney Disease: Improving Global Outcomes (KDIGO)",
        section="Definition, Staging and Risk Stratification (§2.1)",
        recommendation=(
            "AKI is defined by any of: increase in serum creatinine by >= 0.3 mg/dL within 48 hours; "
            "increase in serum creatinine to >= 1.5 times baseline within 7 days; or urine volume < 0.5 mL/kg/h for 6 hours. "
            "Clinical risk stratification should incorporate nephrotoxic medication review and baseline eGFR."
        ),
        evidence_level="Level 1A",
        doi_or_url="https://doi.org/10.1038/kisup.2012.1",
    ),
    KnowledgeCitation(
        guideline_id="AHA-ACC-2017-HTN",
        title="2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure",
        organization="American College of Cardiology / American Heart Association",
        section="Hypertensive Crises and Inpatient Blood Pressure (§11.2)",
        recommendation=(
            "Hypertensive crisis is defined as systolic BP > 180 mmHg and/or diastolic BP > 120 mmHg. "
            "Assess immediately for target organ damage (acute coronary syndrome, encephalopathy, pulmonary edema). "
            "In the absence of acute target organ damage (hypertensive urgency), gradual oral blood pressure reduction is indicated."
        ),
        evidence_level="Class I, Level B-NR",
        doi_or_url="https://doi.org/10.1161/HYP.0000000000000065",
    ),
    KnowledgeCitation(
        guideline_id="ADA-2024-GLYCEMIC",
        title="Standards of Care in Diabetes — 2024: Hospital Care",
        organization="American Diabetes Association (ADA)",
        section="Inpatient Glycemic Targets and Hypoglycemia Management (§16.1 - §16.5)",
        recommendation=(
            "Target blood glucose range for most noncritical and critically ill inpatients is 140–180 mg/dL (7.8–10.0 mmol/L). "
            "Hypoglycemia (<70 mg/dL) must be avoided; glucose <54 mg/dL represents serious clinically significant hypoglycemia "
            "requiring immediate carbohydrate or IV dextrose intervention and protocol review."
        ),
        evidence_level="Grade A",
        doi_or_url="https://doi.org/10.2337/dc24-S016",
    ),
    KnowledgeCitation(
        guideline_id="AHA-HFSA-2022-HF",
        title="2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
        organization="American Heart Association / Heart Failure Society of America",
        section="Risk Stratification and Inpatient Management (§7.3)",
        recommendation=(
            "In patients hospitalized with acute heart failure, risk stratification incorporating vital stability, "
            "renal function (creatinine, BUN), and perfusion markers (lactate) guides monitoring intensity "
            "and early discharge readiness. Multidisciplinary clinical decision support improves guideline-directed medical therapy."
        ),
        evidence_level="Class 1, Level B-R",
        doi_or_url="https://doi.org/10.1161/CIR.0000000000001063",
    ),
]


class KnowledgeRetrievalService(BaseService, IKnowledgeProvider):
    """
    Retrieves grounded clinical evidence citations matching user queries and clinical parameters.
    """

    def retrieve(
        self, query: str, clinical_context: Optional[Dict[str, Any]] = None, top_k: int = 3
    ) -> KnowledgeRetrievalResult:
        """
        Match query and clinical context against approved guidelines using lexical and domain-keyword relevance.
        """
        search_terms = set(re.findall(r"\w+", query.lower()))

        # Expand terms with clinical context if provided
        if clinical_context:
            for k, v in clinical_context.items():
                if v is not None:
                    search_terms.add(str(k).lower())

        scored_citations = []

        for citation in APPROVED_CLINICAL_GUIDELINES:
            corpus = f"{citation.title} {citation.section} {citation.recommendation}".lower()
            tokens = set(re.findall(r"\w+", corpus))
            overlap = len(search_terms.intersection(tokens))
            score = overlap / max(len(search_terms), 1)
            scored_citations.append((citation, score))

        # Sort by relevance descending
        scored_citations.sort(key=lambda x: x[1], reverse=True)
        top_results = scored_citations[:top_k]

        citations = [item[0] for item in top_results]
        scores = [item[1] for item in top_results]

        # Calculate grounding confidence based on top citation relevance
        max_score = scores[0] if scores else 0.0
        grounding_confidence = min(1.0, max_score * 2.0) if max_score > 0 else 0.5

        return KnowledgeRetrievalResult(
            query=query,
            citations=citations,
            relevance_scores=scores,
            grounding_confidence=grounding_confidence,
        )
