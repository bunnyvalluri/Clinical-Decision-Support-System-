import logging
import time
from typing import Any, Dict, List, Optional
from apps.ai_agents.permissions import CanAccessPatientData
from apps.ai_agents.services.safety_service import SafetyService

logger = logging.getLogger("ai_agents.services.context_builder")


class ContextBuilder:
    """
    Builds clean, partitioned context for agent planning and model inference.
    Strictly separates system instructions, clinical data boundaries, and user requests.
    """
    @classmethod
    def build_context(
        cls,
        user,
        role: str,
        patient_id: Optional[str] = None,
        retrieved_facts: Optional[List[Dict[str, Any]]] = None,
        retrieved_docs: Optional[List[Dict[str, Any]]] = None,
        memories: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context: Dict[str, Any] = {
            "user_id": user.id,
            "role": role,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        # 1. Patient Context with Object-Level Authorization Gate
        if patient_id:
            if CanAccessPatientData.verify_patient_access(user, patient_id):
                context["patient_id"] = patient_id
                context["patient_authorized"] = True
            else:
                context["patient_id"] = patient_id
                context["patient_authorized"] = False
                logger.warning(f"User {user.id} unauthorized for patient {patient_id}.")

        # 2. Retrieved Clinical Facts (Tagged as bounded data)
        if retrieved_facts:
            context["clinical_facts"] = retrieved_facts

        # 3. Retrieved RAG Documents
        if retrieved_docs:
            context["retrieved_documents"] = retrieved_docs

        # 4. User Preferences
        if memories:
            context["preferences"] = memories

        return context

    @classmethod
    def format_prompt_messages(
        cls,
        system_policy: str,
        user_query: str,
        context: Dict[str, Any],
        tool_results: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, str]]:
        messages = [
            {"role": "system", "content": system_policy}
        ]

        # Context boundary injection
        context_parts = []
        if context.get("patient_id") and context.get("patient_authorized"):
            context_parts.append(f"Active Patient Context: ID {context['patient_id']}")
        if context.get("preferences"):
            context_parts.append(f"Clinician Preferences: {context['preferences']}")
        if context.get("clinical_facts"):
            facts_str = "\n".join([str(f) for f in context["clinical_facts"]])
            context_parts.append(f"Authoritative Clinical Facts:\n{SafetyService.sanitize_untrusted_data(facts_str)}")
        if context.get("retrieved_documents"):
            docs_str = "\n".join([f"[{d.get('title')}]: {d.get('passage')}" for d in context["retrieved_documents"]])
            context_parts.append(f"Curated Guidelines Evidence:\n{SafetyService.sanitize_untrusted_data(docs_str)}")

        if context_parts:
            messages.append({
                "role": "system",
                "content": "CONTEXT AND EVIDENCE:\n" + "\n\n".join(context_parts),
            })

        # Add Tool Observations if any
        if tool_results:
            obs_lines = []
            for tr in tool_results:
                obs_lines.append(f"Tool '{tr.get('tool_name')}': {tr.get('data') or tr.get('error')}")
            messages.append({
                "role": "system",
                "content": "TOOL OBSERVATIONS:\n" + "\n".join(obs_lines),
            })

        # User Query
        messages.append({"role": "user", "content": user_query})

        return messages
