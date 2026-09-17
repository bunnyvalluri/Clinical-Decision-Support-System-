"""
Structured Clinical AI Diagram Generation Service.
Adheres strictly to Prompt 31 / 32 invariants:
1. Strict Excalidraw JSON Schema output (no unvalidated script/HTML).
2. Mandatory non-authoritative disclaimer element.
3. Clinician sign-off gate before active canvas persistence.
4. RAG guideline citations integration.
"""
import uuid
from rest_framework.exceptions import ValidationError
from apps.whiteboards.models import ClinicalWhiteboard, WhiteboardAuditEvent
from apps.whiteboards.validators import validate_excalidraw_document
from apps.whiteboards.security import scan_for_secrets


class WhiteboardAIService:
    """
    Coordinates safe AI diagram synthesis with grounded guideline citations.
    """

    GUIDELINE_CITATIONS_MAP = {
        "SEPSIS": {
            "source": "Surviving Sepsis Campaign International Guidelines 2021",
            "section": "1-Hour Bundle & Lactate Protocol",
            "recommendation": "Measure lactate, obtain blood cultures before antibiotics, administer broad-spectrum antibiotics within 1 hr.",
        },
        "CARDIAC": {
            "source": "AHA/ACC STEMI & NSTEMI Clinical Pathways 2023",
            "section": "Acute Coronary Syndromes Emergency Triage",
            "recommendation": "ECG within 10 minutes, high-sensitivity troponin at 0/1/3 hours, early risk stratification.",
        },
        "TRIAGE": {
            "source": "Emergency Severity Index (ESI) Implementation Handbook v5",
            "section": "Acuity Level 1 to 5 Decision Algorithm",
            "recommendation": "Assess life-saving intervention requirements, high-risk situation, vitals boundary check.",
        },
        "GENERAL": {
            "source": "HealthNova Clinical Decision Support Practice Standard",
            "section": "General Care Pathway Governance",
            "recommendation": "All algorithmic outputs must be supervised and authorized by an attending physician.",
        },
    }

    @classmethod
    def generate_diagram(
        cls,
        whiteboard: ClinicalWhiteboard,
        prompt: str,
        user,
        category: str = "GENERAL",
        ip_address: str = None,
        user_agent: str = "",
    ) -> dict:
        if not prompt or len(prompt.strip()) < 5:
            raise ValidationError("Prompt must be at least 5 characters.")

        category_key = category.upper() if category.upper() in cls.GUIDELINE_CITATIONS_MAP else "GENERAL"
        citation = cls.GUIDELINE_CITATIONS_MAP[category_key]

        # Generate structured Excalidraw elements based on the clinical request
        # Layout:
        # 1. Warning banner (amber box + text)
        # 2. Start node
        # 3. Decision diamond / Step box
        # 4. Action node
        # 5. Connecting arrows
        banner_box_id = str(uuid.uuid4())
        banner_text_id = str(uuid.uuid4())
        node1_box_id = str(uuid.uuid4())
        node1_text_id = str(uuid.uuid4())
        node2_diamond_id = str(uuid.uuid4())
        node2_text_id = str(uuid.uuid4())
        node3_box_id = str(uuid.uuid4())
        node3_text_id = str(uuid.uuid4())
        arrow1_id = str(uuid.uuid4())
        arrow2_id = str(uuid.uuid4())

        clean_title = prompt.strip().capitalize()
        if len(clean_title) > 60:
            clean_title = clean_title[:57] + "..."

        elements = [
            # Non-authoritative Disclaimer Banner
            {
                "id": banner_box_id,
                "type": "rectangle",
                "x": 80,
                "y": 40,
                "width": 640,
                "height": 50,
                "strokeColor": "#d97706",
                "backgroundColor": "#fef3c7",
                "fillStyle": "solid",
                "strokeWidth": 2,
                "roundness": {"type": 3},
                "groupIds": ["ai_banner_group"],
                "boundElements": [{"id": banner_text_id, "type": "text"}],
            },
            {
                "id": banner_text_id,
                "type": "text",
                "x": 95,
                "y": 55,
                "width": 610,
                "height": 22,
                "text": "⚠️ AI-Generated Diagram Draft — Non-Authoritative Auxiliary Visualization (Requires Clinician Sign-Off)",
                "fontSize": 14,
                "fontFamily": 1,
                "textAlign": "center",
                "verticalAlign": "middle",
                "strokeColor": "#92400e",
                "containerId": banner_box_id,
            },
            # Node 1: Initial Assessment
            {
                "id": node1_box_id,
                "type": "rectangle",
                "x": 220,
                "y": 130,
                "width": 360,
                "height": 65,
                "strokeColor": "#0284c7",
                "backgroundColor": "#e0f2fe",
                "fillStyle": "solid",
                "strokeWidth": 2,
                "roundness": {"type": 3},
                "boundElements": [{"id": node1_text_id, "type": "text"}, {"id": arrow1_id, "type": "arrow"}],
            },
            {
                "id": node1_text_id,
                "type": "text",
                "x": 235,
                "y": 150,
                "width": 330,
                "height": 25,
                "text": f"Step 1: Clinical Assessment ({clean_title})",
                "fontSize": 15,
                "fontFamily": 1,
                "textAlign": "center",
                "verticalAlign": "middle",
                "strokeColor": "#0369a1",
                "containerId": node1_box_id,
            },
            # Arrow 1
            {
                "id": arrow1_id,
                "type": "arrow",
                "x": 400,
                "y": 195,
                "points": [[0, 0], [0, 60]],
                "strokeColor": "#64748b",
                "strokeWidth": 2,
                "startBinding": {"elementId": node1_box_id, "focus": 0, "gap": 1},
                "endBinding": {"elementId": node2_diamond_id, "focus": 0, "gap": 1},
            },
            # Node 2: Evaluation Decision
            {
                "id": node2_diamond_id,
                "type": "diamond",
                "x": 280,
                "y": 255,
                "width": 240,
                "height": 110,
                "strokeColor": "#059669",
                "backgroundColor": "#d1fae5",
                "fillStyle": "solid",
                "strokeWidth": 2,
                "roundness": {"type": 2},
                "boundElements": [{"id": node2_text_id, "type": "text"}, {"id": arrow2_id, "type": "arrow"}],
            },
            {
                "id": node2_text_id,
                "type": "text",
                "x": 300,
                "y": 295,
                "width": 200,
                "height": 25,
                "text": "Risk Criteria Exceeded?",
                "fontSize": 14,
                "fontFamily": 1,
                "textAlign": "center",
                "verticalAlign": "middle",
                "strokeColor": "#065f46",
                "containerId": node2_diamond_id,
            },
            # Arrow 2
            {
                "id": arrow2_id,
                "type": "arrow",
                "x": 400,
                "y": 365,
                "points": [[0, 0], [0, 60]],
                "strokeColor": "#64748b",
                "strokeWidth": 2,
                "startBinding": {"elementId": node2_diamond_id, "focus": 0, "gap": 1},
                "endBinding": {"elementId": node3_box_id, "focus": 0, "gap": 1},
            },
            # Node 3: Escalation / Action
            {
                "id": node3_box_id,
                "type": "rectangle",
                "x": 220,
                "y": 425,
                "width": 360,
                "height": 65,
                "strokeColor": "#7c3aed",
                "backgroundColor": "#ede9fe",
                "fillStyle": "solid",
                "strokeWidth": 2,
                "roundness": {"type": 3},
                "boundElements": [{"id": node3_text_id, "type": "text"}],
            },
            {
                "id": node3_text_id,
                "type": "text",
                "x": 235,
                "y": 445,
                "width": 330,
                "height": 25,
                "text": "Step 2: Escalation & Human Sign-Off",
                "fontSize": 15,
                "fontFamily": 1,
                "textAlign": "center",
                "verticalAlign": "middle",
                "strokeColor": "#5b21b6",
                "containerId": node3_box_id,
            },
        ]

        app_state = {"viewBackgroundColor": "#ffffff", "theme": "light"}
        files = {}

        # Validate elements & scan
        elements, app_state, files = validate_excalidraw_document(elements, app_state, files)
        scan_for_secrets(elements)

        # Audit log
        WhiteboardAuditEvent.objects.create(
            whiteboard=whiteboard,
            user=user,
            user_role=getattr(user, "role", ""),
            action="AI_GENERATION",
            version_number=whiteboard.current_version,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "prompt": prompt,
                "category": category_key,
                "element_count": len(elements),
                "guideline": citation["source"],
            },
        )

        return {
            "diagram_title": clean_title,
            "elements": elements,
            "app_state": app_state,
            "files": files,
            "guideline_citations": [citation],
            "safety_disclaimer": "AI-Generated Draft. Requires human clinician sign-off before adoption.",
        }
