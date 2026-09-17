# Tool Execution Rules — HealthNova AI CDSS

1. Default-deny on all tools and MCP endpoints.
2. High-risk operations (e.g., Coolify deployment requests, config changes) mandate explicit human sign-off.
3. Repetitive tool loops (> 3 identical calls without progress) trigger immediate execution termination.
4. Execution duration is capped at 10 seconds per tool and 60 seconds per task.
5. All tool arguments and results are redacted before persistence or transmission.
