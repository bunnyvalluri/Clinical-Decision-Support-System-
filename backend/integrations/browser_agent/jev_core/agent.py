"""
The complete agent loop. Typed choices, observable state, bounded execution.
Preserves core Jev Ultrafast single-mutation safety and bounded action space.
"""
import base64
import logging
import time
from pathlib import Path
from typing import Any, Callable, Dict, Generator, List, Optional, Union

from .browser import Browser, StalePage
from .model import action_space, choose, field_context, field_text
from .questions import MAX_STEPS

logger = logging.getLogger("browser_agent.agent")


class Agent:
    def __init__(
        self,
        url: str,
        goals: Union[str, List[str]],
        *,
        record_dir: Optional[Union[str, Path]] = None,
        screenshots: bool = False,
        force_sandbox: bool = False,
        step_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        task = goals.strip() if isinstance(goals, str) else "\n".join(goals).strip()
        if not task:
            raise ValueError("Supply a task")
        plan = [task]
        self.pending_text = None
        self.step_callback = step_callback
        self.record_dir = Path(record_dir) if record_dir else None
        self.screenshots = screenshots or bool(record_dir)
        self.browser = Browser(url, force_sandbox=force_sandbox)
        try:
            page = self.browser.observe(screenshot=self.screenshots)
        except Exception:
            self.browser.close()
            raise

        self.state = dict(
            browser=self.browser,
            goal="\n".join(plan),
            page=page,
            decision=None,
            history=[],
            status="ready",
            plan=plan,
            plan_index=0,
            decisions=[],
            text_calls=[],
            elapsed_ms=0,
            started_at=None,
            record=bool(self.record_dir),
        )
        if self.record_dir:
            self.record_dir.mkdir(parents=True, exist_ok=True)
            if page.get("screenshot"):
                (self.record_dir / "000000.jpg").write_bytes(base64.b64decode(page["screenshot"]))

    def snapshot(self) -> Dict[str, Any]:
        return {
            **{k: v for k, v in self.state.items() if k != "browser"},
            "elements": action_space(self.state["page"]["actions"])[0],
        }

    def command(self, name: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        body = body or {}
        state = self.state
        if name == "tick":
            try:
                self.command("predict", {})
                result = self.command("act", {"fingerprint": state["page"]["fingerprint"]})
                if self.step_callback and state["history"]:
                    self.step_callback(state["history"][-1])
                return result
            except StalePage:
                state["decision"] = None
                state["status"] = "ready"
                state["page"] = state["browser"].observe(screenshot=self.screenshots)
                state["elapsed_ms"] = round((time.perf_counter() - state["started_at"]) * 1000)
                return self.snapshot()
        elif name == "predict":
            if not state.get("browser"):
                raise ValueError("Start an agent session first")
            if state["started_at"] is None:
                state["started_at"] = time.perf_counter()
            if not state["browser"].fresh(state["page"]):
                state["page"] = state["browser"].observe(screenshot=self.screenshots)
            state["decision"] = None
            if state["status"] in {"done", "blocked"}:
                raise ValueError("This run has stopped. Start a fresh demo.")
            if len(state["decisions"]) >= MAX_STEPS * 2:
                raise ValueError("Reached the model-call budget")
            state["decision"] = choose(state["page"], state["goal"], state["history"])
            state["decisions"].append(
                {
                    **state["decision"],
                    "fingerprint": state["page"]["fingerprint"],
                    "elapsed_ms": round((time.perf_counter() - state["started_at"]) * 1000),
                }
            )
            state["status"] = "predicted"
        elif name == "act":
            decision, page = state["decision"], state["page"]
            if not decision or body.get("fingerprint") != page["fingerprint"]:
                raise ValueError("Observe and choose before acting")
            # Consume once, before any mutation or model call. A retry cannot double-click.
            state["decision"] = None
            selected = decision["choice"]
            if selected in {"DONE", "BLOCKED"}:
                if not state["browser"].fresh(page):
                    state["status"] = "ready"
                    raise StalePage("Page changed since the decision. Choose again.")
                state["status"] = "done" if selected == "DONE" else "blocked"
                state["plan_index"] = int(selected == "DONE")
                state["elapsed_ms"] = round((time.perf_counter() - state["started_at"]) * 1000)
                return self.snapshot()

            matching_actions = [a for a in page["actions"] if a["id"] == selected]
            if not matching_actions:
                state["status"] = "blocked"
                raise ValueError(f"Action target {selected} not found in observed page actions")
            action = matching_actions[0]

            if len(state["history"]) >= MAX_STEPS:
                state["status"] = "blocked"
                raise ValueError(f"Stopped at the {MAX_STEPS}-action budget")
            text, helper = None, None
            if action.get("kind") == "fill":
                if not state["browser"].fresh(page):
                    raise StalePage("Page changed before text generation. Choose again.")
                context = field_context(state["goal"], action, page, state["history"])
                if self.pending_text and self.pending_text[0] == context:
                    _, text, helper = self.pending_text
                else:
                    text, helper = field_text(context)
                    self.pending_text = (context, text, helper)
                    state["text_calls"].append({**helper, "field": action.get("label"), "value": text})

            # Browser.act checks freshness immediately before input
            state["browser"].act(action, page, text=text)
            self.pending_text = None
            state["elapsed_ms"] = round((time.perf_counter() - state["started_at"]) * 1000)

            # Record execution before observing
            step_record = {
                "step": len(state["history"]) + 1,
                "action": action.get("label", ""),
                "kind": action.get("kind", ""),
                "choice": selected,
                "probability": decision.get("probabilities", {}).get(selected, 1.0),
                "confidence": decision.get("confidence", 1.0),
                "latency_ms": decision.get("latency_ms", 0),
                "text": text,
                "text_helper": helper["model"] if helper else None,
                "text_latency_ms": helper["latency_ms"] if helper else 0,
                "operation": decision.get("operation", ""),
                "target": decision.get("target"),
                "page_changed": None,
                "url": page.get("url", ""),
                "usage": decision.get("usage", {}),
                "executed_ms": round((time.perf_counter() - state["started_at"]) * 1000),
                "elapsed_ms": state["elapsed_ms"],
            }
            state["history"].append(step_record)
            state["page"] = state["browser"].observe(screenshot=self.screenshots)
            state["elapsed_ms"] = round((time.perf_counter() - state["started_at"]) * 1000)
            state["history"][-1].update(
                page_changed=state["page"]["fingerprint"] != page["fingerprint"],
                url=state["page"].get("url", ""),
                elapsed_ms=state["elapsed_ms"],
            )
            if state["record"] and state["page"].get("screenshot"):
                (self.record_dir / f"{state['elapsed_ms']:06d}.jpg").write_bytes(
                    base64.b64decode(state["page"]["screenshot"])
                )
            repeated = state["history"][-3:]
            state["status"] = (
                "blocked"
                if len(repeated) == 3 and all(h.get("page_changed") is False and h.get("kind") != "wait" for h in repeated)
                else "ready"
            )
        else:
            raise ValueError(f"Unknown command: {name}")
        return self.snapshot()

    def run(self, max_ticks: int = MAX_STEPS) -> Generator[Dict[str, Any], None, None]:
        ticks = 0
        while self.state["status"] not in {"done", "blocked"} and ticks < max_ticks:
            yield self.command("tick")
            ticks += 1

    def close(self):
        if self.browser:
            self.browser.close()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()
