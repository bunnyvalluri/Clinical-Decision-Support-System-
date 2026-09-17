"""
Domain exceptions for Firecrawl Web Intelligence.
"""

class WebIntelligenceError(Exception):
    """Base exception for all web intelligence operations."""
    def __init__(self, message: str, code: str = "WEB_INTELLIGENCE_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class SSRFBlockedError(WebIntelligenceError):
    """Raised when a target URL resolves to an internal/private IP or forbidden scheme."""
    def __init__(self, message: str = "Target URL rejected by SSRF defense policy."):
        super().__init__(message, code="SSRF_BLOCKED")


class DomainBlockedError(WebIntelligenceError):
    """Raised when the domain is on the blocklist or not in allowed domains."""
    def __init__(self, domain: str):
        super().__init__(f"Domain '{domain}' is blocked by security policy.", code="DOMAIN_BLOCKED")
        self.domain = domain


class PolicyDeniedError(WebIntelligenceError):
    """Raised when the requested operation is forbidden by role or governance policy."""
    def __init__(self, message: str = "Operation denied by role or safety policy."):
        super().__init__(message, code="POLICY_DENIED")


class RateLimitExceededError(WebIntelligenceError):
    """Raised when request exceeds per-role or per-domain rate limits."""
    def __init__(self, message: str = "Rate limit exceeded for web intelligence."):
        super().__init__(message, code="RATE_LIMITED")


class QuotaExceededError(WebIntelligenceError):
    """Raised when quota is exhausted."""
    def __init__(self, message: str = "Web intelligence quota exceeded."):
        super().__init__(message, code="QUOTA_EXCEEDED")


class FirecrawlUnavailableError(WebIntelligenceError):
    """Raised when Firecrawl API is unreachable or circuit breaker is OPEN."""
    def __init__(self, message: str = "Firecrawl service is temporarily unavailable."):
        super().__init__(message, code="FIRECRAWL_UNAVAILABLE")


class ExtractionFailedError(WebIntelligenceError):
    """Raised when structured LLM extraction fails schema validation."""
    def __init__(self, message: str = "Structured extraction failed schema validation."):
        super().__init__(message, code="EXTRACTION_FAILED")


class JobNotFoundError(WebIntelligenceError):
    """Raised when a crawl or batch job ID cannot be found."""
    def __init__(self, job_id: str):
        super().__init__(f"Web job '{job_id}' not found.", code="JOB_NOT_FOUND")
        self.job_id = job_id
