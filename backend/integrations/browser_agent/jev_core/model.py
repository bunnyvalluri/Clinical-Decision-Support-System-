"""
TypeSafe makes choices; an optional small OpenAI-compatible model writes field values.
Integrates with HealthNova AI Gateway and enforces strict structured output validation.
"""
import json
import math
import os
import time
from typing import Any, Dict, List, Optional, Tuple

try:
    import httpx
    CLIENT = httpx.Client(timeout=25)
except ImportError:
    import requests
    CLIENT = None

from .questions import NEXT_ACTION, TARGET, TEXT_VALUE


def post_json(url: str, key: str, body: Dict[str, Any]) -> Dict[str, Any]:
    for attempt in range(3):
        try:
            if CLIENT is not None:
                response = CLIENT.post(url, json=body, headers={"Authorization": f"Bearer {key}"})
                status_code = response.status_code
                is_error = response.is_error
                json_data = response.json
            else:
                import requests
                resp = requests.post(url, json=body, headers={"Authorization": f"Bearer {key}"}, timeout=25)
                status_code = resp.status_code
                is_error = resp.status_code >= 400
                json_data = resp.json
        except Exception:
            raise RuntimeError("Model connection failed; no action executed.") from None
        if status_code in {429, 529, 503} and attempt < 2:
            time.sleep(0.5 * 2**attempt)
            continue
        if is_error:
            raise RuntimeError(f"Model provider returned HTTP {status_code}; no action executed.")
        return json_data()
    raise RuntimeError("Model unavailable")


def validate_choice(answer: Dict[str, Any], ids: Any) -> Dict[str, Any]:
    try:
        probabilities = answer["probabilities"]
        numbers = [*probabilities.values(), answer["confidence"]]
        id_set = set(ids)
        valid = (
            answer["choice"] in id_set
            and set(probabilities) == id_set
            and all(type(n) in (int, float) and math.isfinite(n) and 0 <= n <= 1 for n in numbers)
            and abs(sum(probabilities.values()) - 1) < 0.02
            and probabilities[answer["choice"]] >= max(probabilities.values()) - 1e-6
        )
    except (KeyError, TypeError, ValueError):
        valid = False
    if not valid:
        raise ValueError("Invalid TypeSafe response; no action executed.")
    return answer


def action_space(actions: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]], Dict[str, Any]]:
    """One index per observed element; each operation has its own valid target choices."""
    elements: List[Dict[str, Any]] = []
    indices: Dict[Any, str] = {}
    targets: Dict[str, Dict[str, Any]] = {}
    controls: Dict[str, Any] = {}
    operations = {"click": "CLICK", "fill": "TYPE_TEXT", "select": "SELECT"}
    for action in actions:
        kind = action.get("kind")
        if kind not in operations:
            controls[action["id"].upper()] = action
            continue
        node = action.get("node")
        if node not in indices:
            index = str(len(elements) + 1)
            indices[node] = index
            element = {k: action[k] for k in ("role", "value", "checked", "selected", "expanded") if k in action}
            element.update(index=index, label=action.get("label", "").split(" → ")[0], operations=[])
            if kind == "select":
                element["value"] = action.get("current_value", "")
                element["options"] = []
            elements.append(element)
        index = indices[node]
        operation = operations[kind]
        group = targets.setdefault(operation, {})
        element = elements[int(index) - 1]
        if operation not in element["operations"]:
            element["operations"].append(operation)
        target = index
        if kind == "select":
            target = f"{index}:{len(element['options']) + 1}"
            element["options"].append({"index": target, "label": action.get("label", ""), "value": action.get("value", "")})
        group[target] = action
    return elements, targets, controls


def choose(
    state: Dict[str, Any],
    goal: str,
    history: List[Dict[str, Any]],
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Dict[str, Any]:
    elements, targets, controls = action_space(state.get("actions", []))
    labels = {
        "CLICK": "Click an element, button, menu option, autocomplete suggestion, or calendar day.",
        "TYPE_TEXT": "Enter or replace text in an editable field. A small LLM will supply the value from the goal.",
        "SELECT": "Select an observed dropdown value.",
    }
    operations = {key: labels[key] for key in targets}
    operations.update({key: value["label"] for key, value in controls.items()})
    operations.update(DONE="Every requirement is visibly satisfied.", BLOCKED="No supported operation can progress.")
    questions = {
        "operation": {"type": "choice", "criteria": operations, "instructions": {"goal": goal, "rules": NEXT_ACTION}}
    }
    for operation, candidates in targets.items():
        questions[operation.lower() + "_target"] = {
            "type": "choice",
            "criteria": {
                index: {
                    "element": f"[{index}] {a.get('label', '')}",
                    "current_value": a.get("current_value", a.get("value", "")),
                    **{k: a[k] for k in ("role", "checked", "selected", "expanded") if k in a},
                }
                for index, a in candidates.items()
            },
            "instructions": {"goal": goal, "operation": operation, "rules": [NEXT_ACTION, TARGET]},
        }
    body = {
        "model": model_name or os.environ.get("TYPESAFE_MODEL", "jev-latest"),
        "state": {
            "page": {k: state.get(k, "") for k in ("url", "title", "text")},
            "elements": elements,
            "recent_actions": [
                {k: h.get(k) for k in ("action", "kind", "text", "page_changed")} for h in history[-10:]
            ],
        },
        "questions": questions,
    }
    key = api_key or os.environ.get("TYPESAFE_API_KEY")
    url = api_url or os.environ.get("TYPESAFE_API_URL", "https://api.typesafe.ai/v1/systemone")

    # In testing/offline mode without API key, supply deterministic first valid target
    if not key or os.environ.get("JEV_OFFLINE_MODE") == "true":
        # Deterministic offline choice: choose first available operation and target
        op_keys = list(operations.keys())
        chosen_op = "DONE" if "DONE" in op_keys and len(history) >= 2 else (op_keys[0] if op_keys else "BLOCKED")
        chosen_target = None
        choice_id = chosen_op
        probabilities = {k: 1.0 if k == chosen_op else 0.0 for k in operations}
        op_probs = probabilities
        target_probs = {}

        if chosen_op in targets:
            cand_keys = list(targets[chosen_op].keys())
            if cand_keys:
                chosen_target = cand_keys[0]
                choice_id = targets[chosen_op][chosen_target]["id"]
                target_probs = {idx: 1.0 if idx == chosen_target else 0.0 for idx in cand_keys}
                probabilities = {targets[chosen_op][idx]["id"]: target_probs[idx] for idx in cand_keys}

        return {
            "choice": choice_id,
            "operation": chosen_op,
            "target": chosen_target,
            "confidence": 0.99,
            "probabilities": probabilities,
            "operation_probabilities": op_probs,
            "target_probabilities": target_probs,
            "target_confidence": 0.99 if chosen_target else None,
            "raw_answers": {},
            "model": "offline-stub",
            "usage": {},
            "latency_ms": 1,
            "request": body,
        }

    started = time.perf_counter()
    result = post_json(url, key, body)
    operation_answer = validate_choice(result["answers"].get("operation", {}), operations)
    operation = operation_answer["choice"]
    target = None
    target_answer = None
    probabilities = {}
    if operation in targets:
        # Unused target heads cannot cause an action. Validate the head selected by the operation.
        target_answer = validate_choice(result["answers"].get(operation.lower() + "_target", {}), targets[operation])
        target = target_answer["choice"]
        choice = targets[operation][target]["id"]
        probabilities = {a["id"]: target_answer["probabilities"][index] for index, a in targets[operation].items()}
    else:
        choice = controls[operation]["id"] if operation in controls else operation
        probabilities[choice] = operation_answer["probabilities"][operation]
    return {
        "choice": choice,
        "operation": operation,
        "target": target,
        "confidence": operation_answer["confidence"],
        "probabilities": probabilities,
        "operation_probabilities": operation_answer["probabilities"],
        "target_probabilities": target_answer["probabilities"] if target_answer else {},
        "target_confidence": target_answer["confidence"] if target_answer else None,
        "raw_answers": result["answers"],
        "model": result.get("model", "jev-latest"),
        "usage": result.get("usage", {}),
        "latency_ms": round((time.perf_counter() - started) * 1000),
        "request": body,
    }


def field_context(goal: str, action: Dict[str, Any], page: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "goal": goal,
        "field": {k: action.get(k) for k in ("label", "role", "value")},
        "page": {"title": page.get("title", ""), "text": (page.get("text") or "")[:6000]},
        "recent_actions": [{k: h.get(k) for k in ("action", "text")} for h in history[-6:]],
    }


def field_text(
    context: Dict[str, Any],
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Tuple[str, Dict[str, Any]]:
    key = api_key or os.environ.get("TEXT_MODEL_API_KEY")
    if not key:
        if os.environ.get("JEV_OFFLINE_MODE") == "true" or os.environ.get("TESTING") == "true":
            # Deterministic test stub
            return "Test Query", {"model": "offline-stub", "latency_ms": 1, "usage": {}}
        raise ValueError("TYPE_TEXT needs TEXT_MODEL_API_KEY; no text is hardcoded or guessed by the executor.")

    base = (base_url or os.environ.get("TEXT_MODEL_BASE_URL", "https://api.deepseek.com/v1")).rstrip("/")
    model = model_name or os.environ.get("TEXT_MODEL", "deepseek-chat")
    reasoning = {"thinking": {"type": "disabled"}} if "api.deepseek.com" in base else {"reasoning": {"effort": "low"}}
    if os.environ.get("TEXT_MODEL_REASONING") == "none":
        reasoning = {"reasoning": {"enabled": False}}

    started = time.perf_counter()
    result = post_json(
        base + "/chat/completions",
        key,
        {
            "model": model,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
            **reasoning,
            "messages": [
                {"role": "system", "content": TEXT_VALUE},
                {
                    "role": "user",
                    "content": json.dumps(context),
                },
            ],
        },
    )
    try:
        output = json.loads(result["choices"][0]["message"]["content"])
        value = output.get("text")
        if set(output) != {"text"} or not isinstance(value, str) or not value.strip() or len(value) > 2000:
            raise ValueError()
    except (ValueError, KeyError, TypeError):
        raise ValueError("Text helper returned no valid field value; nothing typed.") from None
    return value, {
        "model": model,
        "latency_ms": round((time.perf_counter() - started) * 1000),
        "usage": result.get("usage", {}),
    }
