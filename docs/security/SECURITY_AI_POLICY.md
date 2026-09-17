# AI & LLM Security Policy for Security Auditing

## Untrusted Input Handling
1. **Target Content is Untrusted**: API responses, endpoint headers, error traces, and web content analyzed by security agents are treated as untrusted input.
2. **Prompt Injection Mitigation**: Regex and semantic sanitization are applied before feeding scan outputs into AI models. Target payloads cannot override agent safety instructions.
3. **No Patient PHI to External LLMs**: Patient data, clinical notes, and physician identifiers are strictly excluded from AI prompts. Only synthetic identifiers are permitted.
4. **Local / Sovereign LLMs Preferred**: For automated analysis of vulnerability traces, local or sovereign enterprise LLM endpoints are preferred over public consumer APIs.
