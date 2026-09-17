"""
Input validators for NocoDB datasets, schemas, and query parameters.
"""
import re
from django.core.exceptions import ValidationError


ALLOWED_SORT_DIRECTIONS = ["", "-"]
ALLOWED_COLUMN_TYPES = [
    "SingleLineText",
    "Number",
    "Rating",
    "Select",
    "MultiSelect",
    "Formula",
    "Checkbox",
    "DateTime",
    "Date",
    "JSON",
]

SQL_INJECTION_PATTERN = re.compile(
    r"(\b(UNION(\s+ALL)?|SELECT|DROP|ALTER|CREATE|TRUNCATE|DELETE|INSERT|UPDATE)\b|--|/\*|\*/|;)",
    re.IGNORECASE,
)

PROMPT_INJECTION_PATTERN = re.compile(
    r"(ignore\s+(all\s+)?previous\s+instructions|system\s+prompt|reveal\s+secret|bypass\s+safety)",
    re.IGNORECASE,
)


def validate_column_name(name: str):
    """Ensure column names are alphanumeric with underscores and under 64 chars."""
    if not name or not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{0,63}$", name):
        raise ValidationError(
            f"Invalid column name '{name}'. Must start with a letter, contain only alphanumeric characters and underscores, and be under 64 characters."
        )


def validate_query_safety(query_str: str):
    """Sanitize and validate search terms against SQL and Prompt Injection patterns."""
    if not query_str or not isinstance(query_str, str):
        return
    if SQL_INJECTION_PATTERN.search(query_str):
        raise ValidationError("Potential SQL injection pattern detected in search query.")
    if PROMPT_INJECTION_PATTERN.search(query_str):
        raise ValidationError("Potential prompt injection pattern detected in search query.")


def validate_page_size(page_size: int, max_limit: int = 100) -> int:
    """Clamp page size to valid integer bounds."""
    try:
        val = int(page_size)
    except (ValueError, TypeError):
        return 25
    if val <= 0:
        return 25
    return min(val, max_limit)
