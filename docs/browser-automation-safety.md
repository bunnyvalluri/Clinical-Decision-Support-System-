# Browser Automation Safety & Independent Outcome Verification

## Principle: DONE != SUCCESS
In Laya Ultrafast or any LLM-driven browser agent, when the model selects `action: "DONE"`, this is merely an unverified assertion by the model. 

HealthNova enforces **Independent Post-Condition Verification**:
1. Programmatic evaluation runs via `BrowserOutcomeVerifier`.
2. Inspects final DOM text content, status code, and URL patterns.
3. Automatically rejects any page containing known error signatures (`404 Not Found`, `500 Internal Server Error`, `Access Denied`, `Service Unavailable`).
4. Checks that pre-defined expected keywords or selectors are present.
5. Only if all programmatic assertions pass does the task transition to `SUCCEEDED`. Otherwise, it transitions to `FAILED`.

## Mutation Safety
- State-changing operations (`SUBMIT`, `DELETE`, `CLICK_MUTATION`) are flagged before execution.
- If a mutation fails or times out, the agent must STOP.
- Automatic retries on mutations are strictly FORBIDDEN to prevent duplicate external side-effects (e.g. duplicate submissions, double uploads).
