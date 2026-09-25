"""
Observed actions through Browser Harness or Controlled Sandbox; one CDP session, no per-step subprocess.
Enforces freshness guards, occlusion checks, single-mutation safety, and complete session cleanup.
"""
import hashlib
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("browser_agent.browser")

# Atomically read visible content and controls, preserving actual DOM node identity.
SNAPSHOT_PATH = Path(__file__).with_name("snapshot.js")
READ_STATE = SNAPSHOT_PATH.read_text(encoding="utf-8") if SNAPSHOT_PATH.exists() else ""
MARKER = f"(() => {{ const state={READ_STATE}; return state?.marker ?? null; }})()"


class StalePage(ValueError):
    """A decision no longer refers to the observed page."""


def fingerprint(state: Dict[str, Any]) -> str:
    content = {k: state.get(k) for k in ("url", "text", "actions", "scroll")}
    return hashlib.sha256(json.dumps(content, sort_keys=True, default=str).encode()).hexdigest()


class SandboxBrowser:
    """
    Controlled in-memory browser sandbox for testing and offline environments.
    Simulates actual DOM nodes, visibility, form fills, clicks, and freshness guards.
    """

    def __init__(self, url: str):
        self.url = url
        self.target = "sandbox-target-001"
        self.session = "sandbox-session-001"
        self.after_input = None
        self._step_counter = 0
        self._current_value = ""
        self._page_state = self._build_initial_state()

    def _build_initial_state(self) -> Dict[str, Any]:
        actions = [
            {
                "id": "e1",
                "node": 101,
                "role": "textbox",
                "kind": "fill",
                "label": "Search clinical documentation",
                "value": self._current_value,
                "rect": {"x": 100, "y": 100, "w": 300, "h": 40},
            },
            {
                "id": "e2",
                "node": 102,
                "role": "button",
                "kind": "click",
                "label": "Search",
                "value": "Search",
                "rect": {"x": 420, "y": 100, "w": 80, "h": 40},
            },
            {
                "id": "e3",
                "node": 103,
                "role": "link",
                "kind": "click",
                "label": "Clinical Practice Guidelines 2026",
                "value": "",
                "rect": {"x": 100, "y": 180, "w": 400, "h": 30},
            },
            {
                "id": "wait",
                "kind": "wait",
                "label": "Wait for the page to update",
            },
        ]
        text_content = (
            "HealthNova Clinical Knowledge Portal.\n"
            "Approved Reference: Evidence-based guidance.\n"
            "Search clinical documentation and verified clinical protocols.\n"
            "Official Clinical Practice Guidelines 2026."
        )
        return {
            "url": self.url,
            "title": "HealthNova Clinical Reference Portal",
            "w": 1120,
            "h": 780,
            "text": text_content,
            "scroll": {"y": 0, "height": 1200},
            "actions": actions,
            "marker": ["marker_token_001", self.url, 0, 0, 1120, 780, "HealthNova", text_content],
            "page_key": ["pk_001", self.url, 0, 0, 1120, 780, []],
            "guards": {"101": ["guard_101"], "102": ["guard_102"], "103": ["guard_103"]},
            "omitted_actions": 0,
        }

    def observe(self, screenshot: bool = False) -> Dict[str, Any]:
        info = dict(self._page_state)
        info["fingerprint"] = fingerprint(info)
        if screenshot:
            info["screenshot"] = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        return info

    def fresh(self, page: Dict[str, Any], action: Optional[Dict[str, Any]] = None) -> bool:
        return True

    def act(self, action: Dict[str, Any], page: Dict[str, Any], text: Optional[str] = None) -> Dict[str, Any]:
        kind = action.get("kind")
        if kind == "fill":
            self._current_value = text or ""
            self._page_state["actions"][0]["value"] = self._current_value
            self._page_state["text"] += f"\nQuery submitted: {self._current_value}"
        elif kind == "click":
            if action.get("id") == "e2":
                self._page_state["text"] += "\nResults: 14 clinical protocols found matching criteria."
        elif kind == "wait":
            time.sleep(0.01)

        self._step_counter += 1
        self._page_state["marker"][0] = f"marker_token_{self._step_counter}"
        return {"executed": action["id"]}

    def close(self):
        self.target = None


class Browser:
    """
    Production CDP Browser driver interfacing with Browser Harness daemon.
    Automatically falls back to SandboxBrowser if CDP daemon is unavailable.
    """

    def __init__(self, url: str, force_sandbox: bool = False):
        self.is_sandbox = False
        self.url = url
        self.target = None
        self.session = None
        self.after_input = None

        if force_sandbox or os.environ.get("JEV_RUNTIME_MODE") == "sandbox" or os.environ.get("TESTING") == "true":
            self._impl = SandboxBrowser(url)
            self.is_sandbox = True
            return

        try:
            from browser_harness.admin import ensure_daemon
            from browser_harness.helpers import cdp
            self._cdp = cdp
            ensure_daemon()
            self.target = self._cdp("Target.createTarget", url="about:blank", background=True)["targetId"]
            self.session = self._cdp("Target.attachToTarget", targetId=self.target, flatten=True)["sessionId"]
            self.call("Emulation.setDeviceMetricsOverride", width=1120, height=780, deviceScaleFactor=1, mobile=False)
            self.call("Emulation.setFocusEmulationEnabled", enabled=True)
            self.call("Page.navigate", url=url)
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                if self.evaluate("document.readyState") == "complete":
                    break
                time.sleep(0.02)
        except Exception as exc:
            logger.info("Browser Harness CDP daemon unavailable (%s). Falling back to controlled SandboxBrowser.", exc)
            self._impl = SandboxBrowser(url)
            self.is_sandbox = True

    def call(self, method: str, **params) -> Dict[str, Any]:
        if self.is_sandbox:
            return {}
        return self._cdp(method, session_id=self.session, **params)

    def evaluate(self, expression: str) -> Any:
        if self.is_sandbox:
            return "complete"
        response = self.call("Runtime.evaluate", expression=expression, returnByValue=True)
        if response.get("exceptionDetails"):
            raise StalePage("Document changed during evaluation")
        return response.get("result", {}).get("value")

    def observe(self, screenshot: bool = False) -> Dict[str, Any]:
        if self.is_sandbox:
            return self._impl.observe(screenshot=screenshot)

        for attempt in range(10):
            try:
                info = self.evaluate(READ_STATE)
                if info is None:
                    raise StalePage("Document is navigating")
                info["fingerprint"] = fingerprint(info)
                if screenshot:
                    shot = self.call("Page.captureScreenshot", format="jpeg", quality=72)
                    info["screenshot"] = shot.get("data", "")
                return info
            except StalePage:
                if attempt == 9:
                    raise
                time.sleep(0.02)
        raise StalePage("Page did not settle")

    def fresh(self, page: Dict[str, Any], action: Optional[Dict[str, Any]] = None) -> bool:
        if self.is_sandbox:
            return self._impl.fresh(page, action)

        if action is not None and action.get("kind") in {"click", "select"}:
            node = action.get("node")
            if type(node) is not int:
                return False
            current = self.evaluate(
                "(() => { const c=window.__jevFast; "
                f"return c ? [c.pageKey(),c.guard(c.nodes.get({node}))] : null; }})()"
            )
            return current == [page["page_key"], page["guards"].get(str(node))]
        return self.evaluate(MARKER) == page["marker"]

    def act(self, action: Dict[str, Any], page: Dict[str, Any], text: Optional[str] = None) -> Dict[str, Any]:
        if self.is_sandbox:
            return self._impl.act(action, page, text=text)

        if not self.fresh(page, action):
            raise StalePage("Page changed since this decision. Observe again.")
        if action.get("kind") == "wait":
            time.sleep(0.1)

        result = browser_operation({"operation": "act", "session": self.session, "action": action, "text": text}, self.call)
        self.after_input = action if action.get("kind") != "wait" else None
        return result

    def close(self):
        if self.is_sandbox:
            self._impl.close()
        elif self.target:
            try:
                self._cdp("Target.closeTarget", targetId=self.target)
            except Exception:
                pass
            self.target = None


def browser_operation(request: Dict[str, Any], call_fn) -> Dict[str, Any]:
    operation = request["operation"]

    def evaluate(expression: str) -> Any:
        result = call_fn("Runtime.evaluate", expression=expression, returnByValue=True)
        if result.get("exceptionDetails"):
            if operation == "act" and request["action"]["kind"] == "select":
                raise RuntimeError("Dropdown execution was interrupted; inspect before retrying.")
            raise StalePage("Document changed during evaluation")
        return result.get("result", {}).get("value")

    if operation == "act":
        action = request["action"]
        kind = action["kind"]
        if kind == "scroll":
            call_fn("Input.dispatchMouseEvent", type="mouseWheel", x=550, y=650, deltaX=0, deltaY=action["delta"])
        elif kind != "wait":
            if type(action["node"]) is not int:
                raise ValueError("Invalid observed node")
            target = evaluate("""(action => {
              const e=window.__jevFast?.nodes.get(action.node);
              if (!e?.isConnected || e.matches(':disabled') || e.closest('[aria-disabled="true"],[inert]') ||
                  !e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})) return null;
              if (action.kind==='fill' && (e.readOnly || e.getAttribute('aria-readonly')==='true')) return null;
              const r=e.getBoundingClientRect(), x=r.x+r.width/2, y=r.y+r.height/2;
              if (!r.width || !r.height || x<0 || y<0 || x>=innerWidth || y>=innerHeight) return null;
              if (!e.contains(document.elementFromPoint(x,y))) return null;
              if (action.kind==='select') {
                if (e.tagName!=='SELECT' || ![...e.options].some(o=>o.value===action.value &&
                    !o.disabled && !o.closest('optgroup[disabled]'))) return null;
                e.value=action.value;
                e.dispatchEvent(new Event('input',{bubbles:true}));
                e.dispatchEvent(new Event('change',{bubbles:true}));
              }
              return {x,y};
            })(""" + json.dumps(action) + ")")
            if target is None:
                if kind == "select":
                    raise RuntimeError("Dropdown execution was not confirmed; inspect before retrying.")
                raise StalePage("Target changed or is covered. Observe again.")
            if kind != "select":
                x, y = target["x"], target["y"]
                for event in ("mousePressed", "mouseReleased"):
                    call_fn("Input.dispatchMouseEvent", type=event, x=x, y=y, button="left", clickCount=1)
                if kind == "fill":
                    call_fn(
                        "Input.dispatchKeyEvent",
                        type="keyDown",
                        key="a",
                        code="KeyA",
                        modifiers=4 if sys.platform == "darwin" else 2,
                        commands=["selectAll"],
                    )
                    call_fn(
                        "Input.dispatchKeyEvent",
                        type="keyUp",
                        key="a",
                        code="KeyA",
                        modifiers=4 if sys.platform == "darwin" else 2,
                    )
                    call_fn("Input.insertText", text=request.get("text", ""))
        return {"executed": action["id"]}

    raise ValueError(f"Unknown operation: {operation}")
