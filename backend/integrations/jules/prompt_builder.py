"""
Structured prompt generation for Google Jules sessions.
Formats comprehensive, sanitized engineering prompts ensuring strict adherence to
healthcare security, architectural invariants, and testing standards.
"""
from typing import List, Optional
from integrations.jules.sanitizer import SensitiveDataSanitizer


class JulesPromptBuilder:
    VERSION = "1.0"

    @classmethod
    def build_prompt(
        cls,
        repository: str,
        branch: str,
        title: str,
        issue_category: str,
        description: str,
        error_log: str = "",
        affected_files: Optional[List[str]] = None,
        expected_behavior: str = "",
        actual_behavior: str = "",
        commit_hash: str = "",
        test_evidence: str = "",
    ) -> str:
        """
        Builds a structured, sanitized prompt for Jules execution.
        """
        sanitized_desc = SensitiveDataSanitizer.sanitize_text(description)
        sanitized_log = SensitiveDataSanitizer.sanitize_text(error_log)
        sanitized_evidence = SensitiveDataSanitizer.sanitize_text(test_evidence)
        files_str = "\n".join([f"- {f}" for f in (affected_files or [])]) or "To be determined during investigation."

        prompt = f"""You are acting as an expert senior software engineer remediating an issue in the HealthNova AI application.

=== PROJECT CONTEXT ===
Repository: {repository}
Target Branch: {branch}
Commit: {commit_hash or 'HEAD'}
Issue Category: {issue_category}
Issue Title: {title}

=== BUG / ISSUE DESCRIPTION ===
{sanitized_desc}

=== OBSERVED FAILURE & ERROR LOG ===
{sanitized_log or 'No raw log provided; see reproduction steps.'}

=== EXPECTED BEHAVIOR ===
{expected_behavior or 'Component compiles, passes all regression tests, and behaves according to specification.'}

=== ACTUAL BEHAVIOR ===
{actual_behavior or 'Component fails compile, raises an exception, or violates test assertions.'}

=== POTENTIALLY AFFECTED FILES ===
{files_str}

=== TEST EVIDENCE ===
{sanitized_evidence or 'Standard automated test suite.'}

=== MANDATORY ARCHITECTURAL & CLINICAL CONSTRAINTS ===
1. HealthNova AI uses a Next.js (TypeScript) frontend and Django REST Framework (Python) backend with Neon PostgreSQL.
2. DO NOT modify unrelated functionality, routes, or role-based portals (/doctor/*, /nurse/*, /user/*, /informaticist/*, /admin/*).
3. CLINICAL SAFETY INVARIANT: You MUST NOT modify medical diagnosis logic, change clinical decision safety rules, or bypass human-in-the-loop gates.
4. STRICT WHITE THEME INVARIANT: Never introduce dark mode classes (dark:*), theme toggles, or dark CSS in the frontend.
5. NO FAKE DATA: Never introduce Math.random() business mockups, fake patient records, or fabricated ML metrics.
6. NO SECRET EXPOSURE: Never write hardcoded API keys, tokens, database URLs, or PHI into code or tests.
7. REGRESSION TESTING: Add or update targeted unit tests verifying that the bug is fixed and cannot regress.

=== REMEDIATION WORKFLOW INSTRUCTIONS ===
1. Investigate the root cause using the provided evidence and repository context.
2. Formulate a concise, minimal-diff implementation plan.
3. Apply precise code fixes following repository conventions.
4. Verify by running the appropriate test suite (e.g. node --test, npx tsc, pytest/manage.py test).
5. Ensure zero lint or typecheck regressions.
6. Report all modified files and a concise summary of the root cause and fix.
"""
        return prompt.strip()
