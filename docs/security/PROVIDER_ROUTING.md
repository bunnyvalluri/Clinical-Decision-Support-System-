# Common Security Provider Routing & Federation

## 1. Providers
1. **`STRIX`**: Deep source & web vulnerability scanning (Prompt 42).
2. **`AGENTIC_BUGHUNTER`**: Fast internal reconnaissance & route coverage (Prompt 28).
3. **`PENTEST_AGENTS`**: Controlled autonomous multi-agent offensive security & IDOR testing (Prompt 44).

## 2. Selection Matrix
The `SecurityProviderRouter` dynamically routes requests based on task type:
- `FAST_REVIEW` / `RECON` -> `AgenticBugHunterProvider`
- `DEEP_WEB_TEST` / `SARIF` -> `StrixProvider`
- `AGENTIC_BOUNTY_RESEARCH` / `API_TESTING` -> `PentestAgentsProvider`
Cross-scanner deduplication is performed via `FindingClusteringService`.
